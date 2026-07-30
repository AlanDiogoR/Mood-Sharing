import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Mood, MoodType, ILocation } from '../models/Mood';
import { User } from '../models/User';
import { CoupleDaySummary } from '../models/CoupleDaySummary';
import { getMoodEmoji } from '../utils/moodEmojis';
import { calculateDistance, isWithinProximity } from '../utils/distance';
import { sendMoodChangeNotification as sendExpoMoodChangeNotification, sendProximityNotification as sendExpoProximityNotification, isExpoPushToken } from '../services/expoPushService';
import { sendMoodChangeNotification as sendFcmMoodChangeNotification, sendProximityNotification as sendFcmProximityNotification } from '../services/firebaseAdmin';
import { AuthRequest } from '../middleware/auth';

const PROXIMITY_THRESHOLD_KM = 1.0;
const MAX_MEETING_GAP_MINUTES = 30;

const isValidLocation = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ILocation).latitude === 'number' &&
  Number.isFinite((value as ILocation).latitude) &&
  (value as ILocation).latitude >= -90 &&
  (value as ILocation).latitude <= 90 &&
  typeof (value as ILocation).longitude === 'number' &&
  Number.isFinite((value as ILocation).longitude) &&
  (value as ILocation).longitude >= -180 &&
  (value as ILocation).longitude <= 180;

// Garante que só latitude/longitude cheguem ao banco (descarta chaves extras).
const sanitizeLocation = (value: unknown): ILocation | undefined => {
  if (!isValidLocation(value)) {
    return undefined;
  }
  const { latitude, longitude } = value as ILocation;
  return { latitude, longitude };
};

export const validateMoodPayload = [
  body('type')
    .isIn(Object.values(MoodType))
    .withMessage('Tipo de estado emocional inválido'),
  body('message')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Mensagem inválida')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mensagem deve ter no máximo 500 caracteres'),
  body('extraEmoji')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Emoji extra inválido')
    .isLength({ max: 16 })
    .withMessage('Emoji extra muito longo'),
  body('extraLabel')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Rótulo extra inválido')
    .trim()
    .isLength({ max: 60 })
    .withMessage('Rótulo extra deve ter no máximo 60 caracteres'),
  body('location')
    .optional({ values: 'null' })
    .custom(isValidLocation)
    .withMessage('Localização inválida'),
];

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

export const getCurrentMood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user?.userId;

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

export const getPartnerMood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.params.partnerId;
    const userId = req.user?.userId;

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

export const updateMood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        errors: errors.array(),
      });
      return;
    }

    const userId = req.user?.userId;
    const { type, message, location, extraEmoji, extraLabel } = req.body;

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
        location: sanitizeLocation(location),
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

export const updateMoodWithProximity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        errors: errors.array(),
      });
      return;
    }

    const userId = req.user?.userId;
    const { type, extraEmoji, extraLabel } = req.body;
    const location = sanitizeLocation(req.body.location);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
      return;
    }

    if (!location) {
      res.status(400).json({
        success: false,
        error: 'Localização não fornecida',
      });
      return;
    }

    const user = await User.findById(userId).select('partnerId name');
    const partnerMood = user?.partnerId
      ? await Mood.findOne({ userId: user.partnerId }).select('location')
      : null;
    const partnerLocation = partnerMood?.location;

    const nearby = partnerLocation
      ? isWithinProximity(location, partnerLocation, PROXIMITY_THRESHOLD_KM)
      : false;

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

    if (nearby && user?.partnerId) {
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

      try {
        const partner = await User.findById(user.partnerId).select('fcmToken');
        if (partner?.fcmToken) {
          if (isExpoPushToken(partner.fcmToken)) {
            await sendExpoProximityNotification(partner.fcmToken, user.name);
          } else {
            await sendFcmProximityNotification(partner.fcmToken, user.name);
          }
        }
      } catch (notificationError) {
        console.error('Erro ao enviar notificação de proximidade:', notificationError);
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

export const getMoodHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const currentUserId = req.user?.userId;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 100);

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
