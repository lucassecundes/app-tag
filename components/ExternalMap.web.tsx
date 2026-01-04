import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

// Mocks para Web para evitar crash ao importar @rnmapbox/maps
export const MapView = (props: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Mapa Mapbox (Nativo)</Text>
        <Text style={styles.subtitle}>
          O Mapbox SDK requer execução nativa (Android/iOS).
          No navegador, exibimos este placeholder.
        </Text>
        <View style={styles.placeholderMap}>
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, { transform: [{ rotate: '90deg' }] }]} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
};

export const Camera = (props: any) => null;
export const PointAnnotation = (props: any) => null;
export const Callout = (props: any) => null;
export const UserLocation = (props: any) => null;
export const LocationPuck = (props: any) => null;
export const ShapeSource = (props: any) => null;
export const LineLayer = (props: any) => null;
export const CircleLayer = (props: any) => null;
export const FillLayer = (props: any) => null; // Adicionado Mock
export const Images = (props: any) => null;

export const StyleURL = {
  Dark: 'mapbox://styles/mapbox/dark-v11',
  Street: 'mapbox://styles/mapbox/streets-v12',
  Satellite: 'mapbox://styles/mapbox/satellite-v9',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  messageContainer: {
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    color: Colors.primary,
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 12,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    marginBottom: 32,
  },
  placeholderMap: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: Colors.surfaceHighlight,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  }
});

export default { MapView, Camera, PointAnnotation, Callout, StyleURL, UserLocation, LocationPuck, ShapeSource, LineLayer, CircleLayer, FillLayer, Images };
