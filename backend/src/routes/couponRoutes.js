import express from 'express';
import {
  getCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/couponController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, adminOnly, getCoupons)
  .post(protect, adminOnly, createCoupon);

router.post('/validate', protect, validateCoupon);

router.route('/:id')
  .delete(protect, adminOnly, deleteCoupon);

export default router;
