import { BleManager, Device } from 'react-native-ble-plx';
import { Platform } from 'react-native';

class BluetoothService {
  private manager: BleManager | null = null;
  private isScanning = false;

  constructor() {
    // Apenas prepara o serviço, a instância real será criada no getManager()
    // para evitar crashes de permissão no Android 12+
  }

  /**
   * Obtém ou cria a instância do BleManager de forma segura (Lazy Initialization).
   */
  getManager(): BleManager | null {
    if (Platform.OS !== 'android') return null;
    
    if (!this.manager) {
      try {
        console.log('[bluetoothService] Instanciando BleManager...');
        this.manager = new BleManager();
      } catch (error) {
        console.error('[bluetoothService] Erro ao instanciar BleManager:', error);
        return null;
      }
    }
    return this.manager;
  }

  /**
   * Inicia o scan.
   * onDeviceFound será chamado para cada dispositivo encontrado.
   */
  startScan(onDeviceFound: (device: Device) => void) {
    const manager = this.getManager();
    if (this.isScanning || !manager) return;

    console.log('[bluetoothService] Iniciando scan Bluetooth...');
    this.isScanning = true;

    manager.startDeviceScan(
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
    const manager = this.getManager();
    if (!manager) return;

    // Se já estiver escaneando algo, paramos para iniciar o foco
    if (this.isScanning) {
      this.stopScan();
    }

    console.log(`[bluetoothService] Iniciando scan focado no MAC: ${targetMac}...`);
    this.isScanning = true;

    manager.startDeviceScan(
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
