import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Lock, Key } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SecurityScreen() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
        Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    if (password !== confirmPassword) {
        Alert.alert('Erro', 'As senhas não coincidem.');
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: password });
        if (error) throw error;
        Alert.alert('Sucesso', 'Sua senha foi atualizada com sucesso!');
        setPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        Alert.alert('Erro', error.message || 'Não foi possível atualizar a senha.');
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
        <Text style={styles.title}>Segurança e Senha</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
            Para sua segurança, escolha uma senha forte e não a compartilhe com ninguém.
        </Text>

        <View style={styles.form}>
          <Input
            label="Nova Senha"
            placeholder="Digite sua nova senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock size={20} color={Colors.textSecondary} />}
          />

          <Input
            label="Confirmar Nova Senha"
            placeholder="Repita a nova senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon={<Key size={20} color={Colors.textSecondary} />}
          />
        </View>

        <Button
          title="ATUALIZAR SENHA"
          onPress={handleUpdatePassword}
          loading={loading}
          icon={<Lock size={20} color={Colors.white} />}
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
  description: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  saveButton: {
    marginTop: 'auto',
  },
});
