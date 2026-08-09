import express from 'express';
import { getOrderChatHistory, markChatAsRead } from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

// Mounted at /api/orders/:id/chat
router.route('/')
  .get(protect, getOrderChatHistory)
  .post(protect, markChatAsRead);

export default router;
