import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ArrowLeft, Share2, Copy, Calendar, Clock, Trash2, CheckCircle2, Globe, ShieldAlert } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import * as Clipboard from 'expo-clipboard';
import { format, addHours, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';

const BASE_URL = 'https://tagpro-web.netlify.app'; // Ajustar conforme o ambiente real

export default function ShareLocationScreen() {
  const params = useLocalSearchParams();
  const { id, nome } = params;
  const { user } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremium();
  
  const [loading, setLoading] = useState(false);
  const [activeLinks, setActiveLinks] = useState<any[]>([]);
  const [fetchingLinks, setFetchingLinks] = useState(true);
  
  // Estados para novo link
  const [expiryDate, setExpiryDate] = useState(addHours(new Date(), 24)); // Default 24h
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fetchActiveLinks = useCallback(async () => {
    if (!id || !user) return;
    
    setFetchingLinks(true);
    try {
      const { data, error } = await supabase
        .from('compartilhamentos')
        .select('*')
        .eq('tag_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveLinks(data || []);
    } catch (error) {
      console.error('Erro ao buscar links de compartilhamento:', error);
    } finally {
      setFetchingLinks(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchActiveLinks();
  }, [fetchActiveLinks]);

  const handleCreateLink = async () => {
    if (!id || !user) return;

    if (!isPremium) {
      Alert.alert(
        'Recurso Premium',
        'Assine o plano Premium para gerar links de compartilhamento.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Planos', onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase
        .from('compartilhamentos')
        .insert({
          tag_id: id,
          usuario_id: user.id,
          token: token,
          valido_de: new Date().toISOString(),
          valido_ate: expiryDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Sucesso', 'Link de compartilhamento criado com sucesso!');
      fetchActiveLinks();
    } catch (error: any) {
      console.error('Erro ao criar link:', error);
      Alert.alert('Erro', 'Não foi possível criar o link de compartilhamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    Alert.alert(
      'Revogar Acesso',
      'Tem certeza que deseja desativar este link? O acesso será interrompido imediatamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desativar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('compartilhamentos')
                .delete()
                .eq('id', linkId);

              if (error) throw error;
              fetchActiveLinks();
            } catch (error) {
              console.error('Erro ao deletar link:', error);
              Alert.alert('Erro', 'Não foi possível desativar o link.');
            }
          }
        }
      ]
    );
  };

  const handleCopyLink = async (token: string) => {
    const url = `${BASE_URL}/compartilhado/${token}`;
    await Clipboard.setStringAsync(url);
    Alert.alert('Copiado', 'Link copiado para a área de transferência!');
  };

  const handleShareLink = async (token: string) => {
    const url = `${BASE_URL}/compartilhado/${token}`;
    try {
      await Share.share({
        message: `Acompanhe a localização em tempo real de ${nome}: ${url}`,
        url: url, // iOS apenas
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(expiryDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setExpiryDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(expiryDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setExpiryDate(newDate);
    }
  };

  const renderLinkItem = ({ item }: { item: any }) => {
    const isExpired = isAfter(new Date(), parseISO(item.valido_ate));
    
    return (
      <View style={[styles.linkCard, isExpired && styles.linkCardExpired]}>
        <View style={styles.linkHeader}>
          <View style={styles.tokenInfo}>
            <Globe size={16} color={isExpired ? Colors.textSecondary : Colors.primary} />
            <Text style={[styles.tokenText, isExpired && styles.textMuted]} numberOfLines={1}>
              {item.token}
            </Text>
          </View>
          <View style={[styles.statusBadge, isExpired ? styles.statusBadgeExpired : styles.statusBadgeActive]}>
            <Text style={styles.statusBadgeText}>{isExpired ? 'Expirado' : 'Ativo'}</Text>
          </View>
        </View>

        <View style={styles.linkDates}>
          <View style={styles.dateItem}>
            <Clock size={12} color={Colors.textSecondary} />
            <Text style={styles.dateText}>Expira em: {format(parseISO(item.valido_ate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</Text>
          </View>
        </View>

        <View style={styles.linkActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleCopyLink(item.token)}
          >
            <Copy size={18} color={Colors.text} />
            <Text style={styles.actionButtonText}>Copiar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleShareLink(item.token)}
          >
            <Share2 size={18} color={Colors.text} />
            <Text style={styles.actionButtonText}>Enviar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDeleteLink(item.id)}
          >
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (premiumLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Compartilhar Localização',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerInfo}>
          <View style={styles.iconCircle}>
            <Share2 size={32} color={Colors.white} />
          </View>
          <Text style={styles.title}>Compartilhar {nome}</Text>
          <Text style={styles.subtitle}>
            Crie um link temporário para que outras pessoas acompanhem este dispositivo em tempo real sem precisar de conta.
          </Text>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.sectionTitle}>Novo Link de Compartilhamento</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Expiração</Text>
            <TouchableOpacity 
              style={styles.dateSelector} 
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={Colors.primary} />
              <Text style={styles.dateSelectorText}>
                {format(expiryDate, 'dd/MM/yyyy', { locale: ptBR })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hora de Expiração</Text>
            <TouchableOpacity 
              style={styles.dateSelector} 
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={20} color={Colors.primary} />
              <Text style={styles.dateSelectorText}>
                {format(expiryDate, 'HH:mm', { locale: ptBR })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={expiryDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={expiryDate}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <Button 
            title="GERAR LINK PÚBLICO" 
            onPress={handleCreateLink}
            loading={loading}
            style={styles.generateButton}
          />
          
          <View style={styles.securityNote}>
            <ShieldAlert size={14} color={Colors.textSecondary} />
            <Text style={styles.securityNoteText}>
              O link permite visualizar apenas a localização atual e as últimas 3 posições.
            </Text>
          </View>
        </View>

        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>Links Ativos / Recentes</Text>
          
          {fetchingLinks ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : activeLinks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum link criado para este dispositivo.</Text>
            </View>
          ) : (
            activeLinks.map(link => (
              <View key={link.id}>
                {renderLinkItem({ item: link })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  configCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  dateSelectorText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: Colors.text,
  },
  generateButton: {
    marginTop: 10,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  securityNoteText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  linksSection: {
    flex: 1,
  },
  linkCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  linkCardExpired: {
    opacity: 0.7,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tokenText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text,
  },
  textMuted: {
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(0, 200, 81, 0.1)',
  },
  statusBadgeExpired: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text,
  },
  linkDates: {
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  linkActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
  },
  deleteButton: {
    flex: 0,
    width: 40,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
