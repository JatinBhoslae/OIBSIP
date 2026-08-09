import express from 'express';
import {
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearNotifications,
  triggerInventoryScan,
} from '../controllers/notificationController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

// Apply admin protection to all routes
router.use(protect, adminOnly);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.put('/read-all', markAllNotificationsAsRead);
router.put('/:id/read', markNotificationAsRead);
router.delete('/clear', clearNotifications);
router.delete('/:id', deleteNotification);
router.post('/trigger-scan', triggerInventoryScan);

export default router;
