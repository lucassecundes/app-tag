import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Tagpro+",
  slug: "tagpro-rastreamento",
  version: "1.1.6",
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
    appleTeamId: "A3L6M76G5R",
    supportsTablet: true,
    bundleIdentifier: "com.tagpro.app",
    buildNumber: "7",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "O aplicativo precisa de acesso à câmera para escanear o QR Code das TAGs fisicas e realizar a vinculação ao seu perfil.",
      NSLocationWhenInUseUsageDescription: "Sua localização é utilizada para mostrar sua posição relativa aos seus dispositivos rastreados no mapa e auxiliar na recuperação."
    }
  },
  android: {
    package: "com.tagpro.app",
    versionCode: 13,
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
      projectId: "15b1a5bc-9104-4d9f-9721-427d4d94201c"
    }
  }
});
