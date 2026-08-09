import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  dashboardOverview,
  revenueAnalytics,
  orderAnalytics,
  customerAnalytics,
  pizzaAnalytics,
  inventoryAnalytics,
  paymentAnalytics,
  deliveryAnalytics,
  forecastAnalytics,
} from '../controllers/analyticsController.js';
import {
  exportCSV,
  exportExcel,
  exportPDF,
} from '../controllers/reportsController.js';

const router = express.Router();

// ─── Analytics Endpoints (Admin Only) ────────────────────────
router.get('/overview', protect, adminOnly, dashboardOverview);
router.get('/revenue', protect, adminOnly, revenueAnalytics);
router.get('/orders', protect, adminOnly, orderAnalytics);
router.get('/customers', protect, adminOnly, customerAnalytics);
router.get('/pizzas', protect, adminOnly, pizzaAnalytics);
router.get('/inventory', protect, adminOnly, inventoryAnalytics);
router.get('/payments', protect, adminOnly, paymentAnalytics);
router.get('/delivery', protect, adminOnly, deliveryAnalytics);
router.get('/forecast', protect, adminOnly, forecastAnalytics);

// ─── Report Export Endpoints ──────────────────────────────────
router.get('/reports/csv', protect, adminOnly, exportCSV);
router.get('/reports/excel', protect, adminOnly, exportExcel);
router.get('/reports/pdf', protect, adminOnly, exportPDF);

export default router;
