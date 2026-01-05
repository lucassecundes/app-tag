import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { usePremium } from '../context/PremiumContext';
import { getPremiumCheckoutUrl } from '../lib/premium';
import { Check, Crown, X } from 'lucide-react-native';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { isPremium, isLoading, refreshPremiumStatus } = usePremium();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);

  useEffect(() => {
    // Redirect if already premium
    if (!isLoading && isPremium) {
      Alert.alert('Você já é Premium!', 'Aproveite todos os benefícios.');
      router.back();
    }
  }, [isPremium, isLoading]);

  useEffect(() => {
    loadCheckoutUrl();
  }, []);

  const loadCheckoutUrl = async () => {
    const url = await getPremiumCheckoutUrl();
    setCheckoutUrl(url);
    setLoadingUrl(false);
  };

  const handleSubscribe = async () => {
    if (!checkoutUrl) {
      Alert.alert('Erro', 'Link de checkout não disponível no momento.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
        // Assuming the user might subscribe, we can try to refresh status when they return?
        // But deep linking back would be better. For now, manual refresh or auto-refresh on app focus (handled in _layout) works.
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link de pagamento.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao tentar abrir o checkout.');
    }
  };

  const benefits = [
    'Acesso ilimitado ao histórico de localização',
    'Todas os alertas do sistema desbloqueados',
    'Monitoramento de múltiplos dispositivos',
    'Suporte prioritário 24/7',
    'Sem anúncios'
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Crown size={64} color="#FFD700" fill="#FFD700" />
          </View>
          
          <Text style={styles.title}>Seja Premium</Text>
          <Text style={styles.subtitle}>
            Desbloqueie todo o potencial do seu rastreador com o plano Premium.
          </Text>

          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.checkIcon}>
                  <Check size={16} color="#FFF" />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Apenas</Text>
            <Text style={styles.priceValue}>R$ 9,90</Text>
            <Text style={styles.pricePeriod}>/mês</Text>
          </View>

          <TouchableOpacity 
            style={[styles.subscribeButton, (!checkoutUrl && !loadingUrl) && styles.disabledButton]} 
            onPress={handleSubscribe}
            disabled={!checkoutUrl && !loadingUrl}
          >
            {loadingUrl ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.subscribeButtonText}>ASSINAR AGORA</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            Cancele a qualquer momento.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Montserrat_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    fontFamily: 'Poppins_400Regular',
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 16,
    color: '#CCC',
    marginRight: 8,
    fontFamily: 'Poppins_400Regular',
  },
  priceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Montserrat_700Bold',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#CCC',
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  subscribeButton: {
    width: '100%',
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#555',
    shadowOpacity: 0,
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'Montserrat_700Bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
});
