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
          <View style={styles.iconContainer}>
            <Bluetooth size={40} color={Colors.info} strokeWidth={1.5} />
          </View>
          
          <Text style={styles.title}>Bluetooth Desativado</Text>
          
          <Text style={styles.description}>
            É essencial manter o Bluetooth ativado para garantir a melhor performance durante o rastreamento e atualizações dos seus dispositivos TAG+.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.enableButton]} 
              onPress={handleEnableBluetooth}
              activeOpacity={0.7}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: width - 48,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 181, 229, 0.3)', // Neon blue border hint
    shadowColor: Colors.info,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(51, 181, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 181, 229, 0.5)',
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  enableButton: {
    backgroundColor: Colors.info,
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  enableButtonText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: Colors.white,
  },
});
