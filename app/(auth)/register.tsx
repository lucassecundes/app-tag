import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Mail, Lock, User, ArrowLeft, Tag } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

import { translateSupabaseError } from '../../lib/errorTranslator';

export default function RegisterScreen() {
  const params = useLocalSearchParams();
  const tagId = params.tagId as string;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    
    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (authError) {
      Alert.alert('Erro no Cadastro', translateSupabaseError(authError.message));
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Registrar Aceite dos Termos
      const { error: termError } = await supabase
        .from('term_acceptances')
        .insert({
          user_id: authData.user.id,
          term_version: '1.0.0', // Versão inicial
          term_checksum: 'manual-check', // Placeholder, ideal seria hash do texto
          accepted_at: new Date().toISOString(),
          metadata: {
            device: Platform.OS,
            app_version: '1.0.0',
            ip_address: 'mobile-app'
          }
        });

      if (termError) {
        console.error('Erro ao registrar aceite:', termError);
        // Não bloqueamos o fluxo, mas logamos o erro
      }

      // 3. Vincular a TAG ao novo usuário na tabela 'tags'
      if (tagId) {
        const { error: deviceError } = await supabase
          .from('tags')
          .insert({
            usuario_id: authData.user.id,
            // Alterado de name para nome
            nome: `TAG ${tagId}`,
            codigo: tagId,
            icone: 'car',
            created_at: new Date().toISOString(),
          });

        if (deviceError) {
          console.log('Erro ao vincular tag:', deviceError);
          Alert.alert('Atenção', 'Conta criada, mas houve um erro ao vincular a TAG automaticamente. Tente vincular manualmente no app.');
        }
      }

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso! Faça login para continuar.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
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
          <Link href="/(auth)/scan-tag" asChild>
            <Button 
              title="" 
              onPress={() => {}} 
              variant="ghost" 
              icon={<ArrowLeft size={24} color={Colors.text} />}
              style={styles.backButton}
            />
          </Link>
          <View>
             <Text style={styles.stepTitle}>Passo 2 de 2</Text>
             <Text style={styles.title}>Criar Conta</Text>
          </View>
        </View>

        {tagId && (
          <View style={styles.tagBadge}>
            <Tag size={16} color={Colors.primary} />
            <Text style={styles.tagText}>Vinculando TAG: {tagId}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Input
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
            icon={<User size={20} color={Colors.textSecondary} />}
          />

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

          <Text style={styles.termsText}>
            Ao se cadastrar, você concorda com nossos{' '}
            <Text style={styles.linkText} onPress={() => router.push('/(auth)/terms')}>
              Termos de Uso
            </Text>{' '}
            e{' '}
            <Text style={styles.linkText} onPress={() => router.push('/(auth)/privacy')}>
              Política de Privacidade
            </Text>.
          </Text>

          <Button 
            title="FINALIZAR CADASTRO" 
            onPress={handleRegister} 
            loading={loading}
            style={styles.registerButton}
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
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
    justifyContent: 'flex-start',
    marginRight: 8,
  },
  stepTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.3)',
  },
  tagText: {
    color: Colors.primary,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  termsText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 24,
    lineHeight: 20,
  },
  linkText: {
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  registerButton: {
    marginBottom: 24,
  },
});
