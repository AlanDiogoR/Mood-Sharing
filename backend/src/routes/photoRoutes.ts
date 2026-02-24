import express from 'express';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import { uploadSharedPhoto, getLatestPartnerPhoto, getPartnerPhotos } from '../controllers/photoController';

const router = express.Router();

router.use(authenticate);

router.get('/', getPartnerPhotos);
router.get('/latest', getLatestPartnerPhoto);
router.post('/', uploadImage.single('photo'), uploadSharedPhoto);

export default router;
