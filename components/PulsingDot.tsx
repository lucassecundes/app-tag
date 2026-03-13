import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    withDelay
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface PulsingDotProps {
    color?: string;
    size?: number;
    borderOnly?: boolean;
}

export const PulsingDot = ({
    color = Colors.primary,
    size = 120,
    borderOnly = false
}: PulsingDotProps) => {
    const scale1 = useSharedValue(0.2);
    const opacity1 = useSharedValue(0.8);

    const scale2 = useSharedValue(0.2);
    const opacity2 = useSharedValue(0.8);

    useEffect(() => {
        const duration = 2500;

        scale1.value = withRepeat(
            withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );
        opacity1.value = withRepeat(
            withTiming(0, { duration, easing: Easing.out(Easing.ease) }),
            -1,
            false
        );

        scale2.value = withDelay(
            1000,
            withRepeat(
                withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
                -1,
                false
            )
        );
        opacity2.value = withDelay(
            1000,
            withRepeat(
                withTiming(0, { duration, easing: Easing.out(Easing.ease) }),
                -1,
                false
            )
        );
    }, []);

    const animatedStyle1 = useAnimatedStyle(() => ({
        transform: [{ scale: scale1.value }],
        opacity: opacity1.value,
    }));

    const animatedStyle2 = useAnimatedStyle(() => ({
        transform: [{ scale: scale2.value }],
        opacity: opacity2.value,
    }));

    const dotStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        position: 'absolute' as const,
        top: '50%' as const,
        left: '50%' as const,
        marginTop: -size / 2,
        marginLeft: -size / 2,
    };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View
                style={[
                    dotStyle,
                    borderOnly ? { borderWidth: 2, borderColor: color } : { backgroundColor: color },
                    animatedStyle1
                ]}
            />
            <Animated.View
                style={[
                    dotStyle,
                    borderOnly ? { borderWidth: 2, borderColor: color } : { backgroundColor: color },
                    animatedStyle2
                ]}
            />
        </View>
    );
};
