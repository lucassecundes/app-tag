import { Tabs, Redirect } from 'expo-router';
import { Map, Clock, Bell, User } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, View, Platform } from 'react-native';
import { NotificationBanner } from '../../components/NotificationBanner';

export default function TabLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <NotificationBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            height: Platform.OS === 'android' ? 80 : 80,
            paddingBottom: Platform.OS === 'android' ? 16 : 24,
            paddingTop: 8,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarLabelStyle: {
            fontFamily: 'Poppins_500Medium',
            fontSize: 10,
            paddingBottom: Platform.OS === 'android' ? 4 : 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mapa',
            tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Histórico',
            tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Alertas',
            tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="personal-data"
          options={{
            href: null,
            tabBarStyle: { display: 'none' }, // Opcional: esconde a tab bar nesta tela
          }}
        />
        <Tabs.Screen
          name="security"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </>
  );
}
