import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useBluetoothState } from '../hooks/useBluetoothState';
import { gpsRequirementState } from '../hooks/useBluetoothTracker';
import { BluetoothRequirementModal } from './BluetoothRequirementModal';
import { LocationRequirementModal } from './LocationRequirementModal';
import { useAuth } from '../context/AuthContext';

export function GlobalBluetoothMonitor() {
  const { session } = useAuth();
  const { bluetoothState, isReady } = useBluetoothState();
  const [btModalVisible, setBtModalVisible] = useState(false);
  const [gpsModalVisible, setGpsModalVisible] = useState(false);
  const [hasPromptedBt, setHasPromptedBt] = useState(false);

  // Monitora o estado do Bluetooth
  useEffect(() => {
    if (Platform.OS !== 'android' || !isReady || !session?.user) return;

    // Apenas mostrar se o Bluetooth estiver desligado (PoweredOff)
    if (bluetoothState === 'PoweredOff' && !hasPromptedBt) {
      setBtModalVisible(true);
      setHasPromptedBt(true);
    }

    // Auto-fechar o modal quando o bluetooth for ativado
    if (bluetoothState === 'PoweredOn' && btModalVisible) {
      setBtModalVisible(false);
    }
  }, [bluetoothState, isReady, hasPromptedBt, btModalVisible, session?.user]);

  // Monitora o estado do GPS (via hook useBluetoothTracker)
  useEffect(() => {
    if (Platform.OS !== 'android' || !session?.user) return;
    
    const unsubscribe = gpsRequirementState.subscribe((disabled) => {
      setGpsModalVisible(disabled);
    });

    return () => unsubscribe();
  }, [session?.user]);

  if (Platform.OS !== 'android') return null;

  return (
    <>
      <BluetoothRequirementModal 
        visible={btModalVisible} 
        onClose={() => setBtModalVisible(false)} 
      />
      <LocationRequirementModal
        visible={gpsModalVisible}
        onClose={() => setGpsModalVisible(false)}
      />
    </>
  );
}
