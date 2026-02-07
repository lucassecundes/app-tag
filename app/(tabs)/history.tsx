import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, Dimensions, Alert, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { MapPin, Clock, Filter, Map as MapIcon, List, X, Calendar, ChevronDown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../components/ui/Button';

import { MapView, Camera, ShapeSource, LineLayer, CircleLayer, StyleURL } from '../../components/ExternalMap';

const { height } = Dimensions.get('window');

type FilterType = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function HistoryScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const filterTagId = params.tagId as string;

  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View Mode State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const [customRange, setCustomRange] = useState<{ start: Date, end: Date } | null>(null);

  // Custom Date Picker State
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDateStart, setTempDateStart] = useState(new Date());
  const [tempDateEnd, setTempDateEnd] = useState(new Date());

  const cameraRef = useRef<any>(null);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      // Busca um histórico maior para permitir filtragem local eficiente
      let query = supabase
        .from('historico_tags')
        .select(`
          *,
          tags!inner (
            nome,
            usuario_id
          )
        `);

      // Se não for admin OU se não estiver filtrando uma tag específica, 
      // garante que só veja as próprias tags
      if (!filterTagId) {
        query = query.eq('tags.usuario_id', user.id);
      }

      if (filterTagId) {
        query = query.eq('tag_id', filterTagId);
      }

      // Ordenação: Tenta data_hora, mas se falhar (ex: campo nulo em registros antigos)
      // a query pode não ser eficiente. O ideal é ordenar no banco.
      query = query.order('data_hora', { ascending: false, nullsFirst: false });

      const { data, error } = await query.limit(200);

      if (error) throw error;

      // Aplicar Fallback de data localmente e garantir ordenação consistente
      const dataList = (data || []).map(item => ({
        ...item,
        // Fallback recomendado: data_hora ?? created_at
        display_date: item.data_hora || item.created_at
      })).sort((a, b) => {
        // Garantir ordenação correta mesmo com fallback
        return new Date(b.display_date).getTime() - new Date(a.display_date).getTime();
      });

      setHistory(dataList);
      applyFilter(activeFilter, dataList);

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchHistory();
    }, [user, filterTagId])
  );

  const applyFilter = (filter: FilterType, dataToFilter = history) => {

    if (filter === 'custom' && (!customRange)) {
      // Se for custom mas não tiver range definido, abrimos o picker (lógica na UI)
      // Aqui apenas setamos o filtro ativo se já tiver range
      return;
    }

    setActiveFilter(filter);

    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (filter) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        start = startOfDay(yesterday);
        end = endOfDay(yesterday);
        break;
      case 'week':
        start = subDays(now, 7);
        break;
      case 'month':
        start = subDays(now, 30);
        break;
      case 'custom':
        if (customRange) {
          // No modo custom, usamos o horário exato definido pelo usuário
          start = customRange.start;
          end = customRange.end;
        } else {
          start = startOfDay(now); // Fallback
        }
        break;
      default:
        start = startOfDay(now);
    }

    const filtered = dataToFilter.filter(item => {
      const itemDate = parseISO(item.display_date);
      return isWithinInterval(itemDate, { start, end });
    });

    setFilteredHistory(filtered);
  };

  const handleCustomDateConfirm = () => {
    // Validação de intervalo de 30 dias
    const diffTime = Math.abs(tempDateEnd.getTime() - tempDateStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      Alert.alert('Limite Excedido', 'O intervalo máximo permitido é de 30 dias.');
      return;
    }

    if (tempDateStart > tempDateEnd) {
      Alert.alert('Data Inválida', 'A data inicial não pode ser maior que a final.');
      return;
    }

    setCustomRange({ start: tempDateStart, end: tempDateEnd });
    applyFilter('custom'); // Re-aplica com o novo range
    setShowFilterModal(false);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(null);
      return;
    }

    const currentDate = selectedDate || (showDatePicker === 'start' ? tempDateStart : tempDateEnd);

    if (Platform.OS === 'android') {
      setShowDatePicker(null); // Fecha o picker atual

      if (pickerMode === 'date') {
        // Se estava escolhendo data, salva e abre o de hora
        if (showDatePicker === 'start') setTempDateStart(currentDate);
        else setTempDateEnd(currentDate);

        setPickerMode('time');
        // Pequeno delay para reabrir o picker no modo time
        setTimeout(() => {
          setShowDatePicker(showDatePicker); // Reabre com o mesmo target
        }, 100);
      } else {
        // Se estava escolhendo hora, finaliza
        if (showDatePicker === 'start') setTempDateStart(currentDate);
        else setTempDateEnd(currentDate);
        setPickerMode('date'); // Reseta para o próximo uso
      }
    } else {
      // iOS
      if (showDatePicker === 'start') setTempDateStart(currentDate);
      else setTempDateEnd(currentDate);
      setShowDatePicker(null);
    }
  };

  const openDatePicker = (target: 'start' | 'end') => {
    setPickerMode('date'); // Sempre começa pela data
    setShowDatePicker(target);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // --- Map Helpers ---
  const routeGeoJSON = useMemo(() => {
    if (filteredHistory.length < 1) return null;

    // Ordenar cronologicamente para desenhar a linha corretamente
    const sortedPoints = [...filteredHistory].sort((a, b) =>
      new Date(a.display_date).getTime() - new Date(b.display_date).getTime()
    );

    const coordinates = sortedPoints
      .filter(p => p.longitude && p.latitude)
      .map(p => [p.longitude, p.latitude]);

    if (coordinates.length === 0) return null;

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates,
          },
        },
      ],
    };
  }, [filteredHistory]);

  const initialCoords = useMemo(() => {
    if (filteredHistory.length > 0 && filteredHistory[0].longitude) {
      return [filteredHistory[0].longitude, filteredHistory[0].latitude];
    }
    return [-46.633308, -23.550520]; // SP Default
  }, [filteredHistory]);

  // --- Formatters ---
  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    return format(parseISO(dateString), 'HH:mm', { locale: ptBR });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data desconhecida';
    return format(parseISO(dateString), "d 'de' MMM", { locale: ptBR });
  };

  const getFilterLabel = (filter: FilterType) => {
    switch (filter) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Ontem';
      case 'week': return 'Últimos 7 dias';
      case 'month': return 'Últimos 30 dias';
      case 'custom':
        if (customRange) {
          return `${format(customRange.start, 'dd/MM')} - ${format(customRange.end, 'dd/MM')}`;
        }
        return 'Personalizado';
      default: return 'Hoje';
    }
  };

  // --- Renderers ---
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        <View style={styles.timelineDot} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.tags?.nome || 'Dispositivo'}</Text>
            <Text style={styles.itemTime}>{formatTime(item.display_date)}</Text>
          </View>
          <Text style={styles.itemDate}>{formatDate(item.display_date)}</Text>
        </View>

        <View style={styles.addressContainer}>
          <MapPin size={14} color={Colors.primary} style={{ marginTop: 2 }} />
          <Text style={styles.addressText} numberOfLines={2}>
            {item.endereco || 'Endereço não identificado'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Histórico</Text>
          <TouchableOpacity
            style={styles.filterSelector}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterSelectorText}>{getFilterLabel(activeFilter)}</Text>
            <ChevronDown size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, styles.primaryIconButton]}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            {viewMode === 'list' ? (
              <MapIcon size={20} color={Colors.white} />
            ) : (
              <List size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Principal */}


      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {viewMode === 'list' ? (
            <FlatList
              data={filteredHistory}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.listContent}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Clock size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyTitle}>Sem histórico</Text>
                  <Text style={styles.emptyText}>
                    Nenhuma movimentação encontrada para o período selecionado.
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                styleURL={StyleURL.Dark}
              >
                <Camera
                  ref={cameraRef}
                  defaultSettings={{
                    centerCoordinate: initialCoords,
                    zoomLevel: 12,
                  }}
                />

                {routeGeoJSON && (
                  <ShapeSource id="routeSource" shape={routeGeoJSON}>
                    <LineLayer
                      id="routeLine"
                      style={{
                        lineColor: Colors.primary,
                        lineWidth: 4,
                        lineCap: 'round',
                        lineJoin: 'round',
                        lineOpacity: 0.8,
                      }}
                    />
                    <CircleLayer
                      id="routePoints"
                      style={{
                        circleRadius: 4,
                        circleColor: Colors.white,
                        circleStrokeWidth: 1,
                        circleStrokeColor: Colors.primary,
                      }}
                    />
                  </ShapeSource>
                )}
              </MapView>
              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>
                  Exibindo {filteredHistory.length} pontos
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Modal de Filtro */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Período</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Seleção Rápida</Text>

            <View style={styles.filterOptions}>
              {[
                { id: 'today', label: 'Hoje' },
                { id: 'yesterday', label: 'Ontem' },
                { id: 'week', label: '7 Dias' },
                { id: 'month', label: '30 Dias' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterChip,
                    activeFilter === option.id && styles.activeFilterChip
                  ]}
                  onPress={() => {
                    applyFilter(option.id as FilterType);
                    setShowFilterModal(false);
                  }}
                >
                  <Calendar size={16} color={activeFilter === option.id ? Colors.white : Colors.textSecondary} />
                  <Text style={[
                    styles.filterChipText,
                    activeFilter === option.id && styles.activeFilterChipText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Opção Personalizada */}
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  activeFilter === 'custom' && styles.activeFilterChip
                ]}
                onPress={() => {
                  setActiveFilter('custom');
                }}
              >
                <Calendar size={16} color={activeFilter === 'custom' ? Colors.white : Colors.textSecondary} />
                <Text style={[
                  { fontSize: 13, fontFamily: activeFilter === 'custom' ? 'Montserrat_600SemiBold' : 'Poppins_400Regular' },
                  activeFilter === 'custom' && { color: Colors.white }
                ]}>
                  Personalizado
                </Text>
              </TouchableOpacity>
            </View>

            {/* Seletor de Data Customizado */}
            {activeFilter === 'custom' && (
              <View style={styles.customDateContainer}>
                <Text style={styles.customDateLabel}>Intervalo (Data e Hora)</Text>
                <View style={styles.dateInputsRow}>
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('start')}>
                    <Text style={styles.dateInputText}>{format(tempDateStart, 'dd/MM HH:mm')}</Text>
                  </TouchableOpacity>
                  <Text style={{ color: Colors.textSecondary }}>-</Text>
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('end')}>
                    <Text style={styles.dateInputText}>{format(tempDateEnd, 'dd/MM HH:mm')}</Text>
                  </TouchableOpacity>
                </View>
                <Button title="Confirmar Intervalo" onPress={handleCustomDateConfirm} style={{ marginTop: 12 }} />
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={showDatePicker === 'start' ? tempDateStart : tempDateEnd}
                mode={pickerMode}
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.modalFooter}>
              <Button
                title="Fechar"
                variant="outline"
                onPress={() => setShowFilterModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceHighlight,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  filterSelectorText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryIconButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 20,
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    bottom: -30,
    width: 2,
    backgroundColor: Colors.surfaceHighlight,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
    zIndex: 1,
    marginTop: 6,
  },
  itemContent: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: Colors.text,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  itemTime: {
    color: Colors.primary,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  itemDate: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    textAlign: 'right',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },

  // Map Styles
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapOverlayText: {
    color: Colors.white,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.text,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  activeFilterChipText: {
    color: Colors.white,
  },
  modalFooter: {
    marginTop: 16,
  },
  customDateContainer: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customDateLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dateInputText: {
    color: Colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
});
