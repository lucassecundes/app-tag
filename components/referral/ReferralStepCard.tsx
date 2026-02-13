import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ReferralStepCardProps {
    step: number;
    title: string;
    description: string;
    children?: React.ReactNode;
}

export const ReferralStepCard = ({ step, title, description, children }: ReferralStepCardProps) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.stepBadge}>
                    <Text style={styles.stepText}>{step}</Text>
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
            </View>
            {children && <View style={styles.content}>{children}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepText: {
        color: Colors.white,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        color: Colors.text,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        marginBottom: 4,
    },
    description: {
        color: Colors.textSecondary,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
    },
    content: {
        marginTop: 16,
    },
});
