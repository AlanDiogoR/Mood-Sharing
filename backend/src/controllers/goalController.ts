import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { GoalList } from '../models/Goal';
import { AuthRequest } from '../middleware/auth';

const getUserId = (req: AuthRequest): string | undefined => req.user?.userId;

export const validateUpdateGoals = [
  body('items').isArray({ max: 200 }).withMessage('Items deve ser um array com no máximo 200 itens'),
  body('items.*.id').isString().isLength({ min: 1, max: 64 }).withMessage('ID inválido'),
  body('items.*.title')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título deve ter entre 1 e 200 caracteres'),
  body('items.*.category')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Categoria deve ter entre 1 e 100 caracteres'),
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
