import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../../context/NotificationContext';

export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useContext(NotificationContext);

  useEffect(() => {
    fetchNotifications({ limit: 6 });
  }, [fetchNotifications]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">LOW</span>;
    }
  };

  const getTimeAgo = (dateString) => {
    const diff = (new Date() - new Date(dateString)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="absolute right-0 mt-3 w-96 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-orange-500/20 text-orange-400">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[11px] font-medium text-orange-400 hover:text-orange-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-neutral-850">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <svg className="w-10 h-10 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-xs">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 5).map((item) => (
            <div
              key={item._id}
              onClick={() => markAsRead(item._id)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                !item.read ? 'bg-orange-500/5 hover:bg-orange-500/10' : 'hover:bg-neutral-800/50'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {item.type === 'OUT_OF_STOCK' || item.priority === 'CRITICAL' ? (
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                    🚨
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                    ⚠️
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className={`text-xs font-semibold truncate ${!item.read ? 'text-white' : 'text-neutral-300'}`}>
                    {item.title}
                  </h4>
                  {getPriorityBadge(item.priority)}
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-500">
                  <span>{getTimeAgo(item.createdAt)}</span>
                  {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/50 text-center">
        <Link
          to="/admin/notifications"
          onClick={onClose}
          className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1"
        >
          View All Notifications
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
