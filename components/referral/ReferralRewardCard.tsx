import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { CheckCircle2, Lock } from 'lucide-react-native';

interface ReferralRewardCardProps {
    friendsCount: number;
    rewardName: string;
    subText: string;
    isUnlocked: boolean;
    isRedeemed?: boolean;
    icon?: React.ReactNode;
}

export const ReferralRewardCard = ({
    friendsCount,
    rewardName,
    subText,
    isUnlocked,
    isRedeemed,
    icon
}: ReferralRewardCardProps) => {
    return (
        <View style={[styles.card, isUnlocked && styles.unlockedCard]}>
            <View style={styles.badgeContainer}>
                {isUnlocked ? (
                    <CheckCircle2 size={20} color={Colors.success} />
                ) : (
                    <Lock size={20} color={Colors.textMuted} />
                )}
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.friendCount}>{friendsCount} {friendsCount === 1 ? 'Amigo' : 'Amigos'}</Text>
                <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>{rewardName}</Text>
                </View>
                <Text style={styles.subText}>{subText}</Text>
            </View>

            {icon && <View style={styles.iconContainer}>{icon}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        flex: 1,
        marginHorizontal: 4,
        minHeight: 140,
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: 0.7,
    },
    unlockedCard: {
        borderColor: Colors.primary,
        opacity: 1,
        backgroundColor: Colors.surfaceHighlight,
    },
    badgeContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    infoContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    friendCount: {
        color: Colors.textSecondary,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        marginBottom: 4,
    },
    rewardBadge: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 4,
    },
    rewardText: {
        color: Colors.white,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 12,
        textAlign: 'center',
    },
    subText: {
        color: Colors.textMuted,
        fontFamily: 'Poppins_400Regular',
        fontSize: 10,
        textAlign: 'center',
    },
    iconContainer: {
        marginVertical: 4,
    }
});
