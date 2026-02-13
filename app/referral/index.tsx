import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ReferralStepCard } from '../../components/referral/ReferralStepCard';
import { Copy, Share2, Award, Gift, ShoppingBag, ChevronLeft } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export default function ReferralInviteScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [referralCode, setReferralCode] = useState<string>('');
    const [baseUrl, setBaseUrl] = useState<string>('https://rastreiotag.com.br/checkout');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;

            try {
                // Fetch referral code from profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('referral_code')
                    .eq('id', user.id)
                    .single();

                if (profileData?.referral_code) {
                    setReferralCode(profileData.referral_code);
                }

                // Fetch checkout link from products table
                const { data: productData } = await supabase
                    .from('products')
                    .select('checkout_link')
                    .eq('id', 'a8244447-dbeb-4163-bc2c-dbe696b36b33')
                    .single();

                if (productData?.checkout_link) {
                    setBaseUrl(productData.checkout_link);
                }
            } catch (error) {
                console.error('Error fetching referral data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    const referralLink = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}coupon=${referralCode || 'SEULINK'}`;

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(referralLink);
        Alert.alert('Sucesso', 'Link de indicação copiado!');
    };

    const shareLink = async () => {
        try {
            await Share.share({
                message: `Use meu link para ganhar 20% de desconto na sua Tag Pro Plus! ${referralLink}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#0057FF', '#0094FF']}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft size={24} color={Colors.white} />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Indique e Ganhe</Text>
                        <Text style={styles.headerSubtitle}>Convide amigos e ganhe recompensas incríveis!</Text>

                        <View style={styles.rewardsImageContainer}>
                            <Award size={80} color={Colors.white} strokeWidth={1} />
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <ReferralStepCard
                        step={1}
                        title="Compartilhe o seu link"
                        description="Envie seu link de indicação para seus amigos!"
                    >
                        <View style={styles.linkContainer}>
                            <View style={styles.linkBox}>
                                <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
                            </View>
                            <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                                <Text style={styles.copyButtonText}>COPIAR LINK</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.shareIconButton} onPress={shareLink}>
                            <Share2 size={20} color={Colors.primary} />
                            <Text style={styles.shareIconText}>Compartilhar agora</Text>
                        </TouchableOpacity>
                    </ReferralStepCard>

                    <ReferralStepCard
                        step={2}
                        title="Seu amigo compra uma TAG"
                        description="Seu amigo faz uma compra usando o seu link."
                    >
                        <View style={styles.stepImageContainer}>
                            <ShoppingBag size={48} color={Colors.primary} />
                        </View>
                    </ReferralStepCard>

                    <ReferralStepCard
                        step={3}
                        title="Ganhe recompensas!"
                        description="Acumule indicações e troque por prêmios."
                    >
                        <View style={styles.rewardsList}>
                            <View style={styles.rewardItem}>
                                <Gift size={16} color={Colors.primary} />
                                <Text style={styles.rewardItemText}>1 amigo: Cupom de 50%</Text>
                            </View>
                            <View style={styles.rewardItem}>
                                <Gift size={16} color={Colors.primary} />
                                <Text style={styles.rewardItemText}>3 amigos: 1 TAG grátis</Text>
                            </View>
                            <View style={styles.rewardItem}>
                                <Gift size={16} color={Colors.primary} />
                                <Text style={styles.rewardItemText}>5 amigos: 2 TAGs grátis</Text>
                            </View>
                        </View>
                    </ReferralStepCard>

                    <Button
                        title="VER MEUS PRÊMIOS"
                        onPress={() => router.push('/referral/dashboard')}
                        style={styles.mainButton}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerTitle: {
        color: Colors.white,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 28,
        marginBottom: 8,
    },
    headerSubtitle: {
        color: Colors.white,
        fontFamily: 'Poppins_400Regular',
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.9,
        marginBottom: 20,
    },
    rewardsImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        marginTop: -20,
    },
    linkContainer: {
        flexDirection: 'row',
        marginTop: 12,
    },
    linkBox: {
        flex: 1,
        backgroundColor: Colors.surfaceHighlight,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        padding: 12,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRightWidth: 0,
    },
    linkText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    copyButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    copyButtonText: {
        color: Colors.white,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 12,
    },
    shareIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        padding: 8,
    },
    shareIconText: {
        color: Colors.primary,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        marginLeft: 8,
    },
    stepImageContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    rewardsList: {
        marginTop: 8,
    },
    rewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    rewardItemText: {
        color: Colors.text,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        marginLeft: 10,
    },
    mainButton: {
        marginTop: 20,
        marginBottom: 40,
    }
});
