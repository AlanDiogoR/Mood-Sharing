import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getGoals, updateGoals, validateUpdateGoals } from '../controllers/goalController';

const router = Router();

router.use(authenticate);

router.get('/', getGoals);
router.put('/', validateUpdateGoals, updateGoals);

export default router;
