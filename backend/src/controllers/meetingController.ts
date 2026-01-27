import { Request, Response } from 'express';
import { validationResult, query } from 'express-validator';
import { CoupleDaySummary } from '../models/CoupleDaySummary';
import { User } from '../models/User';

const MAX_GAP_MINUTES = 30;

const getPairKey = (userId: string, partnerId: string): string => {
  const sorted = [userId, partnerId].sort();
  return `${sorted[0]}:${sorted[1]}`;
};

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

export const validateWeeklyMeetings = [
  query('start').optional().isISO8601().withMessage('Data inicial inválida'),
];

export const recordProximity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const user = await User.findById(userId).select('partnerId');
    if (!user?.partnerId) {
      res.status(400).json({ success: false, error: 'Parceiro não vinculado' });
      return;
    }

    const timestamp = req.body?.timestamp ? new Date(req.body.timestamp) : new Date();
    if (Number.isNaN(timestamp.getTime())) {
      res.status(400).json({ success: false, error: 'Data inválida' });
      return;
    }

    const partnerId = user.partnerId.toString();
    const pairKey = getPairKey(userId, partnerId);
    const dateKey = getDateKey(timestamp);

    const summary = await CoupleDaySummary.findOne({ pairKey, dateKey });

    if (!summary) {
      const created = await CoupleDaySummary.create({
        pairKey,
        dateKey,
        totalMinutesTogether: 0,
        activeMinutesTogether: 0,
        lastSeenAt: timestamp,
      });
      res.json({ success: true, data: created });
      return;
    }

    if (summary.lastSeenAt) {
      const diffMinutes = Math.max(
        0,
        Math.round((timestamp.getTime() - summary.lastSeenAt.getTime()) / 60000)
      );
      if (diffMinutes > 0 && diffMinutes <= MAX_GAP_MINUTES) {
        summary.totalMinutesTogether += diffMinutes;
      }
    }

    summary.lastSeenAt = timestamp;
    await summary.save();

    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Erro ao registrar proximidade:', error);
    res.status(500).json({ success: false, error: 'Erro ao registrar proximidade' });
  }
};

export const getWeeklyMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
      return;
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const user = await User.findById(userId).select('partnerId');
    if (!user?.partnerId) {
      res.json({ success: true, data: { entries: [], totals: { totalMinutesTogether: 0, activeMinutesTogether: 0, totalDays: 0 }, startKey: '', endKey: '' } });
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

    const pairKey = getPairKey(userId, user.partnerId.toString());
    const summaries = await CoupleDaySummary.find({
      pairKey,
      dateKey: { $gte: startKey, $lte: endKey },
    }).sort({ dateKey: 1 });

    const totals = summaries.reduce(
      (acc, item) => {
        acc.totalMinutesTogether += item.totalMinutesTogether || 0;
        acc.activeMinutesTogether += item.activeMinutesTogether || 0;
        return acc;
      },
      { totalMinutesTogether: 0, activeMinutesTogether: 0 }
    );

    res.json({
      success: true,
      data: {
        startKey,
        endKey,
        entries: summaries,
        totals: {
          totalMinutesTogether: totals.totalMinutesTogether,
          activeMinutesTogether: totals.activeMinutesTogether,
          totalDays: summaries.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao carregar encontros semanais:', error);
    res.status(500).json({ success: false, error: 'Erro ao carregar encontros' });
  }
};
