import { BleManager, Device } from 'react-native-ble-plx';

class BluetoothService {
  private manager: BleManager | null = null;
  private isScanning = false;

  constructor() {
    this.manager = new BleManager();
  }

  /**
   * Inicia o scan.
   * onDeviceFound será chamado para cada dispositivo encontrado.
   */
  startScan(onDeviceFound: (device: Device) => void) {
    if (this.isScanning || !this.manager) return;

    console.log('[bluetoothService] Iniciando scan Bluetooth...');
    this.isScanning = true;

    this.manager.startDeviceScan(
      null, 
      { allowDuplicates: false }, 
      (error, device) => {
        if (error) {
          console.error('[bluetoothService] Erro no scan Bluetooth:', error);
          this.stopScan();
          return;
        }

        if (device && device.id) { // device.id is usually the MAC address on Android
          onDeviceFound(device);
        }
      }
    );
  }

  /**
   * Para o scan Bluetooth.
   */
  stopScan() {
    if (!this.isScanning || !this.manager) return;

    console.log('[bluetoothService] Parando scan Bluetooth...');
    this.manager.stopDeviceScan();
    this.isScanning = false;
  }

  /**
   * Limpa a instância quando o app for destruído.
   */
  destroy() {
    this.stopScan();
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
  }
}

export const bluetoothService = new BluetoothService();
