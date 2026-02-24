import { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { getStore } from '@netlify/blobs';
import { SharedPhoto } from '../models/SharedPhoto';
import { User } from '../models/User';
import { isServerless, uploadDir } from '../config/uploads';
import { sendMoodChangeNotification as sendExpoNotification, isExpoPushToken } from '../services/expoPushService';
import { sendToMultipleTokens as sendFcmMulti } from '../services/firebaseAdmin';

const getSharedPhotoStore = () => {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (isServerless && (!siteID || !token)) {
    throw new Error(
      'Netlify Blobs não configurado. Defina NETLIFY_BLOBS_SITE_ID e NETLIFY_BLOBS_TOKEN.'
    );
  }

  if (siteID && token) {
    return getStore({
      name: 'user-photos',
      siteID,
      token,
    });
  }

  return getStore('user-photos');
};

const getExtensionFromMime = (mimeType?: string): string => {
  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/jpeg':
    default:
      return '.jpg';
  }
};

const getPairKey = (userId: string, partnerId: string): string => {
  const sorted = [userId, partnerId].sort();
  return `${sorted[0]}:${sorted[1]}`;
};

export const uploadSharedPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'Arquivo não enviado' });
      return;
    }

    const user = await User.findById(userId).select('partnerId');
    if (!user?.partnerId) {
      res.status(400).json({ success: false, error: 'Parceiro não vinculado' });
      return;
    }

    const partnerId = user.partnerId.toString();
    const pairKey = getPairKey(userId, partnerId);

    let filename = '';
    let photoUrl = '';

    if (isServerless) {
      if (!req.file?.buffer) {
        res.status(400).json({ success: false, error: 'Arquivo inválido' });
        return;
      }

      const extension = getExtensionFromMime(req.file.mimetype);
      filename = `${crypto.randomUUID()}${extension}`;
      photoUrl = `/api/uploads/${filename}`;
      const store = getSharedPhotoStore();

      const arrayBuffer = req.file.buffer.buffer.slice(
        req.file.buffer.byteOffset,
        req.file.buffer.byteOffset + req.file.buffer.byteLength
      );
      await store.set(filename, arrayBuffer as unknown as any, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });
    } else {
      filename = req.file.filename;
      photoUrl = `/uploads/${filename}`;
      const filePath = path.resolve(uploadDir, filename);
      if (!filePath) {
        res.status(500).json({ success: false, error: 'Falha ao salvar imagem' });
        return;
      }
    }

    const sharedPhoto = await SharedPhoto.create({
      pairKey,
      senderId: userId,
      receiverId: partnerId,
      photoUrl,
      photoFilename: filename,
    });

    // Notify the partner about the new photo
    try {
      const sender = await User.findById(userId).select('name');
      const partner = await User.findById(partnerId).select('fcmToken');
      const senderName = sender?.name || 'Seu parceiro';

      if (partner?.fcmToken) {
        if (isExpoPushToken(partner.fcmToken)) {
          const { Expo, ExpoPushMessage } = require('expo-server-sdk');
          const expo = new Expo();
          const messages: typeof ExpoPushMessage[] = [{
            to: partner.fcmToken,
            sound: 'default',
            title: '📸 Nova foto recebida!',
            body: `${senderName} enviou uma foto para você`,
            data: { type: 'new_photo', senderId: userId },
            priority: 'high',
            channelId: 'mood_sharing_channel',
          }];
          const chunks = expo.chunkPushNotifications(messages);
          for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
          }
        } else {
          await sendFcmMulti(
            [partner.fcmToken],
            { title: '📸 Nova foto recebida!', body: `${senderName} enviou uma foto para você` },
            { type: 'new_photo', senderId: userId }
          );
        }
      }
    } catch (notifError) {
      console.error('Erro ao notificar parceiro sobre foto:', notifError);
    }

    res.json({
      success: true,
      data: sharedPhoto,
    });
  } catch (error: any) {
    console.error('Erro ao enviar foto para parceiro:', error);
    const message =
      error?.message?.includes('Netlify Blobs') ? error.message : 'Erro ao enviar foto';
    res.status(500).json({ success: false, error: message });
  }
};

export const getLatestPartnerPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const user = await User.findById(userId).select('partnerId');
    if (!user?.partnerId) {
      res.json({ success: true, data: null });
      return;
    }

    const pairKey = getPairKey(userId, user.partnerId.toString());
    const sharedPhoto = await SharedPhoto.findOne({
      pairKey,
      receiverId: userId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sharedPhoto || null,
    });
  } catch (error: any) {
    console.error('Erro ao buscar foto do parceiro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar foto do parceiro' });
  }
};

export const getPartnerPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const user = await User.findById(userId).select('partnerId');
    if (!user?.partnerId) {
      res.json({ success: true, data: [] });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const skip = (page - 1) * limit;

    const pairKey = getPairKey(userId, user.partnerId.toString());

    const [photos, total] = await Promise.all([
      SharedPhoto.find({ pairKey, receiverId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SharedPhoto.countDocuments({ pairKey, receiverId: userId }),
    ]);

    res.json({
      success: true,
      data: photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + photos.length < total,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar galeria de fotos do parceiro:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar fotos do parceiro' });
  }
};
