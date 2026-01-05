import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Colors } from '../../constants/Colors';
import { AlertTriangle, Battery, Shield, WifiOff, Bell, MapPin } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { PremiumBadge } from '../../components/PremiumBadge';
import { PremiumBanner } from '../../components/PremiumBanner';
import { router, useFocusEffect } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AlertsScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!user) return;
    
    try {
      // Busca notificações do banco de dados (tabela 'notificacoes' a ser criada/usada)
      // Como não temos a tabela ainda, vamos simular que buscamos vazio ou da tabela existente se houver
      // Vamos assumir uma estrutura padrão para quando o backend gerar
      
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') { // Ignora erro se tabela não existir
         console.log('Erro ao buscar notificações:', error);
      }
      
      setAlerts(data || []);
    } catch (error) {
      console.log('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAlerts();
    }, [user])
  );

  const handleAlertPress = (alert: any) => {
    if (alert.latitude && alert.longitude) {
      router.push({
        pathname: '/device-detail/[id]',
        params: { 
          id: alert.tag_id,
          lat: alert.latitude,
          lng: alert.longitude,
          focusAlert: 'true' // Parâmetro para focar no alerta
        }
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'geofence': return <Shield size={24} color={Colors.primary} />;
      case 'movement': return <AlertTriangle size={24} color={Colors.warning} />;
      case 'disconnect': return <WifiOff size={24} color={Colors.textSecondary} />;
      case 'battery': return <Battery size={24} color={Colors.error} />;
      default: return <Bell size={24} color={Colors.text} />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
    } catch (e) {
      return 'Recentemente';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
      </View>

      {!isPremium && <PremiumBanner message="Receba alertas ilimitados e prioridade." />}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Bell size={48} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Tudo tranquilo por aqui</Text>
              <Text style={styles.emptyText}>
                Você não possui novas notificações no momento.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.alertItem}
              onPress={() => handleAlertPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {getIcon(item.type)}
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  {!isPremium && <PremiumBadge size="small" style={{ marginLeft: 8 }} />}
                </View>
                <Text style={styles.alertMessage}>{item.message}</Text>
                <Text style={styles.alertTime}>{formatTime(item.created_at)}</Text>
              </View>
              {(item.latitude && item.longitude) && (
                <View style={styles.mapAction}>
                  <MapPin size={16} color={Colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    color: Colors.text,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
  },
  alertMessage: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  alertTime: {
    color: Colors.textMuted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  mapAction: {
    padding: 8,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    borderRadius: 8,
    marginLeft: 8,
  },
});
