import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { MediaItem } from '../models/MediaItem';
import { SortOrder } from 'mongoose';
import { User } from '../models/User';

const getUserId = (req: Request): string | undefined => (req as any).user?.userId;

const getPairKey = (userId: string, partnerId: string): string => {
  const sorted = [userId, partnerId].sort();
  return `${sorted[0]}:${sorted[1]}`;
};

const getUserPairKey = async (userId: string): Promise<string> => {
  const user = await User.findById(userId).select('partnerId');
  if (!user?.partnerId) {
    return userId;
  }
  return getPairKey(userId, user.partnerId.toString());
};

const ensurePairKey = async (userId: string, pairKey: string): Promise<void> => {
  await MediaItem.updateMany(
    { userId, $or: [{ pairKey: { $exists: false } }, { pairKey: null }] },
    { $set: { pairKey } }
  );
};

export const validateCreateMedia = [
  body('title').trim().isLength({ min: 1 }).withMessage('Título é obrigatório'),
  body('type').isIn(['movie', 'series']).withMessage('Tipo inválido'),
  body('notes').optional().isString().withMessage('Notas inválidas'),
];

export const validateUpdateMedia = [
  param('id').isMongoId().withMessage('ID inválido'),
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Título inválido'),
  body('type').optional().isIn(['movie', 'series']).withMessage('Tipo inválido'),
  body('notes').optional().isString().withMessage('Notas inválidas'),
  body('rating')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 5 })
    .withMessage('Avaliação inválida'),
  body('review').optional({ nullable: true }).isString().withMessage('Comentário inválido'),
  body('completed').optional().isBoolean().withMessage('Status inválido'),
];

export const validateGetOrDeleteMedia = [param('id').isMongoId().withMessage('ID inválido')];

export const validateReorderMedia = [
  body('orderedIds')
    .isArray({ min: 1 })
    .withMessage('orderedIds deve ser um array não vazio'),
  body('orderedIds.*').isMongoId().withMessage('IDs inválidos'),
];

export const createMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
      return;
    }

    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const { title, type, notes } = req.body;
    const pairKey = await getUserPairKey(userId);
    await ensurePairKey(userId, pairKey);
    const hasManualOrder = await MediaItem.exists({ pairKey, orderIndex: { $ne: null } });

    let orderIndex: number | null = null;
    if (hasManualOrder) {
      const last = await MediaItem.findOne({ pairKey, orderIndex: { $ne: null } })
        .sort({ orderIndex: -1 })
        .select('orderIndex');
      orderIndex = (last?.orderIndex ?? -1) + 1;
    }

    const item = await MediaItem.create({
      userId,
      pairKey,
      title,
      type,
      notes,
      orderIndex,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Erro ao criar mídia:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar item' });
  }
};

export const listMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const pairKey = await getUserPairKey(userId);
    await ensurePairKey(userId, pairKey);
    const hasManualOrder = await MediaItem.exists({ pairKey, orderIndex: { $ne: null } });
    let query = MediaItem.find({ pairKey });
    if (hasManualOrder) {
      query = query.sort([['orderIndex', 1 as SortOrder], ['createdAt', 1 as SortOrder]]);
    } else {
      query = query.sort([['createdAt', 1 as SortOrder]]);
    }

    const items = await query;
    res.json({ success: true, data: items, meta: { manualOrder: !!hasManualOrder } });
  } catch (error: any) {
    console.error('Erro ao listar mídia:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar itens' });
  }
};

export const getMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
      return;
    }

    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const pairKey = await getUserPairKey(userId);
    await ensurePairKey(userId, pairKey);
    const item = await MediaItem.findOne({ _id: req.params.id, pairKey });
    if (!item) {
      res.status(404).json({ success: false, error: 'Item não encontrado' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Erro ao buscar mídia:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar item' });
  }
};

export const updateMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
      return;
    }

    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const pairKey = await getUserPairKey(userId);
    await ensurePairKey(userId, pairKey);
    const item = await MediaItem.findOneAndUpdate(
      { _id: req.params.id, pairKey },
      { $set: req.body },
      { new: true }
    );

    if (!item) {
      res.status(404).json({ success: false, error: 'Item não encontrado' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Erro ao atualizar mídia:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar item' });
  }
};

export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
      return;
    }

    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const pairKey = await getUserPairKey(userId);
    await ensurePairKey(userId, pairKey);
    const item = await MediaItem.findOneAndDelete({ _id: req.params.id, pairKey });
    if (!item) {
      res.status(404).json({ success: false, error: 'Item não encontrado' });
      return;
    }

    res.json({ success: true, message: 'Item removido' });
  } catch (error: any) {
    console.error('Erro ao remover mídia:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover item' });
  }
};

export const reorderMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
      return;
    }

    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const orderedIds: string[] = req.body.orderedIds;
    const pairKey = await getUserPairKey(userId);
    await ensurePairKey(userId, pairKey);

    const objectIds = orderedIds.map((id) => new mongoose.Types.ObjectId(id));
    const items = await MediaItem.find({ _id: { $in: objectIds }, pairKey }).select('_id');
    if (items.length !== orderedIds.length) {
      res.status(400).json({ success: false, error: 'Lista inválida de itens' });
      return;
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id), pairKey },
        update: { $set: { orderIndex: index } },
      },
    }));

    await MediaItem.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Ordem atualizada' });
  } catch (error: any) {
    console.error('Erro ao reordenar mídia:', error);
    res.status(500).json({ success: false, error: 'Erro ao reordenar itens' });
  }
};
