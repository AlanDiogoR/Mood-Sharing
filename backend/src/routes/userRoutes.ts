import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import {
  getUserPhoto,
  uploadUserPhoto,
  getUserPublic,
  updateUserProfile,
  validateUpdateProfile,
} from '../controllers/userController';
import { exportMyData, deleteMyAccount } from '../controllers/accountController';

const router = Router();

router.use(authenticate);

// A exclusão de conta verifica a senha; limite estrito evita brute force
// da senha a partir de um access token vazado.
const deleteAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

router.get('/me/photo', getUserPhoto);
router.post('/me/photo', uploadImage.single('photo'), uploadUserPhoto);
router.get('/me/export', exportMyData);
router.delete('/me', deleteAccountLimiter, deleteMyAccount);
router.put('/me', validateUpdateProfile, updateUserProfile);
router.get('/:id', getUserPublic);

export default router;
