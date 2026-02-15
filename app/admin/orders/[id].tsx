import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { getOrderById, OrderDetails } from '../../../services/adminService';
import {
    User,
    Mail,
    Phone,
    CreditCard,
    Package,
    MapPin,
    Calendar,
    DollarSign,
    Truck,
    Tag
} from 'lucide-react-native';

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (id) {
                    const data = await getOrderById(id);
                    setOrder(data);
                }
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Pedido não encontrado</Text>
            </View>
        );
    }

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'CONFIRMED':
            case 'RECEIVED':
                return '#10B981';
            case 'PENDING':
                return '#F59E0B';
            case 'OVERDUE':
                return '#EF4444';
            default:
                return Colors.textSecondary;
        }
    };

    const getStatusLabel = (status: string | null) => {
        switch (status) {
            case 'CONFIRMED':
                return 'Confirmado';
            case 'RECEIVED':
                return 'Recebido';
            case 'PENDING':
                return 'Pendente';
            case 'OVERDUE':
                return 'Atrasado';
            default:
                return status || 'N/A';
        }
    };

    const formatCurrency = (value: number | null) => {
        return `R$ ${(value || 0).toFixed(2)}`;
    };

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

    const openPhone = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const openEmail = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Status Badge */}
            <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor(order.payment_status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.payment_status) }]}>
                    {getStatusLabel(order.payment_status)}
                </Text>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações do Cliente</Text>

                <View style={styles.infoRow}>
                    <User size={20} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Nome:</Text>
                    <Text style={styles.infoValue}>{order.customer_name || 'N/A'}</Text>
                </View>

                {order.customer_email && (
                    <TouchableOpacity style={styles.infoRow} onPress={() => openEmail(order.customer_email!)}>
                        <Mail size={20} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={[styles.infoValue, styles.linkText]}>{order.customer_email}</Text>
                    </TouchableOpacity>
                )}

                {order.customer_phone && (
                    <TouchableOpacity style={styles.infoRow} onPress={() => openPhone(order.customer_phone!)}>
                        <Phone size={20} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>Telefone:</Text>
                        <Text style={[styles.infoValue, styles.linkText]}>{order.customer_phone}</Text>
                    </TouchableOpacity>
                )}

                {order.customer_cpf_cnpj && (
                    <View style={styles.infoRow}>
                        <CreditCard size={20} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>CPF/CNPJ:</Text>
                        <Text style={styles.infoValue}>{order.customer_cpf_cnpj}</Text>
                    </View>
                )}
            </View>

            {/* Order Items */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Itens do Pedido</Text>
                {order.order_items.map((item, index) => (
                    <View key={item.id} style={styles.orderItem}>
                        <View style={styles.orderItemHeader}>
                            <Text style={styles.orderItemName}>{item.product_name}</Text>
                            <Text style={styles.orderItemPrice}>{formatCurrency(item.subtotal)}</Text>
                        </View>
                        <Text style={styles.orderItemDetails}>
                            {item.quantity}x {formatCurrency(item.unit_price)}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Payment Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações de Pagamento</Text>

                <View style={styles.infoRow}>
                    <Package size={20} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Subtotal:</Text>
                    <Text style={styles.infoValue}>
                        {formatCurrency((order.total_amount || 0) - (order.shipping_amount || 0))}
                    </Text>
                </View>

                {order.discount && order.discount > 0 && (
                    <View style={styles.infoRow}>
                        <Tag size={20} color="#10B981" />
                        <Text style={styles.infoLabel}>Desconto:</Text>
                        <Text style={[styles.infoValue, { color: '#10B981' }]}>
                            -{formatCurrency(order.discount)}
                        </Text>
                    </View>
                )}

                {order.coupon && (
                    <View style={styles.infoRow}>
                        <Tag size={20} color="#10B981" />
                        <Text style={styles.infoLabel}>Cupom:</Text>
                        <Text style={[styles.infoValue, { color: '#10B981' }]}>
                            {order.coupon.token} ({order.coupon.percent}%)
                        </Text>
                    </View>
                )}

                {order.shipping_amount && (
                    <View style={styles.infoRow}>
                        <Truck size={20} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>Frete:</Text>
                        <Text style={styles.infoValue}>{formatCurrency(order.shipping_amount)}</Text>
                    </View>
                )}

                <View style={[styles.infoRow, styles.totalRow]}>
                    <DollarSign size={20} color="#FF6B35" />
                    <Text style={[styles.infoLabel, styles.totalLabel]}>Total:</Text>
                    <Text style={[styles.infoValue, styles.totalValue]}>
                        {formatCurrency(order.total_amount)}
                    </Text>
                </View>

                {order.payment_method && (
                    <View style={styles.infoRow}>
                        <CreditCard size={20} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>Método:</Text>
                        <Text style={styles.infoValue}>{order.payment_method}</Text>
                    </View>
                )}
            </View>

            {/* Shipping Info */}
            {order.shipping_address && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações de Entrega</Text>

                    <View style={styles.infoRow}>
                        <MapPin size={20} color={Colors.textSecondary} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.addressText}>
                                {order.shipping_address.street}, {order.shipping_address.number}
                                {order.shipping_address.complement ? ` - ${order.shipping_address.complement}` : ''}
                                {'\n'}
                                {order.shipping_address.neighborhood}
                                {'\n'}
                                {order.shipping_address.city} - {order.shipping_address.state}
                                {'\n'}
                                CEP: {order.shipping_address.cep}
                            </Text>
                        </View>
                    </View>

                    {order.shipping_method && (
                        <View style={styles.infoRow}>
                            <Truck size={20} color={Colors.textSecondary} />
                            <Text style={styles.infoLabel}>Método:</Text>
                            <Text style={styles.infoValue}>{order.shipping_method}</Text>
                        </View>
                    )}

                    {order.estimated_delivery_days && (
                        <View style={styles.infoRow}>
                            <Calendar size={20} color={Colors.textSecondary} />
                            <Text style={styles.infoLabel}>Entrega:</Text>
                            <Text style={styles.infoValue}>{order.estimated_delivery_days} dias úteis</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Metadata */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalhes do Pedido</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID:</Text>
                    <Text style={[styles.infoValue, styles.monoText]}>{order.id}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Calendar size={20} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Data:</Text>
                    <Text style={styles.infoValue}>{formatDate(order.created_at)}</Text>
                </View>

                {order.quantity && order.quantity > 1 && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Quantidade:</Text>
                        <Text style={styles.infoValue}>{order.quantity} unidades</Text>
                    </View>
                )}
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
        textTransform: 'uppercase',
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
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    totalLabel: {
        fontSize: 16,
        fontFamily: 'Montserrat_600SemiBold',
    },
    totalValue: {
        fontSize: 20,
        fontFamily: 'Montserrat_700Bold',
        color: '#FF6B35',
    },
    orderItem: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    orderItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    orderItemName: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Montserrat_600SemiBold',
        color: Colors.text,
    },
    orderItemPrice: {
        fontSize: 14,
        fontFamily: 'Montserrat_700Bold',
        color: '#FF6B35',
    },
    orderItemDetails: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
    },
    addressText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.text,
        lineHeight: 18,
    },
    monoText: {
        fontFamily: 'Courier',
        fontSize: 12,
    },
});
