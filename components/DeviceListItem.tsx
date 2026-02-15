
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, ShieldAlert, Bell, Car, Bike, Truck, Bus, Package, Smartphone } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { fetchAddressFromNominatim } from '../services/geocoding';

interface DeviceListItemProps {
    item: any;
    onPress: (item: any) => void;
    timeAgo: string;
}

export const DeviceListItem = ({ item, onPress, timeAgo }: DeviceListItemProps) => {
    const [address, setAddress] = useState(item.endereco || 'Aguardando posição');
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (item.ultima_lat && item.ultima_lng) {
            const updateAddress = async () => {
                try {
                    const newAddress = await fetchAddressFromNominatim(
                        parseFloat(item.ultima_lat),
                        parseFloat(item.ultima_lng)
                    );
                    setAddress(newAddress);
                } catch (error) {
                    console.error('Error in DeviceListItem address update:', error);
                }
            };

            updateAddress();
        }
    }, [item.ultima_lat, item.ultima_lng]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'car': return <Car size={24} color={Colors.primary} />;
            case 'moto': return <Bike size={24} color={Colors.primary} />;
            case 'truck': return <Truck size={24} color={Colors.primary} />;
            case 'bus': return <Bus size={24} color={Colors.primary} />;
            case 'object': return <Package size={24} color={Colors.primary} />;
            default: return <Smartphone size={24} color={Colors.primary} />;
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardIcon}>
                {item.imagem_url && !imageError ? (
                    <Image
                        source={{ uri: item.imagem_url }}
                        style={styles.deviceImage}
                        resizeMode="cover"
                        onError={() => {
                            console.log(`Erro ao carregar imagem para o dispositivo ${item.id}`);
                            setImageError(true);
                        }}
                    />
                ) : (
                    getIcon(item.icone)
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.nome || 'Dispositivo sem nome'}</Text>
                <Text style={styles.cardSubtitle}>
                    ID: {item.codigo || item.id?.substring(0, 8)}
                    {timeAgo && <Text style={{ color: Colors.primary }}> • {timeAgo}</Text>}
                </Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: item.ultima_lat ? Colors.success : Colors.warning }]} />
                    <Text style={styles.statusText} numberOfLines={1}>
                        {address}
                    </Text>
                </View>
            </View>
            <View style={styles.rightActions}>
                {(item.alerta_cerca || item.alerta_movimento) && (
                    <View style={styles.alertsContainer}>
                        {item.alerta_cerca && (
                            <View style={[styles.alertBadge, { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
                                <ShieldAlert size={16} color={Colors.error} />
                            </View>
                        )}
                        {item.alerta_movimento && (
                            <View style={[styles.alertBadge, { backgroundColor: 'rgba(255, 187, 51, 0.1)' }]}>
                                <Bell size={16} color={Colors.warning} />
                            </View>
                        )}
                    </View>
                )}
                <View style={styles.actionIcon}>
                    <MapPin size={20} color={Colors.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        elevation: 2,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
    },
    deviceImage: {
        width: 48,
        height: 48,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Montserrat_600SemiBold',
        color: Colors.text,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
        flexShrink: 0,
    },
    statusText: {
        fontSize: 11,
        fontFamily: 'Poppins_500Medium',
        color: Colors.textSecondary,
        flexShrink: 1,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alertsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    alertBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIcon: {
        padding: 8,
        backgroundColor: 'rgba(255, 122, 0, 0.1)',
        borderRadius: 8,
    },
});
