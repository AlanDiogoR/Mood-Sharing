import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  linkPartner,
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

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);
router.post('/link-partner', authenticate, linkPartner);
router.post('/fcm-token', authenticate, updateFcmToken);
router.post('/verify-password', authenticate, verifyPassword);
router.post('/change-password', authenticate, validateChangePassword, changePassword);

export default router;
