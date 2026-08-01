import express from 'express';
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus,
  cancelOrder,
  getAnalytics,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, getUserOrders);

router.route('/admin')
  .get(protect, adminOnly, getAdminOrders);

router.route('/analytics')
  .get(protect, adminOnly, getAnalytics);

router.post('/verify-payment', protect, verifyPayment);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, updateOrderStatus); // Put updates the status

router.post('/:id/cancel', protect, cancelOrder);

export default router;
