import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createMedia,
  deleteMedia,
  getMedia,
  listMedia,
  reorderMedia,
  updateMedia,
  validateCreateMedia,
  validateGetOrDeleteMedia,
  validateReorderMedia,
  validateUpdateMedia,
} from '../controllers/mediaController';

const router = Router();

router.use(authenticate);

router.get('/', listMedia);
router.post('/', validateCreateMedia, createMedia);
router.post('/reorder', validateReorderMedia, reorderMedia);
router.get('/:id', validateGetOrDeleteMedia, getMedia);
router.put('/:id', validateUpdateMedia, updateMedia);
router.delete('/:id', validateGetOrDeleteMedia, deleteMedia);

export default router;
