import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { bluetoothService } from './bluetoothService';
import { tagsService } from './tagsService';
import { trackingService } from './trackingService';
import { matcherService } from './matcherService';
import { locationService } from './locationService';
import { supabase } from '../../lib/supabase';

export const BLUETOOTH_BACKGROUND_TASK = 'BLUETOOTH_BACKGROUND_TASK';

// Registra a task no escopo global
if (Platform.OS === 'android') {
  TaskManager.defineTask(BLUETOOTH_BACKGROUND_TASK, async ({ data, error }) => {
    if (error) {
      console.error('[backgroundTaskService] Erro na tarefa de background:', error);
      return;
    }

    console.log('[backgroundTaskService] Iniciando scan em background...');
    
    try {
      // 1. Pega usuário atual logado via auth_session ou fallback de cache se possível
      // Como estamos em background, o Supabase já deve ter a sessão persistida
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.log('[backgroundTaskService] Nenhum usuário logado. Abortando scan background.');
        return;
      }

      // 2. Busca tags do usuário
      const tags = await tagsService.getTagsWithMac(session.user.id);
      if (tags.length === 0) {
        console.log('[backgroundTaskService] Nenhuma tag para rastrear. Abortando scan background.');
        return;
      }

      // 3. Pega o gerenciador Bluetooth de forma segura
      const manager = bluetoothService.getManager();
      if (!manager) {
        console.warn('[backgroundTaskService] BleManager não instanciado. Abortando.');
        return;
      }

      const state = await manager.state();
      if (state !== 'PoweredOn') {
        console.log(`[backgroundTaskService] Bluetooth não está ligado (Status: ${state}). Abortando.`);
        return;
      }

      console.log('[backgroundTaskService] Escaneando por 10 segundos...');
      
      // Inicia scan
      manager.startDeviceScan(null, { allowDuplicates: false }, async (scanError, device) => {
        if (scanError) {
          console.error('[backgroundTaskService] Erro no scan em background:', scanError);
          return;
        }

        if (device && device.id) {
          const matchedTag = matcherService.findMatchingTag(device.id, tags);
          if (matchedTag) {
            // Em background (a cada 10 mins) nós atualizamos
            // Não vamos usar o canUpdateTag do foreground que tem 5 mins, vamos usar um especifico
            if (trackingService.canUpdateTagBackground(matchedTag.id)) {
              console.log(`[backgroundTaskService] Tag encontrada em bg: ${device.id}. Capturando local...`);
              trackingService.lockTagBackground(matchedTag.id);

              const loc = await locationService.getCurrentLocation();
              if (loc) {
                console.log(`[backgroundTaskService] Atualizando tag ${matchedTag.id} no banco...`);
                await trackingService.updateTagLocation(matchedTag, loc.latitude, loc.longitude, null);
              } else {
                trackingService.unlockTagBackground(matchedTag.id);
              }
            }
          }
        }
      });

      // Pára o scan após 10 segundos para não matar a bateria
      setTimeout(() => {
        console.log('[backgroundTaskService] Encerrando scan em background...');
        manager.stopDeviceScan();
      }, 10000);

    } catch (e) {
      console.error('[backgroundTaskService] Erro geral:', e);
    }
  });
}

/**
 * Função para registrar o rastreamento em segundo plano no Android
 * Intervalo: A cada 10 minutos (600000 ms)
 */
export async function startBackgroundTracking() {
  if (Platform.OS !== 'android') return;

  try {
    // Requer permissões de background primeiro
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('[backgroundTaskService] Permissão foreground necessária antes de background.');
      return;
    }

    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[backgroundTaskService] Permissão de background negada.');
        return;
      }
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BLUETOOTH_BACKGROUND_TASK);
    if (!isRegistered) {
      console.log('[backgroundTaskService] Registrando tarefa de localização em background...');
      await Location.startLocationUpdatesAsync(BLUETOOTH_BACKGROUND_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10 * 60 * 1000, // 10 minutos
        distanceInterval: 50, // ou a cada 50 metros
        foregroundService: {
          notificationTitle: 'TAG+ Rastreamento',
          notificationBody: 'Monitorando suas tags em segundo plano.',
          notificationColor: '#FF7A00',
        },
      });
      console.log('[backgroundTaskService] Tarefa de background registrada com sucesso!');
    } else {
      console.log('[backgroundTaskService] Tarefa já estava registrada.');
    }
  } catch (error) {
    console.error('[backgroundTaskService] Erro ao iniciar background tracking:', error);
  }
}

export async function stopBackgroundTracking() {
  if (Platform.OS !== 'android') return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BLUETOOTH_BACKGROUND_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BLUETOOTH_BACKGROUND_TASK);
      console.log('[backgroundTaskService] Tarefa de background encerrada.');
    }
  } catch (error) {
    console.error('[backgroundTaskService] Erro ao parar background tracking:', error);
  }
}
