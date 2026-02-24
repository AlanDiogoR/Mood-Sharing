import { Response } from 'express';
import { validationResult } from 'express-validator';
import { SharedNote } from '../models/SharedNote';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const getPairKey = (userId: string, partnerId: string): string => {
  const sorted = [userId, partnerId].sort();
  return `${sorted[0]}:${sorted[1]}`;
};

const getUserPairKey = async (userId: string): Promise<string | null> => {
  const user = await User.findById(userId).select('partnerId');
  if (!user?.partnerId) {
    return null;
  }
  return getPairKey(userId, user.partnerId.toString());
};

export const listNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const pairKey = await getUserPairKey(userId);
    if (!pairKey) {
      res.status(400).json({ success: false, error: 'Parceiro não vinculado' });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      SharedNote.find({ pairKey }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      SharedNote.countDocuments({ pairKey }),
    ]);

    res.json({
      success: true,
      data: notes,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Erro ao listar notas:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar notas' });
  }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const pairKey = await getUserPairKey(userId);
    if (!pairKey) {
      res.status(400).json({ success: false, error: 'Parceiro não vinculado' });
      return;
    }

    const content = req.body.content?.trim();
    const note = await SharedNote.create({
      pairKey,
      authorId: userId,
      content,
    });

    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    console.error('Erro ao criar nota:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar nota' });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const pairKey = await getUserPairKey(userId);
    if (!pairKey) {
      res.status(400).json({ success: false, error: 'Parceiro não vinculado' });
      return;
    }

    const noteId = req.params.id;
    const content = req.body.content?.trim();
    const note = await SharedNote.findOneAndUpdate(
      { _id: noteId, pairKey },
      { $set: { content } },
      { new: true }
    );

    if (!note) {
      res.status(404).json({ success: false, error: 'Nota não encontrada' });
      return;
    }

    res.json({ success: true, data: note });
  } catch (error: any) {
    console.error('Erro ao atualizar nota:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar nota' });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const pairKey = await getUserPairKey(userId);
    if (!pairKey) {
      res.status(400).json({ success: false, error: 'Parceiro não vinculado' });
      return;
    }

    const noteId = req.params.id;
    const note = await SharedNote.findOneAndDelete({ _id: noteId, pairKey });
    if (!note) {
      res.status(404).json({ success: false, error: 'Nota não encontrada' });
      return;
    }

    res.json({ success: true, message: 'Nota removida' });
  } catch (error: any) {
    console.error('Erro ao remover nota:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover nota' });
  }
};
