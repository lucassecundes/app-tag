import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "TAG+",
  slug: "tagpro-rastreamento",
  version: "2.0.0",
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
    buildNumber: "12",
    infoPlist: {
      CFBundleShortVersionString: "2.0.0",
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "O aplicativo precisa de acesso à câmera para escanear o QR Code das TAGs fisicas e realizar a vinculação ao seu perfil.",
      NSLocationWhenInUseUsageDescription: "Sua localização é utilizada para mostrar sua posição relativa aos seus dispositivos rastreados no mapa e auxiliar na recuperação."
    }
  },
  android: {
    package: "com.tagpro.app",
    versionCode: 19,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#151515"
    },
    permissions: [
      "android.permission.CAMERA",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
      "android.permission.INTERNET",
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT"
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
        "locationWhenInUsePermission": "Permitir acesso à localização para rastreamento.",
        "isIosBackgroundLocationEnabled": false,
        "isAndroidBackgroundLocationEnabled": true
      }
    ],
    [
      "@rnmapbox/maps",
      {
        "RNMapboxMapsImpl": "mapbox",
        "RNMapboxMapsDownloadToken": process.env.MAPBOX_DOWNLOADS_TOKEN
      }
    ],
    [
      "react-native-ble-plx",
      {
        "isBackgroundEnabled": false,
        "modes": [
          "central"
        ],
        "bluetoothAlwaysPermission": false
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
