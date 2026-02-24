import { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { WorkoutSummary } from '../models/WorkoutSummary';
import { CoupleDaySummary } from '../models/CoupleDaySummary';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const ACTIVE_WINDOW_MINUTES = 90;

const getUserId = (req: AuthRequest): string | undefined => req.user?.userId;

const getDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date = new Date()): Date => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
};

const getPairKey = (userId: string, partnerId: string): string => {
  const sorted = [userId, partnerId].sort();
  return `${sorted[0]}:${sorted[1]}`;
};

export const validateSaveWorkout = [
  body('dateKey').isString().withMessage('Data inválida'),
  body('durationMinutes').isNumeric().withMessage('Duração inválida'),
  body('calories').isNumeric().withMessage('Calorias inválidas'),
  body('completedAt').isNumeric().withMessage('Data de conclusão inválida'),
];

export const saveWorkoutSummary = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { dateKey, durationMinutes, calories, completedAt } = req.body;
    const summary = await WorkoutSummary.findOneAndUpdate(
      { userId, dateKey },
      {
        $set: {
          durationMinutes,
          calories,
          completedAt: new Date(completedAt),
        },
      },
      { new: true, upsert: true }
    );

    const user = await User.findById(userId).select('partnerId');
    if (user?.partnerId) {
      const pairKey = getPairKey(userId, user.partnerId.toString());
      const daySummary = await CoupleDaySummary.findOne({ pairKey, dateKey });
      if (daySummary?.lastSeenAt) {
        const completedDate = new Date(completedAt);
        const diffMinutes = Math.abs(
          (completedDate.getTime() - daySummary.lastSeenAt.getTime()) / 60000
        );
        if (diffMinutes <= ACTIVE_WINDOW_MINUTES) {
          daySummary.activeMinutesTogether += durationMinutes;
          await daySummary.save();
        }
      }
    }

    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Erro ao salvar treino:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar treino' });
  }
};

export const validateWeeklySummary = [
  query('start').optional().isISO8601().withMessage('Data inicial inválida'),
];

export const getWeeklySummary = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const startParam = req.query.start as string | undefined;
    const startDate = startParam ? new Date(startParam) : getWeekStart();
    if (Number.isNaN(startDate.getTime())) {
      res.status(400).json({ success: false, error: 'Data inicial inválida' });
      return;
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const startKey = getDateKey(startDate);
    const endKey = getDateKey(endDate);

    const summaries = await WorkoutSummary.find({
      userId,
      dateKey: { $gte: startKey, $lte: endKey },
    }).sort({ dateKey: 1 });

    const totals = summaries.reduce(
      (acc, item) => {
        acc.totalMinutes += item.durationMinutes;
        acc.totalCalories += item.calories;
        return acc;
      },
      { totalMinutes: 0, totalCalories: 0 }
    );

    res.json({
      success: true,
      data: {
        startKey,
        endKey,
        entries: summaries,
        totals: {
          totalMinutes: totals.totalMinutes,
          totalCalories: totals.totalCalories,
          totalDays: summaries.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao carregar resumo semanal:', error);
    res.status(500).json({ success: false, error: 'Erro ao carregar resumo semanal' });
  }
};
