import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';

import { tagsService, TagWithMac } from '../services/bluetooth/tagsService';
import { bluetoothService } from '../services/bluetooth/bluetoothService';
import { matcherService } from '../services/bluetooth/matcherService';
import { locationService } from '../services/bluetooth/locationService';
import { trackingService } from '../services/bluetooth/trackingService';
import { useAuth } from '../context/AuthContext';

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

      // 2. Solicitar permissões necessárias
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        console.warn('[useBluetoothTracker] Permissões negadas. Scan abortado.');
        return;
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
            } else {
              // Comentado para não poluir os logs (um beacon pode enviar dezenas de pacotes por segundo)
              // console.log(`[useBluetoothTracker] Tag ${matchedTag.id} ignorada por causa do cooldown ativo.`);
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
      subscription.remove();
    };
  }, [session?.user?.id]);
}

/**
 * Função utilitária para pedir as permissões necessárias
 */
async function requestPermissions(): Promise<boolean> {
  try {
    console.log('[useBluetoothTracker] Solicitando permissões de localização e bluetooth...');

    // Localização (Expo)
    const locPerm = await Location.requestForegroundPermissionsAsync();
    if (locPerm.status !== 'granted') {
      console.warn('[useBluetoothTracker] Permissão de localização não concedida pelo usuário.');
      return false;
    }


    // Bluetooth (React Native / Android nativo)
    if (typeof Platform.Version === 'number' && Platform.Version >= 31) {
      // Android 12+ requer permissões específicas
      const btScanPerm = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
      const btConnectPerm = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);

      if (
        btScanPerm !== PermissionsAndroid.RESULTS.GRANTED ||
        btConnectPerm !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.warn('[useBluetoothTracker] Permissão de Bluetooth Scan/Connect não concedida (Android 12+).');
        return false;
      }
    } else {
      // Android 11 e inferior usa ACCESS_FINE_LOCATION para scan
      const locationPerm = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (locationPerm !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('[useBluetoothTracker] Permissão de ACCESS_FINE_LOCATION não concedida para Bluetooth (Android < 12).');
        return false;
      }
    }

    console.log('[useBluetoothTracker] Permissões concedidas.');
    return true;
  } catch (error) {
    console.error('[useBluetoothTracker] Erro ao solicitar permissões:', error);
    return false;
  }
}
