import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { getAbandonedCartById, updateCartStatus, AbandonedCartDetails } from '../../../services/adminService';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Package,
    DollarSign,
    CheckCircle,
    XCircle
} from 'lucide-react-native';

export default function AbandonedCartDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [cart, setCart] = useState<AbandonedCartDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                if (id) {
                    const data = await getAbandonedCartById(id);
                    setCart(data);
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [id]);

    const handleUpdateStatus = async (status: 'recovered' | 'ignored') => {
        if (!id) return;

        const message = status === 'recovered'
            ? 'Marcar este carrinho como recuperado?'
            : 'Marcar este carrinho como ignorado?';

        Alert.alert(
            'Confirmar ação',
            message,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            await updateCartStatus(id, status);
                            Alert.alert(
                                'Sucesso',
                                'Status atualizado com sucesso!',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (error) {
                            console.error('Error updating cart status:', error);
                            Alert.alert('Erro', 'Não foi possível atualizar o status');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!cart) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Carrinho não encontrado</Text>
            </View>
        );
    }

    const formatDate = (date: string | null) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return date;
        }
    };

    const formatCurrency = (value: number | null) => {
        return `R$ ${(value || 0).toFixed(2)}`;
    };

    const openPhone = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const openEmail = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Status Badge */}
            <View style={[styles.statusBanner, { backgroundColor: '#F5980120' }]}>
                <Text style={[styles.statusText, { color: '#F59E0B' }]}>
                    CARRINHO ABANDONADO
                </Text>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações do Cliente</Text>

                <View style={styles.infoRow}>
                    <User size={20} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Nome:</Text>
                    <Text style={styles.infoValue}>{cart.name || 'N/A'}</Text>
                </View>

                {cart.email && (
                    <TouchableOpacity style={styles.infoRow} onPress={() => openEmail(cart.email!)}>
                        <Mail size={20} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={[styles.infoValue, styles.linkText]}>{cart.email}</Text>
                    </TouchableOpacity>
                )}

                {cart.phone && (
                    <TouchableOpacity style={styles.infoRow} onPress={() => openPhone(cart.phone!)}>
                        <Phone size={20} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>Telefone:</Text>
                        <Text style={[styles.infoValue, styles.linkText]}>{cart.phone}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Product Info */}
            {cart.product && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Produto Abandonado</Text>

                    <View style={styles.infoRow}>
                        <Package size={20} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>Produto:</Text>
                        <Text style={styles.infoValue}>{cart.product.name || 'N/A'}</Text>
                    </View>

                    {cart.product.price && (
                        <View style={styles.infoRow}>
                            <DollarSign size={20} color="#FF6B35" />
                            <Text style={styles.infoLabel}>Preço:</Text>
                            <Text style={[styles.infoValue, { color: '#FF6B35', fontFamily: 'Montserrat_700Bold' }]}>
                                {formatCurrency(cart.product.price)}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Cart Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalhes do Carrinho</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID:</Text>
                    <Text style={[styles.infoValue, styles.monoText]}>{cart.id}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Calendar size={20} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Abandonado em:</Text>
                    <Text style={styles.infoValue}>{formatDate(cart.created_at)}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={[styles.infoValue, { color: '#F59E0B' }]}>{cart.status || 'pending'}</Text>
                </View>
            </View>

            {/* Metadata */}
            {cart.metadata && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações Adicionais</Text>

                    {cart.metadata.quantity && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Quantidade:</Text>
                            <Text style={styles.infoValue}>{cart.metadata.quantity} unidades</Text>
                        </View>
                    )}

                    {cart.metadata.coupon && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Cupom:</Text>
                            <Text style={[styles.infoValue, { color: '#10B981', fontFamily: 'Montserrat_700Bold' }]}>
                                {cart.metadata.coupon}
                            </Text>
                        </View>
                    )}

                    {cart.metadata.shippingOption && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Frete:</Text>
                            <Text style={styles.infoValue}>
                                {cart.metadata.shippingOption.name} - {formatCurrency(cart.metadata.shippingOption.price)} ({cart.metadata.shippingOption.days} dias)
                            </Text>
                        </View>
                    )}

                    {cart.metadata.shippingAddress && (
                        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Endereço de Entrega:</Text>
                            </View>
                            <Text style={[styles.addressText, { marginLeft: 8, color: Colors.text }]}>
                                {cart.metadata.shippingAddress.street}, {cart.metadata.shippingAddress.number}
                                {cart.metadata.shippingAddress.complement ? ` - ${cart.metadata.shippingAddress.complement}` : ''}
                                {'\n'}
                                {cart.metadata.shippingAddress.neighborhood}
                                {'\n'}
                                {cart.metadata.shippingAddress.city} - {cart.metadata.shippingAddress.state}
                                {'\n'}
                                CEP: {cart.metadata.shippingAddress.cep}
                            </Text>
                        </View>
                    )}

                    {!cart.metadata.quantity && !cart.metadata.coupon && !cart.metadata.shippingOption && !cart.metadata.shippingAddress && (
                        <Text style={styles.metadataText}>
                            {JSON.stringify(cart.metadata, null, 2)}
                        </Text>
                    )}
                </View>
            )}

            {/* Action Buttons */}
            {cart.status === 'pending' && (
                <View style={styles.actionsSection}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.recoveredButton]}
                        onPress={() => handleUpdateStatus('recovered')}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <CheckCircle size={20} color="#FFF" />
                                <Text style={styles.actionButtonText}>Marcar como Recuperado</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.ignoredButton]}
                        onPress={() => handleUpdateStatus('ignored')}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <XCircle size={20} color="#FFF" />
                                <Text style={styles.actionButtonText}>Marcar como Ignorado</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    errorText: {
        fontSize: 16,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textMuted,
    },
    statusBanner: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    statusText: {
        fontSize: 18,
        fontFamily: 'Montserrat_700Bold',
        letterSpacing: 1,
    },
    section: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Montserrat_600SemiBold',
        color: Colors.text,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        marginLeft: 8,
        marginRight: 8,
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: Colors.text,
        textAlign: 'right',
    },
    linkText: {
        color: '#3B82F6',
        textDecorationLine: 'underline',
    },
    monoText: {
        fontFamily: 'Courier',
        fontSize: 12,
    },
    metadataText: {
        fontSize: 12,
        fontFamily: 'Courier',
        color: Colors.text,
        lineHeight: 18,
    },
    addressText: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.text,
        lineHeight: 20,
    },
    actionsSection: {
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    recoveredButton: {
        backgroundColor: '#10B981',
    },
    ignoredButton: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Montserrat_600SemiBold',
        marginLeft: 8,
    },
});
