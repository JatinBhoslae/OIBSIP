import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function MyOrders() {
  const { token } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'

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
            <h1 className="text-3xl font-extrabold tracking-tight text-white">My Orders</h1>
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
                    <Link
                      to={`/orders/${order.trackingCode || order._id}`}
                      className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-bold rounded-xl transition-all"
                    >
                      Track Order Live
                    </Link>

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
    </div>
  );
}
