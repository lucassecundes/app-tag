import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

import { bluetoothService } from '../../services/bluetooth/bluetoothService';
import { locationService } from '../../services/bluetooth/locationService';
import { trackingService } from '../../services/bluetooth/trackingService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const ORBIT_SIZE_OUTER = width * 0.72;
const ORBIT_SIZE_INNER = width * 0.52;
const CORE_SIZE = width * 0.28;
const DOT_SIZE = 14;

export default function ConnectingScreen() {
  const { id, nome, mac } = useLocalSearchParams<{ id?: string, nome?: string, mac?: string }>();
  const { user } = useAuth();

  // Glow / pulse da esfera central
  const pulseAnim = useRef(new Animated.Value(0.7)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Rotações dos anéis
  const outerRotation = useRef(new Animated.Value(0)).current;
  const innerRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsação do núcleo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Brilho do núcleo (opacity do halo)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.85,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Anel externo — sentido horário
    Animated.loop(
      Animated.timing(outerRotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Anel interno — sentido anti-horário
    Animated.loop(
      Animated.timing(innerRotation, {
        toValue: 1,
        duration: 5500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Lógica de busca Bluetooth focada neste MAC
    if (Platform.OS === 'android' && mac && mac !== '0' && id && user) {
      bluetoothService.scanForMac(mac, async (device) => {
        console.log(`[ConnectingScreen] MAC ${mac} encontrado! Capturando localização...`);
        
        const loc = await locationService.getCurrentLocation();
        if (loc) {
          // Atualizar o Supabase usando o trackingService
          // Ele cria um mock de TagWithMac para atender a tipagem
          const tagMock = { id, mac, usuario_id: user.id } as any;
          await trackingService.updateTagLocation(tagMock, loc.latitude, loc.longitude, null);
          
          // O Realtime (caso estivesse na tela de detalhes) ou uma atualização faria navegar
          // Mas como estamos no connecting, podemos navegar para o detalhe direto:
          router.replace({
            pathname: '/device-detail/[id]',
            params: {
              id,
              nome,
              mac,
              lat: loc.latitude.toString(),
              lng: loc.longitude.toString()
            }
          });
        }
      });
    }

    return () => {
      // Parar o scan ao sair da tela
      if (Platform.OS === 'android' && mac && mac !== '0') {
        bluetoothService.stopScan();
      }
    };
  }, [mac, id, user, nome]);

  const outerSpin = outerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const innerSpin = innerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const deviceName = nome || 'Dispositivo';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {deviceName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conteúdo Central */}
      <View style={styles.content}>
        {/* Textos superiores */}
        <View style={styles.topTextContainer}>
          <Text style={styles.mainTitle}>Dispositivo conectando...</Text>
          <Text style={styles.subtitle}>
            Isso pode levar de 5 minutos a 1 hora para se conectar.
          </Text>
        </View>

        {/* Área de animação */}
        <View style={styles.animationContainer}>

          {/* Halo de brilho (fundo do núcleo) */}
          <Animated.View
            style={[
              styles.glowHalo,
              { opacity: glowAnim },
            ]}
          />

          {/* Anel externo pontilhado + satélite */}
          <Animated.View
            style={[
              styles.orbit,
              {
                width: ORBIT_SIZE_OUTER,
                height: ORBIT_SIZE_OUTER,
                borderRadius: ORBIT_SIZE_OUTER / 2,
                transform: [{ rotate: outerSpin }],
              },
            ]}
          >
            {/* Ponto satélite laranja no anel externo (topo) */}
            <View style={[styles.dot, styles.dotOrange, { top: -DOT_SIZE / 2, alignSelf: 'center' }]} />
            {/* Ponto satélite roxo no anel externo (esquerda) */}
            <View style={[styles.dot, styles.dotPurple, { left: -DOT_SIZE / 2, top: '50%', marginTop: -DOT_SIZE / 2 }]} />
          </Animated.View>

          {/* Anel interno pontilhado + satélite */}
          <Animated.View
            style={[
              styles.orbit,
              {
                width: ORBIT_SIZE_INNER,
                height: ORBIT_SIZE_INNER,
                borderRadius: ORBIT_SIZE_INNER / 2,
                transform: [{ rotate: innerSpin }],
              },
            ]}
          >
            {/* Ponto satélite laranja no anel interno (baixo) */}
            <View style={[styles.dot, styles.dotOrange, { bottom: -DOT_SIZE / 2, alignSelf: 'center' }]} />
            {/* Ponto satélite roxo no anel interno (direita) */}
            <View style={[styles.dot, styles.dotPurple, { right: -DOT_SIZE / 2, top: '50%', marginTop: -DOT_SIZE / 2 }]} />
          </Animated.View>

          {/* Núcleo central */}
          <Animated.View
            style={[
              styles.core,
              {
                width: CORE_SIZE,
                height: CORE_SIZE,
                borderRadius: CORE_SIZE / 2,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Camada interna mais brilhante */}
            <View style={styles.coreInner} />
          </Animated.View>
        </View>

        {/* Texto de status */}
        <Text style={styles.statusText}>Conectando...</Text>

        {/* Dica adicional */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            O dispositivo pode se conectar mais rápido se estiver em movimento.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
  },
  topTextContainer: {
    alignItems: 'center',
    marginBottom: 52,
    marginTop: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  animationContainer: {
    width: ORBIT_SIZE_OUTER + 24,
    height: ORBIT_SIZE_OUTER + 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  glowHalo: {
    position: 'absolute',
    width: CORE_SIZE * 1.8,
    height: CORE_SIZE * 1.8,
    borderRadius: (CORE_SIZE * 1.8) / 2,
    backgroundColor: Colors.primary,
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 122, 0, 0.35)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 0.9,
    elevation: 4,
  },
  dotOrange: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
  dotPurple: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  core: {
    position: 'absolute',
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  coreInner: {
    width: '60%',
    height: '60%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 170, 50, 0.7)',
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.primary,
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  tipContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
