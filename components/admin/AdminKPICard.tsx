import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { LucideIcon } from 'lucide-react-native';

interface AdminKPICardProps {
    title: string;
    value: number | string;
    icon: React.ReactElement;
    trend?: {
        value: number;
        direction: 'up' | 'down';
    };
    onPress?: () => void;
}

export function AdminKPICard({ title, value, icon, trend, onPress }: AdminKPICardProps) {
    const CardComponent = onPress ? TouchableOpacity : View;

    return (
        <CardComponent
            style={[styles.card, onPress && styles.cardTouchable]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.iconContainer}>
                {icon}
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.value}>{value}</Text>

                {trend && (
                    <View style={styles.trendContainer}>
                        <Text style={[
                            styles.trendText,
                            trend.direction === 'up' ? styles.trendUp : styles.trendDown
                        ]}>
                            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
                        </Text>
                    </View>
                )}
            </View>
        </CardComponent>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTouchable: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B35',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    value: {
        fontSize: 28,
        fontFamily: 'Montserrat_700Bold',
        color: Colors.text,
    },
    trendContainer: {
        marginTop: 4,
    },
    trendText: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
    },
    trendUp: {
        color: '#10B981',
    },
    trendDown: {
        color: '#EF4444',
    },
});
