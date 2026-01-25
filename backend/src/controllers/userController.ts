import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { User } from '../models/User';

const deleteFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
};

export const uploadUserPhoto = async (req: Request, res: Response): Promise<void> => {
  const uploadedFilename = req.file?.filename;
  const uploadedPath = uploadedFilename
    ? path.resolve(process.cwd(), 'uploads', uploadedFilename)
    : null;

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

    const user = await User.findById(userId);
    if (!user) {
      if (uploadedPath) {
        await deleteFileIfExists(uploadedPath);
      }
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    const previousFilename = user.photoFilename;
    const filename = req.file.filename;
    const photoUrl = `/uploads/${filename}`;

    user.photoFilename = filename;
    user.photoUrl = photoUrl;
    user.photoUploadedAt = new Date();
    await user.save();

    if (previousFilename) {
      const previousPath = path.resolve(process.cwd(), 'uploads', previousFilename);
      await deleteFileIfExists(previousPath);
    }

    res.json({
      success: true,
      data: {
        photoUrl,
        photoUploadedAt: user.photoUploadedAt,
      },
    });
  } catch (error: any) {
    console.error('Erro ao enviar foto:', error);
    if (uploadedPath) {
      try {
        await deleteFileIfExists(uploadedPath);
      } catch (cleanupError) {
        console.error('Erro ao limpar upload após falha:', cleanupError);
      }
    }
    res.status(500).json({ success: false, error: 'Erro ao enviar foto' });
  }
};

export const getUserPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const user = await User.findById(userId).select('photoUrl photoUploadedAt');
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    if (!user.photoUrl) {
      res.status(404).json({ success: false, error: 'Foto não encontrada' });
      return;
    }

    res.json({
      success: true,
      data: {
        photoUrl: user.photoUrl,
        photoUploadedAt: user.photoUploadedAt,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar foto:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar foto' });
  }
};
