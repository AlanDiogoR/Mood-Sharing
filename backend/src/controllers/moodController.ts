import { Request, Response } from 'express';
import { Mood, MoodType, ILocation } from '../models/Mood';
import { User } from '../models/User';
import { CoupleDaySummary } from '../models/CoupleDaySummary';
import { getMoodEmoji } from '../utils/moodEmojis';
import { calculateDistance, isWithinProximity } from '../utils/distance';
import { sendMoodChangeNotification as sendExpoMoodChangeNotification, sendProximityNotification as sendExpoProximityNotification, isExpoPushToken } from '../services/expoPushService';
import { sendMoodChangeNotification as sendFcmMoodChangeNotification, sendProximityNotification as sendFcmProximityNotification } from '../services/firebaseAdmin';

const PROXIMITY_THRESHOLD_KM = 1.0;
const MAX_MEETING_GAP_MINUTES = 30;

const getPairKey = (userId: string, partnerId: string): string => {
  const sorted = [userId, partnerId].sort();
  return `${sorted[0]}:${sorted[1]}`;
};

const getDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const recordCoupleMeeting = async (
  userId: string,
  partnerId: string,
  timestamp = new Date()
): Promise<void> => {
  const pairKey = getPairKey(userId, partnerId);
  const dateKey = getDateKey(timestamp);
  const summary = await CoupleDaySummary.findOne({ pairKey, dateKey });

  if (!summary) {
    await CoupleDaySummary.create({
      pairKey,
      dateKey,
      totalMinutesTogether: 0,
      activeMinutesTogether: 0,
      lastSeenAt: timestamp,
    });
    return;
  }

  if (summary.lastSeenAt) {
    const diffMinutes = Math.max(
      0,
      Math.round((timestamp.getTime() - summary.lastSeenAt.getTime()) / 60000)
    );
    if (diffMinutes > 0 && diffMinutes <= MAX_MEETING_GAP_MINUTES) {
      summary.totalMinutesTogether += diffMinutes;
    }
  }

  summary.lastSeenAt = timestamp;
  await summary.save();
};

export const getCurrentMood = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const currentUserId = (req as any).user?.userId;

    // Só pode ver o próprio mood ou do parceiro
    if (userId !== currentUserId) {
      const user = await User.findById(currentUserId);
      if (user?.partnerId?.toString() !== userId) {
        res.status(403).json({
          success: false,
          error: 'Acesso negado',
        });
        return;
      }
    }

    const mood = await Mood.findOne({ userId }).sort({ updatedAt: -1 });

    if (!mood) {
      res.status(404).json({
        success: false,
        error: 'Estado emocional não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: mood,
    });
  } catch (error: any) {
    console.error('Erro ao buscar estado atual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estado emocional',
    });
  }
};

export const getPartnerMood = async (req: Request, res: Response): Promise<void> => {
  try {
    const partnerId = req.params.partnerId;
    const userId = (req as any).user?.userId;

    // Verifica se é o parceiro
    const user = await User.findById(userId);
    if (user?.partnerId?.toString() !== partnerId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      });
      return;
    }

    const mood = await Mood.findOne({ userId: partnerId }).sort({ updatedAt: -1 });

    if (!mood) {
      res.status(404).json({
        success: false,
        error: 'Estado emocional do parceiro não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: mood,
    });
  } catch (error: any) {
    console.error('Erro ao buscar estado do parceiro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estado do parceiro',
    });
  }
};

