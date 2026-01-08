import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Check, X, Info, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  target_version?: string;
  condition: 'equal' | 'less_than' | 'all';
  is_active: boolean;
  created_at: string;
}

export default function NotificationsAdminScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'error'>('info');
  const [targetVersion, setTargetVersion] = useState('');
  const [condition, setCondition] = useState<'equal' | 'less_than' | 'all'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('in_app_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setNotifications(data);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirmar', 'Deseja realmente excluir esta notificação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('in_app_notifications')
              .delete()
              .eq('id', id);

            if (error) throw error;
            fetchNotifications();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        }
      }
    ]);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('in_app_notifications')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Atenção', 'Título e Mensagem são obrigatórios.');
      return;
    }

    if (condition !== 'all' && !targetVersion.trim()) {
      Alert.alert('Atenção', 'Versão alvo é obrigatória para esta condição.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('in_app_notifications')
        .insert({
          title,
          message,
          type,
          target_version: targetVersion || null,
          condition,
          created_by: user?.id,
          is_active: true
        });

      if (error) throw error;

      setModalVisible(false);
      resetForm();
      fetchNotifications();
      Alert.alert('Sucesso', 'Notificação criada com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível criar a notificação.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('info');
    setTargetVersion('');
    setCondition('all');
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'error': return <AlertCircle size={20} color="#EF4444" />;
      case 'warning': return <AlertTriangle size={20} color="#F59E0B" />;
      default: return <Info size={20} color="#3B82F6" />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificações Internas</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {notifications.map((item) => (
          <View key={item.id} style={[styles.card, !item.is_active && styles.cardInactive]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                {getTypeIcon(item.type)}
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleToggleActive(item.id, item.is_active)}>
                  {item.is_active ? (
                    <Check size={20} color={Colors.primary} />
                  ) : (
                    <X size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 12 }}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardMessage}>{item.message}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMeta}>
                {item.condition === 'all' 
                  ? 'Todas as versões' 
                  : `${item.condition === 'less_than' ? '<' : '='} ${item.target_version}`}
              </Text>
              <Text style={styles.cardMeta}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Notificação</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Input
                label="Título"
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Manutenção Programada"
              />

              <Text style={styles.label}>Mensagem</Text>
              <TextInput
                style={styles.textArea}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                placeholder="Digite a mensagem..."
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Tipo</Text>
              <View style={styles.row}>
                {['info', 'warning', 'error'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, type === t && styles.chipActive]}
                    onPress={() => setType(t as any)}
                  >
                    <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Regra de Exibição</Text>
              <View style={styles.row}>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'equal', label: 'Igual a' },
                  { id: 'less_than', label: 'Menor que' }
                ].map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, condition === c.id && styles.chipActive]}
                    onPress={() => setCondition(c.id as any)}
                  >
                    <Text style={[styles.chipText, condition === c.id && styles.chipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {condition !== 'all' && (
                <Input
                  label="Versão Alvo"
                  value={targetVersion}
                  onChangeText={setTargetVersion}
                  placeholder="Ex: 1.0.0"
                  keyboardType="numeric"
                />
              )}

              <Button
                title="CRIAR NOTIFICAÇÃO"
                onPress={handleCreate}
                loading={saving}
                style={{ marginTop: 20 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
  },
  cardMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textMuted,
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
    maxHeight: '80%',
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
  label: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontFamily: 'Poppins_400Regular',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },
});
