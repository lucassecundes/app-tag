import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react-native';
import Constants from 'expo-constants';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper simples para comparação de versões semver (x.y.z)
const compareVersions = (v1: string, v2: string) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  target_version?: string;
  condition: 'equal' | 'less_than' | 'all';
}

export const NotificationBanner = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('in_app_notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const appVersion = Constants.expoConfig?.version || '1.0.0';
        const filtered = await filterNotifications(data, appVersion);
        setNotifications(filtered);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações internas:', error);
    }
  };

  const filterNotifications = async (data: any[], appVersion: string) => {
    const valid: Notification[] = [];
    
    for (const item of data) {
      // Verificar se já foi fechada pelo usuário (opcional, aqui vou manter sempre visível por sessão por enquanto, ou usar AsyncStorage)
      const isHidden = await AsyncStorage.getItem(`hide_notif_${item.id}`);
      if (isHidden) continue;

      if (item.condition === 'all') {
        valid.push(item);
      } else if (item.target_version) {
        const comparison = compareVersions(appVersion, item.target_version);
        
        if (item.condition === 'equal' && comparison === 0) {
          valid.push(item);
        } else if (item.condition === 'less_than' && comparison < 0) {
          valid.push(item);
        }
      }
    }
    return valid;
  };

  const handleClose = async () => {
    if (notifications[currentIndex]) {
      await AsyncStorage.setItem(`hide_notif_${notifications[currentIndex].id}`, 'true');
    }
    
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setVisible(false);
    }
  };

  if (!visible || notifications.length === 0) return null;

  const current = notifications[currentIndex];

  const getStyles = (type: string) => {
    switch (type) {
      case 'error':
        return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', icon: <AlertCircle size={20} color="#991B1B" /> };
      case 'warning':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', icon: <AlertTriangle size={20} color="#92400E" /> };
      default:
        return { bg: '#E0F2FE', border: '#3B82F6', text: '#075985', icon: <Info size={20} color="#075985" /> };
    }
  };

  const styleConfig = getStyles(current.type);

  return (
    <View style={[styles.container, { backgroundColor: styleConfig.bg, borderColor: styleConfig.border }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {styleConfig.icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: styleConfig.text }]}>{current.title}</Text>
          <Text style={[styles.message, { color: styleConfig.text }]}>{current.message}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={20} color={styleConfig.text} />
        </TouchableOpacity>
      </View>
      {notifications.length > 1 && (
        <View style={styles.pagination}>
          <Text style={[styles.paginationText, { color: styleConfig.text }]}>
            {currentIndex + 1} de {notifications.length}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 0 : 16, // Ajuste para SafeArea
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  pagination: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  paginationText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    opacity: 0.8,
  },
});
