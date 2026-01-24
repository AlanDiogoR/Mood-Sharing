import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { body, validationResult } from 'express-validator';

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

    // Verifica se o usuário já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Email já cadastrado',
      });
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
    });

    // Se forneceu email do parceiro, tenta vincular
    if (partnerEmail) {
      const partner = await User.findOne({ email: partnerEmail.toLowerCase() });
      if (partner) {
        user.partnerId = partner._id;
        // Vincula bidirecionalmente
        partner.partnerId = user._id;
        await partner.save();
      }
    }

    await user.save();

    // Gera tokens
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove a senha da resposta
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hora
        },
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

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove a senha da resposta
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
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

      // Gera novos tokens
      const tokenPayload: TokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600,
        },
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

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

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

export const linkPartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { partnerEmail } = req.body;

    if (!partnerEmail) {
      res.status(400).json({
        success: false,
        error: 'Email do parceiro não fornecido',
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

    const partner = await User.findOne({ email: partnerEmail.toLowerCase() });
    if (!partner) {
      res.status(404).json({
        success: false,
        error: 'Parceiro não encontrado',
      });
      return;
    }

    // Vincula bidirecionalmente
    user.partnerId = partner._id;
    partner.partnerId = user._id;

    await user.save();
    await partner.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error: any) {
    console.error('Erro ao vincular parceiro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao vincular parceiro',
    });
  }
};

export const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      res.status(400).json({
        success: false,
        error: 'FCM token não fornecido',
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

    user.fcmToken = fcmToken;
    await user.save();

    res.json({
      success: true,
      message: 'FCM token atualizado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar FCM token',
    });
  }
};

// Validações
export const validateRegister = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name').trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];
