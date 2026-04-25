import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { bluetoothService } from '../services/bluetooth/bluetoothService';

export function useBluetoothState() {
  const [bluetoothState, setBluetoothState] = useState<string>('Unknown');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let subscription: any = null;

    const checkAndSubscribe = async () => {
      try {
        let hasPermission = true;

        if (typeof Platform.Version === 'number' && Platform.Version >= 31) {
          const connectPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
          hasPermission = connectPermission;
        }

        if (hasPermission) {
          const manager = bluetoothService.getManager();
          if (manager) {
            // Pega o estado atual
            const currentState = await manager.state();
            setBluetoothState(currentState);
            
            // Inscreve para mudanças futuras
            subscription = manager.onStateChange((state) => {
              setBluetoothState(state);
            }, true);
          }
        }
      } catch (error) {
        console.error('[useBluetoothState] Erro ao verificar estado do Bluetooth:', error);
      } finally {
        setIsReady(true);
      }
    };

    checkAndSubscribe();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { bluetoothState, isReady };
}
