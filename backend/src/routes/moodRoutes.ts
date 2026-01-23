import {Router} from 'express';
import {
  getCurrentMood,
  getPartnerMood,
  updateMood,
  updateMoodWithProximity,
  getMoodHistory,
} from '../controllers/moodController';
import {authenticate} from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

router.get('/current/:userId', getCurrentMood);
router.get('/partner/:partnerId', getPartnerMood);
router.post('/', updateMood);
router.post('/with-proximity', updateMoodWithProximity);
router.get('/history/:userId', getMoodHistory);

export default router;
