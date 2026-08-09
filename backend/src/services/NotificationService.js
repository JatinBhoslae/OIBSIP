import Notification from '../models/Notification.js';
import { getIO } from '../utils/socket.js';

/**
 * Creates a notification with 24-hour duplicate prevention for inventory alerts.
 */
export const createNotificationService = async (data) => {
  const { ingredient, type, priority, currentStock, minimumStock, title, message } = data;

  // Deduplication logic: If an alert for the same ingredient and type was created within 24 hours, skip creation
  if (ingredient && ['LOW_STOCK', 'OUT_OF_STOCK'].includes(type)) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRecentNotification = await Notification.findOne({
      ingredient,
      type,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (existingRecentNotification) {
      console.log(`[NOTIFICATION DE-DUP] Skipped duplicate alert for ingredient ${ingredient} (Type: ${type})`);
      return null;
    }
  }

  const notification = await Notification.create({
    title,
    message,
    type: type || 'LOW_STOCK',
    priority: priority || 'MEDIUM',
    ingredient,
    currentStock,
    minimumStock,
    recipient: 'admin',
    emailStatus: 'pending',
    read: false,
    sentAt: new Date(),
  });

  // Real-time broadcast via Socket.IO
  const io = getIO();
  if (io) {
    io.to('admin-room').emit('notificationCreated', notification);
    if (type === 'LOW_STOCK' || type === 'OUT_OF_STOCK') {
      io.to('admin-room').emit('inventoryLow', {
        notificationId: notification._id,
        ingredient,
        currentStock,
        minimumStock,
        priority,
      });
    }
  }

  return notification;
};

/**
 * Fetches notifications with query parameters (read status, priority, type, pagination)
 */
export const getNotificationsService = async (queryParams = {}) => {
  const { read, priority, type, timeRange, page = 1, limit = 20, search } = queryParams;
  const query = {};

  if (read !== undefined && read !== 'all') {
    query.read = read === 'true' || read === true;
  }

  if (priority && priority !== 'all') {
    query.priority = priority.toUpperCase();
  }

  if (type && type !== 'all') {
    query.type = type.toUpperCase();
  }

  if (timeRange === 'today') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    query.createdAt = { $gte: startOfDay };
  } else if (timeRange === 'week') {
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: startOfWeek };
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: regex }, { message: regex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const totalItems = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .populate('ingredient', 'name category unit quantity minimumStock image')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const unreadCount = await Notification.countDocuments({ read: false });

  return {
    notifications,
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum) || 1,
    },
  };
};

/**
 * Returns total count of unread notifications
 */
export const getUnreadCountService = async () => {
  const unreadCount = await Notification.countDocuments({ read: false });
  const criticalCount = await Notification.countDocuments({ read: false, priority: 'CRITICAL' });
  return { unreadCount, criticalCount };
};

/**
 * Marks a notification as read
 */
export const markAsReadService = async (id) => {
  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  return notification;
};

/**
 * Marks all notifications as read
 */
export const markAllAsReadService = async () => {
  const result = await Notification.updateMany(
    { read: false },
    { read: true, readAt: new Date() }
  );
  return result;
};

/**
 * Deletes a notification by ID
 */
export const deleteNotificationService = async (id) => {
  const notification = await Notification.findByIdAndDelete(id);
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }
  return notification;
};

/**
 * Clears all read notifications or all notifications
 */
export const clearNotificationsService = async (onlyRead = false) => {
  const query = onlyRead ? { read: true } : {};
  const result = await Notification.deleteMany(query);
  return result;
};