export const updateMood = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { type, message, location, extraEmoji, extraLabel } = req.body;

    if (!type || !Object.values(MoodType).includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Tipo de estado emocional inválido',
      });
      return;
    }

    const emoji = getMoodEmoji(type as MoodType);

    // Cria ou atualiza o mood
    const mood = await Mood.findOneAndUpdate(
      { userId },
      {
        type,
        emoji,
        message,
        extraEmoji: extraEmoji ?? null,
        extraLabel: extraLabel ?? null,
        location,
      },
      {
        new: true,
        upsert: true,
      }
    );

    // Envia notificação para o parceiro se existir
    try {
      const user = await User.findById(userId);
      if (user?.partnerId) {
        const partner = await User.findById(user.partnerId);
        if (partner?.fcmToken) {
          // Verifica se é um token Expo ou FCM e usa o serviço apropriado
          if (isExpoPushToken(partner.fcmToken)) {
            await sendExpoMoodChangeNotification(
              partner.fcmToken,
              user.name,
              type as MoodType,
              message
            );
          } else {
            // Token FCM - usa Firebase Admin
            await sendFcmMoodChangeNotification(
              partner.fcmToken,
              user.name,
              type as MoodType,
              message
            );
          }
        }
      }
    } catch (notificationError) {
      // Não falha a requisição se a notificação falhar
      console.error('Erro ao enviar notificação:', notificationError);
    }

    res.json({
      success: true,
      data: mood,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar estado emocional',
    });
  }
};

export const updateMoodWithProximity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { type, location, partnerLocation, extraEmoji, extraLabel } = req.body;

    if (!type || !Object.values(MoodType).includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Tipo de estado emocional inválido',
      });
      return;
    }

    if (!location || !partnerLocation) {
      res.status(400).json({
        success: false,
        error: 'Localizações não fornecidas',
      });
      return;
    }

    // Verifica proximidade
    const nearby = isWithinProximity(location, partnerLocation, PROXIMITY_THRESHOLD_KM);

    // Se estiverem próximos, força ambos para "happy"
    const finalType = nearby ? MoodType.HAPPY : (type as MoodType);
    const emoji = getMoodEmoji(finalType);

    // Atualiza o mood do usuário atual
    const mood = await Mood.findOneAndUpdate(
      { userId },
      {
        type: finalType,
        emoji,
        extraEmoji: extraEmoji ?? null,
        extraLabel: extraLabel ?? null,
        location,
      },
      {
        new: true,
        upsert: true,
      }
    );

    // Se estiverem próximos, atualiza o parceiro também
    if (nearby) {
      const user = await User.findById(userId);
      if (user?.partnerId) {
        try {
          await recordCoupleMeeting(userId, user.partnerId.toString(), new Date());
        } catch (meetingError) {
          console.error('Erro ao registrar encontro do casal:', meetingError);
        }
        await Mood.findOneAndUpdate(
          { userId: user.partnerId },
          {
            type: MoodType.HAPPY,
            emoji: getMoodEmoji(MoodType.HAPPY),
            extraEmoji: null,
            extraLabel: null,
            location: partnerLocation,
          },
          {
            new: true,
            upsert: true,
          }
        );

        // Envia notificação de proximidade
        try {
          const partner = await User.findById(user.partnerId);
          if (partner?.fcmToken) {
            // Verifica se é um token Expo ou FCM e usa o serviço apropriado
            if (isExpoPushToken(partner.fcmToken)) {
              await sendExpoProximityNotification(partner.fcmToken, user.name);
            } else {
              // Token FCM - usa Firebase Admin
              await sendFcmProximityNotification(partner.fcmToken, user.name);
            }
          }
        } catch (notificationError) {
          console.error('Erro ao enviar notificação de proximidade:', notificationError);
        }
      }
    }

    res.json({
      success: true,
      data: mood,
      nearby,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar estado com proximidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar estado emocional',
    });
  }
};

export const getMoodHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const currentUserId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    // Só pode ver o próprio histórico ou do parceiro
    if (userId !== currentUserId) {
      const user = await User.findById(currentUserId);
      if (user?.partnerId?.toString() !== userId) {
        res.status(403).json({
          success: false,
          error: 'Acesso negado',
        });
        return;
      }
    }

    const moods = await Mood.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: moods,
    });
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico',
    });
  }
};
