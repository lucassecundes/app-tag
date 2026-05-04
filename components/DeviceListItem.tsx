import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  MapPin,
  ShieldAlert,
  Bell,
  Car,
  Bike,
  Truck,
  Bus,
  Package,
  Smartphone,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  ChevronDown,
  History,
  Target,
  Users,
  Map,
} from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { fetchAddressFromNominatim } from '../services/geocoding';
import { router } from 'expo-router';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_TAG_IMAGE = require('../assets/images/icon tag.png');

interface DeviceListItemProps {
  item: any;
  onPress: (item: any) => void;
  timeAgo: string;
}

export const DeviceListItem = ({ item, onPress, timeAgo }: DeviceListItemProps) => {
  const [address, setAddress] = useState(item.endereco || 'Aguardando posição');
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Animated values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item.ultima_lat && item.ultima_lng) {
      const updateAddress = async () => {
        try {
          const newAddress = await fetchAddressFromNominatim(
            parseFloat(item.ultima_lat),
            parseFloat(item.ultima_lng)
          );
          setAddress(newAddress);
        } catch (error) {
          console.error('Error in DeviceListItem address update:', error);
        }
      };
      updateAddress();
    }
  }, [item.ultima_lat, item.ultima_lng]);

  const isActive = item.ultima_comunicacao &&
    (new Date().getTime() - new Date(item.ultima_comunicacao).getTime()) < 24 * 60 * 60 * 1000;

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue,
        useNativeDriver: false,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(chevronAnim, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleMapPress = () => {
    if (!item.ultima_lat || !item.ultima_lng) {
      router.push({
        pathname: '/device-detail/connecting',
        params: { id: item.id, nome: item.nome, mac: item.mac },
      });
      return;
    }
    router.push({
      pathname: '/device-detail/[id]',
      params: {
        id: item.id,
        nome: item.nome,
        mac: item.mac,
        lat: item.ultima_lat,
        lng: item.ultima_lng,
        address: item.endereco,
      },
    });
  };

  const handleHistoricoPress = () => {
    router.push({ pathname: '/history', params: { device_id: item.id, device_nome: item.nome } } as any);
  };

  const handleCercaPress = () => {
    router.push({ pathname: '/device-detail/[id]', params: { id: item.id, nome: item.nome, mac: item.mac, lat: item.ultima_lat, lng: item.ultima_lng, address: item.endereco, openGeofence: 'true' } } as any);
  };

  const handleCompartilhadoPress = () => {
    router.push({ pathname: '/device-detail/share', params: { id: item.id } } as any);
  };

  const getBatteryInfo = (level: number | null | undefined) => {
    if (level === 3) return { icon: BatteryFull, color: Colors.success, label: 'Cheio', bg: 'rgba(0,200,81,0.12)' };
    if (level === 2) return { icon: BatteryMedium, color: Colors.warning, label: 'Médio', bg: 'rgba(255,187,51,0.12)' };
    if (level === 1) return { icon: BatteryLow, color: Colors.error, label: 'Baixo', bg: 'rgba(255,68,68,0.12)' };
    return null;
  };

  const batteryInfo = getBatteryInfo(item.battery);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 108],
  });

  const expandOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const borderGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  return (
    <Animated.View style={[styles.card, { borderColor: borderGlow }]}>
      {/* Collapsed Header Row */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={toggleExpand}
        activeOpacity={0.85}
      >
        {/* Device Image */}
        <View style={styles.imageContainer}>
          {item.imagem_url && !imageError ? (
            <Image
              source={{ uri: item.imagem_url }}
              style={styles.deviceImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Image
              source={DEFAULT_TAG_IMAGE}
              style={styles.deviceImage}
              resizeMode="cover"
            />
          )}
          {/* Online status dot */}
          <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.success : Colors.error }]} />
        </View>

        {/* Main Info */}
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.nome || 'Dispositivo sem nome'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: isActive ? 'rgba(0,200,81,0.15)' : 'rgba(255,68,68,0.12)' }]}>
              <Text style={[styles.statusBadgeText, { color: isActive ? Colors.success : Colors.error }]}>
                {isActive ? 'Ativo' : 'Offline'}
              </Text>
            </View>
          </View>
          <Text style={styles.codeText} numberOfLines={1}>
            {item.codigo || item.id?.substring(0, 10)}
          </Text>
          <View style={styles.addressRow}>
            <MapPin size={10} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.addressText} numberOfLines={1}>{address}</Text>
          </View>
          {timeAgo ? (
            <Text style={styles.timeAgoText}>Atualizado há {timeAgo}</Text>
          ) : null}
        </View>

        {/* Right: battery + chevron */}
        <View style={styles.rightCol}>
          {batteryInfo && (
            <View style={[styles.batteryBadge, { backgroundColor: batteryInfo.bg }]}>
              <batteryInfo.icon size={14} color={batteryInfo.color} />
            </View>
          )}
          {(item.alerta_cerca || item.alerta_movimento) && (
            <View style={styles.alertsRow}>
              {item.alerta_cerca && (
                <View style={styles.alertDot}>
                  <ShieldAlert size={12} color={Colors.error} />
                </View>
              )}
              {item.alerta_movimento && (
                <View style={styles.alertDot}>
                  <Bell size={12} color={Colors.warning} />
                </View>
              )}
            </View>
          )}
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Expandable Content */}
      <Animated.View style={[styles.expandableContainer, { height: expandHeight, opacity: expandOpacity }]}>
        {/* Divider */}
        <View style={styles.expandDivider} />

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleHistoricoPress} activeOpacity={0.7}>
            <View style={styles.actionIconWrap}>
              <History size={18} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleCercaPress} activeOpacity={0.7}>
            <View style={styles.actionIconWrap}>
              <Target size={18} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Cerca</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleCompartilhadoPress} activeOpacity={0.7}>
            <View style={styles.actionIconWrap}>
              <Users size={18} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Compartilhado</Text>
          </TouchableOpacity>

          {/* Map access icon */}
          <TouchableOpacity style={[styles.actionBtn, styles.mapActionBtn]} onPress={handleMapPress} activeOpacity={0.7}>
            <View style={[styles.actionIconWrap, styles.mapIconWrap]}>
              <Map size={18} color={Colors.background} />
            </View>
            <Text style={[styles.actionLabel, { color: Colors.primary }]}>Mapa</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    // Subtle shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  imageContainer: {
    width: 58,
    height: 58,
    borderRadius: 14,
    overflow: 'visible',
    position: 'relative',
    backgroundColor: Colors.surfaceHighlight,
  },
  deviceImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.surface,
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    flex: 1,
  },
  timeAgoText: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textMuted,
    marginTop: 1,
  },
  rightCol: {
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  batteryBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  alertDot: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: 'rgba(255,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Expandable section
  expandableContainer: {
    overflow: 'hidden',
  },
  expandDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  actionLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mapActionBtn: {
    flex: 1,
  },
  mapIconWrap: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
});
