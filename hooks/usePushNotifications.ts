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
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

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
        alert('Falha ao obter permissão para notificações push!');
        return;
      }
      
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      // token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
      
      try {
        // Tentativa padrão sem project ID (funciona em desenvolvimento na maioria dos casos)
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e) {
        console.log('Erro ao pegar token:', e);
      }
      
      console.log('Expo Push Token:', token);
    } else {
      // alert('Must use physical device for Push Notifications');
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
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const saveTokenToSupabase = async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Salva o token na tabela usuario se existir coluna, ou cria uma tabela de tokens
      // Por enquanto, apenas logamos, pois precisamos saber onde salvar
      console.log('Token pronto para salvar no Supabase:', token);
      
      // Exemplo de update se houver coluna:
      // await supabase.from('usuario').update({ push_token: token }).eq('auth_user_id', user.id);
    }
  };

  return {
    expoPushToken,
    notification,
  };
}
