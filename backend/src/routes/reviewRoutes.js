import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  getPizzaReviews,
  createReview,
  toggleHelpful,
  getAdminReviews,
  updateReviewStatus,
  respondToReview,
} from '../controllers/reviewController.js';

const router = express.Router();

// Public routes
router.get('/pizza/:pizzaId', getPizzaReviews);

// Protected customer routes
router.post('/', protect, createReview);
router.post('/:id/helpful', protect, toggleHelpful);

// Admin routes
router.get('/admin', protect, adminOnly, getAdminReviews);
router.put('/admin/:id/status', protect, adminOnly, updateReviewStatus);
router.post('/admin/:id/respond', protect, adminOnly, respondToReview);

export default router;
