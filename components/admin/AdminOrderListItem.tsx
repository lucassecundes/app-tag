import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ChevronRight } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminOrderListItemProps {
    id: string;
    customerName: string | null;
    customerEmail: string | null;
    paymentStatus: string | null;
    totalAmount: number | null;
    createdAt: string | null;
    quantity: number | null;
    onPress: () => void;
}

export function AdminOrderListItem({
    id,
    customerName,
    customerEmail,
    paymentStatus,
    totalAmount,
    createdAt,
    quantity,
    onPress,
}: AdminOrderListItemProps) {
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

    const formatDate = (date: string | null) => {
        if (!date) return 'N/A';
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
        } catch {
            return date;
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <Text style={styles.customerName} numberOfLines={1}>
                    {customerName || customerEmail || 'Cliente não identificado'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(paymentStatus)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(paymentStatus) }]}>
                        {getStatusLabel(paymentStatus)}
                    </Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.label}>Pedido #{id.substring(0, 8)}</Text>
                <Text style={styles.amount}>
                    R$ {totalAmount?.toFixed(2) || '0.00'}
                </Text>
            </View>

            {quantity && quantity > 1 && (
                <Text style={styles.quantity}>{quantity} unidades</Text>
            )}

            <View style={styles.footer}>
                <Text style={styles.time}>{formatDate(createdAt)}</Text>
                <ChevronRight size={20} color={Colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    customerName: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Montserrat_600SemiBold',
        color: Colors.text,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
    },
    amount: {
        fontSize: 18,
        fontFamily: 'Montserrat_700Bold',
        color: '#FF6B35',
    },
    quantity: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    time: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textMuted,
    },
});
