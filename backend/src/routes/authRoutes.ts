import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  updateFcmToken,
  verifyPassword,
  changePassword,
  validateRegister,
  validateLogin,
  validateChangePassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

// Rotas autenticadas que verificam senha também precisam de limite estrito,
// senão um access token vazado permite brute force da senha.
const passwordCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/fcm-token', authenticate, updateFcmToken);
router.post('/verify-password', authenticate, passwordCheckLimiter, verifyPassword);
router.post('/change-password', authenticate, passwordCheckLimiter, validateChangePassword, changePassword);

export default router;
