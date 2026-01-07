import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { User, Settings, Shield, HelpCircle, LogOut, ChevronRight, Smartphone } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
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

  const openSupportWhatsApp = async () => {
    const whatsappUrl = 'https://wa.me/556740420408?text=Preciso%20de%20suporte%20no%20app%20Tagpro+';
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    }
  };

  const menuItems = [
    { icon: <User size={20} color={Colors.text} />, label: 'Dados Pessoais', action: () => router.push('/(tabs)/personal-data') },
    // Ação atualizada para navegar para a tela de dispositivos
    { icon: <Smartphone size={20} color={Colors.text} />, label: 'Meus Dispositivos', action: () => router.push('/devices') },
    { icon: <Shield size={20} color={Colors.text} />, label: 'Segurança e Senha', action: () => router.push('/(tabs)/security') },
    { icon: <Settings size={20} color={Colors.text} />, label: 'Configurações do App', action: () => router.push('/(tabs)/settings') },
    { icon: <HelpCircle size={20} color={Colors.text} />, label: 'Suporte Técnico', action: openSupportWhatsApp },
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem
              ]}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconBox}>
                  {item.icon}
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} />
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
      
      <Text style={styles.versionText}>Versão 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  logoutButton: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
});
