import express from 'express';
import { protect } from '../middlewares/auth.js';
import { getMyReferralStats } from '../controllers/referralController.js';

const router = express.Router();

router.get('/stats', protect, getMyReferralStats);

export default router;
