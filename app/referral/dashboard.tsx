import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ReferralRewardCard } from '../../components/referral/ReferralRewardCard';
import { ReferralFriendItem } from '../../components/referral/ReferralFriendItem';
import { ChevronLeft, Camera, Users, Award, Gift, Smartphone, Copy } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import * as Clipboard from 'expo-clipboard';
import { Alert, Linking } from 'react-native';

export default function ReferralDashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        confirmedCount: 0,
        totalCount: 0,
    });
    const [referrals, setReferrals] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any[]>([]);
    const [referralCode, setReferralCode] = useState<string>('');
    const [baseUrl, setBaseUrl] = useState<string>('https://rastreiotag.com.br/checkout');

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

                // Fetch referrals count and list
                // Note: In a real scenario, we would join with public.profiles to get names
                const { data, error } = await supabase
                    .from('referrals')
                    .select('*, profiles:buyer_user_id(email)')
                    .eq('referrer_id', user.id);

                if (data) {
                    setReferrals(data);
                    const confirmed = data.filter(r => r.status === 'confirmed').length;
                    setStats({
                        confirmedCount: confirmed,
                        totalCount: data.length
                    });
                }

                // Fetch rewards to get coupon tokens
                const { data: rewardsData } = await supabase
                    .from('rewards')
                    .select('*, coupons(token)')
                    .eq('user_id', user.id);
                
                if (rewardsData) {
                    setRewards(rewardsData);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    const displayReferrals = referrals;

    const progress = Math.min(stats.confirmedCount / 5, 1);
    const nextMilestone = stats.confirmedCount < 1 ? 1 : stats.confirmedCount < 3 ? 3 : 5;
    const progressText = stats.confirmedCount >= 5
        ? "Parabéns! Você atingiu o nível máximo!"
        : `Rumo à ${nextMilestone === 1 ? '50% OFF' : nextMilestone === 3 ? '1 TAG Grátis' : '2 TAGs Grátis'}!`;

    const referralLink = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}coupon=${referralCode || 'SEULINK'}`;

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(referralLink);
        Alert.alert('Sucesso', 'Link de indicação copiado!');
    };

    const handleRewardClick = (type: string) => {
        // Find the reward
        const reward = rewards.find(r => r.type === type);
        if (reward && reward.coupons && reward.coupons.token) {
            const rewardLink = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}coupon=${reward.coupons.token}`;
            Linking.openURL(rewardLink);
        } else {
            Alert.alert('Aviso', 'O cupom desta recompensa ainda não está disponível ou está sendo processado.');
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['#051813', '#0A2E24']}
                    style={styles.header}
                >
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <ChevronLeft size={24} color={Colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Minhas Indicações</Text>
                        <TouchableOpacity>
                            <Camera size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.progressCard}>
                        <Text style={styles.confirmedText}>{stats.confirmedCount} Indicações confirmadas</Text>
                        <Text style={styles.milestoneText}>{progressText}</Text>

                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                            <Text style={styles.progressLabel}>{stats.confirmedCount}/5</Text>
                        </View>

                        <View style={styles.rewardsRow}>
                            <ReferralRewardCard
                                friendsCount={1}
                                rewardName="50% CUPOM"
                                subText="1 Cupom de 50%"
                                isUnlocked={stats.confirmedCount >= 1}
                                icon={<Gift size={24} color={stats.confirmedCount >= 1 ? Colors.primary : Colors.textMuted} />}
                                onPress={() => handleRewardClick('coupon_50')}
                            />
                            <ReferralRewardCard
                                friendsCount={3}
                                rewardName="1 TAG GRATIS"
                                subText="1 TAG Grátis"
                                isUnlocked={stats.confirmedCount >= 3}
                                icon={<Award size={24} color={stats.confirmedCount >= 3 ? Colors.primary : Colors.textMuted} />}
                                onPress={() => handleRewardClick('tag_free')}
                            />
                            <ReferralRewardCard
                                friendsCount={5}
                                rewardName="2 TAGS GRATIS"
                                subText="2 TAGs Grátis"
                                isUnlocked={stats.confirmedCount >= 5}
                                icon={<Smartphone size={24} color={stats.confirmedCount >= 5 ? Colors.primary : Colors.textMuted} />}
                                onPress={() => handleRewardClick('2_tags_free')}
                            />
                        </View>

                        <Button
                            title="CONVIDAR AMIGOS"
                            onPress={() => router.push('/referral')}
                            style={styles.inviteButton}
                        />

                        <TouchableOpacity style={styles.copyLinkButton} onPress={copyToClipboard}>
                            <Copy size={16} color={Colors.white} />
                            <Text style={styles.copyLinkText}>Copiar meu link de indicação</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <Users size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>Indicações Feitas</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>Amigos compraram usando o seu link</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <View style={styles.list}>
                            {displayReferrals.length > 0 ? (
                                displayReferrals.map((item) => (
                                    <ReferralFriendItem
                                        key={item.id}
                                        name={item.profiles?.email?.split('@')[0] || 'Amigo'}
                                        rewardEarned={item.reward || (stats.confirmedCount >= 5 ? '2 TAGs Grátis' : stats.confirmedCount >= 3 ? '1 TAG Grátis' : '50% OFF')}
                                        date={new Date(item.created_at).toLocaleDateString('pt-BR')}
                                        status={item.status}
                                    />
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Você ainda não possui indicações realizadas.</Text>
                                </View>
                            )}
                        </View>
                    )}
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
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    navTitle: {
        color: Colors.white,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
    },
    progressCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    confirmedText: {
        color: Colors.white,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 4,
    },
    milestoneText: {
        color: Colors.white,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.9,
        marginBottom: 20,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 6,
        marginBottom: 24,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.white,
        borderRadius: 6,
    },
    progressLabel: {
        position: 'absolute',
        right: 10,
        color: Colors.white,
        fontSize: 10,
        fontFamily: 'Montserrat_700Bold',
    },
    rewardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    inviteButton: {
        backgroundColor: Colors.primary,
        marginBottom: 12,
    },
    copyLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    copyLinkText: {
        color: Colors.white,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        marginLeft: 8,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        textAlign: 'center',
    },
    content: {
        padding: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        color: Colors.text,
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        marginLeft: 8,
    },
    sectionSubtitle: {
        color: Colors.textSecondary,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        marginBottom: 20,
    },
    list: {
        marginTop: 10,
    },
});
