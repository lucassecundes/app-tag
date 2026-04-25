import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform, Linking } from 'react-native';
import { BluetoothRequirementModal } from '../../components/BluetoothRequirementModal';

// Mocks
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Platform.OS = 'android';
  rn.Linking.sendIntent = jest.fn();
  rn.Linking.openSettings = jest.fn();
  return rn;
});

jest.mock('lucide-react-native', () => ({
  Bluetooth: () => 'BluetoothIcon',
  X: () => 'XIcon',
}));

describe('BluetoothRequirementModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não deve renderizar no iOS', () => {
    Platform.OS = 'ios';
    const { toJSON } = render(
      <BluetoothRequirementModal visible={true} onClose={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('deve renderizar corretamente no Android quando visível', () => {
    Platform.OS = 'android';
    const { getByText } = render(
      <BluetoothRequirementModal visible={true} onClose={jest.fn()} />
    );

    expect(getByText('Bluetooth Desativado')).toBeTruthy();
    expect(getByText('Cancelar')).toBeTruthy();
    expect(getByText('Ativar Bluetooth')).toBeTruthy();
  });

  it('deve chamar onClose ao clicar em Cancelar', () => {
    Platform.OS = 'android';
    const onCloseMock = jest.fn();
    const { getByText } = render(
      <BluetoothRequirementModal visible={true} onClose={onCloseMock} />
    );

    fireEvent.press(getByText('Cancelar'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('deve chamar Linking.sendIntent ao clicar em Ativar Bluetooth', async () => {
    Platform.OS = 'android';
    (Linking.sendIntent as jest.Mock).mockResolvedValue(true);

    const { getByText } = render(
      <BluetoothRequirementModal visible={true} onClose={jest.fn()} />
    );

    fireEvent.press(getByText('Ativar Bluetooth'));

    expect(Linking.sendIntent).toHaveBeenCalledWith('android.settings.BLUETOOTH_SETTINGS');
  });

  it('deve fazer fallback para Linking.openSettings se sendIntent falhar', async () => {
    Platform.OS = 'android';
    (Linking.sendIntent as jest.Mock).mockRejectedValue(new Error('Intent failed'));
    (Linking.openSettings as jest.Mock).mockResolvedValue(true);

    const { getByText } = render(
      <BluetoothRequirementModal visible={true} onClose={jest.fn()} />
    );

    fireEvent.press(getByText('Ativar Bluetooth'));

    // Esperar as promises
    await new Promise(process.nextTick);

    expect(Linking.sendIntent).toHaveBeenCalledWith('android.settings.BLUETOOTH_SETTINGS');
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });
});
