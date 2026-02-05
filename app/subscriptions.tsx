import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CreditCard, ExternalLink, Calendar } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SubscriptionsScreen() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('plans_assinar')
        .select('*, planos(nome, preco, moeda)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas assinaturas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSupport = () => {
    Linking.openURL('https://wa.me/556740420408?text=Ol%C3%A1%2C%20gostaria%20de%20cancelar%20minha%20assinatura.');
  };

  const renderItem = ({ item }: { item: any }) => {
    const isActive = item.status === 'active';
    const planName = item.planos?.nome || 'Plano Desconhecido';
    const price = item.planos?.preco ? `${item.planos.moeda} ${item.planos.preco}` : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.planName}>{planName}</Text>
            {price ? <Text style={styles.planPrice}>{price}</Text> : null}
          </View>
          <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {isActive ? 'ATIVO' : 'INATIVO'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <Calendar size={16} color={Colors.textSecondary} />
          <Text style={styles.detailsText}>
            Vence em: {format(new Date(item.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
          </Text>
        </View>

        {isActive && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSupport}>
            <Text style={styles.cancelButtonText}>Cancelar Assinatura</Text>
            <ExternalLink size={14} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Minhas Assinaturas</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CreditCard size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Você não possui assinaturas ativas.</Text>
            </View>
          }
        />
      )}
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  content: {
    padding: 24,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
  },
  statusTextActive: {
    color: '#22c55e',
  },
  statusTextInactive: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  detailsText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
});
