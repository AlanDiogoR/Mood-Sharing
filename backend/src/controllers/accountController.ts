import { Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { getStore } from '@netlify/blobs';
import { User } from '../models/User';
import { Mood } from '../models/Mood';
import { MediaItem } from '../models/MediaItem';
import { SharedNote } from '../models/SharedNote';
import { SharedPhoto } from '../models/SharedPhoto';
import { WorkoutSummary } from '../models/WorkoutSummary';
import { GoalList } from '../models/Goal';
import { CoupleDaySummary } from '../models/CoupleDaySummary';
import { RefreshToken } from '../models/RefreshToken';
import { isServerless, uploadDir } from '../config/uploads';
import { AuthRequest } from '../middleware/auth';

const getPairKey = (userId: string, partnerId: string): string => {
  const sorted = [userId, partnerId].sort();
  return `${sorted[0]}:${sorted[1]}`;
};

const getUserPhotoStore = () => {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;
  if (siteID && token) {
    return getStore({ name: 'user-photos', siteID, token });
  }
  return getStore('user-photos');
};

const deletePhotoFile = async (filename?: string | null): Promise<void> => {
  if (!filename) {
    return;
  }
  try {
    if (isServerless) {
      await getUserPhotoStore().delete(filename);
    } else {
      await fs.promises.unlink(path.resolve(uploadDir, path.basename(filename)));
    }
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error('Erro ao remover arquivo de foto:', error?.message || error);
    }
  }
};

/**
 * Exporta todos os dados pessoais do usuário em JSON (direito de portabilidade
 * — LGPD art. 18 / GDPR art. 20). Inclui dados próprios e do espaço do casal.
 */
export const exportMyData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    const pairKey = user.partnerId ? getPairKey(userId, user.partnerId.toString()) : userId;

    const [moods, media, notes, photos, workouts, goals, coupleDays] = await Promise.all([
      Mood.find({ userId }).lean(),
      MediaItem.find({ $or: [{ userId }, { pairKey }] }).lean(),
      SharedNote.find({ $or: [{ authorId: userId }, { pairKey }] }).lean(),
      SharedPhoto.find({ $or: [{ senderId: userId }, { receiverId: userId }, { pairKey }] })
        .select('-photoFilename')
        .lean(),
      WorkoutSummary.find({ userId }).lean(),
      GoalList.find({ userId }).lean(),
      CoupleDaySummary.find({ pairKey }).lean(),
    ]);

    res.setHeader('Content-Disposition', 'attachment; filename="mood-sharing-export.json"');
    res.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        profile: user.toJSON(),
        moods,
        media,
        notes,
        photos,
        workouts,
        goals,
        meetings: coupleDays,
      },
    });
  } catch (error: any) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({ success: false, error: 'Erro ao exportar dados' });
  }
};

/**
 * Exclui permanentemente a conta e todos os dados associados (direito de
 * eliminação — LGPD art. 18 / GDPR art. 17). Exige a senha para confirmar.
 *
 * Decisão de produto: como notas, mídias e fotos vivem no "espaço do casal"
 * (pairKey), elas são removidas junto, e o parceiro é desvinculado.
 */
export const deleteMyAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const { password } = req.body ?? {};
    if (!password) {
      res.status(400).json({ success: false, error: 'Senha é obrigatória para excluir a conta' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Senha incorreta' });
      return;
    }

    const partnerId = user.partnerId?.toString();
    const pairKey = partnerId ? getPairKey(userId, partnerId) : userId;

    const sharedPhotos = await SharedPhoto.find({ pairKey }).select('photoFilename').lean();

    await session.withTransaction(async () => {
      await Promise.all([
        Mood.deleteMany({ userId }, { session }),
        MediaItem.deleteMany({ $or: [{ userId }, { pairKey }] }, { session }),
        SharedNote.deleteMany({ $or: [{ authorId: userId }, { pairKey }] }, { session }),
        SharedPhoto.deleteMany({ pairKey }, { session }),
        WorkoutSummary.deleteMany({ userId }, { session }),
        GoalList.deleteMany({ userId }, { session }),
        CoupleDaySummary.deleteMany({ pairKey }, { session }),
        RefreshToken.deleteMany({ userId }, { session }),
      ]);

      if (partnerId) {
        await User.updateOne({ _id: partnerId }, { $set: { partnerId: null } }, { session });
      }

      await User.deleteOne({ _id: userId }, { session });
    });

    // Limpeza de arquivos (fora da transação; falhas não revertem a exclusão).
    await deletePhotoFile(user.photoFilename);
    await Promise.all(sharedPhotos.map(photo => deletePhotoFile(photo.photoFilename)));

    res.json({ success: true, message: 'Conta e dados excluídos permanentemente' });
  } catch (error: any) {
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ success: false, error: 'Erro ao excluir conta' });
  } finally {
    await session.endSession();
  }
};
