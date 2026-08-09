import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  createDeliveryPartner,
  getDeliveryPartners,
  updatePartnerStatus,
  getSmartSuggestions,
  assignOrder,
  getLiveFleetMapData,
} from '../controllers/adminDeliveryController.js';

const router = express.Router();

router.get('/partners', protect, adminOnly, getDeliveryPartners);
router.post('/partners', protect, adminOnly, createDeliveryPartner);
router.put('/partners/:id/status', protect, adminOnly, updatePartnerStatus);
router.get('/smart-suggestions', protect, adminOnly, getSmartSuggestions);
router.post('/assign/:orderId', protect, adminOnly, assignOrder);
router.get('/live-map', protect, adminOnly, getLiveFleetMapData);

export default router;
