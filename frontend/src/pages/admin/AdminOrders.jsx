import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';

export default function AdminOrders() {
  const { token } = useContext(AuthContext);
  const { socket } = useContext(SocketContext) || {};

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });

  // Selected Order Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', vehicleNumber: '' });
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ refundReason: '', refundNotes: '' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/orders/admin', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter,
          dateRange,
          search,
          sortBy,
          page,
          limit: 10,
        },
      });
      if (res.data.success) {
        setOrders(res.data.orders || []);
        setPagination(res.data.pagination || { totalPages: 1, totalItems: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/orders/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch OMS analytics:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchAnalytics();
    }
  }, [token, statusFilter, dateRange, search, sortBy, page]);

  // Socket listener for real-time order updates
  useEffect(() => {
    if (!socket) return;
    socket.emit('joinAdminRoom');

    const handleOrderUpdate = () => {
      fetchOrders();
      fetchAnalytics();
    };

    socket.on('orderCreated', handleOrderUpdate);
    socket.on('orderUpdated', handleOrderUpdate);
    socket.on('orderStatusChanged', handleOrderUpdate);

    return () => {
      socket.off('orderCreated', handleOrderUpdate);
      socket.off('orderUpdated', handleOrderUpdate);
      socket.off('orderStatusChanged', handleOrderUpdate);
    };
  }, [socket]);

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const nextStatusMap = {
      'Order Received': 'Preparing',
      Preparing: 'Baking',
      Baking: 'Quality Check',
      'Quality Check': 'Ready',
      Ready: 'Out For Delivery',
      'Out For Delivery': 'Delivered',
      confirmed: 'Preparing',
      preparing: 'Baking',
      'in-kitchen': 'Quality Check',
      ready: 'Out For Delivery',
      'out-for-delivery': 'Delivered',
    };

    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    try {
      await axios.put(
        `http://localhost:5001/api/orders/${orderId}/status`,
        { status: nextStatus, remarks: `Status advanced to ${nextStatus}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await axios.put(
        `http://localhost:5001/api/orders/${selectedOrder._id}/assign-delivery`,
        driverForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDriverModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      console.error('Failed to assign driver:', err);
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await axios.post(
        `http://localhost:5001/api/orders/${selectedOrder._id}/refund`,
        refundForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRefundModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      console.error('Failed to process refund:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">Delivered</span>;
      case 'Cancelled':
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">Cancelled</span>;
      case 'Refunded':
      case 'refunded':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Refunded</span>;
      case 'Out For Delivery':
      case 'out-for-delivery':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">Out for Delivery</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">{status}</span>;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />

        <main className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Merchant Order Panel (OMS)
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Real-time kitchen order dispatch, delivery partner assignment, and status timeline auditing.
              </p>
            </div>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400 font-semibold">Today's Revenue</p>
                <h3 className="text-2xl font-black text-white mt-1">₹{analytics.todayRevenue}</h3>
                <p className="text-[11px] text-orange-400 mt-1">{analytics.todayOrders} order(s) today</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400 font-semibold">Pending Kitchen Orders</p>
                <h3 className="text-2xl font-black text-amber-400 mt-1">{analytics.pendingCount}</h3>
                <p className="text-[11px] text-neutral-500 mt-1">Requires kitchen dispatch</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400 font-semibold">Completed Deliveries</p>
                <h3 className="text-2xl font-black text-green-400 mt-1">{analytics.deliveredCount}</h3>
                <p className="text-[11px] text-neutral-500 mt-1">Successfully fulfilled</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400 font-semibold">Avg Delivery Time</p>
                <h3 className="text-2xl font-black text-orange-500 mt-1">{analytics.avgDeliveryTimeMinutes}m</h3>
                <p className="text-[11px] text-neutral-500 mt-1">Enterprise benchmark</p>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Search Order #, Tracking, Phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
              />

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Order Statuses</option>
                <option value="Order Received">Order Received</option>
                <option value="Preparing">Preparing</option>
                <option value="Baking">Baking</option>
                <option value="Quality Check">Quality Check</option>
                <option value="Ready">Ready for Pickup</option>
                <option value="Out For Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-orange-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-neutral-950 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">No merchant orders found matching filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="p-4">Order #</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Delivery Driver</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {orders.map((o) => (
                      <tr key={o._id} className="hover:bg-neutral-850/50 transition-colors">
                        <td className="p-4 font-bold text-white">
                          #{o.orderNumber || o._id.slice(-6).toUpperCase()}
                          <div className="text-[10px] text-orange-400 font-normal">{o.trackingCode || 'TRK-N/A'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{o.user?.name || 'Customer'}</div>
                          <div className="text-[10px] text-neutral-400">{o.phone}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-white">{o.items?.length || 0} items</span>
                        </td>
                        <td className="p-4 font-bold text-white">₹{o.grandTotal}</td>
                        <td className="p-4">{getStatusBadge(o.status)}</td>
                        <td className="p-4">
                          {o.deliveryPartner?.name ? (
                            <span className="text-white font-semibold">🛵 {o.deliveryPartner.name}</span>
                          ) : (
                            <span className="text-neutral-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold"
                          >
                            Details
                          </button>

                          {!['Delivered', 'Cancelled', 'Refunded'].includes(o.status) && (
                            <button
                              onClick={() => handleAdvanceStatus(o._id, o.status)}
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-500/20"
                            >
                              Advance
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-neutral-500">
                Page {page} of {pagination.totalPages} ({pagination.totalItems} orders)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-xs rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-xs rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Detail Audit History Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white">
              Order #{selectedOrder.orderNumber || selectedOrder._id}
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <div>
                <p className="text-neutral-400">Customer</p>
                <p className="font-bold text-white">{selectedOrder.user?.name}</p>
                <p className="text-neutral-400">{selectedOrder.phone}</p>
              </div>
              <div>
                <p className="text-neutral-400">Delivery Address</p>
                <p className="font-bold text-white">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}
                </p>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Audit Trail History</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {selectedOrder.statusHistory?.map((h, i) => (
                  <div key={i} className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-orange-400">{h.status}</span>
                      <span className="text-neutral-500">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-neutral-300">{h.remarks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800">
              <a
                href={`http://localhost:5001/api/orders/${selectedOrder._id}/invoice?print=true`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl"
              >
                Print Invoice
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDriverModal(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl"
                >
                  Assign Driver
                </button>

                <button
                  onClick={() => {
                    setShowRefundModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl"
                >
                  Refund Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showDriverModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleAssignDriver} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Assign Delivery Executive</h3>
            <input
              type="text"
              placeholder="Driver Name (e.g. Rahul Sharma)"
              required
              value={driverForm.name}
              onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
            />
            <input
              type="text"
              placeholder="Phone (+91 98765 43210)"
              required
              value={driverForm.phone}
              onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
            />
            <input
              type="text"
              placeholder="Vehicle Number (MH 12 AB 1234)"
              value={driverForm.vehicleNumber}
              onChange={(e) => setDriverForm({ ...driverForm, vehicleNumber: e.target.value })}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowDriverModal(false)} className="px-4 py-2 text-xs text-neutral-400">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl">
                Assign & Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleProcessRefund} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Process Order Refund</h3>
            <p className="text-xs text-neutral-400">Total refund amount: ₹{selectedOrder.grandTotal}</p>
            <input
              type="text"
              placeholder="Refund Reason (e.g. Customer cancelled / Delayed)"
              required
              value={refundForm.refundReason}
              onChange={(e) => setRefundForm({ ...refundForm, refundReason: e.target.value })}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
            />
            <textarea
              placeholder="Admin Notes"
              value={refundForm.refundNotes}
              onChange={(e) => setRefundForm({ ...refundForm, refundNotes: e.target.value })}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white h-20"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowRefundModal(false)} className="px-4 py-2 text-xs text-neutral-400">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl">
                Execute Refund
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
