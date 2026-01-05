import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, ChevronRight } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface PremiumBannerProps {
  message?: string;
}

export const PremiumBanner: React.FC<PremiumBannerProps> = ({ 
  message = "Desbloqueie recursos exclusivos!" 
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push('/subscription')}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Crown size={20} color="#000" fill="#000" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Seja Premium</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <ChevronRight size={20} color="#000" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFD700', // Gold
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Montserrat_700Bold',
  },
  message: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
});
