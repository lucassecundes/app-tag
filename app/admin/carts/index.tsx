import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { AdminCartListItem } from '../../../components/admin/AdminCartListItem';
import { getAbandonedCarts, AbandonedCartListItem } from '../../../services/adminService';
import { ArrowLeft } from 'lucide-react-native';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/Colors';

export default function AbandonedCartsListScreen() {
    const router = useRouter();
    const [carts, setCarts] = useState<AbandonedCartListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCarts = async () => {
        try {
            const data = await getAbandonedCarts({ limit: 50 });
            setCarts(data);
        } catch (error) {
            console.error('Error fetching abandoned carts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCarts();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCarts();
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
                    <Text style={styles.mainTitle}>Carrinhos Abandonados</Text>
                    <Text style={styles.count}>{carts.length} encontrados</Text>
                </View>
            </View>

            <View style={styles.headerInfo}>
                <Text style={styles.subtitle}>Mostrando apenas carrinhos pendentes</Text>
            </View>

            <FlatList
                data={carts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <AdminCartListItem
                        id={item.id}
                        email={item.email}
                        phone={item.phone}
                        name={item.name}
                        productName={item.product_name}
                        createdAt={item.created_at}
                        onPress={() => router.push(`/admin/carts/${item.id}`)}
                    />
                )}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum carrinho abandonado pendente</Text>
                        <Text style={styles.emptySubtext}>
                            Ótimo! Todos os carrinhos foram recuperados ou ignorados.
                        </Text>
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
    headerInfo: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    count: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textMuted,
        marginTop: 2,
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textMuted,
        textAlign: 'center',
    },
});
