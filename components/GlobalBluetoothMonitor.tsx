import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useBluetoothState } from '../hooks/useBluetoothState';
import { BluetoothRequirementModal } from './BluetoothRequirementModal';

export function GlobalBluetoothMonitor() {
  const { bluetoothState, isReady } = useBluetoothState();
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isReady) return;

    // Apenas mostrar se o Bluetooth estiver desligado (PoweredOff)
    if (bluetoothState === 'PoweredOff' && !hasPrompted) {
      setModalVisible(true);
      setHasPrompted(true);
    }
  }, [bluetoothState, isReady, hasPrompted]);

  if (Platform.OS !== 'android') return null;

  return (
    <BluetoothRequirementModal 
      visible={modalVisible} 
      onClose={() => setModalVisible(false)} 
    />
  );
}
