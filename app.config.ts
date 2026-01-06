import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "TAGPRO+ Rastreamento",
  slug: "tagpro-rastreamento",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "tagpro",
  userInterfaceStyle: "dark",
  backgroundColor: "#151515",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#151515"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.tagpro.app",
    infoPlist: {
      NSCameraUsageDescription: "O aplicativo precisa de acesso à câmera para escanear o QR Code das TAGs.",
      NSLocationWhenInUseUsageDescription: "Precisamos da sua localização para mostrar sua posição no mapa em relação aos dispositivos."
    }
  },
  android: {
    package: "com.tagpro.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#151515"
    },
    permissions: [
      "android.permission.CAMERA",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.INTERNET"
    ]
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-camera",
      {
        "cameraPermission": "Permitir acesso à câmera para escanear QR Codes."
      }
    ],
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermission": "Permitir acesso à localização para rastreamento."
      }
    ],
    [
      "@rnmapbox/maps",
      {
        "RNMapboxMapsImpl": "mapbox",
        "RNMapboxMapsDownloadToken": process.env.MAPBOX_DOWNLOADS_TOKEN
      }
    ],
    "@react-native-community/datetimepicker"
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    eas: {
      projectId: "e917ad5d-2b23-44ae-aaaa-9d4edab88043"
    }
  }
});
