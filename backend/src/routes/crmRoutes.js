import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  getMyCrmProfile,
  getAdminCustomer360,
  getAdminCustomerList,
  createCampaign,
  sendCampaign,
} from '../controllers/crmController.js';

const router = express.Router();

// Customer 360 self route
router.get('/me', protect, getMyCrmProfile);

// Admin CRM routes
router.get('/admin/customers', protect, adminOnly, getAdminCustomerList);
router.get('/admin/customers/:id', protect, adminOnly, getAdminCustomer360);
router.post('/admin/campaigns', protect, adminOnly, createCampaign);
router.post('/admin/campaigns/:id/send', protect, adminOnly, sendCampaign);

export default router;
