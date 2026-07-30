import {Router} from 'express';
import {
  getCurrentMood,
  getPartnerMood,
  updateMood,
  updateMoodWithProximity,
  getMoodHistory,
  validateMoodPayload,
} from '../controllers/moodController';
import {authenticate} from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

router.get('/current/:userId', getCurrentMood);
router.get('/partner/:partnerId', getPartnerMood);
router.post('/', validateMoodPayload, updateMood);
router.post('/with-proximity', validateMoodPayload, updateMoodWithProximity);
router.get('/history/:userId', getMoodHistory);

export default router;
