import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ChevronRight, ShoppingCart } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminCartListItemProps {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    productName?: string;
    createdAt: string | null;
    onPress: () => void;
}

export function AdminCartListItem({
    id,
    email,
    phone,
    name,
    productName,
    createdAt,
    onPress,
}: AdminCartListItemProps) {
    const formatDate = (date: string | null) => {
        if (!date) return 'N/A';
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
        } catch {
            return date;
        }
    };

    const customerIdentifier = name || email || phone || 'Cliente não identificado';

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                <ShoppingCart size={24} color="#F59E0B" />
            </View>

            <View style={styles.content}>
                <Text style={styles.customerName} numberOfLines={1}>
                    {customerIdentifier}
                </Text>

                {productName && (
                    <Text style={styles.productName} numberOfLines={1}>
                        {productName}
                    </Text>
                )}

                {email && email !== customerIdentifier && (
                    <Text style={styles.email} numberOfLines={1}>
                        {email}
                    </Text>
                )}

                <Text style={styles.time}>{formatDate(createdAt)}</Text>
            </View>

            <ChevronRight size={20} color={Colors.textSecondary} />
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
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontFamily: 'Montserrat_600SemiBold',
        color: Colors.text,
        marginBottom: 4,
    },
    productName: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    email: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textMuted,
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textMuted,
    },
});
