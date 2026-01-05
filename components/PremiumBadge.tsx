import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Crown } from 'lucide-react-native';

interface PremiumBadgeProps {
  style?: ViewStyle;
  size?: 'small' | 'medium';
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ style, size = 'small' }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push('/subscription');
  };

  const iconSize = size === 'small' ? 12 : 16;
  const fontSize = size === 'small' ? 10 : 12;
  const paddingVertical = size === 'small' ? 4 : 6;
  const paddingHorizontal = size === 'small' ? 8 : 12;

  return (
    <TouchableOpacity 
      style={[styles.badge, { paddingVertical, paddingHorizontal }, style]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Crown size={iconSize} color="#FFF" style={styles.icon} />
      <Text style={[styles.text, { fontSize }]}>PREMIUM</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700', // Gold color
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    color: '#000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
