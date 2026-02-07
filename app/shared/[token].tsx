import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { MapView, Camera, PointAnnotation, MarkerView, StyleURL, ShapeSource, LineLayer, CircleLayer } from '../../components/ExternalMap';
import { Car, Truck, Bike, Bus, Package, Smartphone, Clock, MapPin, AlertCircle, Layers } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Image } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SharedLocationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<any>(null);
  const [imageError, setImageError] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [mapStyle, setMapStyle] = useState(StyleURL.Dark);
  const cameraRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      // 1. Buscar dados da Tag via RPC (público)
      const { data: tagData, error: tagError } = await supabase
        .rpc('get_shared_tag', { token_text: token });

      if (tagError || !tagData || tagData.length === 0) {
        throw new Error('Link expirado ou inválido.');
      }

      const currentDevice = tagData[0];
      setDevice(currentDevice);

      // 2. Buscar histórico (trilha) via RPC (público)
      const { data: histData, error: histError } = await supabase
        .rpc('get_shared_historico', { token_text: token, limit_count: 3 });

      if (!histError && histData) {
        setHistory(histData);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao carregar compartilhamento:', err);
      setError(err.message || 'Ocorreu um erro ao carregar o mapa.');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (!device?.id) return;

    const subscription = supabase
      .channel(`shared_tag_${device.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tags',
        filter: `id=eq.${device.id}`
      }, (payload) => {
        setDevice((current: any) => ({ ...current, ...payload.new }));
        // Recarregar histórico para atualizar a trilha
        supabase.rpc('get_shared_historico', { token_text: token, limit_count: 3 })
          .then(({ data }) => {
            if (data) setHistory(data);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [device?.id, token]);

  // Centralizar câmera quando o dispositivo mudar
  useEffect(() => {
    if (device?.ultima_lat && device?.ultima_lng && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [parseFloat(device.ultima_lng), parseFloat(device.ultima_lat)],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
  }, [device?.id]); // Apenas na primeira carga ou se o ID mudar

  const trailGeoJSON = useMemo(() => {
    if (!history || history.length < 2) return null;

    const coordinates = history.map(h => [parseFloat(h.longitude), parseFloat(h.latitude)]);
    // Adicionar a posição atual como o ponto mais recente se não estiver no histórico
    if (device?.ultima_lat && device?.ultima_lng) {
      const lastPos = [parseFloat(device.ultima_lng), parseFloat(device.ultima_lat)];
      // Verifica se a última posição já é o primeiro item do histórico para não duplicar
      if (coordinates.length > 0 && (coordinates[0][0] !== lastPos[0] || coordinates[0][1] !== lastPos[1])) {
        coordinates.unshift(lastPos);
      }
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
      properties: {},
    };
  }, [history, device]);

  const getIcon = (type: string) => {
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando localização...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Link Inválido</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <MapView
        style={styles.map}
        styleURL={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera ref={cameraRef} />

        {trailGeoJSON && (
          <ShapeSource id="trailSource" shape={trailGeoJSON}>
            <LineLayer
              id="trailLine"
              style={{
                lineColor: Colors.primary,
                lineWidth: 3,
                lineOpacity: 0.6,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )}

        {history.map((h, index) => (
          <PointAnnotation
            key={`hist-${index}`}
            id={`hist-${index}`}
            coordinate={[parseFloat(h.longitude), parseFloat(h.latitude)]}
          >
            <View style={styles.historyPoint} />
          </PointAnnotation>
        ))}

        {device && (
          <MarkerView
            id="device-marker"
            coordinate={[parseFloat(device.ultima_lng), parseFloat(device.ultima_lat)]}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerBubble}>
                {device.imagem_url && !imageError ? (
                  <Image
                    source={{ uri: device.imagem_url }}
                    style={styles.markerImage}
                    resizeMode="cover"
                    fadeDuration={0}
                    onError={() => {
                      console.log('Erro ao carregar imagem no compartilhado');
                      setImageError(true);
                    }}
                  />
                ) : (
                  <View style={styles.iconContainer}>
                    {getIcon(device.icone)}
                  </View>
                )}
              </View>
              <View style={styles.markerArrow} />
            </View>
          </MarkerView>
        )}
      </MapView>

      <TouchableOpacity style={styles.styleButton} onPress={toggleMapStyle}>
        <Layers size={20} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            {device?.imagem_url && !imageError ? (
              <Image
                source={{ uri: device.imagem_url }}
                style={styles.cardImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              getIcon(device?.icone)
            )}
          </View>
          <View style={styles.titleInfo}>
            <Text style={styles.deviceName}>{device?.nome}</Text>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Tempo Real</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <MapPin size={16} color={Colors.textSecondary} />
            <Text style={styles.infoValue} numberOfLines={2}>
              {device?.endereco || 'Endereço não disponível'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={16} color={Colors.textSecondary} />
            <Text style={styles.infoValue}>
              Última atualização: {device?.ultima_comunicacao ? format(parseISO(device.ultima_comunicacao), 'HH:mm:ss', { locale: ptBR }) : '--:--'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Compartilhado via Tagpro+</Text>
        </View>
      </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  styleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: 50,
    height: 50,
  },
  titleInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 81, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.success,
  },
  cardContent: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    backgroundColor: 'transparent',
  },
  // markerPulse removed
  markerBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    marginTop: 10,
    overflow: 'hidden',
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
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.white,
    marginTop: -1,
    zIndex: 1,
  },
  historyPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.white,
  },
});
