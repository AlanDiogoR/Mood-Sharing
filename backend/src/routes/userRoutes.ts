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
import { exportMyData, deleteMyAccount } from '../controllers/accountController';

const router = Router();

router.use(authenticate);

router.get('/me/photo', getUserPhoto);
router.post('/me/photo', uploadImage.single('photo'), uploadUserPhoto);
router.get('/me/export', exportMyData);
router.delete('/me', deleteMyAccount);
router.put('/me', validateUpdateProfile, updateUserProfile);
router.get('/:id', getUserPublic);

export default router;
