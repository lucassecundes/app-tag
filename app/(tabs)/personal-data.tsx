import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, User, Mail, Phone, Save } from 'lucide-react-native';
import { router } from 'expo-router';

export default function PersonalDataScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Preencher email do auth
      setEmail(user.email || '');
      
      // Buscar dados complementares
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (data) {
        setNome(data.nome || '');
        setTelefone(data.telefone || '');
      } else if (user.user_metadata?.full_name) {
        setNome(user.user_metadata.full_name);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const updates = {
        auth_user_id: user.id,
        nome,
        telefone,
        updated_at: new Date().toISOString(),
      };

      // Upsert para garantir que cria se não existir
      const { error } = await supabase
        .from('usuario')
        .upsert(updates, { onConflict: 'auth_user_id' });

      if (error) throw error;

      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar dados.');
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
        <Text style={styles.title}>Dados Pessoais</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <Input
            label="Nome Completo"
            placeholder="Seu nome"
            value={nome}
            onChangeText={setNome}
            icon={<User size={20} color={Colors.textSecondary} />}
          />

          <Input
            label="E-mail"
            value={email}
            editable={false}
            icon={<Mail size={20} color={Colors.textSecondary} />}
            style={{ opacity: 0.7 }}
          />
          <Text style={styles.helperText}>O e-mail não pode ser alterado por aqui.</Text>

          <Input
            label="Telefone / Celular"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
            icon={<Phone size={20} color={Colors.textSecondary} />}
          />
        </View>

        <Button 
          title="SALVAR ALTERAÇÕES" 
          onPress={handleSave} 
          loading={loading}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: Colors.background,
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
  helperText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginTop: -16, // Aproxima do input desabilitado
    marginBottom: 24,
    marginLeft: 4,
  },
  saveButton: {
    marginTop: 'auto',
  },
});
