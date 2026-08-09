import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext) || {};

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // Real-time toast alert

  const API_URL = 'http://localhost:5001/api/admin/notifications';

  // Fetch unread count & recent notifications for admin
  const fetchUnreadCount = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      const res = await axios.get(`${API_URL}/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount || 0);
        setCriticalCount(res.data.criticalCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread notifications count:', err.message);
    }
  }, [token, user]);

  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!token || user?.role !== 'admin') return;
      setLoading(true);
      try {
        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        if (res.data.success) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err.message);
      } finally {
        setLoading(false);
      }
    },
    [token, user]
  );

  const markAsRead = async (id) => {
    try {
      const res = await axios.put(
        `${API_URL}/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await axios.put(
        `${API_URL}/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  };

  const clearAllNotifications = async (onlyRead = false) => {
    try {
      const res = await axios.delete(`${API_URL}/clear`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { onlyRead },
      });
      if (res.data.success) {
        if (onlyRead) {
          setNotifications((prev) => prev.filter((n) => !n.read));
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err.message);
    }
  };

  // Real-time socket listeners
  useEffect(() => {
    if (!socket || user?.role !== 'admin') return;

    socket.emit('joinAdminRoom');

    const handleNotificationCreated = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      if (notification.priority === 'CRITICAL') {
        setCriticalCount((prev) => prev + 1);
      }

      // Display real-time toast alert
      setToast({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        type: notification.type,
      });

      // Auto dismiss toast after 6 seconds
      setTimeout(() => setToast(null), 6000);
    };

    socket.on('notificationCreated', handleNotificationCreated);

    return () => {
      socket.off('notificationCreated', handleNotificationCreated);
    };
  }, [socket, user]);

  // Initial fetch on mount / auth change
  useEffect(() => {
    if (token && user?.role !== 'admin') {
      fetchUnreadCount();
    }
  }, [token, user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        criticalCount,
        loading,
        toast,
        setToast,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
