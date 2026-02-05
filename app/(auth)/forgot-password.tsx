import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../lib/errorTranslator';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu email.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'tagpro://reset-password',
    });

    if (error) {
      Alert.alert('Erro', translateSupabaseError(error.message));
    } else {
      Alert.alert(
        'Email Enviado',
        'Se este email estiver cadastrado, você receberá um link para redefinir sua senha.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Button 
            title="" 
            onPress={() => router.back()} 
            variant="ghost" 
            icon={<ArrowLeft size={24} color={Colors.text} />}
            style={styles.backButton}
          />
          <View>
             <Text style={styles.title}>Recuperar Senha</Text>
             <Text style={styles.subtitle}>Enviaremos um link para o seu email</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="Seu email cadastrado"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Mail size={20} color={Colors.textSecondary} />}
          />

          <Button 
            title="ENVIAR LINK" 
            onPress={handleResetPassword} 
            loading={loading}
            icon={<Send size={20} color={Colors.white} />}
            style={styles.resetButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
    justifyContent: 'flex-start',
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  resetButton: {
    marginTop: 16,
  },
});
