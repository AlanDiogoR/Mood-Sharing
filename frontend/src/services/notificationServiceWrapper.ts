import {MoodType} from '../types';
import {CONFIG} from '../constants/config';

// Detecta se está rodando no Expo Go (sem development build)
const isExpoGo = !CONFIG.EXPO_PROJECT_ID || CONFIG.EXPO_PROJECT_ID === 'your-expo-project-id';

// Stub completo para Expo Go - não importa o módulo de forma alguma
class NotificationServiceStub {
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async getToken(): Promise<string | null> {
    return null;
  }

  async sendMoodChangeNotification(
    _partnerName: string,
    _moodType: MoodType,
    _moodMessage?: string
  ): Promise<void> {
    // No-op no Expo Go
  }

  async sendProximityNotification(_partnerName: string): Promise<void> {
    // No-op no Expo Go
  }

  async subscribeToTopic(_topic: string): Promise<void> {
    // No-op no Expo Go
  }

  async unsubscribeFromTopic(_topic: string): Promise<void> {
    // No-op no Expo Go
  }
}

// No Expo Go, sempre usa o stub para evitar qualquer importação do módulo
// Isso evita que o Metro inclua o módulo no bundle
export const notificationService = new NotificationServiceStub();
