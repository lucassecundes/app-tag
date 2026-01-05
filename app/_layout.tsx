import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider } from '../context/AuthContext';
import { PremiumProvider } from '../context/PremiumContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { View, LogBox, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Ignora avisos de depreciação de bibliotecas externas no ambiente Web
// O aviso "findDOMNode is deprecated" é comum ao usar react-native-gesture-handler na web
// e não afeta o funcionamento do app.
LogBox.ignoreLogs([
  'findDOMNode is deprecated',
  'Warning: findDOMNode is deprecated',
]);

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && /findDOMNode is deprecated/.test(args[0])) return;
    originalError(...args);
  };
}

export default function RootLayout() {
  useFrameworkReady();
  usePushNotifications();

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PremiumProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="devices" />
            <Stack.Screen name="device-detail/[id]" />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="light" backgroundColor={Colors.background} />
        </PremiumProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
