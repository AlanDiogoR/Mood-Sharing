import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWeeklySummary,
  saveWorkoutSummary,
  validateSaveWorkout,
  validateWeeklySummary,
} from '../controllers/workoutController';

const router = Router();

router.use(authenticate);

router.post('/summary', validateSaveWorkout, saveWorkoutSummary);
router.get('/weekly', validateWeeklySummary, getWeeklySummary);

export default router;
