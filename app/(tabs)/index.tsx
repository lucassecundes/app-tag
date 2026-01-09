import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Smartphone, Tag, MapPin, AlertCircle, Car, Truck, Bike, Bus, Package, Bell, ShieldAlert, Filter, Search, X } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { PremiumBanner } from '../../components/PremiumBanner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { translateSupabaseError } from '../../lib/errorTranslator';

export default function DeviceListScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admin Filter States
  const [isAdmin, setIsAdmin] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (user) {
      const { data } = await supabase
        .from('usuario')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();
      setIsAdmin(data?.role === 'admin');
    }
  };

  const fetchDevices = async () => {
    if (!user) return;
    setErrorMsg(null);
    try {
      console.log('Buscando dispositivos...');
      
      let query = supabase
        .from('tags')
        .select('*')
        .order('ultima_comunicacao', { ascending: false });

      // Se for admin e tiver filtro ativo, busca pelo ID alvo
      if (isAdmin && filterActive && targetUserId) {
        // Tenta buscar pelo usuario_id (UUID)
        query = query.eq('usuario_id', targetUserId);
      } else {
        // Comportamento padrão: busca os dispositivos do próprio usuário
        query = query.eq('usuario_id', user.id);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Erro Supabase:', error);
        setErrorMsg(translateSupabaseError(error.message));
        throw error;
      }

      console.log('Dispositivos encontrados:', data?.length);
      setDevices(data || []);
    } catch (error: any) {
      console.log('Erro no catch:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = () => {
    setFilterActive(true);
    setShowFilterModal(false);
    setLoading(true);
    fetchDevices();
  };

  const clearFilter = () => {
    setTargetUserId('');
    setFilterActive(false);
    setLoading(true);
    // fetchDevices será chamado pelo useEffect quando filterActive mudar, ou podemos chamar manualmente
    // mas precisamos garantir que o estado atualizou. 
    // Melhor abordagem: chamar fetchDevices na próxima renderização ou usar um useEffect dependente.
    // Para simplificar, vou forçar a chamada com o estado "limpo" lógico:
    setTimeout(() => {
        fetchDevices(); // Re-busca sem filtros (volta ao padrão user.id)
    }, 100);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchDevices();
      }
    }, [user, filterActive]) // Recarrega se o filtro mudar
  );

  useEffect(() => {
    // Realtime subscription para atualizar a lista se algo mudar
    const subscription = supabase
      .channel('tags_list_update_main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, () => {
        console.log('Mudança detectada na tabela tags, atualizando...');
        fetchDevices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  const handleDevicePress = (device: any) => {
    router.push({
      pathname: '/device-detail/[id]',
      params: { 
        id: device.id,
        nome: device.nome,
        lat: device.ultima_lat || -23.550520, 
        lng: device.ultima_lng || -46.633308,
        address: device.endereco
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car size={24} color={Colors.primary} />;
      case 'moto': return <Bike size={24} color={Colors.primary} />;
      case 'truck': return <Truck size={24} color={Colors.primary} />;
      case 'bus': return <Bus size={24} color={Colors.primary} />;
      case 'object': return <Package size={24} color={Colors.primary} />;
      default: return <Smartphone size={24} color={Colors.primary} />;
    }
  };

  // Função auxiliar para calcular tempo relativo
  const getTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const timeAgo = getTimeAgo(item.ultima_comunicacao);
    const hasLocation = !!item.endereco;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleDevicePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardIcon}>
          {getIcon(item.icone)}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.nome || 'Dispositivo sem nome'}</Text>
          
          {/* Alteração: Tempo movido para junto do ID */}
          <Text style={styles.cardSubtitle}>
            ID: {item.codigo || item.id?.substring(0, 8)}
            {timeAgo && <Text style={{ color: Colors.primary }}> • {timeAgo}</Text>}
          </Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.ultima_lat ? Colors.success : Colors.warning }]} />
            
            <Text style={styles.statusText} numberOfLines={1}>
              {hasLocation ? item.endereco : 'Aguardando posição'}
            </Text>
          </View>
        </View>
        
        <View style={styles.rightActions}>
          {(item.alerta_cerca || item.alerta_movimento) && (
            <View style={styles.alertsContainer}>
              {item.alerta_cerca && (
                <View style={[styles.alertBadge, { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
                  <ShieldAlert size={16} color={Colors.error} />
                </View>
              )}
              {item.alerta_movimento && (
                <View style={[styles.alertBadge, { backgroundColor: 'rgba(255, 187, 51, 0.1)' }]}>
                  <Bell size={16} color={Colors.warning} />
                </View>
              )}
            </View>
          )}
          <View style={styles.actionIcon}>
            <MapPin size={20} color={Colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}</Text>
          <Text style={styles.title}>Meus Dispositivos</Text>
        </View>
        
        {isAdmin && (
          <TouchableOpacity 
            style={[styles.filterButton, filterActive && styles.filterButtonActive]}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color={filterActive ? Colors.white : Colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Exibe aviso de filtro ativo */}
      {filterActive && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>Filtrando por ID: {targetUserId}</Text>
          <TouchableOpacity onPress={clearFilter}>
            <X size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Filtro */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Usuário</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>ID do Usuário (UUID)</Text>
            <Input 
              placeholder="Ex: 123e4567-e89b..." 
              value={targetUserId}
              onChangeText={setTargetUserId}
              autoCapitalize="none"
              icon={<Search size={20} color={Colors.textSecondary} />}
            />
            
            <Button 
              title="APLICAR FILTRO" 
              onPress={applyFilter}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* 3. Exibição Condicional do Banner Premium (Apenas para não-admin/não-premium) */}
      {!isPremium && !isAdmin && (
        <PremiumBanner message="Faça upgrade para monitorar dispositivos ilimitados" />
      )}

      {errorMsg && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color={Colors.white} />
          <Text style={styles.errorText}>Erro: {errorMsg}</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Tag size={48} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum dispositivo</Text>
              <Text style={styles.emptyText}>
                Você ainda não possui nenhuma TAGPRO+ vinculada.
              </Text>
              <Button 
                title="Vincular Agora" 
                onPress={() => router.push('/devices/add')}
                style={{ marginTop: 24, width: '100%' }}
              />
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/devices/add')}
        activeOpacity={0.8}
      >
        <Plus size={24} color={Colors.white} />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: Colors.background,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  errorContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.error,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: Colors.white,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  actionIcon: {
    padding: 8,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  filterBannerText: {
    color: Colors.white,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
});
