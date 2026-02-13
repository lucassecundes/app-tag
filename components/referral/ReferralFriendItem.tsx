import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { CheckCircle2, User } from 'lucide-react-native';

interface ReferralFriendItemProps {
    name: string;
    rewardEarned: string;
    date: string;
    status: 'pending' | 'confirmed' | 'rejected';
}

export const ReferralFriendItem = ({ name, rewardEarned, date, status }: ReferralFriendItemProps) => {
    const isConfirmed = status === 'confirmed';

    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                <User size={24} color={Colors.textSecondary} />
                {isConfirmed && (
                    <View style={styles.statusBadge}>
                        <CheckCircle2 size={12} color={Colors.success} fill={Colors.white} />
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.reward}>
                    <Text style={{ color: Colors.primary }}>{rewardEarned}</Text> Ganho!
                </Text>
            </View>

            <View style={styles.rightContent}>
                <View style={styles.statusTextContainer}>
                    <CheckCircle2 size={14} color={isConfirmed ? Colors.success : Colors.textMuted} />
                    <Text style={[styles.statusText, { color: isConfirmed ? Colors.success : Colors.textMuted }]}>
                        {isConfirmed ? 'Confirmado' : 'Pendente'}
                    </Text>
                </View>
                <Text style={styles.date}>Confirmado em {date}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderRadius: 6,
    },
    info: {
        flex: 1,
    },
    name: {
        color: Colors.text,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
    },
    reward: {
        color: Colors.textSecondary,
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
    },
    rightContent: {
        alignItems: 'flex-end',
    },
    statusTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        marginLeft: 4,
    },
    date: {
        color: Colors.textMuted,
        fontFamily: 'Poppins_400Regular',
        fontSize: 10,
    },
});
