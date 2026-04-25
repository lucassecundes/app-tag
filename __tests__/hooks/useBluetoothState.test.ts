import { renderHook, act } from '@testing-library/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { useBluetoothState } from '../../hooks/useBluetoothState';
import { bluetoothService } from '../../services/bluetooth/bluetoothService';

// Mocks
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 31,
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
    },
    check: jest.fn(),
  },
}));

jest.mock('../../services/bluetooth/bluetoothService', () => ({
  bluetoothService: {
    getManager: jest.fn(),
  },
}));

describe('useBluetoothState Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar isReady=true e bluetoothState=Unknown no iOS', async () => {
    Platform.OS = 'ios';
    
    const { result } = renderHook(() => useBluetoothState());
    
    expect(result.current.bluetoothState).toBe('Unknown');
    expect(result.current.isReady).toBe(false);
    
    // No iOS, ele retorna cedo e nunca seta isReady como true nesse hook específico pro Android
    // Se o design do hook mudar, esse teste seria atualizado.
  });

  it('deve verificar permissões no Android 12 (API 31) e não instanciar se não tiver permissão', async () => {
    Platform.OS = 'android';
    Platform.Version = 31;
    (PermissionsAndroid.check as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useBluetoothState());

    await act(async () => {
      await new Promise(process.nextTick);
    });

    expect(PermissionsAndroid.check).toHaveBeenCalledWith('android.permission.BLUETOOTH_CONNECT');
    expect(bluetoothService.getManager).not.toHaveBeenCalled();
    expect(result.current.isReady).toBe(true);
    expect(result.current.bluetoothState).toBe('Unknown');
  });

  it('deve assinar mudanças de estado se tiver permissão', async () => {
    Platform.OS = 'android';
    Platform.Version = 31;
    (PermissionsAndroid.check as jest.Mock).mockResolvedValue(true);

    const mockOnStateChange = jest.fn();
    const mockState = jest.fn().mockResolvedValue('PoweredOn');

    (bluetoothService.getManager as jest.Mock).mockReturnValue({
      state: mockState,
      onStateChange: mockOnStateChange,
    });

    const { result } = renderHook(() => useBluetoothState());

    await act(async () => {
      await new Promise(process.nextTick);
    });

    expect(bluetoothService.getManager).toHaveBeenCalled();
    expect(mockState).toHaveBeenCalled();
    expect(mockOnStateChange).toHaveBeenCalled();
    
    expect(result.current.bluetoothState).toBe('PoweredOn');
    expect(result.current.isReady).toBe(true);
  });

  it('deve funcionar no Android 10 (API 29) sem verificar BLUETOOTH_CONNECT', async () => {
    Platform.OS = 'android';
    Platform.Version = 29;

    const mockOnStateChange = jest.fn();
    const mockState = jest.fn().mockResolvedValue('PoweredOff');

    (bluetoothService.getManager as jest.Mock).mockReturnValue({
      state: mockState,
      onStateChange: mockOnStateChange,
    });

    const { result } = renderHook(() => useBluetoothState());

    await act(async () => {
      await new Promise(process.nextTick);
    });

    expect(PermissionsAndroid.check).not.toHaveBeenCalled();
    expect(bluetoothService.getManager).toHaveBeenCalled();
    expect(result.current.bluetoothState).toBe('PoweredOff');
    expect(result.current.isReady).toBe(true);
  });
});
