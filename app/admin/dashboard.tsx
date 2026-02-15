import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { AdminKPICard } from '../../components/admin/AdminKPICard';
import { getDashboardStats, DashboardStats } from '../../services/adminService';
import {
    ShoppingBag,
    ShoppingCart,
    Users,
    Tag,
    TrendingUp,
    Clock,
    CheckCircle,
    ArrowLeft,
    Calendar,
    DollarSign
} from 'lucide-react-native';
import { Stack } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [chartPeriod, setChartPeriod] = useState(7); // Default 7 days

    const fetchStats = async () => {
        try {
            const data = await getDashboardStats(chartPeriod);
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [chartPeriod]); // Refetch when period changes

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando estatísticas...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
        >
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/(tabs)/profile')}
                >
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Painel de controle</Text>
                    <Text style={styles.subtitle}>Visão geral do sistema</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>KPIs Principais</Text>

                <AdminKPICard
                    title="Total de Pedidos"
                    value={stats?.totalOrders || 0}
                    icon={<ShoppingBag size={28} color="#FF6B35" />}
                    onPress={() => router.push('/admin/orders')}
                />

                <AdminKPICard
                    title="Carrinhos Abandonados"
                    value={stats?.abandonedCarts || 0}
                    icon={<ShoppingCart size={28} color="#F59E0B" />}
                    onPress={() => router.push('/admin/carts')}
                />

                <AdminKPICard
                    title="Total de Clientes"
                    value={stats?.totalClients || 0}
                    icon={<Users size={28} color="#10B981" />}
                />

                <AdminKPICard
                    title="Tags Ativas"
                    value={stats?.activeTags || 0}
                    icon={<Tag size={28} color="#3B82F6" />}
                />
            </View>

            {/* Sales Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vendas</Text>

                {/* Sales Today Card */}
                <View style={[styles.kpiCard, { marginBottom: 20, backgroundColor: Colors.surface, borderColor: Colors.primary }]}>
                    <View style={styles.kpiHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                            <DollarSign size={24} color={Colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.kpiTitle}>Vendas Hoje</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.kpiValue, { color: Colors.primary }]}>
                                    R$ {stats?.salesToday?.toFixed(2) || '0.00'}
                                </Text>
                                {stats?.salesGrowth !== undefined && (
                                    <View style={[
                                        styles.badge,
                                        { backgroundColor: stats.salesGrowth >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                                    ]}>
                                        <Text style={[
                                            styles.badgeText,
                                            { color: stats.salesGrowth >= 0 ? '#10B981' : '#EF4444' }
                                        ]}>
                                            {stats.salesGrowth > 0 ? '+' : ''}{stats.salesGrowth.toFixed(1)}%
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Chart Filter */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterButton, chartPeriod === 7 && styles.filterButtonActive]}
                        onPress={() => setChartPeriod(7)}
                    >
                        <Text style={[styles.filterText, chartPeriod === 7 && styles.filterTextActive]}>7 Dias</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, chartPeriod === 30 && styles.filterButtonActive]}
                        onPress={() => setChartPeriod(30)}
                    >
                        <Text style={[styles.filterText, chartPeriod === 30 && styles.filterTextActive]}>30 Dias</Text>
                    </TouchableOpacity>
                </View>

                {/* Sales Chart */}
                <View style={styles.chartContainer}>
                    {stats?.salesHistory && stats.salesHistory.length > 0 ? (
                        <LineChart
                            data={stats.salesHistory}
                            color={Colors.primary}
                            thickness={3}
                            dataPointsColor={Colors.primary}
                            startFillColor="rgba(255, 107, 53, 0.3)"
                            endFillColor="rgba(255, 107, 53, 0.01)"
                            startOpacity={0.9}
                            endOpacity={0.2}
                            initialSpacing={20}
                            noOfSections={4}
                            yAxisColor="transparent"
                            xAxisColor="transparent"
                            yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
                            hideRules
                            curved
                            isAnimated
                            width={300}
                            height={180}
                            hideDataPoints={false}
                            dataPointsRadius={4}
                            pointerConfig={{
                                pointerStripHeight: 160,
                                pointerStripColor: 'lightgray',
                                pointerStripWidth: 2,
                                pointerColor: 'lightgray',
                                radius: 6,
                                pointerLabelWidth: 100,
                                pointerLabelHeight: 90,
                                autoAdjustPointerLabelPosition: false,
                                pointerLabelComponent: (items: any) => {
                                    return (
                                        <View
                                            style={{
                                                height: 90,
                                                width: 100,
                                                justifyContent: 'center',
                                                marginTop: -30,
                                                marginLeft: -40,
                                                borderRadius: 8,
                                                backgroundColor: Colors.surfaceHighlight,
                                                padding: 8,
                                            }}
                                        >
                                            <Text style={{ color: Colors.textSecondary, fontSize: 10, marginBottom: 4, textAlign: 'center' }}>
                                                {items[0].date}
                                            </Text>
                                            <Text style={{ color: Colors.text, fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>
                                                R$ {items[0].value.toFixed(2)}
                                            </Text>
                                        </View>
                                    );
                                },
                            }}
                        />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyChartText}>Sem dados de vendas no período</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status de Pedidos</Text>

                <View style={styles.statusGrid}>
                    <View style={[styles.statusCard, styles.statusPending]}>
                        <Clock size={20} color="#F59E0B" />
                        <Text style={styles.statusValue}>{stats?.ordersByStatus.pending || 0}</Text>
                        <Text style={styles.statusLabel}>Pendentes</Text>
                    </View>

                    <View style={[styles.statusCard, styles.statusConfirmed]}>
                        <CheckCircle size={20} color="#10B981" />
                        <Text style={styles.statusValue}>{stats?.ordersByStatus.confirmed || 0}</Text>
                        <Text style={styles.statusLabel}>Confirmados</Text>
                    </View>

                    <View style={[styles.statusCard, styles.statusReceived]}>
                        <TrendingUp size={20} color="#3B82F6" />
                        <Text style={styles.statusValue}>{stats?.ordersByStatus.received || 0}</Text>
                        <Text style={styles.statusLabel}>Recebidos</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Última atualização: agora</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 40,
    },
    backButton: {
        marginRight: 16,
        padding: 8,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Montserrat_700Bold',
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Montserrat_600SemiBold',
        color: Colors.text,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statusCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statusPending: {
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    statusConfirmed: {
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    statusReceived: {
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    statusValue: {
        fontSize: 24,
        fontFamily: 'Montserrat_700Bold',
        color: Colors.text,
        marginVertical: 8,
    },
    statusLabel: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 20,
    },
    footerText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textMuted,
    },
    kpiCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
    },
    kpiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kpiTitle: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 24,
        fontFamily: 'Montserrat_700Bold',
        color: Colors.text,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: 'Montserrat_600SemiBold',
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: Colors.surface,
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    filterButtonActive: {
        backgroundColor: Colors.primary,
    },
    filterText: {
        fontSize: 12,
        fontFamily: 'Montserrat_600SemiBold',
        color: Colors.textSecondary,
    },
    filterTextActive: {
        color: '#FFF',
    },
    chartContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    emptyChart: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyChartText: {
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
    },
});
