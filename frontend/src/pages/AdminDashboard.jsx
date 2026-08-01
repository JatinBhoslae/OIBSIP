import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  ClipboardList,
  Layers,
  Tag,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);

  // States
  const [orders, setOrders] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Forms
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercentage: 20,
    maxDiscount: 100,
    minOrderValue: 200,
    expiryDate: '',
  });

  const [couponError, setCouponError] = useState('');

  // Check admin access
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    socket.emit('joinAdminRoom');

    socket.on('newOrder', (order) => {
      setOrders((prev) => [order, ...prev]);
    });

    return () => {
      socket.off('newOrder');
    };
  }, [socket]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const res = await api.get('/orders/admin');
        setOrders(res.data.orders);
      } else if (activeTab === 'inventory') {
        const res = await api.get('/ingredients');
        setIngredients(res.data.ingredients);
      } else if (activeTab === 'coupons') {
        const res = await api.get('/coupons');
        setCoupons(res.data.coupons);
      } else if (activeTab === 'analytics') {
        const res = await api.get('/orders/analytics');
        setAnalytics(res.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleRestock = async (ingId, currentQty) => {
    const amount = prompt('Enter restock amount:', '50');
    if (!amount || isNaN(amount)) return;

    try {
      const res = await api.put(`/ingredients/${ingId}`, {
        quantity: Number(currentQty) + Number(amount),
      });
      setIngredients((prev) =>
        prev.map((i) => (i._id === ingId ? res.data.ingredient : i))
      );
    } catch (error) {
      console.error('Failed to restock:', error);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    try {
      const res = await api.post('/coupons', newCoupon);
      setCoupons((prev) => [res.data.coupon, ...prev]);
      setNewCoupon({
        code: '',
        discountPercentage: 20,
        maxDiscount: 100,
        minOrderValue: 200,
        expiryDate: '',
      });
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${couponId}`);
      setCoupons((prev) => prev.filter((c) => c._id !== couponId));
    } catch (error) {
      console.error('Failed to delete coupon:', error);
    }
  };

  return (
    <div className="bg-[#111827] text-white min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left border-b border-neutral-900 pb-6">
          <div>
            <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest">Store Administration</span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-0.5">Admin Dashboard</h1>
            <p className="text-xs text-neutral-400">Real-time order monitoring, ingredient stock tracking & promotional coupons.</p>
          </div>
          <Button onClick={fetchData} variant="secondary" className="text-xs py-2 px-4">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-900 pb-3">
          {[
            { key: 'orders', label: 'Orders', icon: ClipboardList },
            { key: 'inventory', label: 'Inventory / Stock', icon: Layers },
            { key: 'coupons', label: 'Coupons', icon: Tag },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-btn text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-medium'
                    : 'bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-850'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]" />
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 text-left"
          >
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-neutral-900/40 border border-neutral-850 rounded-card overflow-hidden shadow-light">
                <div className="p-5 border-b border-neutral-850 flex justify-between items-center">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[#FF6B00]" />
                    Live Order Monitor
                  </h3>
                  <span className="text-xs text-neutral-500 font-medium">{orders.length} total orders</span>
                </div>
                {orders.length === 0 ? (
                  <div className="p-10 text-center text-neutral-500 text-sm">No orders registered yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase tracking-wider border-b border-neutral-850">
                        <tr>
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Pizzas</th>
                          <th className="p-4">Total</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Change Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-850">
                        {orders.map((o) => (
                          <tr key={o._id} className="hover:bg-neutral-900/30 transition-colors">
                            <td className="p-4 font-mono font-bold text-[#FF6B00]">#{o._id.substring(12)}</td>
                            <td className="p-4">
                              <span className="font-semibold block text-neutral-200">{o.user?.name || 'Guest'}</span>
                              <span className="text-[10px] text-neutral-500">{o.phone}</span>
                            </td>
                            <td className="p-4 text-neutral-400 max-w-xs">
                              {o.items.map((item, idx) => (
                                <span key={idx} className="block text-[11px]">
                                  • {item.name} ({item.size}) x{item.quantity}
                                </span>
                              ))}
                            </td>
                            <td className="p-4 font-extrabold text-white text-sm">₹{o.grandTotal}</td>
                            <td className="p-4">
                              <StatusBadge status={o.status} />
                            </td>
                            <td className="p-4">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateStatus(o._id, e.target.value)}
                                className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="in-kitchen">In Kitchen</option>
                                <option value="ready">Ready</option>
                                <option value="out-for-delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="bg-neutral-900/40 border border-neutral-850 rounded-card p-6 shadow-light">
                  <h3 className="font-bold text-base mb-6 flex items-center gap-2 border-b border-neutral-850 pb-3">
                    <Layers className="w-5 h-5 text-[#FF6B00]" />
                    Ingredient Inventory & Threshold Monitor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ingredients.map((ing) => {
                      const isLow = ing.quantity <= ing.threshold;
                      return (
                        <div
                          key={ing._id}
                          className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                            isLow
                              ? 'bg-[#E63946]/10 border-[#E63946]/30'
                              : 'bg-neutral-950 border-neutral-850'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm text-white">{ing.name}</h4>
                              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{ing.category}</span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className={`text-2xl font-extrabold ${isLow ? 'text-[#E63946]' : 'text-[#22C55E]'}`}>
                                {ing.quantity}
                              </span>
                              <span className="text-xs text-neutral-500">units in stock</span>
                            </div>
                            {isLow && (
                              <p className="text-[10px] text-[#E63946] flex items-center gap-1 mt-1 font-semibold">
                                <AlertTriangle className="w-3 h-3" /> Low stock alert (Threshold: {ing.threshold})
                              </p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-neutral-850 flex justify-between items-center">
                            <span className="text-[10px] text-neutral-500">₹{ing.price} / unit</span>
                            <Button
                              onClick={() => handleRestock(ing._id, ing.quantity)}
                              variant="secondary"
                              className="text-[10px] py-1 px-3"
                            >
                              <Plus className="w-3 h-3" /> Restock
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Coupons Tab */}
            {activeTab === 'coupons' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-5 bg-neutral-900/40 border border-neutral-850 p-6 rounded-card shadow-light space-y-4">
                  <h3 className="font-bold text-base flex items-center gap-2 border-b border-neutral-850 pb-3">
                    <Tag className="w-5 h-5 text-[#FF6B00]" /> Create Promotional Coupon
                  </h3>
                  {couponError && (
                    <p className="text-xs text-[#E63946] bg-[#E63946]/10 p-3 rounded-xl border border-[#E63946]/20">
                      {couponError}
                    </p>
                  )}
                  <form onSubmit={handleCreateCoupon} className="space-y-3">
                    <Input
                      label="Coupon Code"
                      placeholder="PIZZA50"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Discount (%)"
                        type="number"
                        value={newCoupon.discountPercentage}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discountPercentage: Number(e.target.value) })}
                        required
                      />
                      <Input
                        label="Max Discount (₹)"
                        type="number"
                        value={newCoupon.maxDiscount}
                        onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <Input
                      label="Min Order Value (₹)"
                      type="number"
                      value={newCoupon.minOrderValue}
                      onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: Number(e.target.value) })}
                      required
                    />
                    <Input
                      label="Expiry Date"
                      type="date"
                      value={newCoupon.expiryDate}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                      required
                    />
                    <Button type="submit" className="w-full py-2.5 text-xs">
                      <Plus className="w-4 h-4" /> Create Coupon
                    </Button>
                  </form>
                </div>

                <div className="md:col-span-7 bg-neutral-900/40 border border-neutral-850 p-6 rounded-card shadow-light space-y-4">
                  <h3 className="font-bold text-base border-b border-neutral-850 pb-3">Active Promotional Coupons</h3>
                  <div className="space-y-3">
                    {coupons.map((c) => (
                      <div key={c._id} className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="font-mono font-bold text-sm text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2.5 py-1 rounded-lg">
                            {c.code}
                          </span>
                          <div className="mt-2 text-xs text-neutral-400 space-y-0.5">
                            <p>{c.discountPercentage}% OFF up to ₹{c.maxDiscount}</p>
                            <p className="text-[10px] text-neutral-500">Min Order: ₹{c.minOrderValue} · Expires: {new Date(c.expiryDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button onClick={() => handleDeleteCoupon(c._id)} variant="danger" className="p-2 text-xs">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-card text-left shadow-light space-y-2">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Total Revenue</span>
                    <p className="text-3xl font-extrabold text-[#22C55E]">₹{analytics.totalRevenue || 0}</p>
                  </div>
                  <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-card text-left shadow-light space-y-2">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Total Orders</span>
                    <p className="text-3xl font-extrabold text-[#FF6B00]">{analytics.totalOrders || 0}</p>
                  </div>
                  <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-card text-left shadow-light space-y-2">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Avg Order Value</span>
                    <p className="text-3xl font-extrabold text-yellow-400">
                      ₹{analytics.totalOrders ? Math.round(analytics.totalRevenue / analytics.totalOrders) : 0}
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-card text-left shadow-light space-y-4">
                  <h3 className="font-bold text-base border-b border-neutral-850 pb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FF6B00]" /> Popular Pizza Sizes
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {['Small', 'Medium', 'Large'].map((size) => (
                      <div key={size} className="bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                        <span className="text-xs text-neutral-500 font-bold uppercase">{size}</span>
                        <p className="text-xl font-extrabold text-white mt-1">
                          {analytics.sizeDistribution?.[size.toLowerCase()] || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
