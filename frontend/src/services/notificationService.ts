import { MoodType } from '../types';
import { CONFIG } from '../constants/config';
import { apiClient } from '../utils/api';

// Detecta se está rodando no Expo Go (sem development build)
const isExpoGo = !CONFIG.EXPO_PROJECT_ID || CONFIG.EXPO_PROJECT_ID === 'your-expo-project-id';

// Função helper para carregar Notifications dinamicamente apenas quando necessário
// No Expo Go, retorna null imediatamente sem tentar importar
// IMPORTANTE: Usa uma string dinâmica para evitar que o Metro inclua o módulo no bundle
let NotificationsModule: any = null;
let isLoadingModule = false;

async function getNotifications(): Promise<any> {
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
  private receivedSub: any = null;
  private responseSub: any = null;

  async initialize(): Promise<void> {
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

      // Get push token (evita no Expo Go e quando não configurado)
      if (
        !isExpoGo &&
        CONFIG.EXPO_PROJECT_ID &&
        CONFIG.EXPO_PROJECT_ID !== 'your-expo-project-id'
      ) {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: CONFIG.EXPO_PROJECT_ID,
          });
          this.expoPushToken = tokenData.data;

          // Envia o token para o backend
          await this.sendTokenToBackend(this.expoPushToken);
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

      try {
        if (this.receivedSub) this.receivedSub.remove();
        if (this.responseSub) this.responseSub.remove();
        this.receivedSub = Notifications.addNotificationReceivedListener(() => {});
        this.responseSub = Notifications.addNotificationResponseReceivedListener(() => {});
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
        // Envia o token para o backend quando obtido
        await this.sendTokenToBackend(this.expoPushToken);
      } catch (error) {
        console.error('Error getting Expo push token:', error);
      }
    }
    return this.expoPushToken;
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // Envia o token para o backend para ser armazenado
      // O apiClient já adiciona o token de autenticação automaticamente
      const response = await apiClient.post('/auth/fcm-token', {
        fcmToken: token, // Backend aceitará tanto FCM quanto Expo tokens neste campo
      });

      if (!response.success) {
        console.warn('Erro ao enviar Expo Push Token para o backend:', response.error);
      } else {
        console.log('Expo Push Token enviado ao backend com sucesso');
      }
    } catch (error) {
      console.warn('Erro ao enviar Expo Push Token:', error);
    }
  }

  async sendMoodChangeNotification(
    partnerName: string,
    moodType: MoodType,
    moodMessage?: string
  ): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      return;
    }

    try {
      const trimmedMessage = moodMessage?.trim();
      const safePartnerName = partnerName?.trim();
      const titleText = safePartnerName
        ? `${safePartnerName} atualizou o humor`
        : 'Mood Sharing';
      const bodyText = trimmedMessage || (moodType ? `Humor: ${moodType}` : 'Atualizou o humor');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: titleText,
          body: bodyText,
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
    photoUrl: string | null | undefined,
    moodType: MoodType,
    moodMessage?: string,
    partnerMood?: MoodType,
    partnerName?: string,
    partnerMessage?: string
  ): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      return;
    }

    try {
      if (this.lockScreenNotificationId) {
        await Notifications.dismissNotificationAsync(this.lockScreenNotificationId);
        this.lockScreenNotificationId = null;
      }

      const trimmedPartnerMessage = partnerMessage?.trim();
      const trimmedMoodMessage = moodMessage?.trim();
      const titleText = partnerName?.trim() || 'Mood Sharing';
      const bodyText =
        trimmedPartnerMessage ||
        trimmedMoodMessage ||
        'Atualizou o humor';

      const androidPayload: Record<string, unknown> = {
        channelId: CONFIG.NOTIFICATION_CHANNEL_ID,
        priority: (Notifications as any).AndroidNotificationPriority?.MAX || 2,
        visibility: (Notifications as any).AndroidNotificationVisibility?.PUBLIC || 1, // PUBLIC = visível na tela bloqueada
        sound: null, // Sem som para notificação persistente
        vibrate: null, // Sem vibração para notificação persistente
        ongoing: true, // Notificação contínua (persistente)
        autoCancel: false, // Não cancela automaticamente
        showWhen: true, // Mostra quando foi criada
      };

      if (photoUrl) {
        androidPayload.imageUrl = photoUrl;
      }

      const result = await Notifications.scheduleNotificationAsync({
        content: {
          title: titleText,
          body: bodyText,
          sound: false, // Não toca som para notificação persistente
          priority: (Notifications as any).AndroidNotificationPriority?.MAX || 2,
          ...(Notifications as any).AndroidNotificationVisibility && {
            android: androidPayload,
          },
          ...(Notifications as any).iOS && {
            ios: {
              sound: null,
              badge: null,
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
