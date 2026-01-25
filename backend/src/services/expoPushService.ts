import { Expo } from 'expo-server-sdk';
import { MoodType } from '../models/Mood';

// Cria uma instância do cliente Expo
const expo = new Expo();

/**
 * Verifica se um token é um token Expo válido
 */
export function isExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token);
}

/**
 * Envia notificação de mudança de humor para o parceiro
 */
export async function sendMoodChangeNotification(
  expoPushToken: string,
  partnerName: string,
  moodType: MoodType,
  message?: string
): Promise<void> {
  if (!isExpoPushToken(expoPushToken)) {
    console.warn('Token não é um Expo Push Token válido:', expoPushToken);
    return;
  }

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

  const moodMessages: Record<MoodType, string> = {
    [MoodType.HAPPY]: 'está feliz hoje',
    [MoodType.SAD]: 'está triste hoje',
    [MoodType.ANXIOUS]: 'está ansioso hoje',
    [MoodType.CALM]: 'está calmo hoje',
    [MoodType.EXCITED]: 'está empolgado hoje',
    [MoodType.TIRED]: 'está cansado hoje',
    [MoodType.ANGRY]: 'está irritado hoje',
    [MoodType.LOVE]: 'está apaixonado hoje',
  };

  const emoji = moodEmojis[moodType] || '😊';
  const bodyText = message || `${partnerName} ${moodMessages[moodType]} ${emoji}`;

  const messages = [
    {
      to: expoPushToken,
      sound: 'default',
      title: 'Mood Sharing',
      body: bodyText,
      data: {
        type: 'mood_change',
        moodType: moodType,
        partnerName: partnerName,
        emoji: emoji,
        ...(message && { message: message }),
      },
      priority: 'high',
      channelId: 'mood_sharing_channel',
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Erro ao enviar chunk de notificações:', error);
      }
    }

    // Verifica se há erros nos tickets
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error('Erro no ticket de notificação:', ticket.message);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          console.warn('Token não registrado, considere removê-lo do banco de dados');
        }
      }
    }

    console.log('Notificação de mudança de humor enviada com sucesso');
  } catch (error) {
    console.error('Erro ao enviar notificação de mudança de humor:', error);
  }
}

/**
 * Envia notificação de proximidade para o parceiro
 */
export async function sendProximityNotification(
  expoPushToken: string,
  partnerName: string
): Promise<void> {
  if (!isExpoPushToken(expoPushToken)) {
    console.warn('Token não é um Expo Push Token válido:', expoPushToken);
    return;
  }

  const messages = [
    {
      to: expoPushToken,
      sound: 'default',
      title: '🎉 Vocês estão próximos!',
      body: `${partnerName} está perto de você!`,
      data: {
        type: 'proximity',
        partnerName: partnerName,
      },
      priority: 'high',
      channelId: 'mood_sharing_channel',
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Erro ao enviar chunk de notificações:', error);
      }
    }

    // Verifica se há erros nos tickets
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error('Erro no ticket de notificação:', ticket.message);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          console.warn('Token não registrado, considere removê-lo do banco de dados');
        }
      }
    }

    console.log('Notificação de proximidade enviada com sucesso');
  } catch (error) {
    console.error('Erro ao enviar notificação de proximidade:', error);
  }
}
