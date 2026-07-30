import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import {
  sendPartnerInvite,
  listPartnerInvites,
  acceptPartnerInvite,
  declinePartnerInvite,
  cancelPartnerInvite,
  unlinkPartner,
  validateSendInvite,
} from '../controllers/partnerController';

const router = Router();

router.use(authenticate);

// Limite dedicado para envio de convites (contém abuso/enumeração de emails).
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitos convites enviados. Tente novamente mais tarde.' },
});

router.post('/invite', inviteLimiter, validateSendInvite, sendPartnerInvite);
router.get('/invites', listPartnerInvites);
router.post('/invites/:id/accept', acceptPartnerInvite);
router.post('/invites/:id/decline', declinePartnerInvite);
router.post('/invites/:id/cancel', cancelPartnerInvite);
router.post('/unlink', unlinkPartner);

export default router;
