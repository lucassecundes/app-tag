import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Car, Truck, Bike, Bus, Package, Save, Type } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      }
    } catch (error) {
      console.error('Erro ao buscar dispositivo:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do dispositivo.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome do dispositivo é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          nome: nome.trim(),
          icone: type
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
                  {React.cloneElement(item.icon as React.ReactElement, {
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
