import express from 'express';
import { 
  getReferralStats, 
  sendReferralInvite, 
  getReferralLeaderboard 
} from '../controllers/referralController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/referrals/stats - Get user's referral stats
router.get('/stats', getReferralStats);

// POST /api/referrals/invite - Send referral invite
router.post('/invite', sendReferralInvite);

// GET /api/referrals/leaderboard - Get referral leaderboard
router.get('/leaderboard', getReferralLeaderboard);

export default router;

