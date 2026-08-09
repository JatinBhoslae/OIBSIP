import express from 'express';
import { protect } from '../middlewares/auth.js';
import { rateDeliveryPartner } from '../controllers/deliveryRatingController.js';

const router = express.Router();

router.post('/rate', protect, rateDeliveryPartner);

export default router;
