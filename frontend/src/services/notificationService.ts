import * as Notifications from 'expo-notifications';
import {MoodType} from '../types';
import {CONFIG} from '../constants/config';

// Configure notification handler (com tratamento de erro)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.warn('Error setting notification handler:', error);
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<void> {
    try {
      // Request permissions
      const {status: existingStatus} = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permissão de notificação negada');
        return;
      }

      // Get push token (só se EXPO_PROJECT_ID estiver configurado)
      if (CONFIG.EXPO_PROJECT_ID && CONFIG.EXPO_PROJECT_ID !== 'your-expo-project-id') {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: CONFIG.EXPO_PROJECT_ID,
          });
          this.expoPushToken = tokenData.data;
          console.log('Expo Push Token:', this.expoPushToken);
        } catch (error) {
          console.warn('Error getting Expo push token:', error);
        }
      } else {
        console.warn('EXPO_PROJECT_ID não configurado. Notificações push podem não funcionar.');
      }

      // Configure notification channel (Android)
      await Notifications.setNotificationChannelAsync(CONFIG.NOTIFICATION_CHANNEL_ID, {
        name: CONFIG.NOTIFICATION_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Setup notification listeners
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.expoPushToken) {
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: CONFIG.EXPO_PROJECT_ID,
        });
        this.expoPushToken = tokenData.data;
      } catch (error) {
        console.error('Error getting Expo push token:', error);
      }
    }
    return this.expoPushToken;
  }

  async sendMoodChangeNotification(partnerName: string, moodType: MoodType): Promise<void> {
    const moodEmojis: Record<MoodType, string> = {
      [MoodType.HAPPY]: '😊',
      [MoodType.SAD]: '😢',
      [MoodType.ANXIOUS]: '😰',
      [MoodType.CALM]: '😌',
      [MoodType.EXCITED]: '🤩',
      [MoodType.TIRED]: '😴',
      [MoodType.ANGRY]: '😠',
      [MoodType.LOVE]: '❤️',
    };

    const emoji = moodEmojis[moodType] || '😊';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Mood Sharing',
        body: `${partnerName} está ${moodType} ${emoji}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  }

  async sendProximityNotification(partnerName: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Vocês estão próximos!',
        body: `${partnerName} está perto de você!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  }

  async subscribeToTopic(topic: string): Promise<void> {
    // Expo notifications don't have topic subscription like FCM
    // This would need to be handled by your backend
    console.log('Topic subscription should be handled by backend:', topic);
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    // Expo notifications don't have topic subscription like FCM
    console.log('Topic unsubscription should be handled by backend:', topic);
  }
}

export const notificationService = new NotificationService();
