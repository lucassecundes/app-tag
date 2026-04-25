import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Dimensions } from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface LocationRequirementModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function LocationRequirementModal({ visible, onClose }: LocationRequirementModalProps) {
  if (Platform.OS !== 'android') return null;

  const handleEnableLocation = async () => {
    try {
      await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
    } catch (error) {
      console.error('[LocationRequirementModal] Erro ao abrir configurações:', error);
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
              <MapPin size={36} color={Colors.primary} strokeWidth={2} />
            </View>
          </View>
          
          <Text style={styles.title}>GPS Desativado</Text>
          
          <Text style={styles.description}>
            Para registrar e atualizar a localização das suas Tags no mapa, precisamos que o GPS do seu celular esteja ligado.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.enableButton]} 
              onPress={handleEnableLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.enableButtonText}>Ativar Localização</Text>
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
    backgroundColor: 'rgba(255, 107, 107, 0.1)', // Primary color with opacity
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
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
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
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
