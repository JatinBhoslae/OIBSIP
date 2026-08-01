import express from 'express';
import { adminLogin, getDashboard, getAdminProfile } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// Public admin login — no registration route exists
router.post('/login', adminLogin);

// Protected admin endpoints
router.get('/dashboard', protect, adminOnly, getDashboard);
router.get('/profile', protect, adminOnly, getAdminProfile);

export default router;
