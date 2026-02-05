import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Smartphone, Tag, Trash2, AlertCircle, Edit2, Car, Truck, Bike, Bus, Package } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Image } from 'react-native';

export default function MyDevicesScreen() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const fetchDevices = async () => {
    if (!user) return;
    setErrorMsg(null);
    try {
      console.log('Gerenciador: Buscando dispositivos...');
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('usuario_id', user.id);

      if (error) {
        console.error('Erro Supabase Gerenciador:', error);
        setErrorMsg(error.message);
        throw error;
      }

      setDevices(data || []);
    } catch (error: any) {
      console.log('Erro no catch Gerenciador:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user) fetchDevices();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Excluir Dispositivo',
      'Tem certeza que deseja desvincular esta TAG? O histórico será mantido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tags')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              fetchDevices();
            } catch (e: any) {
              Alert.alert('Erro', e.message);
            }
          }
        }
      ]
    );
  };

  const handleEdit = (id: string) => {
    router.push({ pathname: '/devices/edit', params: { id } });
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

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        {item.imagem_url && !imageErrors[item.id] ? (
          <Image 
            source={{ uri: item.imagem_url }} 
            style={styles.deviceImage}
            resizeMode="cover"
            onError={() => {
              console.log(`Erro ao carregar imagem para o dispositivo ${item.id}`);
              setImageErrors(prev => ({ ...prev, [item.id]: true }));
            }}
          />
        ) : (
          getIcon(item.icone)
        )}
      </View>
      <View style={styles.cardContent}>
        {/* Alterado de item.name para item.nome */}
        <Text style={styles.cardTitle}>{item.nome || 'Dispositivo sem nome'}</Text>
        <Text style={styles.cardSubtitle}>ID: {item.codigo || item.id?.substring(0, 8)}</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.statusText}>Ativo</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEdit(item.id)} style={styles.actionButton}>
          <Edit2 size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
          <Trash2 size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Gerenciar Dispositivos</Text>
      </View>

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
                Você ainda não possui nenhuma TAGPRO+ vinculada à sua conta.
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

      {devices.length > 0 && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/devices/add')}
          activeOpacity={0.8}
        >
          <Plus size={24} color={Colors.white} />
        </TouchableOpacity>
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
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
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
});
