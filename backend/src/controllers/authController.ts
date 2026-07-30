import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenId,
  getAccessTokenExpiresInSeconds,
  getRefreshTokenExpiresAt,
  TokenPayload,
} from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createPartnerInviteQuietly } from './partnerController';

const BCRYPT_SALT_ROUNDS = 12;

// Aceita Expo Push Tokens (ExponentPushToken[...]) e tokens FCM.
const FCM_TOKEN_PATTERN = /^[A-Za-z0-9\[\]_:.\-]{10,512}$/;

// Gera um par de tokens e registra o refresh token (jti) na lista de tokens válidos.
const issueTokens = async (payload: TokenPayload, session?: mongoose.ClientSession) => {
  const accessToken = generateAccessToken(payload);
  const jti = generateTokenId();
  const refreshToken = generateRefreshToken(payload, jti);

  await RefreshToken.create(
    [
      {
        jti,
        userId: new mongoose.Types.ObjectId(payload.userId),
        expiresAt: getRefreshTokenExpiresAt(),
      },
    ],
    session ? { session } : undefined
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
  };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        errors: errors.array(),
      });
      return;
    }

    const { email, password, name, partnerEmail } = req.body;

    // Verifica se o usuário já existe. A mensagem é genérica de propósito,
    // para dificultar a enumeração de emails cadastrados.
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Não foi possível criar a conta com os dados informados',
      });
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Cria o usuário
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
    });

    await user.save();

    // O vínculo de parceiro exige consentimento: em vez de vincular direto,
    // registra um convite pendente que o parceiro precisa aceitar.
    if (partnerEmail && typeof partnerEmail === 'string') {
      await createPartnerInviteQuietly(user, partnerEmail);
    }

    // Gera tokens
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const tokens = await issueTokens(tokenPayload);

    // Remove a senha da resposta
    const { password: _password, ...userResponse } = user.toJSON();

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        tokens,
      },
    });
  } catch (error: any) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar usuário',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    // Busca o usuário
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos',
      });
      return;
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos',
      });
      return;
    }

    // Gera tokens
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const tokens = await issueTokens(tokenPayload);

    // Remove a senha da resposta
    const { password: _password, ...userResponse } = user.toJSON();

    res.json({
      success: true,
      data: {
        user: userResponse,
        tokens,
      },
    });
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login',
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token não fornecido',
      });
      return;
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);

      // O token precisa estar registrado, não revogado e não expirado.
      const stored = await RefreshToken.findOne({ jti: decoded.jti });
      if (!stored || stored.revoked || stored.expiresAt.getTime() <= Date.now()) {
        res.status(401).json({
          success: false,
          error: 'Refresh token inválido ou expirado',
        });
        return;
      }

      const userExists = await User.exists({ _id: decoded.userId });
      if (!userExists) {
        res.status(401).json({ success: false, error: 'Usuário não encontrado' });
        return;
      }

      const tokenPayload: TokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
      };

      // Rotação: emite um novo par e revoga o token usado.
      const tokens = await issueTokens(tokenPayload);
      stored.revoked = true;
      await stored.save();

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Refresh token inválido ou expirado',
      });
    }
  } catch (error: any) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao renovar token',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body ?? {};

    // Sem refresh token não há o que revogar; o cliente apenas descarta os tokens locais.
    if (!refreshToken) {
      res.json({ success: true, message: 'Logout efetuado' });
      return;
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      await RefreshToken.updateOne({ jti: decoded.jti }, { $set: { revoked: true } });
    } catch {
      // Token inválido/expirado: nada a revogar, mas o logout é idempotente.
    }

    res.json({ success: true, message: 'Logout efetuado' });
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ success: false, error: 'Erro ao fazer logout' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      });
      return;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuário',
    });
  }
};

export const updateFcmToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string' || !FCM_TOKEN_PATTERN.test(fcmToken)) {
      res.status(400).json({
        success: false,
        error: 'Token de notificação inválido',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
      return;
    }

    // Aceita tanto tokens FCM quanto Expo Push Tokens
    // O campo fcmToken armazena ambos os tipos de tokens
    user.fcmToken = fcmToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token de notificação atualizado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar token de notificação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar token de notificação',
    });
  }
};

export const verifyPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuário não autenticado' });
      return;
    }

    const { password } = req.body;
    if (!password) {
      res.status(400).json({ success: false, error: 'Senha não fornecida' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Senha incorreta' });
      return;
    }

    res.json({ success: true, message: 'Senha verificada' });
  } catch (error: any) {
    console.error('Erro ao verificar senha:', error);
    res.status(500).json({ success: false, error: 'Erro ao verificar senha' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ success: false, error: 'Senha atual incorreta' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await user.save();

    // Revoga todas as sessões: um refresh token roubado deixa de valer
    // assim que a senha é trocada.
    await RefreshToken.updateMany(
      { userId: user._id, revoked: false },
      { $set: { revoked: true } }
    );

    res.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar senha' });
  }
};

// Validações
export const validateRegister = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Senha deve ter entre 8 e 128 caracteres'),
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Nome deve ter entre 2 e 80 caracteres'),
  body('partnerEmail').optional({ values: 'falsy' }).isEmail().withMessage('Email do parceiro inválido'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

export const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Nova senha deve ter entre 8 e 128 caracteres'),
];
