import { Request, Response } from 'express';
import { Mood, MoodType, ILocation } from '../models/Mood';
import { User } from '../models/User';
import { getMoodEmoji } from '../utils/moodEmojis';
import { calculateDistance, isWithinProximity } from '../utils/distance';
import { sendMoodChangeNotification as sendExpoMoodChangeNotification, sendProximityNotification as sendExpoProximityNotification, isExpoPushToken } from '../services/expoPushService';
import { sendMoodChangeNotification as sendFcmMoodChangeNotification, sendProximityNotification as sendFcmProximityNotification } from '../services/firebaseAdmin';

const PROXIMITY_THRESHOLD_KM = 1.0;

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
    const { type, message, location } = req.body;

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
    const { type, location, partnerLocation } = req.body;

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
        await Mood.findOneAndUpdate(
          { userId: user.partnerId },
          {
            type: MoodType.HAPPY,
            emoji: getMoodEmoji(MoodType.HAPPY),
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
