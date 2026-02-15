import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { User, Settings, Shield, HelpCircle, LogOut, ChevronRight, Smartphone, Crown, CreditCard, Gift } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { ReferralProfileCard } from '../../components/referral/ReferralProfileCard';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import Constants from 'expo-constants';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isPremium } = usePremium();
  const [userName, setUserName] = useState<string>('Usuário');
  const [userData, setUserData] = useState<any>(null);

  // useFocusEffect para recarregar dados sempre que a tela ganhar foco (ex: voltar da edição)
  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        if (user) {
          // Tenta pegar do metadata primeiro
          if (user.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name);
          }

          // Busca na tabela usuario para garantir dados atualizados
          try {
            const { data, error } = await supabase
              .from('usuario')
              .select('*')
              .eq('auth_user_id', user.id)
              .single();

            if (data) {
              setUserData(data);
              if (data.nome) {
                setUserName(data.nome);
              }
            }
          } catch (error) {
            console.error('Erro ao buscar dados do perfil:', error);
          }
        }
      };

      fetchUserData();
    }, [user])
  );

  const menuItems = [
    // Admin menu - Only visible for admin users
    ...(userData?.role === 'admin' ? [
      { icon: <Shield size={20} color="#FF6B35" />, label: 'Área do Admin', action: () => router.push('/admin/dashboard'), isAdmin: true }
    ] : []),
    { icon: <User size={20} color={Colors.text} />, label: 'Dados Pessoais', action: () => router.push('/(tabs)/personal-data') },
    // Ação atualizada para navegar para a tela de dispositivos
    { icon: <Smartphone size={20} color={Colors.text} />, label: 'Meus Dispositivos', action: () => router.push('/devices') },
    { icon: <Shield size={20} color={Colors.text} />, label: 'Segurança e Senha', action: () => router.push('/(tabs)/security') },
    { icon: <Settings size={20} color={Colors.text} />, label: 'Configurações do App', action: () => router.push('/(tabs)/settings') },
    { icon: <Gift size={20} color={Colors.text} />, label: 'Minhas Indicações', action: () => router.push('/referral/dashboard') },
    { icon: <HelpCircle size={20} color={Colors.text} />, label: 'Suporte Técnico', action: () => { } },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.email?.substring(0, 2).toUpperCase() || 'US'}
          </Text>

        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <ReferralProfileCard onPress={() => router.push('/referral')} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
                item.isAdmin && styles.adminMenuItem
              ]}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, item.isAdmin && styles.adminIconBox]}>
                  {item.icon}
                </View>
                <Text style={[styles.menuItemLabel, item.isAdmin && styles.adminLabel]}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color={item.isAdmin ? '#FF6B35' : Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button
        title="Sair da Conta"
        onPress={signOut}
        variant="outline"
        icon={<LogOut size={20} color={Colors.primary} />}
        style={styles.logoutButton}
      />

      <Text style={styles.versionText}>Versão {Constants.expoConfig?.version}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFD700',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.primary,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceHighlight,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: Colors.text,
  },
  adminMenuItem: {
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  adminIconBox: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  adminLabel: {
    color: '#FF6B35',
    fontFamily: 'Montserrat_600SemiBold',
  },
  logoutButton: {
    marginTop: 60,
    marginBottom: 24,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
});
