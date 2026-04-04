import { BleManager, Device } from 'react-native-ble-plx';
import { Platform } from 'react-native';

class BluetoothService {
  private manager: BleManager | null = null;
  private isScanning = false;

  constructor() {
    if (Platform.OS === 'android') {
      this.manager = new BleManager();
    }
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
   * Inicia o scan buscando um MAC específico.
   */
  scanForMac(targetMac: string, onDeviceFound: (device: Device) => void) {
    if (!this.manager) return;

    // Se já estiver escaneando algo, paramos para iniciar o foco
    if (this.isScanning) {
      this.stopScan();
    }

    console.log(`[bluetoothService] Iniciando scan focado no MAC: ${targetMac}...`);
    this.isScanning = true;

    this.manager.startDeviceScan(
      null, 
      { allowDuplicates: true }, // allowDuplicates ajuda a encontrar mais rápido estando na tela
      (error, device) => {
        if (error) {
          console.error('[bluetoothService] Erro no scan focado:', error);
          this.stopScan();
          return;
        }

        if (device && device.id === targetMac) {
          onDeviceFound(device);
        }
      }
    );
  }
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
