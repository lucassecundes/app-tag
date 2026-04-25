import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

import { tagsService, TagWithMac } from '../services/bluetooth/tagsService';
import { bluetoothService } from '../services/bluetooth/bluetoothService';
import { matcherService } from '../services/bluetooth/matcherService';
import { locationService } from '../services/bluetooth/locationService';
import { trackingService } from '../services/bluetooth/trackingService';
import { startBackgroundTracking, stopBackgroundTracking } from '../services/bluetooth/backgroundTaskService';
import { useAuth } from '../context/AuthContext';

// Controle global para não insistir na mesma sessão do app
let hasRequestedPermissionsThisSession = false;

// Estado global reativo para avisar a UI que precisamos de GPS
export const gpsRequirementState = {
  isGpsDisabled: false,
  listeners: [] as ((disabled: boolean) => void)[],
  setGpsDisabled(disabled: boolean) {
    if (this.isGpsDisabled !== disabled) {
      this.isGpsDisabled = disabled;
      this.listeners.forEach(listener => listener(disabled));
    }
  },
  subscribe(listener: (disabled: boolean) => void) {
    this.listeners.push(listener);
    listener(this.isGpsDisabled);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

export function useBluetoothTracker() {
  const { session } = useAuth();
  const appState = useRef(AppState.currentState);
  const isScanning = useRef(false);
  const userTags = useRef<TagWithMac[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !session?.user?.id) {
      return; // Apenas Android e apenas usuários logados
    }

    const checkAndStartScan = async () => {
      console.log('[useBluetoothTracker] Iniciando fluxo...');
      
      // 1. Buscar tags com MAC
      const tags = await tagsService.getTagsWithMac(session.user.id);
      userTags.current = tags;

      if (tags.length === 0) {
        console.log('[useBluetoothTracker] Nenhuma tag com MAC cadastrada. Scan ignorado silenciosamente.');
        return;
      }

      // 2. Solicitar e verificar permissões e status dos serviços (Apenas 1x por sessão se negado)
      const isReady = await ensurePermissionsAndServices();
      if (!isReady) {
        console.warn('[useBluetoothTracker] Permissões negadas ou serviços desativados. Scan abortado.');
        return;
      }

      // Se passou por tudo, garante que o modal de GPS está fechado
      gpsRequirementState.setGpsDisabled(false);

      // Inicia rastreamento em background a cada 10 mins (Apenas Android)
      if (Platform.OS === 'android') {
        startBackgroundTracking();
      }

      // 3. Iniciar Scan
      if (!isScanning.current) {
        isScanning.current = true;
        bluetoothService.startScan(async (device) => {
          // Callback quando encontrar um dispositivo
          if (!device.id) return; // No Android, device.id é o endereço MAC

          const matchedTag = matcherService.findMatchingTag(device.id, userTags.current);
          if (matchedTag) {
            if (trackingService.canUpdateTag(matchedTag.id)) {
              console.log(`[useBluetoothTracker] MAC Encontrado! (${device.id}). Capturando localização...`);
              trackingService.lockTag(matchedTag.id); // Evitar race condition de múltiplos pacotes BT
              
              // 4. Capturar Localização
              const loc = await locationService.getCurrentLocation();
              if (loc) {
                // 5. Atualizar DB
                console.log(`[useBluetoothTracker] Atualizando tag ${matchedTag.id} com localização.`);
                await trackingService.updateTagLocation(matchedTag, loc.latitude, loc.longitude, null);
              } else {
                console.warn('[useBluetoothTracker] Erro ao obter localização para a tag encontrada. Removendo lock.');
                trackingService.unlockTag(matchedTag.id);
              }
            }
          }
        });
      }
    };

    const stopScan = () => {
      if (isScanning.current) {
        bluetoothService.stopScan();
        isScanning.current = false;
      }
    };

    // Verificar e iniciar scan assim que monta o hook (se já estiver em foreground)
    if (appState.current === 'active') {
      checkAndStartScan();
    }

    // Ouvir mudanças no ciclo de vida do app
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[useBluetoothTracker] App foi para Foreground. Retomando fluxo...');
        // Resetamos a flag de sessão para poder pedir novamente quando o app for reaberto do background
        hasRequestedPermissionsThisSession = false; 
        checkAndStartScan();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('[useBluetoothTracker] App foi para Background. Encerrando scan (apenas foreground).');
        stopScan();
      }
      appState.current = nextAppState;
    });

    return () => {
      // Limpeza na desmontagem do componente (ex: logout)
      stopScan();
      if (Platform.OS === 'android') {
        stopBackgroundTracking();
      }
      subscription.remove();
    };
  }, [session?.user?.id]);
}

