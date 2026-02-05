import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Detect if we are in Expo Go
import Constants from 'expo-constants';
const isExpoGo = Constants.appOwnership === 'expo';

let Mapbox: any = {
  MapView: (props: any) => <View style={styles.container}><Text>Mapbox not available in Expo Go</Text></View>,
  Camera: () => null,
  PointAnnotation: () => null,
  Callout: () => null,
  StyleURL: {
    Dark: 'mapbox://styles/mapbox/dark-v10',
    Satellite: 'mapbox://styles/mapbox/satellite-v9',
    SatelliteStreet: 'mapbox://styles/mapbox/satellite-streets-v12'
  },
  UserLocation: () => null,
  LocationPuck: () => null,
  ShapeSource: () => null,
  LineLayer: () => null,
  CircleLayer: () => null,
  FillLayer: () => null,
  Images: () => null,
  setAccessToken: () => { },
};

if (!isExpoGo) {
  try {
    // Only try to import if not in Expo Go (although this file runs in Expo Go too, so we need a try/catch or assume it might fail)
    // However, top level imports cannot be try/catched. 
    // We rely on the fact that if the package is installed but not linked, it might not throw on import but on usage.
    // BUT @rnmapbox/maps usually throws if native module is missing.
    // Since we are in a managed workflow that supports it via config plugin, it SHOULD work in Development Builds.
    // For Expo Go, we must avoid it.

    // Changing to require to allow failure?
    // require('@rnmapbox/maps') might still throw.

    // Ideally we would use a separate file for Expo Go, but RN resolving doesn't support .expo.tsx easily without config.

    // Let's try to assume the user wants to run in Expo Go for now and commenting out the real import is the only way 
    // unless we use a conditional require which is tricky with Typescript.

    // BETTER APPROACH:
    // Check if we can just define the exports.

    Mapbox = require('@rnmapbox/maps').default;
  } catch (e) {
    console.warn("Mapbox native module not found, falling back to mock.");
  }
}

// Configuração do Token
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (token && !isExpoGo && Mapbox.setAccessToken) {
  Mapbox.setAccessToken(token);
}

// Mock Component
const MockMap = ({ children, style }: any) => (
  <View style={[styles.container, style]}>
    <View style={styles.mockHeader}>
      <Text style={styles.text}>Ambiente de Teste (Mock)</Text>
      <Text style={styles.subtext}>Mapbox indisponível no Expo Go. Exibindo apenas UI dos Markers.</Text>
    </View>
    {/* Renderiza os filhos (Markers) centralizados para teste de design */}
    <View style={styles.markersPreview}>
      {children}
    </View>
  </View>
);

const MockPoint = ({ children, coordinate }: any) => (
  <View style={styles.mockPointWrapper}>
    {children}
  </View>
);

// Exports
export const MapView = isExpoGo ? MockMap : Mapbox.MapView;
export const Camera = isExpoGo ? ({ children }: any) => <>{children}</> : Mapbox.Camera;
export const PointAnnotation = isExpoGo ? MockPoint : Mapbox.PointAnnotation;
export const Callout = isExpoGo ? () => null : Mapbox.Callout;
export const StyleURL = Mapbox.StyleURL;
export const UserLocation = isExpoGo ? () => null : Mapbox.UserLocation;
export const LocationPuck = isExpoGo ? () => null : Mapbox.LocationPuck;
export const ShapeSource = isExpoGo ? () => null : Mapbox.ShapeSource;
export const LineLayer = isExpoGo ? () => null : Mapbox.LineLayer;
export const CircleLayer = isExpoGo ? () => null : Mapbox.CircleLayer;
export const FillLayer = isExpoGo ? () => null : Mapbox.FillLayer;
export const Images = isExpoGo ? () => null : Mapbox.Images;

export default Mapbox;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
  mockHeader: {
    position: 'absolute',
    top: 100,
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  markersPreview: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 150,
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  mockPointWrapper: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    width: '90%',
  }
});
