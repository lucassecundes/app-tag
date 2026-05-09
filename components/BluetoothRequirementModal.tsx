import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Dimensions } from 'react-native';
import { Bluetooth, X } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface BluetoothRequirementModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function BluetoothRequirementModal({ visible, onClose }: BluetoothRequirementModalProps) {
  if (Platform.OS !== 'android') return null;

  const handleEnableBluetooth = async () => {
    try {
      await Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
    } catch (error) {
      console.error('[BluetoothRequirementModal] Erro ao abrir configurações:', error);
      // Fallback se sendIntent falhar
      Linking.openSettings().catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Bluetooth size={36} color={Colors.info} strokeWidth={2} />
            </View>
          </View>
          
          <Text style={styles.title}>Bluetooth Desativado</Text>
          
          <Text style={styles.description}>
            Mantenha o Bluetooth ativado para garantir o rastreamento em tempo real dos seus veículos e objetos.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.enableButton]} 
              onPress={handleEnableBluetooth}
              activeOpacity={0.8}
            >
              <Text style={styles.enableButtonText}>Ativar Bluetooth</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: width - 48,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    paddingTop: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(51, 181, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 181, 229, 0.2)',
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enableButton: {
    backgroundColor: Colors.info,
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enableButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
});
