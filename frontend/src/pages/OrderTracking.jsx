import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import ChatWidget from '../components/common/ChatWidget';
import LiveTrackingMap from '../components/common/LiveTrackingMap';

export default function OrderTracking() {
  const { id } = useParams(); // Accepts ObjectId or trackingCode or orderNumber
  const { token } = useContext(AuthContext);
  const { socket } = useContext(SocketContext) || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rating Modal States
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [hasRated, setHasRated] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id, token]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket || !order?._id) return;

    socket.emit('joinOrderRoom', { orderId: order._id });

    const handleStatusChanged = (data) => {
      if (data.orderId === order._id) {
        fetchOrder();
      }
    };

    const handleLocationUpdated = (data) => {
      if (data.orderId === order._id) {
        setOrder((prevOrder) => {
          if (!prevOrder) return prevOrder;
          return {
            ...prevOrder,
            deliveryInfo: {
              ...prevOrder.deliveryInfo,
              currentLocation: {
                lat: data.lat,
                lng: data.lng,
                timestamp: data.timestamp,
              },
            },
          };
        });
      }
    };

    socket.on('orderStatusChanged', handleStatusChanged);
    socket.on('deliveryLocationUpdated', handleLocationUpdated);

    return () => {
      socket.off('orderStatusChanged', handleStatusChanged);
      socket.off('deliveryLocationUpdated', handleLocationUpdated);
    };
  }, [socket, order?._id]);

  useEffect(() => {
    if (order?.status === 'Delivered' && !hasRated) {
      // Check if user has already rated in previous sessions (optional enhancement)
      setRatingModalOpen(true);
    }
  }, [order?.status, hasRated]);

  const handleSubmitRating = async () => {
    try {
      await axios.post(
        'http://localhost:5001/api/delivery/ratings',
        {
          orderId: order._id,
          partnerId: order.deliveryPartner.partnerId,
          rating: ratingScore,
          feedback: ratingFeedback,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasRated(true);
      setRatingModalOpen(false);
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  const steps = [
    { key: 'Order Received', label: 'Order Received', desc: 'We have received your order' },
    { key: 'Preparing', label: 'Preparing', desc: 'Preparing fresh ingredients' },
    { key: 'Baking', label: 'Baking in Oven', desc: 'Baking to golden perfection' },
    { key: 'Quality Check', label: 'Quality Check', desc: 'Final inspection & packaging' },
    { key: 'Ready', label: 'Ready for Pickup', desc: 'Hot & ready for delivery' },
    { key: 'Out For Delivery', label: 'Out for Delivery', desc: 'On its way to your doorstep' },
    { key: 'Delivered', label: 'Delivered', desc: 'Enjoy your hot delicious pizza!' },
  ];

  const getStepIndex = (statusStr) => {
    const statusMap = {
      pending: 0,
      confirmed: 0,
      'Order Received': 0,
      preparing: 1,
      Preparing: 1,
      'in-kitchen': 2,
      Baking: 2,
      'Quality Check': 3,
      ready: 4,
      Ready: 4,
      'out-for-delivery': 5,
      'Out For Delivery': 5,
      delivered: 6,
      Delivered: 6,
    };
    return statusMap[statusStr] !== undefined ? statusMap[statusStr] : 0;
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;
  const isCancelled = ['Cancelled', 'cancelled', 'Refunded', 'refunded'].includes(order?.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Order Not Found</h2>
        <p className="text-xs text-neutral-400 mb-6">{error || 'The requested order could not be located.'}</p>
        <Link to="/orders" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Live Tracker</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Tracking Code: <strong className="text-white">{order.trackingCode || 'N/A'}</strong> | Invoice:{' '}
                <strong className="text-neutral-300">{order.invoiceNumber || 'INV-2026-00001'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`http://localhost:5001/api/orders/${order._id}/invoice?print=true`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice PDF
              </a>
            </div>
          </div>

          {/* OTP display for customers */}
          {!isCancelled && order.status !== 'Delivered' && order.deliveryInfo?.deliveryOTP && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Secure Delivery Verification Code</span>
              <div className="text-2xl font-black text-white tracking-widest mt-1 bg-neutral-950 px-5 py-2 rounded-xl border border-neutral-850">
                {order.deliveryInfo.deliveryOTP}
              </div>
              <p className="text-[10px] text-neutral-400 mt-2">Share this OTP with your delivery executive to confirm receipt.</p>
            </div>
          )}

          {/* Cancellation Alert */}
          {isCancelled && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              ⚠️ This order is {order.status}. Reason: {order.cancelReason || 'Order cancelled.'}
            </div>
          )}

          {/* Estimated Delivery Countdown */}
          {!isCancelled && order.status !== 'Delivered' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400">Estimated Delivery Time</p>
                <h3 className="text-lg font-bold text-orange-400 mt-0.5">30 - 45 Minutes</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                ⏱️
              </div>
            </div>
          )}
        </div>

        {/* Live Stepper Timeline */}
        {!isCancelled && (
          <div className="p-6 md:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
            <h2 className="text-lg font-bold text-white">Order Progress Timeline</h2>

            <div className="space-y-6 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-800">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="flex items-start gap-4 relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isPassed
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                          : 'bg-neutral-950 text-neutral-600 border border-neutral-800'
                      } ${isCurrent ? 'ring-4 ring-orange-500/20 scale-110' : ''}`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-bold ${isPassed ? 'text-white' : 'text-neutral-500'}`}>
                          {step.label}
                        </h4>
                        {isCurrent && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse">
                            IN PROGRESS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interactive GPS map tracking */}
        {!isCancelled && order.status !== 'Delivered' && order.deliveryInfo?.deliveryStatus && order.deliveryInfo?.deliveryStatus !== 'UNASSIGNED' && (
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">Interactive Delivery Map</h3>
              {order.deliveryInfo?.currentLocation?.lat && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live GPS
                </span>
              )}
            </div>
            
            <LiveTrackingMap
              customerLocation={{ lat: 19.0760, lng: 72.8777 }} // Default center coordinates matching driver seed starting position
              driverLocation={order.deliveryInfo?.currentLocation}
            />
          </div>
        )}

        {/* Delivery Partner Details (if assigned) */}
        {order.deliveryInfo?.deliveryStatus && order.deliveryInfo?.deliveryStatus !== 'UNASSIGNED' && (
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xl">
                🛵
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delivery Executive Assigned</h3>
                <p className="text-xs text-neutral-300 mt-0.5 font-bold">
                  {order.deliveryInfo?.deliveryStatus}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Details & Summary */}
        <div className="p-6 md:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
          <h3 className="text-base font-bold text-white">Ordered Items</h3>
          <div className="divide-y divide-neutral-800">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <strong className="text-white">{item.quantity}x</strong> {item.name} ({item.size})
                </div>
                <div className="font-bold text-white">₹{item.price * item.quantity}</div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-800 space-y-2 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white">₹{order.totalAmount}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount ({order.couponCode})</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span className="text-white">₹{order.gst}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-white">{order.deliveryCharges === 0 ? 'FREE' : `₹${order.deliveryCharges}`}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-neutral-800">
            </div>
          </div>
        </div>
      </div>
      
      {/* Real-time driver chat */}
      {order && order.deliveryPartner?.partnerId && (
        <ChatWidget orderId={order._id} deliveryPartnerId={order.deliveryPartner.partnerId} />
      )}

      {/* Rating Modal */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md space-y-6">
            <h2 className="text-2xl font-bold text-center">Rate your Delivery</h2>
            <p className="text-sm text-neutral-400 text-center">How was your delivery experience with {order?.deliveryPartner?.partnerName || 'your partner'}?</p>
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingScore(star)}
                  className={`text-4xl transition-all ${ratingScore >= star ? 'text-amber-400 scale-110' : 'text-neutral-700 hover:text-amber-400/50'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Any additional feedback? (optional)"
              rows={3}
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
            />

            <button
              onClick={handleSubmitRating}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all"
            >
              Submit Rating
            </button>
            <button
              onClick={() => setRatingModalOpen(false)}
              className="w-full text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
