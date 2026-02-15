import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Smartphone, Tag, MapPin, AlertCircle, Car, Truck, Bike, Bus, Package, Bell, ShieldAlert, Filter, Search, X, User } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';

import { ChatIcon } from '../../components/ChatIcon';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { translateSupabaseError } from '../../lib/errorTranslator';
import { Image } from 'react-native';
import { DeviceListItem } from '../../components/DeviceListItem';

export default function DeviceListScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('Usuário');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Admin Filter States
  const [isAdmin, setIsAdmin] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetTagCode, setTargetTagCode] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [targetUserLabel, setTargetUserLabel] = useState(''); // Store the email or name for display

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState<any>(null);

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer) clearTimeout(searchTimer);

    if (text.length < 2) {
      setUserResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(text);
    }, 500);
    setSearchTimer(timer);
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('auth_user_id, nome, email')
        .or(`email.ilike.%${query}%,nome.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      setUserResults(data || []);
    } catch (error) {
      console.log('Erro na busca principal:', error);
      // Fallback: tentar apenas por nome se email falhar
      try {
        const { data } = await supabase
          .from('usuario')
          .select('auth_user_id, nome')
          .ilike('nome', `%${query}%`)
          .limit(5);
        setUserResults(data || []);
      } catch (e) {
        console.log('Erro no fallback:', e);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = (selectedUser: any) => {
    setTargetUserId(selectedUser.auth_user_id);
    setTargetTagCode(''); // Clear tag code if selecting user
    setTargetUserLabel(selectedUser.email || selectedUser.nome || selectedUser.auth_user_id);
    setFilterActive(true);
    setShowFilterModal(false);
    // O useEffect cuidará de recarregar os dispositivos
  };

  useEffect(() => {
    checkAdminStatus();
    fetchUserName();
  }, [user]);

  const fetchUserName = async () => {
    if (user) {
      // Tenta pegar do metadata primeiro
      if (user.user_metadata?.full_name) {
        setFirstName(user.user_metadata.full_name.split(' ')[0]);
        return;
      }

      // Se não tiver no metadata, busca no banco
      const { data } = await supabase
        .from('usuario')
        .select('nome')
        .eq('auth_user_id', user.id)
        .single();

      if (data?.nome) {
        setFirstName(data.nome.split(' ')[0]);
      }
    }
  };

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

  const fetchDevices = React.useCallback(async () => {
    if (!user) return;
    setErrorMsg(null);
    try {
      console.log('Buscando dispositivos...');

      let query = supabase
        .from('tags')
        .select('*')
        .order('ultima_comunicacao', { ascending: false });

      // Se for admin e tiver filtro ativo
      if (isAdmin && filterActive) {
        if (targetUserId) {
          // Busca pelo usuario_id
          query = query.eq('usuario_id', targetUserId);
        } else if (targetTagCode) {
          // Busca pelo código da tag
          // Usando ilike para ser case-insensitive e permitir busca parcial se desejar, 
          // mas eq é melhor para código exato. O usuário pediu "pesquisar por codigo".
          // Vamos usar ilike para flexibilidade
          query = query.ilike('codigo', `%${targetTagCode}%`);
        }
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
  }, [user, isAdmin, filterActive, targetUserId, targetTagCode]);

  const applyFilter = () => {
    if (targetTagCode) {
      setTargetUserLabel(`Código: ${targetTagCode}`);
      setTargetUserId(''); // Clear user ID if using code
    } else {
      setTargetUserLabel(targetUserId);
    }
    setFilterActive(true);
    setShowFilterModal(false);
    setLoading(true);
    // fetchDevices will be called by useFocusEffect or we call it here?
    // Since fetchDevices is a dependency of useFocusEffect now (via useCallback ref change?), 
    // actually useFocusEffect depends on callback consistency.
    // Better to just call it. But since state update is async, focus effect handles it.
  };

  const clearFilter = () => {
    setTargetUserId('');
    setTargetTagCode('');
    setFilterActive(false);
    setLoading(true);
    setTimeout(() => {
      // Trigger refresh
      setFilterActive(false); // Ensure state
    }, 100);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchDevices();
      }
    }, [user, fetchDevices])
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
  }, [fetchDevices]); // Added fetchDevices dependency to ensure latest closure is used

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

    return (
      <DeviceListItem
        item={item}
        onPress={handleDevicePress}
        timeAgo={timeAgo}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {firstName}</Text>
          <Text style={styles.title}>Lista de Dispositivos</Text>
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
          <Text style={styles.filterBannerText}>Filtrando por: {targetUserLabel}</Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Usuário</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Pesquisar Usuário (Nome ou Email)</Text>
            <Input
              placeholder="Digite nome ou email..."
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              autoCapitalize="none"
              icon={<Search size={20} color={Colors.textSecondary} />}
            />

            {isSearching && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
            )}

            <FlatList
              data={userResults}
              keyExtractor={(item) => item.auth_user_id}
              style={{ marginTop: 8, maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => selectUser(item)}
                >
                  <View style={styles.resultIcon}>
                    <User size={20} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.resultName}>{item.nome || 'Sem nome'}</Text>
                    {item.email && <Text style={styles.resultEmail}>{item.email}</Text>}
                    <Text style={styles.resultId}>ID: {item.auth_user_id?.substring(0, 8)}...</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length > 2 && !isSearching ? (
                  <Text style={styles.noResultText}>Nenhum usuário encontrado.</Text>
                ) : null
              }
            />

            <View style={styles.modalDivider} />

            <Text style={styles.modalLabel}>Ou Pesquisar por Código (TAG)</Text>
            <Input
              placeholder="Ex: TAG-123456"
              value={targetTagCode}
              onChangeText={(text) => {
                setTargetTagCode(text);
                if (text) setTargetUserId(''); // Clear user ID if checking code
              }}
              autoCapitalize="characters"
              icon={<Tag size={20} color={Colors.textSecondary} />}
            />

            <Button
              title="APLICAR FILTRO"
              onPress={applyFilter}
              style={{ marginTop: 16 }}
              variant="outline"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. Exibição Condicional do Banner Premium (Apenas para não-admin/não-premium) */}


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

      <ChatIcon style={{ bottom: 200, right: 24 }} />
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
    paddingBottom: 160,
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
    overflow: 'hidden',
  },
  deviceImage: {
    width: 48,
    height: 48,
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
    bottom: 130, // Aumentado para dar mais espaço da tab bar
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
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultName: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
  },
  resultEmail: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  resultId: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    opacity: 0.7,
  },
  noResultText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 16,
    fontFamily: 'Poppins_400Regular',
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
});
