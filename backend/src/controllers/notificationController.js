import {
  getNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
  clearNotificationsService,
} from '../services/NotificationService.js';
import { runInventoryMonitor } from '../services/InventoryMonitorService.js';

/**
 * GET /api/admin/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const result = await getNotificationsService(req.query);
    return res.status(200).json({
      success: true,
      count: result.notifications.length,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
      notifications: result.notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/notifications/unread
 */
export const getUnreadNotifications = async (req, res, next) => {
  try {
    const stats = await getUnreadCountService();
    const result = await getNotificationsService({ read: false, limit: 10 });
    return res.status(200).json({
      success: true,
      unreadCount: stats.unreadCount,
      criticalCount: stats.criticalCount,
      notifications: result.notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await markAsReadService(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await markAllAsReadService();
    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount || 0} notifications as read`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/notifications/:id
 */
export const deleteNotification = async (req, res, next) => {
  try {
    await deleteNotificationService(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/notifications/clear
 */
export const clearNotifications = async (req, res, next) => {
  try {
    const onlyRead = req.query.onlyRead === 'true';
    const result = await clearNotificationsService(onlyRead);
    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount || 0} notifications`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/notifications/trigger-scan
 * Manual trigger for stock monitoring scan
 */
export const triggerInventoryScan = async (req, res, next) => {
  try {
    const summary = await runInventoryMonitor();
    return res.status(200).json({
      success: true,
      message: 'Inventory monitoring scan executed successfully',
      summary,
    });
  } catch (error) {
    next(error);
  }
};
