import * as Location from 'expo-location';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
}

export const locationService = {
  async getCurrentLocation(): Promise<CurrentLocation | null> {
    try {
      // First check if permissions are granted
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('[locationService] Permissão de localização não concedida. Não é possível obter localização.');
        return null;
      }

      console.log('[locationService] Capturando localização atual...');
      // Obter localização (getCurrentPositionAsync pode ser mais demorado, usar getLastKnownPosition para agilizar se necessário)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log(`[locationService] Localização capturada: Lat ${location.coords.latitude}, Lng ${location.coords.longitude}`);
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (err) {
      console.error('[locationService] Erro ao obter localização:', err);
      return null;
    }
  }
};