/**
 * Função utilitária para pedir permissões e verificar se os serviços (GPS e BT) estão ligados
 */
async function ensurePermissionsAndServices(): Promise<boolean> {
  if (hasRequestedPermissionsThisSession) {
    console.log('[useBluetoothTracker] Permissões já solicitadas nesta sessão. Aguardando próximo app open.');
    // Se já pedimos e falhou/cancelou, não insistimos mais até a próxima sessão
    // Mas ainda verificamos se, por acaso, já tem a permissão agora (o usuário pode ter ido nas configs).
    return await checkOnlyPermissions();
  }

  hasRequestedPermissionsThisSession = true;

  try {
    console.log('[useBluetoothTracker] Verificando e solicitando permissões...');

    // 1. Permissão de Localização (Expo)
    let locPerm = await Location.getForegroundPermissionsAsync();
    if (locPerm.status !== 'granted') {
      locPerm = await Location.requestForegroundPermissionsAsync();
      if (locPerm.status !== 'granted') {
        showPermissionAlert(
          'Permissão de Localização Necessária',
          'Precisamos da sua localização para rastrear as tags em background. Por favor, habilite nas configurações.'
        );
        return false;
      }
    }

    // 2. Serviço de GPS Ligado
    const isGpsEnabled = await Location.hasServicesEnabledAsync();
    if (!isGpsEnabled) {
      // Aciona o nosso modal moderno de GPS
      gpsRequirementState.setGpsDisabled(true);
      return false;
    } else {
      gpsRequirementState.setGpsDisabled(false);
    }

    // 3. Permissões de Bluetooth (Android)
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+
        const btScanGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        const btConnectGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);

        if (!btScanGranted || !btConnectGranted) {
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);

          if (
            result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] !== PermissionsAndroid.RESULTS.GRANTED ||
            result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] !== PermissionsAndroid.RESULTS.GRANTED
          ) {
            showPermissionAlert(
              'Permissão de Bluetooth Necessária',
              'O Android 12 ou superior exige permissão de "Dispositivos Próximos" para buscar as suas Tags.'
            );
            return false;
          }
        }
      } else {
        // Android 11 e inferior
        const locGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (!locGranted) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Permissão de Localização',
              message: 'Precisamos de acesso à sua localização fina para buscar dispositivos Bluetooth.',
              buttonNeutral: 'Depois',
              buttonNegative: 'Cancelar',
              buttonPositive: 'OK',
            }
          );
          if (result !== PermissionsAndroid.RESULTS.GRANTED) {
            return false;
          }
        }
      }
    }

    // 4. Serviço Bluetooth Ligado
    const manager = bluetoothService.getManager();
    if (manager) {
      const state = await manager.state();
      if (state === 'PoweredOff') {
        try {
          // Exibe o dialog nativo para ligar o Bluetooth
          await manager.enable();
        } catch (e) {
          console.warn('[useBluetoothTracker] Usuário recusou ligar o Bluetooth.');
          return false;
        }
      } else if (state !== 'PoweredOn') {
        console.warn(`[useBluetoothTracker] Bluetooth não está pronto (Status: ${state}).`);
        return false;
      }
    }

    console.log('[useBluetoothTracker] Todas as permissões e serviços estão OK.');
    return true;
  } catch (error) {
    console.error('[useBluetoothTracker] Erro na checagem de permissões/serviços:', error);
    return false;
  }
}

/**
 * Apenas checa se as permissões existem de forma silenciosa (usado quando já solicitamos antes)
 */
async function checkOnlyPermissions(): Promise<boolean> {
  const locPerm = await Location.getForegroundPermissionsAsync();
  if (locPerm.status !== 'granted') return false;
  
  const isGpsEnabled = await Location.hasServicesEnabledAsync();
  if (!isGpsEnabled) {
    gpsRequirementState.setGpsDisabled(true);
    return false;
  } else {
    gpsRequirementState.setGpsDisabled(false);
  }

  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      const btScanGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
      const btConnectGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      if (!btScanGranted || !btConnectGranted) return false;
    } else {
      const locGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (!locGranted) return false;
    }
  }

  const manager = bluetoothService.getManager();
  if (manager) {
    const state = await manager.state();
    if (state !== 'PoweredOn') return false;
  }

  return true;
}

/**
 * Exibe um alerta com a opção de abrir as configurações do app
 */
function showPermissionAlert(title: string, message: string) {
  Alert.alert(
    title,
    message,
    [
      { text: 'Agora não', style: 'cancel' },
      { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
    ]
  );
}
