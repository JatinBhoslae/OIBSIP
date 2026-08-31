import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { Star, X, Check, Award } from 'lucide-react';

export default function MyOrders() {
  const { token, user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'

  // Review modal state
  const [reviewOrder, setReviewOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchMyOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5001/api/orders/my', {
          headers: { Authorization: `Bearer ${token}` },
          params: { tab: activeTab },
        });
        if (res.data.success) {
          setOrders(res.data.orders || []);
        }
      } catch (err) {
        console.error('Failed to fetch user orders:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMyOrders();
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5001/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setWalletBalance(res.data.user?.walletBalance || 0);
      }).catch(console.error);
    }
  }, [token]);

  const handleReorder = async (orderId) => {
    try {
      const res = await axios.post(
        `http://localhost:5001/api/orders/${orderId}/reorder`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.items) {
        res.data.items.forEach((item) => {
          addToCart(item);
        });
        navigate('/cart');
      }
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const res = await axios.post(
        `http://localhost:5001/api/orders/${orderId}/cancel`,
        { reason: 'Customer changed their mind' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o));
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      alert(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmittingReview(true);
    setReviewMessage('');
    try {
      await axios.post(
        `http://localhost:5001/api/pizzas/${selectedItem.pizza}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviewMessage('Review posted successfully!');
      setComment('');
      setTimeout(() => {
        setReviewOrder(null);
        setSelectedItem(null);
        setReviewMessage('');
      }, 1000);
    } catch (err) {
      setReviewMessage(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
      case 'delivered':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">Delivered</span>;
      case 'Cancelled':
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">Cancelled</span>;
      case 'Refunded':
      case 'refunded':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Refunded</span>;
      case 'Out For Delivery':
      case 'out-for-delivery':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Out for Delivery</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">Preparing</span>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              My Orders
              {walletBalance > 0 && (
                <span className="text-xs font-bold bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-3 py-1 rounded-full">
                  Pizza Wallet: ₹{walletBalance}
                </span>
              )}
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Track active deliveries, download invoices, and reorder your favorite pizzas.
            </p>
          </div>
          <Link
            to="/menu"
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all self-start sm:self-auto"
          >
            + Order New Pizza
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          {[
            { id: 'upcoming', label: 'Active & Upcoming' },
            { id: 'completed', label: 'Delivered Orders' },
            { id: 'cancelled', label: 'Cancelled / Refunded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800">
            <svg className="w-12 h-12 mx-auto text-neutral-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-base font-bold text-white mb-1">No orders found</h3>
            <p className="text-xs text-neutral-400 mb-4">You have no orders in this tab right now.</p>
            <Link
              to="/menu"
              className="inline-block px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800/80">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-white">
                        #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Ordered on {new Date(order.createdAt).toLocaleString()} | Tracking Code:{' '}
                      <strong className="text-orange-400">{order.trackingCode || 'N/A'}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-white">₹{order.grandTotal}</div>
                    <div className="text-[11px] text-neutral-400">{order.items.length} item(s)</div>
                  </div>
                </div>

                {/* Items preview */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-neutral-300">
                      <span>
                        <strong className="text-white">{item.quantity}x</strong> {item.name} ({item.size})
                      </span>
                      <span className="text-neutral-400">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
                  <div className="text-xs text-neutral-400">
                    Address: {order.shippingAddress?.street}, {order.shippingAddress?.city}
                  </div>

                  <div className="flex items-center gap-2">
                    {!['Cancelled', 'Refunded', 'cancelled', 'refunded'].includes(order.status) ? (
                      <Link
                        to={`/orders/${order.trackingCode || order._id}`}
                        className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-bold rounded-xl transition-all"
                      >
                        {order.status === 'Delivered' ? 'View Order Receipt' : 'Track Order Live'}
                      </Link>
                    ) : (
                      <span className="text-xs text-neutral-500 font-bold px-2 py-1">Order Cancelled</span>
                    )}

                    {['delivered', 'Delivered'].includes(order.status) && (
                      <button
                        onClick={() => {
                          setReviewOrder(order);
                          setSelectedItem(order.items[0] || null);
                          setRating(5);
                          setComment('');
                          setReviewMessage('');
                        }}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl transition-all"
                      >
                        Leave Review
                      </button>
                    )}

                    {['Order Received', 'Pending Payment', 'pending', 'confirmed', 'Preparing', 'Baking', 'Quality Check', 'Ready'].includes(order.status) && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition-all"
                      >
                        Cancel Order
                      </button>
                    )}

                    <button
                      onClick={() => handleReorder(order._id)}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-all"
                    >
                      Reorder Items
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog Overlay */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 flex flex-col text-left space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
              <div>
                <h3 className="font-bold text-sm">Write Review</h3>
                <p className="text-[10px] text-neutral-400">Order #{reviewOrder.orderNumber || reviewOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button onClick={() => setReviewOrder(null)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="font-bold text-neutral-400">Select Item to Review</label>
              <select
                value={selectedItem ? JSON.stringify(selectedItem) : ''}
                onChange={(e) => setSelectedItem(e.target.value ? JSON.parse(e.target.value) : null)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white focus:outline-none"
              >
                {reviewOrder.items.map((item, idx) => (
                  <option key={idx} value={JSON.stringify(item)}>{item.name} ({item.size})</option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <form onSubmit={handlePostReview} className="space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400">Rating:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-400 block">Comments</label>
                  <textarea
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your dining experience..."
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 bg-[#FF6B00] hover:bg-[#e05e00] rounded-xl text-white font-bold transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Feedback'}
                </button>

                {reviewMessage && (
                  <p className="text-center text-xs font-semibold text-emerald-400 mt-2">{reviewMessage}</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
