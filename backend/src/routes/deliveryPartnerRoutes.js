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
} from '../controllers/deliveryPartnerController.js';

const router = express.Router();

router.get('/profile', protect, getPartnerProfile);
router.put('/availability', protect, toggleAvailability);
router.get('/orders', protect, getAssignedOrders);
router.post('/orders/:orderId/accept', protect, acceptAssignment);
router.post('/orders/:orderId/reject', protect, rejectAssignment);
router.put('/orders/:orderId/status', protect, updateStatus);
router.post('/orders/:orderId/location', protect, sendLocationUpdate);
router.post('/orders/:orderId/complete', protect, verifyOTPAndComplete);

export default router;
