import express from 'express';
import { protect } from '../middlewares/auth.js';
import { topupWallet, withdrawWallet } from '../controllers/walletController.js';

const router = express.Router();

router.post('/topup', protect, topupWallet);
router.post('/withdraw', protect, withdrawWallet);

export default router;
