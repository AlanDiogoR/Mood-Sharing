import { Response } from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { User, IUser } from '../models/User';
import { PartnerInvite } from '../models/PartnerInvite';
import { AuthRequest } from '../middleware/auth';
import {
  sendGenericNotification as sendExpoNotification,
  isExpoPushToken,
} from '../services/expoPushService';
import { sendToMultipleTokens as sendFcmMulti } from '../services/firebaseAdmin';

const notifyUser = async (
  fcmToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  if (!fcmToken) {
    return;
  }
  try {
    if (isExpoPushToken(fcmToken)) {
      await sendExpoNotification(fcmToken, title, body, data);
    } else {
      await sendFcmMulti([fcmToken], { title, body }, data);
    }
  } catch (error) {
    console.error('Erro ao enviar notificação de parceiro:', error);
  }
};

/**
 * Vincula dois usuários em transação e encerra convites pendentes que
 * envolvam qualquer um dos dois (ninguém pode ficar com convites "vivos"
 * depois de já estar em um relacionamento).
 */
const linkUsersAndSettleInvites = async (
  userA: IUser,
  userB: IUser,
  acceptedInviteId?: mongoose.Types.ObjectId
): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      userA.partnerId = userB._id;
      userB.partnerId = userA._id;
      await userA.save({ session });
      await userB.save({ session });

      if (acceptedInviteId) {
        await PartnerInvite.updateOne(
          { _id: acceptedInviteId },
          { $set: { status: 'accepted', respondedAt: new Date() } },
          { session }
        );
      }

      await PartnerInvite.updateMany(
        {
          status: 'pending',
          ...(acceptedInviteId ? { _id: { $ne: acceptedInviteId } } : {}),
          $or: [
            { fromUserId: { $in: [userA._id, userB._id] } },
            { toUserId: { $in: [userA._id, userB._id] } },
          ],
        },
        { $set: { status: 'cancelled', respondedAt: new Date() } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Cria um convite pendente de `fromUser` para o usuário dono de `partnerEmail`.
 * Usado também no registro (o vínculo só acontece quando o convidado aceitar).
 * Retorna null silenciosamente quando o convite não é possível — o registro
 * não deve falhar nem revelar detalhes sobre a conta convidada.
 */
export const createPartnerInviteQuietly = async (
  fromUser: IUser,
  partnerEmail: string
): Promise<void> => {
  try {
    const target = await User.findOne({ email: partnerEmail.toLowerCase() });
    if (
      !target ||
      target._id.toString() === fromUser._id.toString() ||
      target.partnerId ||
      fromUser.partnerId
    ) {
      return;
    }

    const existing = await PartnerInvite.findOne({
      fromUserId: fromUser._id,
      toUserId: target._id,
      status: 'pending',
    });
    if (existing) {
      return;
    }

    await PartnerInvite.create({ fromUserId: fromUser._id, toUserId: target._id });
    await notifyUser(
      target.fcmToken,
      '💌 Convite de parceiro',
      `${fromUser.name} quer se conectar com você no Mood Sharing`,
      { type: 'partner_invite' }
    );
  } catch (error) {
    console.error('Erro ao criar convite de parceiro no registro:', error);
  }
};

export const validateSendInvite = [
  body('partnerEmail').isEmail().withMessage('Email inválido'),
];

export const sendPartnerInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
      return;
    }

    const userId = req.user?.userId;
    const { partnerEmail } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    if (user.partnerId) {
      res.status(400).json({
        success: false,
        error: 'Você já tem um parceiro vinculado. Desvincule antes de convidar outra pessoa.',
      });
      return;
    }

    const target = await User.findOne({ email: String(partnerEmail).toLowerCase() });
    if (!target) {
      res.status(404).json({ success: false, error: 'Nenhuma conta encontrada com este email' });
      return;
    }

    if (target._id.toString() === userId) {
      res.status(400).json({ success: false, error: 'Você não pode se convidar' });
      return;
    }

    if (target.partnerId) {
      res.status(400).json({ success: false, error: 'Esta pessoa já tem um parceiro vinculado' });
      return;
    }

    // Convite mútuo = consentimento dos dois lados: vincula direto.
    const reverseInvite = await PartnerInvite.findOne({
      fromUserId: target._id,
      toUserId: user._id,
      status: 'pending',
    });
    if (reverseInvite) {
      await linkUsersAndSettleInvites(user, target, reverseInvite._id);
      await notifyUser(target.fcmToken, '💑 Parceiro vinculado!', `${user.name} aceitou seu convite`, {
        type: 'partner_linked',
      });
      const { password: _password, ...userResponse } = user.toJSON();
      res.json({ success: true, data: { linked: true, user: userResponse } });
      return;
    }

    const existing = await PartnerInvite.findOne({
      fromUserId: user._id,
      toUserId: target._id,
      status: 'pending',
    });
    if (existing) {
      res.json({ success: true, data: { linked: false, invite: existing.toJSON() } });
      return;
    }

    const invite = await PartnerInvite.create({ fromUserId: user._id, toUserId: target._id });
    await notifyUser(
      target.fcmToken,
      '💌 Convite de parceiro',
      `${user.name} quer se conectar com você no Mood Sharing`,
      { type: 'partner_invite' }
    );

    res.status(201).json({ success: true, data: { linked: false, invite: invite.toJSON() } });
  } catch (error: any) {
    console.error('Erro ao enviar convite de parceiro:', error);
    res.status(500).json({ success: false, error: 'Erro ao enviar convite' });
  }
};

