import { MoodType } from '../types';
import { CONFIG } from '../constants/config';

// Detecta se está rodando no Expo Go (sem development build)
const isExpoGo = !CONFIG.EXPO_PROJECT_ID || CONFIG.EXPO_PROJECT_ID === 'your-expo-project-id';

// Função helper para carregar Notifications dinamicamente apenas quando necessário
// No Expo Go, retorna null imediatamente sem tentar importar
// IMPORTANTE: Usa uma string dinâmica para evitar que o Metro inclua o módulo no bundle
let NotificationsModule: any = null;
let isLoadingModule = false;

async function getNotifications(): Promise<any> {
  if (isExpoGo) {
    return null;
  }

  // Cache do módulo carregado
  if (NotificationsModule) {
    return NotificationsModule;
  }

  if (isLoadingModule) {
    // Aguarda o carregamento em andamento
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (NotificationsModule) {
          clearInterval(checkInterval);
          resolve(NotificationsModule);
        } else if (!isLoadingModule) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 50);
    });
  }

  isLoadingModule = true;

  try {
    // Usa import() dinâmico com string construída dinamicamente para evitar
    // que o Metro bundler inclua o módulo quando estiver no Expo Go
    // Divide a string para evitar detecção estática pelo Metro
    const expoPart = 'expo-';
    const notificationsPart = 'notifications';
    const moduleName = expoPart + notificationsPart;

    const module = await import(moduleName);
    // expo-notifications exporta como namespace
    NotificationsModule = module.default || module;
    return NotificationsModule;
  } catch (error) {
    // Silenciar erro - não logar no Expo Go
    return null;
  } finally {
    isLoadingModule = false;
  }
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized: boolean = false;
  private lockScreenNotificationId: string | null = null;

  async initialize(): Promise<void> {
    // No Expo Go, não inicializa push notifications para evitar avisos
    if (isExpoGo) {
      this.isInitialized = true;
      return;
    }

    const Notifications = await getNotifications();
    if (!Notifications) {
      this.isInitialized = true;
      return;
    }

    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
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
      }

      // Configure notification channel (Android)
      // IMPORTANTE: Configuração para mostrar na tela bloqueada
      try {
        await Notifications.setNotificationChannelAsync(CONFIG.NOTIFICATION_CHANNEL_ID, {
          name: CONFIG.NOTIFICATION_CHANNEL_NAME,
          importance: (Notifications as any).AndroidImportance?.MAX || 5,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          lockscreenVisibility: (Notifications as any).AndroidNotificationVisibility?.PUBLIC || 1, // PUBLIC = visível na tela bloqueada
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      } catch (error) {
        // Ignorar erro de canal no Expo Go
        if (!isExpoGo) {
          console.warn('Error setting notification channel:', error);
        }
      }

      // Setup notification listeners
      try {
        Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
        });

        Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification response:', response);
        });
      } catch (error) {
        // Ignorar erro de listeners no Expo Go
        if (!isExpoGo) {
          console.warn('Error setting notification listeners:', error);
        }
      }

      this.isInitialized = true;
    } catch (error) {
      if (!isExpoGo) {
        console.error('Error initializing notifications:', error);
      }
      this.isInitialized = true; // Marca como inicializado mesmo com erro para evitar tentativas repetidas
    }
  }

  async getToken(): Promise<string | null> {
    // No Expo Go, não tenta obter push token
    if (isExpoGo) {
      return null;
    }

    const Notifications = await getNotifications();
    if (!Notifications) {
      return null;
    }

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
    // No Expo Go, não envia notificações push (apenas local funciona)
    if (isExpoGo) {
      return;
    }

    const Notifications = await getNotifications();
    if (!Notifications) {
      return;
    }

    try {
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
          priority: (Notifications as any).AndroidNotificationPriority?.HIGH || 1,
          // Configurações para tela bloqueada
          ...((Notifications as any).AndroidNotificationVisibility && {
            android: {
              channelId: CONFIG.NOTIFICATION_CHANNEL_ID,
              priority: (Notifications as any).AndroidNotificationPriority?.HIGH || 1,
              visibility: (Notifications as any).AndroidNotificationVisibility?.PUBLIC || 1, // PUBLIC = visível na tela bloqueada
              sound: 'default',
              vibrate: [0, 250, 250, 250],
            },
          }),
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      // Silenciar erro no Expo Go
      if (!isExpoGo) {
        console.error('Error sending mood change notification:', error);
      }
    }
  }

  async sendProximityNotification(partnerName: string): Promise<void> {
    // No Expo Go, não envia notificações push (apenas local funciona)
    if (isExpoGo) {
      return;
    }

    const Notifications = await getNotifications();
    if (!Notifications) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Vocês estão próximos!',
          body: `${partnerName} está perto de você!`,
          sound: true,
          priority: (Notifications as any).AndroidNotificationPriority?.HIGH || 1,
          // Configurações para tela bloqueada
          ...((Notifications as any).AndroidNotificationVisibility && {
            android: {
              channelId: CONFIG.NOTIFICATION_CHANNEL_ID,
              priority: (Notifications as any).AndroidNotificationPriority?.HIGH || 1,
              visibility: (Notifications as any).AndroidNotificationVisibility?.PUBLIC || 1, // PUBLIC = visível na tela bloqueada
              sound: 'default',
              vibrate: [0, 250, 250, 250],
            },
          }),
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      // Silenciar erro no Expo Go
      if (!isExpoGo) {
        console.error('Error sending proximity notification:', error);
      }
    }
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

  async updateLockScreenNotification(
    photoUrl: string,
    moodType: MoodType,
    moodMessage?: string
  ): Promise<void> {
    if (isExpoGo) {
      return;
    }

    const Notifications = await getNotifications();
    if (!Notifications) {
      return;
    }

    try {
      if (this.lockScreenNotificationId) {
        await Notifications.dismissNotificationAsync(this.lockScreenNotificationId);
        this.lockScreenNotificationId = null;
      }

      const emojiMap: Record<MoodType, string> = {
        [MoodType.HAPPY]: '😊',
        [MoodType.SAD]: '😢',
        [MoodType.ANXIOUS]: '😰',
        [MoodType.CALM]: '😌',
        [MoodType.EXCITED]: '🤩',
        [MoodType.TIRED]: '😴',
        [MoodType.ANGRY]: '😠',
        [MoodType.LOVE]: '❤️',
      };

      const emoji = emojiMap[moodType] || '😊';

      const result = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Seu humor atual',
          body: moodMessage ? `${moodType} ${emoji} — ${moodMessage}` : `${moodType} ${emoji}`,
          sound: true,
          priority: (Notifications as any).AndroidNotificationPriority?.HIGH || 1,
          ...(Notifications as any).AndroidNotificationVisibility && {
            android: {
              channelId: CONFIG.NOTIFICATION_CHANNEL_ID,
              priority: (Notifications as any).AndroidNotificationPriority?.HIGH || 1,
              visibility: (Notifications as any).AndroidNotificationVisibility?.PUBLIC || 1,
              imageUrl: photoUrl,
              sound: 'default',
              vibrate: [0, 250, 250, 250],
            },
          },
        },
        trigger: null,
      });

      this.lockScreenNotificationId = result;
    } catch (error) {
      if (!isExpoGo) {
        console.error('Error sending lock screen notification:', error);
      }
    }
  }
}

export const notificationService = new NotificationService();
