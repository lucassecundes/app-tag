import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Car, Truck, Bike, Bus, Package, Save, Type, CreditCard } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../lib/errorTranslator';
import { PlanService } from '../../services/planService';

const DEVICE_TYPES = [
  { id: 'car', label: 'Carro', icon: <Car size={24} color={Colors.white} /> },
  { id: 'moto', label: 'Moto', icon: <Bike size={24} color={Colors.white} /> },
  { id: 'truck', label: 'Caminhão', icon: <Truck size={24} color={Colors.white} /> },
  { id: 'bus', label: 'Ônibus', icon: <Bus size={24} color={Colors.white} /> },
  { id: 'object', label: 'Objeto', icon: <Package size={24} color={Colors.white} /> },
];

export default function EditDeviceScreen() {
  const params = useLocalSearchParams();
  const { id } = params;

  const [nome, setNome] = useState('');
  const [type, setType] = useState('car');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDeviceDetails();
  }, [id]);

  const fetchDeviceDetails = async () => {
    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();

      if (deviceError) throw deviceError;

      if (deviceData) {
        setNome(deviceData.nome || '');
        setType(deviceData.icone || 'car');
        
        // Fetch plan details
        const planData = await PlanService.getDevicePlan(String(id));
        setPlan(planData);
      }
    } catch (error) {
      console.error('Erro ao buscar dispositivo:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do dispositivo.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRenovate = async () => {
    const checkoutUrl = plan?.planos?.checkout_url || 'https://pagamento.tagnativo.com.br/checkout/e264dc25-efa9-4530-8e62-dd0563394313';
    
    if (checkoutUrl) {
      await WebBrowser.openBrowserAsync(checkoutUrl);
    } else {
      Alert.alert('Erro', 'Link de renovação indisponível.');
    }
  };

  const isCloseToExpiry = (dateString: string) => {
    const expiry = new Date(dateString);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome do dispositivo é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          nome: nome.trim(),
          icone: type
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Dispositivo atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', translateSupabaseError(error.message) || 'Erro ao atualizar dispositivo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Dispositivo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <Input
            label="Nome do Dispositivo"
            placeholder="Ex: Carro da Empresa"
            value={nome}
            onChangeText={setNome}
            icon={<Type size={20} color={Colors.textSecondary} />}
          />

          <Text style={styles.label}>Ícone do Dispositivo</Text>
          <View style={styles.typesGrid}>
            {DEVICE_TYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.typeCard,
                  type === item.id && styles.activeTypeCard
                ]}
                onPress={() => setType(item.id)}
              >
                <View style={[
                  styles.iconContainer,
                  type === item.id && styles.activeIconContainer
                ]}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, {
                    color: type === item.id ? Colors.white : Colors.textSecondary
                  })}
                </View>
                <Text style={[
                  styles.typeLabel,
                  type === item.id && styles.activeTypeLabel
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {plan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assinatura e Plano</Text>
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <CreditCard size={20} color={Colors.primary} />
                <Text style={styles.planName}>Plano Anual</Text>
                <View style={[styles.statusBadge, plan.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                  <Text style={[styles.statusText, plan.status === 'active' ? styles.statusTextActive : styles.statusTextInactive]}>
                    {plan.status === 'active' ? 'ATIVO' : 'INATIVO'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.planDetails}>
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Ativação:</Text>
                  <Text style={styles.planValue}>
                    {format(new Date(plan.activation_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </Text>
                </View>
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Vencimento:</Text>
                  <Text style={[
                    styles.planValue,
                    isCloseToExpiry(plan.expiration_date) && styles.expiryWarning
                  ]}>
                    {format(new Date(plan.expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </Text>
                </View>
              </View>

              {isCloseToExpiry(plan.expiration_date) && (
                <Button 
                  title="RENOVAR AGORA" 
                  onPress={handleRenovate}
                  variant="outline"
                  style={styles.renewButton}
                />
              )}
            </View>
          </View>
        )}

        <Button 
          title="SALVAR ALTERAÇÕES" 
          onPress={handleSave} 
          loading={saving}
          icon={<Save size={20} color={Colors.white} />}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTypeCard: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
  },
  iconContainer: {
    marginBottom: 8,
  },
  activeIconContainer: {
    // Efeitos adicionais se necessário
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  activeTypeLabel: {
    color: Colors.primary,
    fontFamily: 'Poppins_500Medium',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginLeft: 12,
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
  planDetails: {
    gap: 12,
    marginBottom: 16,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  planValue: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.text,
  },
  expiryWarning: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  renewButton: {
    marginTop: 8,
  },
  noPlanText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: 'auto',
  },
});
