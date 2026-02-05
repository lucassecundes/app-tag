import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MapView, Camera, PointAnnotation, StyleURL } from '../../components/ExternalMap';
import { Car, Truck, Bike, Bus, Package, Smartphone, ArrowRight, Layers, Share2, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useNavigation } from 'expo-router';

export default function GlobalMapScreen() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
    });
    return () => {
      navigation.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState(StyleURL.Dark);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const fetchDevices = async () => {
    if (!user) return;
    try {
      // Busca dispositivos (reutilizando lógica similar ao index)
      // Verifica se é admin para buscar todos ou apenas do usuário
      const { data: userData } = await supabase
        .from('usuario')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      let query = supabase
        .from('tags')
        .select('*')
        .order('ultima_comunicacao', { ascending: false });

      if (userData?.role !== 'admin') {
        query = query.eq('usuario_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtra apenas dispositivos com localização válida
      const validDevices = (data || []).filter(d => d.ultima_lat && d.ultima_lng);
      setDevices(validDevices);

      // Ajusta câmera para mostrar todos os dispositivos
      if (validDevices.length > 0 && cameraRef.current) {
        fitToDevices(validDevices);
      }
    } catch (error) {
      console.error('Erro ao buscar dispositivos para o mapa:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDevices();
    }, [user])
  );

  // Realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel('global_map_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tags' }, (payload) => {
        setDevices(current => {
          const updated = payload.new;
          if (!updated.ultima_lat || !updated.ultima_lng) return current;

          const exists = current.find(d => d.id === updated.id);
          if (exists) {
            return current.map(d => d.id === updated.id ? updated : d);
          } else {
            // Se não existia na lista (ex: acabou de ganhar localização), adiciona
            return [...current, updated];
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fitToDevices = (deviceList: any[]) => {
    if (!deviceList.length || !cameraRef.current) return;

    if (deviceList.length === 1) {
      cameraRef.current.setCamera({
        centerCoordinate: [parseFloat(deviceList[0].ultima_lng), parseFloat(deviceList[0].ultima_lat)],
        zoomLevel: 14,
        animationDuration: 1000,
      });
      return;
    }

    // Calcula bounds simples
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    deviceList.forEach(d => {
      const lat = parseFloat(d.ultima_lat);
      const lng = parseFloat(d.ultima_lng);
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    // Adiciona margem
    const latDelta = maxLat - minLat;
    const lngDelta = maxLng - minLng;

    cameraRef.current.fitBounds(
      [maxLng + lngDelta * 0.1, maxLat + latDelta * 0.1], // NorthEast
      [minLng - lngDelta * 0.1, minLat - latDelta * 0.1], // SouthWest
      50, // padding
      1000 // duration
    );
  };

  const getMarkerIcon = (type: string) => {
    const size = 24;
    const color = Colors.white;
    switch (type) {
      case 'car': return <Car size={size} color={color} />;
      case 'moto': return <Bike size={size} color={color} />;
      case 'truck': return <Truck size={size} color={color} />;
      case 'bus': return <Bus size={size} color={color} />;
      case 'object': return <Package size={size} color={color} />;
      default: return <Smartphone size={size} color={color} />;
    }
  };

  const toggleMapStyle = () => {
    setMapStyle((prev: string) => prev === StyleURL.Dark ? StyleURL.SatelliteStreet : StyleURL.Dark);
  };

  const handleMarkerPress = (device: any) => {
    setSelectedDevice(device);
    // Centraliza no dispositivo selecionado
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [parseFloat(device.ultima_lng), parseFloat(device.ultima_lat)],
        zoomLevel: 15,
        animationDuration: 500,
      });
    }
  };

  const navigateToDetail = () => {
    if (selectedDevice) {
      router.push({
        pathname: '/device-detail/[id]',
        params: {
          id: selectedDevice.id,
          nome: selectedDevice.nome,
          lat: selectedDevice.ultima_lat,
          lng: selectedDevice.ultima_lng,
          address: selectedDevice.endereco
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        onPress={() => setSelectedDevice(null)} // Deseleciona ao clicar no mapa
      >
        <Camera ref={cameraRef} />

        {devices.map(device => (
          <PointAnnotation
            key={device.id}
            id={`marker-${device.id}`}
            coordinate={[parseFloat(device.ultima_lng), parseFloat(device.ultima_lat)]}
            onSelected={() => handleMarkerPress(device)}
          >
            <View style={styles.markerContainer}>
              <View style={[
                styles.markerBubble,
                selectedDevice?.id === device.id && styles.markerSelected
              ]}>
                {device.imagem_url && !imageErrors[device.id] ? (
                  <Image
                    source={{ uri: device.imagem_url }}
                    style={styles.markerImage}
                    resizeMode="cover"
                    onError={() => {
                      console.log(`Erro ao carregar imagem no mapa para ${device.id}`);
                      setImageErrors(prev => ({ ...prev, [device.id]: true }));
                    }}
                  />
                ) : (
                  <View style={styles.iconContainer}>
                    {getMarkerIcon(device.icone)}
                  </View>
                )}
              </View>
              <View style={[
                styles.markerArrow,
                selectedDevice?.id === device.id && { borderTopColor: Colors.success }
              ]} />
              <View style={styles.labelContainer}>
                <Text style={styles.labelText} numberOfLines={1}>{device.nome}</Text>
              </View>
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa Global</Text>
        <TouchableOpacity style={styles.layerButton} onPress={toggleMapStyle}>
          <Layers size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Card Flutuante do Dispositivo Selecionado */}
      {selectedDevice && (
        <View style={[styles.deviceCard, { bottom: 100 }]}>
          <View style={styles.deviceInfo}>
            <View style={styles.iconBox}>
              {selectedDevice.imagem_url && !imageErrors[selectedDevice.id] ? (
                <Image
                  source={{ uri: selectedDevice.imagem_url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                  onError={() => {
                    setImageErrors(prev => ({ ...prev, [selectedDevice.id]: true }));
                  }}
                />
              ) : (
                getMarkerIcon(selectedDevice.icone)
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{selectedDevice.nome}</Text>
              <Text style={styles.deviceAddress} numberOfLines={1}>
                {selectedDevice.endereco || 'Endereço não disponível'}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.shareIconButton}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert(
                    'Recurso Premium',
                    'O compartilhamento de localização em tempo real está disponível apenas para assinantes Premium.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Ver Planos', onPress: () => router.push('/subscription') }
                    ]
                  );
                  return;
                }
                router.push({
                  pathname: '/device-detail/share' as any,
                  params: { id: selectedDevice.id, nome: selectedDevice.nome }
                });
              }}
            >
              <Share2 size={20} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.detailButton} onPress={navigateToDetail}>
              <Text style={styles.detailButtonText}>Ver Detalhes</Text>
              <ArrowRight size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)', // Simulação, RN precisa de LinearGradient
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  layerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Marker Styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 90,
  },
  labelContainer: {
    backgroundColor: 'rgba(21, 21, 21, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  labelText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '600',
  },
  markerBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 2,
    overflow: 'hidden',
  },
  markerSelected: {
    borderColor: Colors.success,
    transform: [{ scale: 1.1 }],
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.white,
    marginTop: -1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 1,
  },
  // Removed old styles: markerCore, markerStem
  // Device Card Styles
  deviceCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardImage: {
    width: 48,
    height: 48,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceHighlight,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareIconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.white,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
