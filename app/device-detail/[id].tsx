import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Dimensions, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MapView, Camera, PointAnnotation, StyleURL, ShapeSource, CircleLayer, FillLayer, LineLayer } from '../../components/ExternalMap';
import { ArrowLeft, Layers, Eye, MapPin, Car, Truck, Bike, Bus, Package, Smartphone, PlayCircle, Shield, Clock, Lock, Unlock, X } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { usePremium } from '../../context/PremiumContext';
import { useAuth } from '../../context/AuthContext';
import { PremiumBadge } from '../../components/PremiumBadge';
import { translateSupabaseError } from '../../lib/errorTranslator';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 100; // Limite superior (não sobe tudo)
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75; // Altura total do sheet
const PEEK_HEIGHT = 190; // Quanto aparece quando recolhido

// Função auxiliar para criar círculo GeoJSON
const createGeoJSONCircle = (center: [number, number], radiusInMeters: number, points = 64) => {
  if (!center || !center[0] || !center[1]) return null;
  
  const coords = {
    latitude: center[1],
    longitude: center[0],
  };
  const km = radiusInMeters / 1000;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]); // Fechar o polígono

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [ret],
    },
  };
};

export default function DeviceDetailScreen() {
  const params = useLocalSearchParams();
  const { id } = params;
  const { isPremium } = usePremium();
  const { user } = useAuth();
  
  const [nome, setNome] = useState(params.nome as string || 'Dispositivo');
  const [type, setType] = useState('car');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const initialLat = parseFloat(params.lat as string) || -23.550520;
  const initialLng = parseFloat(params.lng as string) || -46.633308;

  const [mapStyle, setMapStyle] = useState(StyleURL.Dark);
  const [currentLocation, setCurrentLocation] = useState({ lat: initialLat, lng: initialLng });
  const [address, setAddress] = useState(params.address as string || 'Carregando endereço...');
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());
  const [simulating, setSimulating] = useState(false);
  
  // Estados dos Alertas
  const [alertaCerca, setAlertaCerca] = useState(false);
  const [cercaCenter, setCercaCenter] = useState<{lat: number, lng: number} | null>(null);
  
  const [alertaMovimento, setAlertaMovimento] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  
  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStart, setScheduleStart] = useState('22:00');
  const [scheduleEnd, setScheduleEnd] = useState('06:00');
  const [movimentoSchedule, setMovimentoSchedule] = useState<{start: string, end: string} | null>(null);

  const cameraRef = useRef<any>(null);

  // --- Bottom Sheet Logic ---
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const scrollTo = useCallback((destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, { damping: 50 });
  }, []);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      // Limitar para não subir demais nem descer demais
      translateY.value = Math.max(translateY.value, -SHEET_HEIGHT + PEEK_HEIGHT);
    })
    .onEnd(() => {
      // Lógica de Snap
      if (translateY.value < -SHEET_HEIGHT / 3) {
        // Expandir
        scrollTo(-SHEET_HEIGHT + PEEK_HEIGHT);
      } else {
        // Recolher
        scrollTo(0);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    if (cameraRef.current && currentLocation.lat && currentLocation.lng) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.lng, currentLocation.lat],
        animationDuration: 1000,
      });
    }
  }, [currentLocation]);

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!id) return; // Guard clause added

      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          updateScreenData(data);
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do dispositivo:', error);
        setAddress('Endereço indisponível');
      }
    };

    fetchDeviceData();

    const subscription = supabase
      .channel(`device_detail_${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'tags', 
        filter: `id=eq.${id}` 
      }, (payload) => {
        console.log('Atualização em tempo real recebida:', payload.new);
        updateScreenData(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  const updateScreenData = (data: any) => {
    if (data.nome) setNome(data.nome);
    if (data.icone) setType(data.icone);

    setAlertaCerca(data.alerta_cerca || false);
    if (data.cerca_lat && data.cerca_lng) {
      setCercaCenter({ lat: data.cerca_lat, lng: data.cerca_lng });
    }

    setAlertaMovimento(data.alerta_movimento || false);
    if (data.movimento_hora_inicio && data.movimento_hora_fim) {
      setMovimentoSchedule({ start: data.movimento_hora_inicio, end: data.movimento_hora_fim });
      setScheduleStart(data.movimento_hora_inicio);
      setScheduleEnd(data.movimento_hora_fim);
    }

    if (data.ultima_lat && data.ultima_lng) {
      const lat = parseFloat(data.ultima_lat);
      const lng = parseFloat(data.ultima_lng);
      setCurrentLocation({ lat, lng });
    }

    if (data.endereco) setAddress(data.endereco);
    if (data.ultima_comunicacao) setLastUpdate(data.ultima_comunicacao);
  };

  const fenceGeoJSON = useMemo(() => {
    if (alertaCerca && cercaCenter) {
      return createGeoJSONCircle([cercaCenter.lng, cercaCenter.lat], 100);
    }
    return null;
  }, [alertaCerca, cercaCenter]);

  const toggleMapStyle = () => {
    setMapStyle((prev: string) => prev === StyleURL.Dark ? StyleURL.SatelliteStreet : StyleURL.Dark);
  };

  const openStreetView = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${currentLocation.lat},${currentLocation.lng}`;
    const label = nome;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    const googleMapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${currentLocation.lat},${currentLocation.lng}`;
    
    Linking.openURL(googleMapsUrl).catch(() => {
      if (url) Linking.openURL(url);
    });
  };

  const toggleAlert = async (type: 'cerca' | 'movimento') => {
    // Restrição Premium
    if (!isPremium) {
      Alert.alert(
        'Recurso Premium',
        'Assine o Premium para ativar alertas de segurança e monitoramento.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Assinar Agora', onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }

    if (type === 'movimento' && !alertaMovimento) {
      // Se for ativar movimento, abre modal primeiro
      setShowScheduleModal(true);
      return;
    }

    setLoadingAlerts(true);
    try {
      const updates: any = {};
      
      if (type === 'cerca') {
        const newState = !alertaCerca;
        updates.alerta_cerca = newState;
        if (newState) {
          updates.cerca_lat = currentLocation.lat;
          updates.cerca_lng = currentLocation.lng;
          updates.cerca_raio = 100;
          setCercaCenter({ lat: currentLocation.lat, lng: currentLocation.lng });
        }
        setAlertaCerca(newState);
      } else {
        // Desativar movimento
        const newState = false;
        updates.alerta_movimento = newState;
        setAlertaMovimento(newState);
      }

      const { error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

    } catch (error: any) {
      console.error('Erro ao atualizar alerta:', error);
      Alert.alert('Erro', 'Falha ao atualizar configuração de alerta.');
      if (type === 'cerca') setAlertaCerca(!alertaCerca);
      // else setAlertaMovimento(!alertaMovimento); // Movimento só desativa aqui
    } finally {
      setLoadingAlerts(false);
    }
  };

  const confirmSchedule = async () => {
    // Validação básica HH:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduleStart) || !timeRegex.test(scheduleEnd)) {
      Alert.alert('Formato Inválido', 'Use o formato HH:mm (ex: 22:00)');
      return;
    }

    setLoadingAlerts(true);
    setShowScheduleModal(false);
    
    try {
      const updates = {
        alerta_movimento: true,
        movimento_lat: currentLocation.lat,
        movimento_lng: currentLocation.lng,
        movimento_hora_inicio: scheduleStart,
        movimento_hora_fim: scheduleEnd
      };

      const { error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setAlertaMovimento(true);
      setMovimentoSchedule({ start: scheduleStart, end: scheduleEnd });

    } catch (error: any) {
      console.error('Erro ao ativar alerta de movimento:', error);
      Alert.alert('Erro', 'Falha ao ativar alerta de movimento.');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const simulateMovement = async () => {
    setSimulating(true);
    try {
      const latOffset = (Math.random() - 0.5) * 0.0025;
      const lngOffset = (Math.random() - 0.5) * 0.0025;
      
      const newLat = currentLocation.lat + latOffset;
      const newLng = currentLocation.lng + lngOffset;
      const newDate = new Date().toISOString();
      const mockAddress = `Localização Simulada em ${new Date().toLocaleTimeString()}`;

      const { error: histError } = await supabase.from('historico_tags').insert({
        tag_id: id,
        latitude: newLat,
        longitude: newLng,
        endereco: mockAddress,
        data_hora: newDate
      });
      
      if (histError) throw histError;

      const { error: tagError } = await supabase.from('tags').update({
        ultima_lat: newLat,
        ultima_lng: newLng,
        endereco: mockAddress,
        ultima_comunicacao: newDate
      }).eq('id', id);

      if (tagError) throw tagError;

      Alert.alert('Simulação', 'Dispositivo movido. Verifique se saiu da zona segura no mapa.');
    } catch (e: any) {
      console.error('Erro na simulação:', e);
      Alert.alert('Erro', translateSupabaseError(e.message));
    } finally {
      setSimulating(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Desconhecido';
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  const getMarkerIcon = () => {
    switch (type) {
      case 'car': return <Car size={16} color={Colors.white} />;
      case 'moto': return <Bike size={16} color={Colors.white} />;
      case 'truck': return <Truck size={16} color={Colors.white} />;
      case 'bus': return <Bus size={16} color={Colors.white} />;
      case 'object': return <Package size={16} color={Colors.white} />;
      default: return <Smartphone size={16} color={Colors.white} />;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <MapView
        style={styles.map}
        styleURL={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [currentLocation.lng, currentLocation.lat],
            zoomLevel: 16,
          }}
        />
        
        {fenceGeoJSON && (
          <ShapeSource id="fenceSource" shape={fenceGeoJSON}>
            <FillLayer 
              id="fenceFill" 
              style={{
                fillColor: Colors.success,
                fillOpacity: 0.2,
              }} 
            />
            <LineLayer 
              id="fenceLine" 
              style={{
                lineColor: Colors.success,
                lineWidth: 2,
                lineDasharray: [2, 2],
              }} 
            />
          </ShapeSource>
        )}

        <PointAnnotation
          id="device-marker"
          coordinate={[currentLocation.lng, currentLocation.lat]}
        >
          <View style={styles.markerContainer}>
            <View style={[
              styles.markerPulse, 
              (alertaCerca || alertaMovimento) && { borderColor: Colors.error, backgroundColor: 'rgba(255, 68, 68, 0.3)' }
            ]} />
            <View style={[
              styles.markerCore,
              (alertaCerca || alertaMovimento) && { backgroundColor: Colors.error }
            ]}>
              {getMarkerIcon()}
            </View>
          </View>
        </PointAnnotation>
      </MapView>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{nome}</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMapStyle}>
          <Layers size={24} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={openStreetView}>
          <Eye size={24} color={Colors.text} />
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: Colors.primary, borderColor: Colors.primary }]} 
            onPress={simulateMovement}
            disabled={simulating}
          >
            {simulating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <PlayCircle size={24} color={Colors.white} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de Agendamento */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Alerta de Movimento</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDesc}>
              Defina o horário em que o movimento não é permitido (ex: noite).
              Se a tag sair do raio de 100m neste horário, um alerta será gerado.
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Início</Text>
                <TextInput
                  style={styles.input}
                  value={scheduleStart}
                  onChangeText={setScheduleStart}
                  placeholder="22:00"
                  placeholderTextColor="#999"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fim</Text>
                <TextInput
                  style={styles.input}
                  value={scheduleEnd}
                  onChangeText={setScheduleEnd}
                  placeholder="06:00"
                  placeholderTextColor="#999"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>

            <Button 
              title="ATIVAR MONITORAMENTO" 
              onPress={confirmSchedule}
              loading={loadingAlerts}
            />
          </View>
        </View>
      </Modal>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.bottomSheet, rBottomSheetStyle]}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          
          {/* Conteúdo Visível Inicialmente (Peek) */}
          <View style={styles.peekContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MapPin size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Localização Atual</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{address}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Última atualização</Text>
                <Text style={styles.statValue}>{getTimeAgo(lastUpdate)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={[styles.statValue, { color: Colors.success }]}>Conectado</Text>
              </View>
            </View>
          </View>

          {/* Conteúdo Expandido (Hidden) */}
          <View style={styles.expandedContent}>
            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Monitoramento e Segurança</Text>
            <View style={styles.alertsContainer}>
              <TouchableOpacity 
                style={[
                  styles.alertCard, 
                  alertaCerca && styles.alertCardActive,
                  !isPremium && styles.alertCardDisabled
                ]}
                onPress={() => toggleAlert('cerca')}
                disabled={loadingAlerts}
              >
                <View style={styles.alertHeader}>
                  <View style={[
                    styles.alertIconBox, 
                    alertaCerca && styles.alertIconBoxActive,
                    !isPremium && styles.alertIconBoxDisabled
                  ]}>
                    <Shield size={20} color={alertaCerca ? Colors.white : Colors.textSecondary} />
                  </View>
                  <View style={styles.toggleIcon}>
                    {!isPremium ? (
                      <PremiumBadge size="small" />
                    ) : (
                      alertaCerca ? <Lock size={16} color={Colors.success} /> : <Unlock size={16} color={Colors.textSecondary} />
                    )}
                  </View>
                </View>
                <Text style={[styles.alertTitle, alertaCerca && styles.alertTitleActive]}>Zona Segura</Text>
                <Text style={styles.alertDesc}>Raio de 100m</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.alertCard, 
                  alertaMovimento && styles.alertCardActive,
                  !isPremium && styles.alertCardDisabled
                ]}
                onPress={() => toggleAlert('movimento')}
                disabled={loadingAlerts}
              >
                <View style={styles.alertHeader}>
                  <View style={[
                    styles.alertIconBox, 
                    alertaMovimento && styles.alertIconBoxActive,
                    !isPremium && styles.alertIconBoxDisabled
                  ]}>
                    <Clock size={20} color={alertaMovimento ? Colors.white : Colors.textSecondary} />
                  </View>
                  <View style={styles.toggleIcon}>
                    {!isPremium ? (
                      <PremiumBadge size="small" />
                    ) : (
                      alertaMovimento ? <Lock size={16} color={Colors.success} /> : <Unlock size={16} color={Colors.textSecondary} />
                    )}
                  </View>
                </View>
                <Text style={[styles.alertTitle, alertaMovimento && styles.alertTitleActive]}>Movimento</Text>
                <Text style={styles.alertDesc}>
                  {alertaMovimento && movimentoSchedule 
                    ? `${movimentoSchedule.start} - ${movimentoSchedule.end}`
                    : 'Fora de Horário'}
                </Text>
              </TouchableOpacity>
            </View>

            <Button 
              title="Ver Histórico Completo" 
              onPress={() => router.push('/(tabs)/history')}
              variant="outline"
              style={{ marginTop: 24 }}
            />
            
            <View style={{ height: 40 }} /> 
          </View>
        </Animated.View>
      </GestureDetector>
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
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(21, 21, 21, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 122, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.5)',
  },
  markerCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 2,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    top: 120,
    gap: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlLabel: {
    position: 'absolute',
    bottom: -16,
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
    color: Colors.white,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
    textAlign: 'center',
    minWidth: 40,
  },
  
  // Bottom Sheet Styles
  bottomSheet: {
    position: 'absolute',
    height: SHEET_HEIGHT,
    width: '100%',
    backgroundColor: Colors.surface,
    bottom: -SHEET_HEIGHT + PEEK_HEIGHT, // Posiciona para mostrar apenas o PEEK
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
  },
  peekContent: {
    paddingHorizontal: 24,
  },
  expandedContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceHighlight,
    marginBottom: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  alertsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  alertCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  alertCardActive: {
    backgroundColor: 'rgba(255, 122, 0, 0.05)',
    borderColor: Colors.primary,
  },
  alertCardDisabled: {
    opacity: 0.7,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIconBoxActive: {
    backgroundColor: Colors.primary,
  },
  alertIconBoxDisabled: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  alertTitleActive: {
    color: Colors.primary,
  },
  alertDesc: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
  },
  toggleIcon: {
    // 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    textAlign: 'center',
  },
});
