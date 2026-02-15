import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configuração do Handler de Notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as Notifications.NotificationBehavior),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // alert('Falha ao obter permissão para notificações push!');
        return;
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e) {
        console.log('Erro ao pegar token:', e);
      }

      console.log('Expo Push Token:', token);
    } else {
      console.log('Emulador detectado: Notificações push não funcionam completamente em emuladores.');
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) {
        saveTokenToSupabase(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notificação tocada:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const saveTokenToSupabase = async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('Salvando token no Supabase:', token);
      const { error } = await supabase
        .from('usuario')
        .update({ expo_push_token: token })
        .eq('auth_user_id', user.id);

      if (error) {
        console.error('Erro ao salvar push token:', error);
      } else {
        console.log('Push token salvo com sucesso!');
      }
    }
  };

  return {
    expoPushToken,
    notification,
  };
}
