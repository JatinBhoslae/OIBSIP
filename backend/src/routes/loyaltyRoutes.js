import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
  getLoyaltyBalance,
  getTransactions,
  getRewardsCatalog,
  redeemReward,
} from '../controllers/loyaltyController.js';

const router = express.Router();

router.get('/balance', protect, getLoyaltyBalance);
router.get('/transactions', protect, getTransactions);
router.get('/rewards', protect, getRewardsCatalog);
router.post('/redeem', protect, redeemReward);

export default router;
