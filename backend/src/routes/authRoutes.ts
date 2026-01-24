import { Router } from 'express';
import {
  register,
  login,
  refresh,
  getCurrentUser,
  linkPartner,
  updateFcmToken,
  validateRegister,
  validateLogin,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refresh);
router.get('/me', authenticate, getCurrentUser);
router.post('/link-partner', authenticate, linkPartner);
router.post('/fcm-token', authenticate, updateFcmToken);

export default router;
