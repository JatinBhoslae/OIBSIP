import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import { NotificationContext } from '../../context/NotificationContext';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

export default function Notifications() {
  const { token } = useContext(AuthContext);
  const { markAsRead, deleteNotification, clearAllNotifications } = useContext(NotificationContext);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [readFilter, setReadFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [triggeringScan, setTriggeringScan] = useState(false);

  const fetchPageNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          read: readFilter,
          priority: priorityFilter,
          type: typeFilter,
          timeRange,
          search,
          page,
          limit: 10,
        },
      });

      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setPagination(res.data.pagination || { totalPages: 1, totalItems: 0 });
      }
    } catch (err) {
      console.error('Failed to load notifications page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPageNotifications();
    }
  }, [token, readFilter, priorityFilter, typeFilter, timeRange, search, page]);

  const handleTriggerScan = async () => {
    setTriggeringScan(true);
    try {
      await axios.post(
        'http://localhost:5001/api/admin/notifications/trigger-scan',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPageNotifications();
    } catch (err) {
      console.error('Scan trigger error:', err);
    } finally {
      setTriggeringScan(false);
    }
  };

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">MEDIUM</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">LOW</span>;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />

        <main className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Notification Center
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Real-time inventory alerts, threshold monitoring, and system logs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerScan}
                disabled={triggeringScan}
                className="px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <svg className={`w-4 h-4 text-orange-400 ${triggeringScan ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {triggeringScan ? 'Scanning...' : 'Run Stock Scan'}
              </button>

              <button
                onClick={() => clearAllNotifications(true)}
                className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold rounded-xl transition-all duration-200"
              >
                Clear Read
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search alerts..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
              />

              {/* Status */}
              <select
                value={readFilter}
                onChange={(e) => { setReadFilter(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Read Status</option>
                <option value="false">Unread Only</option>
                <option value="true">Read Only</option>
              </select>

              {/* Priority */}
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Priorities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Only</option>
                <option value="MEDIUM">Medium Only</option>
                <option value="LOW">Low Only</option>
              </select>

              {/* Type */}
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Types</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="RESTOCKED">Restocked</option>
                <option value="SYSTEM">System</option>
              </select>

              {/* Time */}
              <select
                value={timeRange}
                onChange={(e) => { setTimeRange(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
              </select>
            </div>
          </div>

          {/* List Cards */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-sm text-neutral-400">No notifications match your current filters.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    !n.read
                      ? 'bg-neutral-900/90 border-orange-500/30 shadow-lg shadow-orange-500/5'
                      : 'bg-neutral-900/40 border-neutral-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="mt-1">
                      {n.type === 'OUT_OF_STOCK' || n.priority === 'CRITICAL' ? (
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-lg border border-red-500/30">
                          🚨
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg border border-orange-500/30">
                          ⚠️
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className={`text-sm font-bold ${!n.read ? 'text-white' : 'text-neutral-300'}`}>
                          {n.title}
                        </h3>
                        {getPriorityBadge(n.priority)}
                        <span className="text-[11px] text-neutral-500">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {n.message}
                      </p>

                      {n.ingredient && (
                        <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-1">
                          <span>Ingredient: <strong className="text-white">{n.ingredient.name}</strong></span>
                          <span>Current Stock: <strong className="text-orange-400">{n.currentStock ?? n.ingredient.quantity} {n.ingredient.unit}</strong></span>
                          <span>Min Threshold: <strong className="text-neutral-300">{n.minimumStock ?? n.ingredient.minimumStock} {n.ingredient.unit}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n._id)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                      title="Delete notification"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-neutral-500">
                Page {page} of {pagination.totalPages} ({pagination.totalItems} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
