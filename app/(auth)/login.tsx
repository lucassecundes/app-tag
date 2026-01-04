import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Erro no Login', error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>TAGPRO<Text style={styles.logoPlus}>+</Text></Text>
            <Text style={styles.tagline}>Tecnologia invisível. Segurança imbatível.</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.welcomeText}>Bem-vindo de volta</Text>
          <Text style={styles.subtitleText}>Faça login para continuar</Text>

          <Input
            placeholder="Seu email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Mail size={20} color={Colors.textSecondary} />}
          />

          <Input
            placeholder="Sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock size={20} color={Colors.textSecondary} />}
          />

          <View style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </View>

          <Button 
            title="ENTRAR" 
            onPress={handleLogin} 
            loading={loading}
            icon={<LogIn size={20} color={Colors.white} />}
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button 
            title="Entrar com WhatsApp" 
            onPress={() => {}} 
            variant="secondary"
            style={styles.whatsappButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta? </Text>
            {/* Alterado para apontar para scan-tag em vez de register direto */}
            <Link href="/(auth)/scan-tag" asChild>
              <Text style={styles.linkText}>Cadastre-se</Text>
            </Link>
          </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    letterSpacing: 2,
  },
  logoPlus: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: Colors.textSecondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  form: {
    width: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  whatsappButton: {
    marginBottom: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  linkText: {
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
});
