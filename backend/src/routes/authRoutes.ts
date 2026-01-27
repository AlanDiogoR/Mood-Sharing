import { Router } from 'express';
import {
  register,
  login,
  refresh,
  getCurrentUser,
  linkPartner,
  updateFcmToken,
  changePassword,
  validateRegister,
  validateLogin,
  validateChangePassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refresh);
router.get('/me', authenticate, getCurrentUser);
router.post('/link-partner', authenticate, linkPartner);
router.post('/fcm-token', authenticate, updateFcmToken);
router.post('/change-password', authenticate, validateChangePassword, changePassword);

export default router;
