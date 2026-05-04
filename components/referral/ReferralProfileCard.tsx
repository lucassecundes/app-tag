import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Gift, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ReferralProfileCardProps {
    onPress: () => void;
}

export const ReferralProfileCard = ({ onPress }: ReferralProfileCardProps) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.container}
            >
                <View style={styles.iconContainer}>
                    <Gift size={24} color={Colors.background} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: Colors.background }]}>Indique e Ganhe</Text>
                    <Text style={[styles.subtitle, { color: Colors.background }]}>Ganhe TAGs grátis indicando amigos</Text>
                </View>
                <ChevronRight size={20} color={Colors.background} />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: Colors.white,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
    },
    subtitle: {
        color: Colors.white,
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        opacity: 0.9,
    },
});
