
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { Download, AlertCircle } from 'lucide-react-native';

interface AppUpdateModalProps {
    visible: boolean;
    onUpdate: () => void;
    forceUpdate: boolean;
}

export function AppUpdateModal({ visible, onUpdate, forceUpdate }: AppUpdateModalProps) {
    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={() => {
                // Prevent closing if force update
                if (!forceUpdate) {
                    // Logic to dismiss could be added, but for now we won't close on back press if forceUpdate is true
                }
            }}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.iconContainer}>
                        <Download size={48} color={Colors.primary} />
                    </View>

                    <Text style={styles.title}>Nova versão disponível!</Text>

                    <Text style={styles.message}>
                        Uma nova versão do Tagpro está disponível com melhorias e correções importantes.
                        {forceUpdate ? ' É necessário atualizar para continuar usando o aplicativo.' : ' Recomendamos atualizar para garantir a melhor experiência.'}
                    </Text>

                    <TouchableOpacity
                        style={styles.updateButton}
                        onPress={onUpdate}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.updateButtonText}>Atualizar Agora</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 20,
    },
    modalView: {
        width: '100%',
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#AAA',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    updateButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
    },
    updateButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
