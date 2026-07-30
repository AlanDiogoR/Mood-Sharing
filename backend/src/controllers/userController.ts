import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getStore } from '@netlify/blobs';
import { User } from '../models/User';
import { isServerless, uploadDir } from '../config/uploads';
import { AuthRequest } from '../middleware/auth';
import { detectImageType } from '../middleware/upload';

const deleteFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
};

const getUserPhotoStore = () => {
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

const getSharedPhotoStore = () => {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (siteID && token) {
    return getStore({
      name: 'shared-photos',
      siteID,
      token,
    });
  }

  return getStore('shared-photos');
};

const normalizeHex = (value?: string | null): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

export const validateUpdateProfile = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Nome inválido'),
  body('partnerName').optional().isString().withMessage('Nome do parceiro inválido'),
  body('themePrimary')
    .optional({ nullable: true })
    .custom(value => value === null || /^#?[0-9a-fA-F]{6}$/.test(String(value)))
    .withMessage('Cor primária inválida'),
  body('themeSecondary')
    .optional({ nullable: true })
    .custom(value => value === null || /^#?[0-9a-fA-F]{6}$/.test(String(value)))
    .withMessage('Cor secundária inválida'),
];

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const { name, partnerName, themePrimary, themeSecondary } = req.body;
    const updates: Record<string, any> = {};

    if (typeof name === 'string') {
      updates.name = name.trim();
    }
    if (partnerName !== undefined) {
      updates.partnerName = typeof partnerName === 'string' ? partnerName.trim() || null : null;
    }
    if (themePrimary !== undefined) {
      updates.themePrimary = normalizeHex(themePrimary);
    }
    if (themeSecondary !== undefined) {
      updates.themeSecondary = normalizeHex(themeSecondary);
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select(
      '-password'
    );
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar perfil' });
  }
};

export const uploadUserPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  let writtenPath: string | null = null;

  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    if (!req.file?.buffer) {
      res.status(400).json({ success: false, error: 'Arquivo não enviado' });
      return;
    }

    // Valida o conteúdo real do arquivo (magic bytes), não o MIME declarado.
    const detected = detectImageType(req.file.buffer);
    if (!detected) {
      res.status(400).json({
        success: false,
        error: 'Arquivo não é uma imagem válida. Use JPEG, PNG ou WEBP.',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    const previousFilename = user.photoFilename;
    const filename = `${crypto.randomUUID()}${detected.extension}`;
    let photoUrl: string;

    if (isServerless) {
      photoUrl = `/api/uploads/${filename}`;
      const store = getUserPhotoStore();

      const arrayBuffer = req.file.buffer.buffer.slice(
        req.file.buffer.byteOffset,
        req.file.buffer.byteOffset + req.file.buffer.byteLength
      );
      await store.set(filename, arrayBuffer as unknown as any, {
        metadata: {
          contentType: detected.mime,
        },
      });
    } else {
      photoUrl = `/uploads/${filename}`;
      writtenPath = path.resolve(uploadDir, filename);
      await fs.promises.writeFile(writtenPath, req.file.buffer);
    }

    user.photoFilename = filename;
    user.photoUrl = photoUrl;
    user.photoUploadedAt = new Date();
    await user.save();

    if (previousFilename) {
      if (isServerless) {
        await getUserPhotoStore().delete(previousFilename);
      } else {
        await deleteFileIfExists(path.resolve(uploadDir, path.basename(previousFilename)));
      }
    }

    res.json({
      success: true,
      data: {
        photoUrl: user.photoUrl,
        photoUploadedAt: user.photoUploadedAt,
      },
    });
  } catch (error: any) {
    console.error('Erro ao enviar foto:', error);
    if (writtenPath) {
      try {
        await deleteFileIfExists(writtenPath);
      } catch (cleanupError) {
        console.error('Erro ao limpar upload após falha:', cleanupError);
      }
    }
    const message =
      error?.message?.includes('Netlify Blobs') ? error.message : 'Erro ao enviar foto';
    res.status(500).json({ success: false, error: message });
  }
};

export const getUserPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
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

export const getUserPublic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    const targetUserId = req.params.id;

    if (!currentUserId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    if (!targetUserId) {
      res.status(400).json({ success: false, error: 'Usuário inválido' });
      return;
    }

    if (currentUserId !== targetUserId) {
      const currentUser = await User.findById(currentUserId).select('partnerId');
      if (!currentUser?.partnerId || currentUser.partnerId.toString() !== targetUserId) {
        res.status(403).json({ success: false, error: 'Acesso negado' });
        return;
      }
    }

    const user = await User.findById(targetUserId).select('name photoUrl photoUploadedAt');
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar usuário' });
  }
};

export const getPublicUserPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params.key;
    if (!key || /[\/\\]|\.\./.test(key)) {
      res.status(400).json({ success: false, error: 'Chave inválida' });
      return;
    }

    // Headers defensivos: impedem que o navegador "adivinhe" outro tipo de
    // conteúdo ou execute o arquivo como página.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');

    if (!isServerless) {
      const filePath = path.join(uploadDir, path.basename(key));
      if (!filePath.startsWith(path.resolve(uploadDir))) {
        res.status(400).json({ success: false, error: 'Chave inválida' });
        return;
      }
      res.sendFile(filePath, { headers: { 'Cache-Control': 'public, max-age=86400' } }, err => {
        if (err) {
          res.status(404).json({ success: false, error: 'Foto não encontrada' });
        }
      });
      return;
    }

    // A foto pode estar no store de fotos de perfil ou no de fotos compartilhadas.
    let result = await getUserPhotoStore().getWithMetadata(key, { type: 'arrayBuffer' });
    if (!result || !result.data) {
      result = await getSharedPhotoStore().getWithMetadata(key, { type: 'arrayBuffer' });
    }

    if (!result || !result.data) {
      res.status(404).json({ success: false, error: 'Foto não encontrada' });
      return;
    }

    const metadata = result.metadata as { contentType?: string } | undefined;
    const allowedContentTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const contentType =
      metadata?.contentType && allowedContentTypes.includes(metadata.contentType)
        ? metadata.contentType
        : 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    // Fotos são substituíveis/apagáveis; cache curto evita cópias eternas em CDNs.
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(result.data));
  } catch (error: any) {
    console.error('Erro ao buscar foto pública:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar foto' });
  }
};
