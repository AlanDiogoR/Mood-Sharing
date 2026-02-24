import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { GoalList } from '../models/Goal';
import { AuthRequest } from '../middleware/auth';

const getUserId = (req: AuthRequest): string | undefined => req.user?.userId;

export const validateUpdateGoals = [
  body('items').isArray().withMessage('Items inválidos'),
  body('items.*.id').isString().withMessage('ID inválido'),
  body('items.*.title').isString().withMessage('Título inválido'),
  body('items.*.category').isString().withMessage('Categoria inválida'),
  body('items.*.completed').isBoolean().withMessage('Status inválido'),
];

export const getGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const list = await GoalList.findOne({ userId });
    res.json({ success: true, data: list?.items ?? [] });
  } catch (error: any) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar metas' });
  }
};

export const updateGoals = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { items } = req.body;
    const list = await GoalList.findOneAndUpdate(
      { userId },
      { $set: { items } },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: list.items });
  } catch (error: any) {
    console.error('Erro ao atualizar metas:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar metas' });
  }
};
