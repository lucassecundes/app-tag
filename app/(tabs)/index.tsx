import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Linking,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Plus,
  Tag,
  AlertCircle,
  Filter,
  Search,
  X,
  User,
  ShoppingBag,
} from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { translateSupabaseError } from '../../lib/errorTranslator';
import { DeviceListItem } from '../../components/DeviceListItem';

const TAG_ICON = require('../../assets/images/icon tag.png');

export default function DeviceListScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();

  const techAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(techAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [techAnim]);

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('Usuário');

  // Admin Filter States
  const [isAdmin, setIsAdmin] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetTagCode, setTargetTagCode] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [targetUserLabel, setTargetUserLabel] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState<any>(null);

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer) clearTimeout(searchTimer);
    if (text.length < 2) { setUserResults([]); return; }
    const timer = setTimeout(() => { performSearch(text); }, 500);
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
      try {
        const { data } = await supabase.from('usuario').select('auth_user_id, nome').ilike('nome', `%${query}%`).limit(5);
        setUserResults(data || []);
      } catch (e) { console.log('Erro no fallback:', e); }
    } finally { setIsSearching(false); }
  };

  const selectUser = (selectedUser: any) => {
    setTargetUserId(selectedUser.auth_user_id);
    setTargetTagCode('');
    setTargetUserLabel(selectedUser.email || selectedUser.nome || selectedUser.auth_user_id);
    setFilterActive(true);
    setShowFilterModal(false);
  };

  useEffect(() => {
    checkAdminStatus();
    fetchUserName();
  }, [user]);

  const fetchUserName = async () => {
    if (user) {
      if (user.user_metadata?.full_name) {
        setFirstName(user.user_metadata.full_name.split(' ')[0]);
        return;
      }
      const { data } = await supabase.from('usuario').select('nome').eq('auth_user_id', user.id).single();
      if (data?.nome) setFirstName(data.nome.split(' ')[0]);
    }
  };

  const checkAdminStatus = async () => {
    if (user) {
      const { data } = await supabase.from('usuario').select('role').eq('auth_user_id', user.id).single();
      setIsAdmin(data?.role === 'admin');
    }
  };

  const fetchDevices = React.useCallback(async () => {
    if (!user) return;
    setErrorMsg(null);
    try {
      let query = supabase.from('tags').select('*').order('ultima_comunicacao', { ascending: false });
      if (isAdmin && filterActive) {
        if (targetUserId) query = query.eq('usuario_id', targetUserId);
        else if (targetTagCode) query = query.ilike('codigo', `%${targetTagCode}%`);
      } else {
        query = query.or(`usuario_id.eq.${user.id},usuarios_ids.cs.{"${user.id}"}`);
      }
      const { data, error } = await query;
      if (error) { setErrorMsg(translateSupabaseError(error.message)); throw error; }
      setDevices(data || []);
    } catch (error: any) {
      console.log('Erro no catch:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isAdmin, filterActive, targetUserId, targetTagCode]);

  const applyFilter = () => {
    if (targetTagCode) { setTargetUserLabel(`Código: ${targetTagCode}`); setTargetUserId(''); }
    else setTargetUserLabel(targetUserId);
    setFilterActive(true);
    setShowFilterModal(false);
    setLoading(true);
  };

  const clearFilter = () => {
    setTargetUserId(''); setTargetTagCode(''); setFilterActive(false); setLoading(true);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user) fetchDevices();
    }, [user, fetchDevices])
  );

  useEffect(() => {
    const subscription = supabase
      .channel('tags_list_update_main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, () => { fetchDevices(); })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [fetchDevices]);

  const onRefresh = () => { setRefreshing(true); fetchDevices(); };

  const handleDevicePress = (device: any) => {
    if (!device.ultima_lat || !device.ultima_lng) {
      router.push({ pathname: '/device-detail/connecting', params: { id: device.id, nome: device.nome, mac: device.mac } });
      return;
    }
    router.push({
      pathname: '/device-detail/[id]',
      params: { id: device.id, nome: device.nome, mac: device.mac, lat: device.ultima_lat, lng: device.ultima_lng, address: device.endereco },
    });
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const now = new Date(); const past = new Date(dateString);
    const diffMins = Math.floor((now.getTime() - past.getTime()) / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `cerca de ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  };

  // Compute stats
  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.ultima_comunicacao && (new Date().getTime() - new Date(d.ultima_comunicacao).getTime()) < 24 * 60 * 60 * 1000).length;
  const activePercent = totalDevices > 0 ? Math.round((activeDevices / totalDevices) * 100) : 0;

  const renderItem = ({ item }: { item: any }) => {
    const timeAgo = getTimeAgo(item.ultima_comunicacao);
    return <DeviceListItem item={item} onPress={handleDevicePress} timeAgo={timeAgo} />;
  };

  const renderHeader = () => (
    <View>
      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalDevices}</Text>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statSub}>Dispositivos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{activeDevices}</Text>
          <Text style={styles.statLabel}>Ativos</Text>
          <Text style={[styles.statSub, { color: Colors.primary }]}>• {activePercent}%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {devices.some(d => d.battery === 1) ? '⚠' : '100%'}
          </Text>
          <Text style={styles.statLabel}>Bateria</Text>
          <Text style={styles.statSub}>Média</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: activeDevices === totalDevices && totalDevices > 0 ? Colors.primary : Colors.warning, fontSize: 13 }]}>
            {activeDevices === totalDevices && totalDevices > 0 ? '✓' : '!'}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statSub, { color: activeDevices === totalDevices && totalDevices > 0 ? Colors.primary : Colors.warning }]}>
            {activeDevices === totalDevices && totalDevices > 0 ? 'TUDO OK' : 'ATENÇÃO'}
          </Text>
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIconWrap}>
            <Tag size={16} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Meus veículos</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={[styles.filterButton, filterActive && styles.filterButtonActive]}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={16} color={filterActive ? Colors.background : Colors.textSecondary} />
            <Text style={[styles.filterBtnText, filterActive && { color: Colors.background }]}>
              {filterActive ? 'Filtrado' : 'Filtrar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {filterActive && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>Filtro: {targetUserLabel}</Text>
          <TouchableOpacity onPress={clearFilter} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={14} color={Colors.background} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // "Buy new Tag+" CTA footer
  const renderFooter = () => (
    <TouchableOpacity
      style={styles.acquireContainer}
      onPress={() => Linking.openURL('https://tag.besat.com.br/checkout/tagpro')}
      activeOpacity={0.88}
    >
      <View style={styles.acquireLeft}>
        <Text style={styles.acquireTitle}>Proteja mais veículos com Tag+</Text>
        <Text style={styles.acquireSubtitle}>
          Adquira um novo dispositivo e tenha ainda mais controle e segurança.
        </Text>
        <TouchableOpacity
          style={styles.acquireBtn}
          onPress={() => Linking.openURL('https://tag.besat.com.br/checkout/tagpro')}
          activeOpacity={0.8}
        >
          <ShoppingBag size={16} color={Colors.background} style={{ marginRight: 6 }} />
          <Text style={styles.acquireBtnText}>Comprar nova Tag+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.acquireImageContainer}>
        <Animated.View style={[styles.acquireImageGlow, {
          opacity: techAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
          transform: [{ scale: techAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] }) }]
        }]} />
        <Animated.View style={[styles.acquireImageGlow, {
          opacity: techAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
          transform: [{ scale: techAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }]
        }]} />
        <Image source={TAG_ICON} style={styles.acquireImage} resizeMode="contain" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Gerencie todos os dispositivos da Tag+.</Text>
          <Text style={styles.title}>Dispositivos</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}}>
            <Search size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, styles.headerIconBtnPrimary]}
            onPress={() => router.push('/devices/add')}
          >
            <Plus size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={Colors.white} />
          <Text style={styles.errorText}>{errorMsg}</Text>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListHeaderComponent={renderHeader()}
          ListFooterComponent={renderFooter()}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Image source={TAG_ICON} style={styles.emptyImage} resizeMode="contain" />
              <Text style={styles.emptyTitle}>Nenhum dispositivo</Text>
              <Text style={styles.emptyText}>Você ainda não possui nenhuma TAG+ vinculada.</Text>
              <Button title="Vincular Agora" onPress={() => router.push('/devices/add')} style={{ marginTop: 24, width: '100%' }} />
            </View>
          }
        />
      )}

      {/* Admin Filter Modal */}
      <Modal visible={showFilterModal} transparent={true} animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Usuário</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}><X size={24} color={Colors.text} /></TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Pesquisar Usuário (Nome ou Email)</Text>
            <Input
              placeholder="Digite nome ou email..."
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              autoCapitalize="none"
              icon={<Search size={20} color={Colors.textSecondary} />}
            />
            {isSearching && <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />}
            <FlatList
              data={userResults}
              keyExtractor={(item) => item.auth_user_id}
              style={{ marginTop: 8, maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => selectUser(item)}>
                  <View style={styles.resultIcon}><User size={20} color={Colors.primary} /></View>
                  <View>
                    <Text style={styles.resultName}>{item.nome || 'Sem nome'}</Text>
                    {item.email && <Text style={styles.resultEmail}>{item.email}</Text>}
                    <Text style={styles.resultId}>ID: {item.auth_user_id?.substring(0, 8)}...</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={searchQuery.length > 2 && !isSearching ? <Text style={styles.noResultText}>Nenhum usuário encontrado.</Text> : null}
            />
            <View style={styles.modalDivider} />
            <Text style={styles.modalLabel}>Ou Pesquisar por Código (TAG)</Text>
            <Input
              placeholder="Ex: 1234567890"
              value={targetTagCode}
              onChangeText={(text) => { setTargetTagCode(text); if (text) setTargetUserId(''); }}
              autoCapitalize="characters"
              icon={<Tag size={20} color={Colors.textSecondary} />}
            />
            <Button title="APLICAR FILTRO" onPress={applyFilter} style={{ marginTop: 16 }} variant="outline" />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  greeting: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statSub: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  filterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterBannerText: {
    color: Colors.background,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    flex: 1,
  },

  // List
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyImage: { width: 100, height: 100, opacity: 0.7, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Error
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.error,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: Colors.white, fontFamily: 'Poppins_400Regular', fontSize: 12, flex: 1 },

  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Acquire CTA
  acquireContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    overflow: 'hidden',
    position: 'relative',
    // subtle glow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  acquireLeft: { flex: 1, paddingRight: 10 },
  acquireTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  acquireSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  acquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  acquireBtnText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.background,
  },
  acquireImageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acquireImageGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  acquireImage: {
    width: 80,
    height: 80,
    zIndex: 1,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: Colors.text },
  modalLabel: { fontSize: 13, fontFamily: 'Montserrat_500Medium', color: Colors.textSecondary, marginBottom: 8 },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  resultIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryGlow, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  resultName: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: Colors.text },
  resultEmail: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: Colors.textSecondary },
  resultId: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: Colors.textSecondary, opacity: 0.7 },
  noResultText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 16, fontFamily: 'Poppins_400Regular' },
  modalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
});
