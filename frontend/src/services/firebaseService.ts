import { MoodType } from '../types';
import { CONFIG } from '../constants/config';
import { apiClient } from '../utils/api';

// Detecta se está rodando no Expo Go (sem development build)
const isExpoGo = !CONFIG.EXPO_PROJECT_ID || CONFIG.EXPO_PROJECT_ID === 'your-expo-project-id';

// Função helper para carregar Firebase dinamicamente
let FirebaseModule: any = null;
let isLoadingFirebase = false;

async function getFirebase(): Promise<any> {
  if (isExpoGo) {
    return null;
  }

  if (FirebaseModule) {
    return FirebaseModule;
  }

  if (isLoadingFirebase) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (FirebaseModule) {
          clearInterval(checkInterval);
          resolve(FirebaseModule);
        } else if (!isLoadingFirebase) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 50);
    });
  }

  isLoadingFirebase = true;

  try {
    // Importa Firebase apenas quando necessário
    const firebasePart1 = '@react-native-firebase/';
    const firebasePart2 = 'messaging';
    const moduleName = firebasePart1 + firebasePart2;

    const module = await import(moduleName);
    FirebaseModule = module.default;
    return FirebaseModule;
  } catch (error) {
    console.warn('Firebase não disponível:', error);
    return null;
  } finally {
    isLoadingFirebase = false;
  }
}

class FirebaseService {
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;
  private messaging: any = null;
  private tokenRefreshUnsub: (() => void) | null = null;
  private messageUnsub: (() => void) | null = null;

  async initialize(): Promise<void> {
    if (isExpoGo) {
      this.isInitialized = true;
      return;
    }

    try {
      const messaging = await getFirebase();
      if (!messaging) {
        this.isInitialized = true;
        return;
      }

      this.messaging = messaging();

      // Solicita permissão para notificações
      const authStatus = await this.messaging.requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('Permissão de notificação negada');
        this.isInitialized = true;
        return;
      }

      // Obtém o token FCM
      try {
        const token = await this.messaging.getToken();
        this.fcmToken = token;

        // Envia o token para o backend
        await this.sendTokenToBackend(token);
      } catch (error) {
        console.warn('Erro ao obter FCM token:', error);
      }

      if (this.tokenRefreshUnsub) this.tokenRefreshUnsub();
      if (this.messageUnsub) this.messageUnsub();
      this.tokenRefreshUnsub = this.messaging.onTokenRefresh(async (token: string) => {
        this.fcmToken = token;
        await this.sendTokenToBackend(token);
      });
      this.messageUnsub = this.messaging.onMessage(async () => {});

      this.isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
      this.isInitialized = true;
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // Envia o token para o backend para ser armazenado
      // O apiClient já adiciona o token de autenticação automaticamente
      const response = await apiClient.post('/auth/fcm-token', {
        fcmToken: token,
      });

      if (!response.success) {
        console.warn('Erro ao enviar FCM token para o backend:', response.error);
      }
    } catch (error) {
      console.warn('Erro ao enviar FCM token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    if (isExpoGo || !this.messaging) {
      return null;
    }

    if (!this.fcmToken) {
      try {
        const token = await this.messaging.getToken();
        this.fcmToken = token;
        await this.sendTokenToBackend(token);
      } catch (error) {
        console.error('Erro ao obter FCM token:', error);
      }
    }

    return this.fcmToken;
  }

  async subscribeToTopic(topic: string): Promise<void> {
    if (isExpoGo || !this.messaging) {
      return;
    }

    try {
      await this.messaging.subscribeToTopic(topic);
      console.log(`Inscrito no tópico: ${topic}`);
    } catch (error) {
      console.error(`Erro ao se inscrever no tópico ${topic}:`, error);
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    if (isExpoGo || !this.messaging) {
      return;
    }

    try {
      await this.messaging.unsubscribeFromTopic(topic);
      console.log(`Desinscrito do tópico: ${topic}`);
    } catch (error) {
      console.error(`Erro ao se desinscrever do tópico ${topic}:`, error);
    }
  }
}

export const firebaseService = new FirebaseService();
