import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Bot, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

interface ChatIconProps {
  style?: any;
}

export function ChatIcon({ style }: ChatIconProps) {
  const router = useRouter();

  const handlePress = () => {
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
