import express from 'express';
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
  reorderItems,
  cancelOrder,
  getAdminOrders,
  updateOrderStatus,
  assignDeliveryPartner,
  refundOrder,
  deleteOrder,
  getAnalytics,
} from '../controllers/orderController.js';
import { getOrderInvoice } from '../controllers/invoiceController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// Customer Order Endpoints
router.route('/')
  .post(protect, createOrder);

router.get('/my', protect, getUserOrders);
router.post('/verify-payment', protect, verifyPayment);

// Analytics
router.get('/analytics', protect, adminOnly, getAnalytics);

// Admin Partner OMS Endpoints
router.get('/admin', protect, adminOnly, getAdminOrders);

// Single Order Operations (ID / OrderNumber / TrackingCode)
router.route('/:id')
  .get(protect, getOrderById)
  .delete(protect, adminOnly, deleteOrder);

router.get('/:id/invoice', protect, getOrderInvoice);
router.post('/:id/reorder', protect, reorderItems);
router.post('/:id/cancel', protect, cancelOrder);

// Admin Partner Mutation Endpoints
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/assign-delivery', protect, adminOnly, assignDeliveryPartner);
router.post('/:id/refund', protect, adminOnly, refundOrder);

export default router;
