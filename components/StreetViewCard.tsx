
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants/Colors';
import { MapPin } from 'lucide-react-native';

interface StreetViewCardProps {
    latitude: number;
    longitude: number;
}

export const StreetViewCard = ({ latitude, longitude }: StreetViewCardProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // URL do Street View Embed
    // Usamos o output=svembed para forçar a visualização do panorama
    const url = `https://maps.google.com/maps?layer=c&cbll=${latitude},${longitude}&cbp=12,0,0,0,0&output=svembed`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background-color: #000; }
            iframe { width: 100%; height: 100%; border: 0; }
          </style>
        </head>
        <body>
          <iframe 
            src="${url}" 
            width="100%" 
            height="100%" 
            frameborder="0" 
            style="border:0" 
            allowfullscreen
          ></iframe>
        </body>
      </html>
    `;

    // Script para injetar CSS e remover elementos indesejados se possível (opcional e limitado por CORS/Frame options)
    const injectedJavaScript = `
    /* Tentativa de esconder controles extras se possível */
    true;
  `;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.title}>Visualização da Rua</Text>
            </View>

            <View style={styles.webviewContainer}>
                <WebView
                    source={{ html: htmlContent }}
                    style={styles.webview}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError(true);
                    }}
                    scrollEnabled={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    injectedJavaScript={injectedJavaScript}
                    // Importante para garantir que o mapa carregue corretamente no Android/iOS
                    originWhitelist={['*']}
                />

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.loadingText}>Carregando Street View...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Não foi possível carregar a visualização.</Text>
                        <Text style={styles.errorSubText}>Verifique sua conexão ou se há cobertura no local.</Text>
                    </View>
                )}
            </View>
            <Text style={styles.note}>
                * A imagem pode não corresponder à posição exata em tempo real.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Montserrat_700Bold',
        color: Colors.text,
    },
    webviewContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#e1e1e1', // Placeholder color
        position: 'relative',
    },
    webview: {
        flex: 1,
        opacity: 0.99, // Hack to prevent some rendering issues on Android
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: Colors.error,
        textAlign: 'center',
    },
    errorSubText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
    note: {
        marginTop: 8,
        fontSize: 10,
        fontFamily: 'Poppins_400Regular',
        color: Colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
