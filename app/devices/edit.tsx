import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Car, Truck, Bike, Bus, Package, Save, Type, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Image } from 'react-native';

const DEVICE_TYPES = [
  { id: 'car', label: 'Carro', icon: <Car size={24} color={Colors.white} /> },
  { id: 'moto', label: 'Moto', icon: <Bike size={24} color={Colors.white} /> },
  { id: 'truck', label: 'Caminhão', icon: <Truck size={24} color={Colors.white} /> },
  { id: 'bus', label: 'Ônibus', icon: <Bus size={24} color={Colors.white} /> },
  { id: 'object', label: 'Objeto', icon: <Package size={24} color={Colors.white} /> },
];

export default function EditDeviceScreen() {
  const params = useLocalSearchParams();
  const { id } = params;

  const [nome, setNome] = useState('');
  const [type, setType] = useState('car');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDeviceDetails();
  }, [id]);

  const fetchDeviceDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setNome(data.nome || '');
        setType(data.icone || 'car');
        setImageUrl(data.imagem_url || null);
      }
    } catch (error) {
      console.error('Erro ao buscar dispositivo:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do dispositivo.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para alterar a imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    try {
      // Redimensiona para 200x200 para economizar espaço e manter qualidade no avatar/marker
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 200, height: 200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setNewImage(manipulatedImage.uri);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      Alert.alert('Erro', 'Não foi possível processar a imagem.');
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const fileName = `${id}_${Date.now()}.jpg`;
      
      // Converte a imagem para base64 para evitar o erro de 0 bytes no React Native
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      const { data, error } = await supabase.storage
        .from('device-images')
        .upload(fileName, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error('O bucket "device-images" não foi encontrado no Supabase. Por favor, crie-o no Dashboard do Supabase com acesso público.');
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('device-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome do dispositivo é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = imageUrl;

      if (newImage) {
        finalImageUrl = await uploadImage(newImage);
      }

      const { error } = await supabase
        .from('tags')
        .update({
          nome: nome.trim(),
          icone: type,
          imagem_url: finalImageUrl
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Dispositivo atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar dispositivo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Dispositivo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageSection}>
          <Text style={styles.label}>Imagem do Dispositivo</Text>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarFrame}>
              {newImage || imageUrl ? (
                <Image 
                  source={{ uri: newImage || imageUrl || undefined }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  {DEVICE_TYPES.find(t => t.id === type)?.icon}
                </View>
              )}
              <TouchableOpacity 
                style={styles.editImageButton} 
                onPress={pickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Camera size={20} color={Colors.white} />
                )}
              </TouchableOpacity>
              {(newImage || imageUrl) && (
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => {
                    setNewImage(null);
                    setImageUrl(null);
                  }}
                >
                  <X size={16} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.imageHint}>
              Toque na câmera para enviar uma foto personalizada
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome do Dispositivo"
            placeholder="Ex: Carro da Empresa"
            value={nome}
            onChangeText={setNome}
            icon={<Type size={20} color={Colors.textSecondary} />}
          />

          <Text style={styles.label}>Ícone do Dispositivo</Text>
          <View style={styles.typesGrid}>
            {DEVICE_TYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.typeCard,
                  type === item.id && styles.activeTypeCard
                ]}
                onPress={() => setType(item.id)}
              >
                <View style={[
                  styles.iconContainer,
                  type === item.id && styles.activeIconContainer
                ]}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, {
                    color: type === item.id ? Colors.white : Colors.textSecondary
                  })}
                </View>
                <Text style={[
                  styles.typeLabel,
                  type === item.id && styles.activeTypeLabel
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button 
          title="SALVAR ALTERAÇÕES" 
          onPress={handleSave} 
          loading={saving}
          icon={<Save size={20} color={Colors.white} />}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  form: {
    marginBottom: 32,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  avatarFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  placeholderAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
    zIndex: 2,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
    zIndex: 2,
  },
  imageHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTypeCard: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
  },
  iconContainer: {
    marginBottom: 8,
  },
  activeIconContainer: {
    // Efeitos adicionais se necessário
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  activeTypeLabel: {
    color: Colors.primary,
    fontFamily: 'Poppins_500Medium',
  },
  saveButton: {
    marginTop: 'auto',
  },
});
