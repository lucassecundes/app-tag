import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Bot, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { usePremium } from '../context/PremiumContext';

interface ChatIconProps {
  style?: any;
}

export function ChatIcon({ style }: ChatIconProps) {
  const router = useRouter();
  const { isPremium } = usePremium();

  const handlePress = () => {
    // Navigate regardless of premium status, check will be inside chat or before
    // Requirement says: "Restringir funcionalidades premium: Verificar assinatura do usuário antes de permitir acesso"
    // So we can block here or show a paywall inside.
    // Let's block here for better UX if they can't use it at all.
    // Actually, user wants "Opção de upgrade para plano premium". 
    // If I block here, I need to show the premium modal.
    // Assuming /chat will handle the non-premium state or we handle it here.
    // Let's navigate to /chat and let that screen handle the locked state/banner, 
    // OR we can just show an alert here.
    // Let's stick to the requirement "Verificar assinatura do usuário antes de permitir acesso".
    
    if (!isPremium) {
      // If there is a way to trigger the premium modal, do it.
      // Otherwise navigate to subscription screen.
      router.push('/subscription'); 
      return;
    }
    
    router.push('/chat');
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Bot size={28} color="#FFFFFF" />
      </View>
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED', // Violet/Purple for AI/Futuristic feel
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 999,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  }
});
