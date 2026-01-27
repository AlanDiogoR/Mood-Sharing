import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import {
  getUserPhoto,
  uploadUserPhoto,
  getUserPublic,
  updateUserProfile,
  validateUpdateProfile,
} from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/me/photo', getUserPhoto);
router.post('/me/photo', uploadImage.single('photo'), uploadUserPhoto);
router.put('/me', validateUpdateProfile, updateUserProfile);
router.get('/:id', getUserPublic);

export default router;
