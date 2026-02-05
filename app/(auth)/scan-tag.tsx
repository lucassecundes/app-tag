import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, Link } from 'expo-router';
import { ArrowLeft, QrCode, Type, ChevronRight, ShoppingBag } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export default function ScanTagScreen() {
  const [mode, setMode] = useState<'manual' | 'camera'>('camera');
  const [tagId, setTagId] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProductCheckout();
  }, []);

  const fetchProductCheckout = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('checkout_link')
        .eq('id', 'a8244447-dbeb-4163-bc2c-dbe696b36b33')
        .single();

      if (error) throw error;
      if (data?.checkout_link) {
        setCheckoutUrl(data.checkout_link);
      }
    } catch (error: any) {
      if (error.code !== 'PGRST116') {
        console.error('Erro ao buscar link de checkout:', error);
      }
    }
  };

  useEffect(() => {
    if (mode === 'camera' && !permission?.granted) {
      requestPermission();
    }
  }, [mode]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setTagId(data);
    setMode('manual');
    Alert.alert('TAG Detectada', `Código: ${data}`, [
      { text: 'Confirmar', onPress: () => proceedToRegister(data) },
      { text: 'Escanear Novamente', onPress: () => setScanned(false) }
    ]);
  };

  const proceedToRegister = (id: string) => {
    if (!id) {
      Alert.alert('Erro', 'Por favor, informe o ID da TAG.');
      return;
    }
    // Navega para o registro passando o ID da TAG como parâmetro
    router.push({ pathname: '/register', params: { tagId: id } });
  };

  const handleBuyTag = async () => {
    if (!checkoutUrl) {
      Alert.alert('Link Indisponível', 'O link para aquisição da TAG não está disponível no momento. Por favor, tente novamente mais tarde.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link de compra.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao tentar abrir o checkout.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
        </Link>
        <Text style={styles.title}>Passo 1 de 2</Text>
      </View>

      <Text style={styles.mainTitle}>Vincule sua TAG</Text>
      <Text style={styles.subtitle}>
        Para criar sua conta, primeiro precisamos identificar seu dispositivo TAGPRO+.
      </Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'camera' && styles.activeTab]}
          onPress={() => {
            setMode('camera');
            setScanned(false);
          }}
        >
          <QrCode size={20} color={mode === 'camera' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.tabText, mode === 'camera' && styles.activeTabText]}>Escanear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'manual' && styles.activeTab]}
          onPress={() => setMode('manual')}
        >
          <Type size={20} color={mode === 'manual' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Digitar</Text>
        </TouchableOpacity>
      </View>

      {mode === 'camera' ? (
        <View style={styles.cameraContainer}>
          {!permission?.granted ? (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Permita o acesso à câmera para escanear o QR Code da caixa.</Text>
              <Button title="Permitir Câmera" onPress={requestPermission} />
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scanArea} />
              </View>
            </CameraView>
          )}
        </View>
      ) : (
        <View style={styles.form}>
          <Input
            label="ID da TAG"
            placeholder="Digite o código (Ex: TAG-123)"
            value={tagId}
            onChangeText={setTagId}
            autoCapitalize="characters"
            icon={<QrCode size={20} color={Colors.textSecondary} />}
          />
          <Button
            title="CONTINUAR"
            onPress={() => proceedToRegister(tagId)}
            icon={<ChevronRight size={20} color={Colors.white} />}
            style={{ marginTop: 24 }}
          />

          <Button
            title="ADQUIRIR NOVA TAG"
            onPress={handleBuyTag}
            variant="outline"
            icon={<ShoppingBag size={20} color={Colors.primary} />}
            style={{ marginTop: 12 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  tabs: {
    flexDirection: 'row',
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
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 24,
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
    borderRadius: 16,
  },
  form: {
    flex: 1,
  },
});
