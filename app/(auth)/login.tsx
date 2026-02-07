import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

import { translateSupabaseError } from '../../lib/errorTranslator';

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
      Alert.alert('Erro no Login', translateSupabaseError(error.message));
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

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <Button
            title="ENTRAR"
            onPress={handleLogin}
            loading={loading}
            icon={<LogIn size={20} color={Colors.white} />}
            style={styles.loginButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta? </Text>
            <Link href="/(auth)/scan-tag" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Cadastre-se</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.buyTagContainer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.buyTagButton}
              onPress={() => Linking.openURL('https://tag.besat.com.br/checkout/tagpro')}
            >
              <Text style={styles.buyTagLabel}>Não tem uma tag?</Text>
              <Text style={styles.buyTagAction}>Adquira agora!</Text>
            </TouchableOpacity>
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
  buyTagContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: Colors.textSecondary,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
    marginHorizontal: 16,
  },
  buyTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.2)',
  },
  buyTagLabel: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginRight: 6,
  },
  buyTagAction: {
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
});