export const listPartnerInvites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const [received, sent] = await Promise.all([
      PartnerInvite.find({ toUserId: userId, status: 'pending' })
        .sort({ createdAt: -1 })
        .populate('fromUserId', 'name email'),
      PartnerInvite.find({ fromUserId: userId, status: 'pending' })
        .sort({ createdAt: -1 })
        .populate('toUserId', 'name email'),
    ]);

    res.json({
      success: true,
      data: {
        received: received.map(invite => {
          const from = invite.fromUserId as unknown as { _id: mongoose.Types.ObjectId; name: string; email: string };
          return {
            id: invite._id.toString(),
            fromName: from?.name ?? '',
            fromEmail: from?.email ?? '',
            createdAt: invite.createdAt,
          };
        }),
        sent: sent.map(invite => {
          const to = invite.toUserId as unknown as { _id: mongoose.Types.ObjectId; name: string; email: string };
          return {
            id: invite._id.toString(),
            toName: to?.name ?? '',
            toEmail: to?.email ?? '',
            createdAt: invite.createdAt,
          };
        }),
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar convites de parceiro:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar convites' });
  }
};

export const acceptPartnerInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const inviteId = req.params.id;

    if (!mongoose.isValidObjectId(inviteId)) {
      res.status(400).json({ success: false, error: 'Convite inválido' });
      return;
    }

    // Só o destinatário pode aceitar o próprio convite.
    const invite = await PartnerInvite.findOne({ _id: inviteId, toUserId: userId, status: 'pending' });
    if (!invite) {
      res.status(404).json({ success: false, error: 'Convite não encontrado' });
      return;
    }

    const [user, sender] = await Promise.all([
      User.findById(userId),
      User.findById(invite.fromUserId),
    ]);

    if (!user || !sender) {
      invite.status = 'cancelled';
      invite.respondedAt = new Date();
      await invite.save();
      res.status(404).json({ success: false, error: 'Usuário do convite não existe mais' });
      return;
    }

    if (user.partnerId || sender.partnerId) {
      invite.status = 'cancelled';
      invite.respondedAt = new Date();
      await invite.save();
      res.status(400).json({
        success: false,
        error: 'Um dos usuários já está vinculado a outro parceiro',
      });
      return;
    }

    await linkUsersAndSettleInvites(user, sender, invite._id);
    await notifyUser(sender.fcmToken, '💑 Parceiro vinculado!', `${user.name} aceitou seu convite`, {
      type: 'partner_linked',
    });

    const { password: _password, ...userResponse } = user.toJSON();
    res.json({ success: true, data: userResponse });
  } catch (error: any) {
    console.error('Erro ao aceitar convite de parceiro:', error);
    res.status(500).json({ success: false, error: 'Erro ao aceitar convite' });
  }
};

export const declinePartnerInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const inviteId = req.params.id;

    if (!mongoose.isValidObjectId(inviteId)) {
      res.status(400).json({ success: false, error: 'Convite inválido' });
      return;
    }

    const invite = await PartnerInvite.findOneAndUpdate(
      { _id: inviteId, toUserId: userId, status: 'pending' },
      { $set: { status: 'declined', respondedAt: new Date() } },
      { new: true }
    );

    if (!invite) {
      res.status(404).json({ success: false, error: 'Convite não encontrado' });
      return;
    }

    res.json({ success: true, message: 'Convite recusado' });
  } catch (error: any) {
    console.error('Erro ao recusar convite de parceiro:', error);
    res.status(500).json({ success: false, error: 'Erro ao recusar convite' });
  }
};

export const cancelPartnerInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const inviteId = req.params.id;

    if (!mongoose.isValidObjectId(inviteId)) {
      res.status(400).json({ success: false, error: 'Convite inválido' });
      return;
    }

    const invite = await PartnerInvite.findOneAndUpdate(
      { _id: inviteId, fromUserId: userId, status: 'pending' },
      { $set: { status: 'cancelled', respondedAt: new Date() } },
      { new: true }
    );

    if (!invite) {
      res.status(404).json({ success: false, error: 'Convite não encontrado' });
      return;
    }

    res.json({ success: true, message: 'Convite cancelado' });
  } catch (error: any) {
    console.error('Erro ao cancelar convite de parceiro:', error);
    res.status(500).json({ success: false, error: 'Erro ao cancelar convite' });
  }
};

export const unlinkPartner = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    if (!user.partnerId) {
      res.status(400).json({ success: false, error: 'Você não tem um parceiro vinculado' });
      return;
    }

    const partner = await User.findById(user.partnerId);

    await session.withTransaction(async () => {
      await User.updateOne({ _id: user._id }, { $set: { partnerId: null } }, { session });
      if (partner) {
        await User.updateOne({ _id: partner._id }, { $set: { partnerId: null } }, { session });
      }
    });
    user.partnerId = undefined;

    if (partner) {
      await notifyUser(
        partner.fcmToken,
        'Vínculo desfeito',
        `${user.name} desfez o vínculo de parceiros`,
        { type: 'partner_unlinked' }
      );
    }

    const { password: _password, ...userResponse } = user.toJSON();
    res.json({ success: true, data: userResponse });
  } catch (error: any) {
    console.error('Erro ao desvincular parceiro:', error);
    res.status(500).json({ success: false, error: 'Erro ao desvincular parceiro' });
  } finally {
    await session.endSession();
  }
};
