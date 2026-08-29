import express from 'express';
import { protect, deliveryPartnerOnly } from '../middlewares/auth.js';
import {
  getPartnerProfile,
  toggleAvailability,
  getAssignedOrders,
  acceptAssignment,
  rejectAssignment,
  updateStatus,
  sendLocationUpdate,
  verifyOTPAndComplete,
  resendOTP,
  getEarningsSummary,
  getEarningsHistoryEndpoint,
  getOrderHistory,
} from '../controllers/deliveryPartnerController.js';

const router = express.Router();

router.get('/profile', protect, getPartnerProfile);
router.put('/availability', protect, toggleAvailability);
router.get('/orders', protect, getAssignedOrders);
router.get('/orders/history', protect, getOrderHistory);
router.post('/orders/:orderId/accept', protect, acceptAssignment);
router.post('/orders/:orderId/reject', protect, rejectAssignment);
router.put('/orders/:orderId/status', protect, updateStatus);
router.post('/orders/:orderId/location', protect, sendLocationUpdate);
router.post('/orders/:orderId/resend-otp', protect, resendOTP);
router.post('/orders/:orderId/complete', protect, verifyOTPAndComplete);

// Earnings
router.get('/earnings/summary', protect, getEarningsSummary);
router.get('/earnings/history', protect, getEarningsHistoryEndpoint);

export default router;
