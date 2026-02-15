import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { AdminOrderListItem } from '../../../components/admin/AdminOrderListItem';
import { getOrders, OrderListItem } from '../../../services/adminService';
import { Search, ArrowLeft } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function OrdersListScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const data = await getOrders({ search, limit: 50 });
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchOrders();
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.mainTitle}>Pedidos</Text>
                    <Text style={styles.count}>{orders.length} pedidos encontrados</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nome ou email..."
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <AdminOrderListItem
                        id={item.id}
                        customerName={item.customer_name}
                        customerEmail={item.customer_email}
                        paymentStatus={item.payment_status}
                        totalAmount={item.total_amount}
                        createdAt={item.created_at}
                        quantity={item.quantity}
                        onPress={() => router.push(`/admin/orders/${item.id}`)}
                    />
                )}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        margin: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
        color: Colors.text,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 60,
        marginBottom: 8,
    },
    backButton: {
        marginRight: 16,
        padding: 8,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    mainTitle: {
        fontSize: 24,
        fontFamily: 'Montserrat_700Bold',
        color: Colors.text,
    },
    count: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
    },
    list: {
        padding: 16,
        paddingTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textMuted,
    },
});
