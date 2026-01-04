import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ArrowLeft, QrCode, Type, CheckCircle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function AddDeviceScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'manual' | 'camera'>('manual');
  const [tagId, setTagId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (mode === 'camera' && !permission?.granted) {
      requestPermission();
    }
  }, [mode]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setTagId(data);
    setMode('manual');
    Alert.alert('Código Detectado', `TAG ID: ${data}`);
  };

  const handleSave = async () => {
    console.log('Iniciando vínculo de dispositivo...');
    
    if (!tagId.trim() || !deviceName.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o ID da TAG e dê um nome ao dispositivo.');
      return;
    }

    if (!user) {
      Alert.alert('Erro de Sessão', 'Usuário não autenticado. Faça login novamente.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        usuario_id: user.id,
        // Alterado de name para nome
        nome: deviceName.trim(),
        codigo: tagId.trim(),
        icone: 'car',
        created_at: new Date().toISOString(),
      };

      console.log('Enviando payload para Supabase:', payload);

      const { data, error } = await supabase
        .from('tags')
        .insert(payload)
        .select();

      if (error) {
        console.error('Erro Supabase:', error);
        throw error;
      }

      console.log('Dispositivo vinculado:', data);

      Alert.alert('Sucesso', 'Dispositivo vinculado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Erro no catch:', error);
      Alert.alert('Erro ao Vincular', error.message || 'Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Vincular TAG</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, mode === 'manual' && styles.activeTab]} 
          onPress={() => setMode('manual')}
        >
          <Type size={20} color={mode === 'manual' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, mode === 'camera' && styles.activeTab]} 
          onPress={() => {
            setMode('camera');
            setScanned(false);
          }}
        >
          <QrCode size={20} color={mode === 'camera' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.tabText, mode === 'camera' && styles.activeTabText]}>Câmera</Text>
        </TouchableOpacity>
      </View>

      {mode === 'camera' ? (
        <View style={styles.cameraContainer}>
          {!permission?.granted ? (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Precisamos de acesso à câmera para ler o QR Code.</Text>
              <Button title="Conceder Permissão" onPress={requestPermission} />
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scanArea} />
                <Text style={styles.scanText}>Aponte para o código da TAG</Text>
              </View>
            </CameraView>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.label}>Informações do Dispositivo</Text>
            
            <Input
              label="ID da TAG / Serial"
              placeholder="Ex: TAG-123456"
              value={tagId}
              onChangeText={setTagId}
              autoCapitalize="characters"
              icon={<QrCode size={20} color={Colors.textSecondary} />}
            />

            <Input
              label="Nome do Veículo/Objeto"
              placeholder="Ex: Meu Carro, Mochila..."
              value={deviceName}
              onChangeText={setDeviceName}
              icon={<Type size={20} color={Colors.textSecondary} />}
            />

            <View style={styles.infoBox}>
              <CheckCircle size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                O ID da TAG geralmente encontra-se na parte inferior do dispositivo ou na caixa do produto.
              </Text>
            </View>

            <Button 
              title="VINCULAR DISPOSITIVO" 
              onPress={handleSave} 
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
    fontSize: 14,
  },
  activeTabText: {
    color: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Poppins_400Regular',
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  scanText: {
    color: Colors.white,
    marginTop: 20,
    fontFamily: 'Poppins_500Medium',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
