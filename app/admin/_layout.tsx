import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function AdminLayout() {
    const router = useRouter();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAdminAccess = async () => {
            if (!user) {
                router.replace('/(tabs)');
                return;
            }

            const { data, error } = await supabase
                .from('usuario')
                .select('role')
                .eq('auth_user_id', user.id)
                .single();

            if (error || data?.role !== 'admin') {
                router.replace('/(tabs)');
                return;
            }

            setIsAdmin(true);
        };

        checkAdminAccess();
    }, [user]);

    if (isAdmin === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.surface,
                },
                headerTintColor: Colors.text,
                headerTitleStyle: {
                    fontFamily: 'Montserrat_600SemiBold',
                },
            }}
        >
            <Stack.Screen
                name="dashboard"
                options={{
                    title: 'Admin Dashboard',
                    headerBackTitle: 'Voltar',
                }}
            />
            <Stack.Screen
                name="orders/index"
                options={{
                    title: 'Pedidos',
                    headerBackTitle: 'Dashboard',
                }}
            />
            <Stack.Screen
                name="orders/[id]"
                options={{
                    title: 'Detalhes do Pedido',
                    headerBackTitle: 'Pedidos',
                }}
            />
            <Stack.Screen
                name="carts/index"
                options={{
                    title: 'Carrinhos Abandonados',
                    headerBackTitle: 'Dashboard',
                }}
            />
            <Stack.Screen
                name="carts/[id]"
                options={{
                    title: 'Detalhes do Carrinho',
                    headerBackTitle: 'Carrinhos',
                }}
            />
        </Stack>
    );
}
