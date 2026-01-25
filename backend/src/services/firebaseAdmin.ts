import * as admin from 'firebase-admin';
import { MoodType } from '../models/Mood';

// Inicializa Firebase Admin SDK
// IMPORTANTE: Você precisa baixar o arquivo de credenciais do Firebase Console
// e colocá-lo em backend/firebase-service-account.json
// Ou configurar via variáveis de ambiente

let firebaseAdmin: admin.app.App | null = null;

export function initializeFirebaseAdmin(): void {
  if (firebaseAdmin) {
    return; // Já inicializado
  }

  try {
    // Tenta usar arquivo de credenciais
    const serviceAccount = require('../firebase-service-account.json');

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
    // Se não encontrar o arquivo, tenta usar variáveis de ambiente
    try {
      const {
        FIREBASE_PROJECT_ID,
        FIREBASE_PRIVATE_KEY,
        FIREBASE_CLIENT_EMAIL,
      } = process.env;

      if (FIREBASE_PROJECT_ID && FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL) {
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: FIREBASE_CLIENT_EMAIL,
          }),
        });

        console.log('Firebase Admin inicializado com variáveis de ambiente');
      } else {
        console.warn(
          'Firebase Admin não inicializado: arquivo de credenciais ou variáveis de ambiente não encontradas'
        );
      }
    } catch (envError) {
      console.error('Erro ao inicializar Firebase Admin:', envError);
    }
  }
}

export async function sendMoodChangeNotification(
  fcmToken: string,
  partnerName: string,
  moodType: MoodType,
  message?: string
): Promise<void> {
  if (!firebaseAdmin) {
    console.warn('Firebase Admin não inicializado');
    return;
  }

  const trimmedMessage = message?.trim();
  const bodyText = trimmedMessage
    ? `${partnerName}: ${trimmedMessage}`
    : `${partnerName} atualizou o humor`;

  const notification: admin.messaging.Message = {
    token: fcmToken,
    notification: {
      title: 'Mood Sharing',
      body: bodyText,
    },
    data: {
      type: 'mood_change',
      moodType: moodType,
      partnerName: partnerName,
      ...(trimmedMessage && { message: trimmedMessage }),
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'mood_sharing_channel',
        sound: 'default',
        priority: 'high',
        visibility: 'public', // Importante: permite mostrar na tela bloqueada
        defaultSound: true,
        defaultVibrateTimings: true,
        defaultLightSettings: true,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          contentAvailable: true,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(notification);
    console.log('Notificação enviada com sucesso:', response);
  } catch (error: any) {
    console.error('Erro ao enviar notificação:', error);
    // Se o token é inválido, você pode querer removê-lo do banco de dados
    if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
      console.warn('Token FCM inválido, considere removê-lo do banco de dados');
    }
  }
}

export async function sendProximityNotification(
  fcmToken: string,
  partnerName: string
): Promise<void> {
  if (!firebaseAdmin) {
    console.warn('Firebase Admin não inicializado');
    return;
  }

  const notification: admin.messaging.Message = {
    token: fcmToken,
    notification: {
      title: '🎉 Vocês estão próximos!',
      body: `${partnerName} está perto de você!`,
    },
    data: {
      type: 'proximity',
      partnerName: partnerName,
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'mood_sharing_channel',
        sound: 'default',
        priority: 'high',
        visibility: 'public',
        defaultSound: true,
        defaultVibrateTimings: true,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(notification);
    console.log('Notificação de proximidade enviada:', response);
  } catch (error: any) {
    console.error('Erro ao enviar notificação de proximidade:', error);
  }
}

export async function sendToMultipleTokens(
  tokens: string[],
  notification: admin.messaging.Notification,
  data?: Record<string, string>
): Promise<void> {
  if (!firebaseAdmin || tokens.length === 0) {
    return;
  }

  const message: admin.messaging.MulticastMessage = {
    notification,
    data,
    android: {
      priority: 'high',
      notification: {
        channelId: 'mood_sharing_channel',
        sound: 'default',
        priority: 'high',
        visibility: 'public',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Notificações enviadas: ${response.successCount}/${tokens.length}`);

    // Remove tokens inválidos
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(tokens[idx]);
        }
      });
      console.warn('Tokens inválidos encontrados:', invalidTokens);
    }
  } catch (error) {
    console.error('Erro ao enviar notificações múltiplas:', error);
  }
}
