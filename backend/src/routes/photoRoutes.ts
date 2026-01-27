import express from 'express';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import { uploadSharedPhoto, getLatestPartnerPhoto } from '../controllers/photoController';

const router = express.Router();

router.use(authenticate);

router.get('/latest', getLatestPartnerPhoto);
router.post('/', uploadImage.single('photo'), uploadSharedPhoto);

export default router;
