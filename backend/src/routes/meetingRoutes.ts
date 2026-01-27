import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  recordProximity,
  getWeeklyMeetings,
  validateWeeklyMeetings,
} from '../controllers/meetingController';

const router = express.Router();

router.use(authenticate);

router.post('/record', recordProximity);
router.get('/weekly', validateWeeklyMeetings, getWeeklyMeetings);

export default router;
