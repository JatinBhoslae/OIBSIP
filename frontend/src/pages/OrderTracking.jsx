import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { SocketContext } from '../context/SocketContext';
import { Clock, MapPin, Receipt, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';

const STATUS_TIMELINE = [
  { key: 'pending', label: 'Order Placed', desc: 'Waiting for restaurant confirmation' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Restaurant accepted your order' },
  { key: 'preparing', label: 'Preparing', desc: 'Stretching dough and adding fresh toppings' },
  { key: 'in-kitchen', label: 'In Kitchen', desc: 'Baking inside the stone oven' },
  { key: 'ready', label: 'Ready', desc: 'Packed fresh and hot' },
  { key: 'out-for-delivery', label: 'Out For Delivery', desc: 'Rider is on the way' },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your warm pizza!' },
];

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelMessage, setCancelMessage] = useState('');

  const socket = useContext(SocketContext);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('joinOrderRoom', { orderId: id });

    socket.on('orderStatusChanged', (data) => {
      if (data.orderId === id) {
        setOrder((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    });

    return () => {
      socket.off('orderStatusChanged');
    };
  }, [socket, id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.order);
    } catch (error) {
      console.error('Failed to load order tracking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      const res = await api.post(`/orders/${id}/cancel`);
      setOrder(res.data.order);
      setCancelMessage('Order cancelled successfully.');
    } catch (error) {
      setCancelMessage(error.response?.data?.message || 'Cancellation failed');
    }
  };

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return STATUS_TIMELINE.findIndex((s) => s.key === order.status);
  };

  if (loading) {
    return (
      <div className="bg-[#111827] text-white min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#111827] text-white min-h-screen flex flex-col justify-center items-center py-20 px-6">
        <h2 className="text-2xl font-bold">Order Not Found</h2>
        <p className="text-neutral-500 text-sm mt-2">The requested order tracking reference does not exist.</p>
      </div>
    );
  }

  const currentIdx = getCurrentStatusIndex();
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-[#111827] text-white min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Header */}
        <div className="md:col-span-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-900 pb-6 text-left">
          <div>
            <span className="text-[10px] text-[#FF6B00] font-bold uppercase tracking-widest">Order Reference</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">#{order._id}</h1>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            {['pending', 'confirmed'].includes(order.status) && (
              <Button onClick={handleCancelOrder} variant="danger" className="text-xs py-1.5 px-4">
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {cancelMessage && (
          <div className="md:col-span-12 bg-[#FF6B00]/10 p-3 rounded-xl border border-[#FF6B00]/20 text-xs text-[#FF6B00] text-left font-semibold">
            {cancelMessage}
          </div>
        )}

        {/* Timeline */}
        <div className="md:col-span-7 bg-neutral-900/40 border border-neutral-850 p-6 rounded-card text-left shadow-light">
          <h3 className="font-bold text-lg mb-6 border-b border-neutral-850 pb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FF6B00]" />
            Live Status Tracker
          </h3>

          {isCancelled ? (
            <div className="flex items-center gap-3 bg-[#E63946]/10 border border-[#E63946]/20 p-5 rounded-xl text-[#E63946] text-sm font-semibold">
              <XCircle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold">Order Cancelled</p>
                <p className="text-xs text-[#E63946]/70 mt-0.5">This order has been cancelled. Inventory restored.</p>
              </div>
            </div>
          ) : (
            <div className="relative border-l-2 border-neutral-800 ml-4 space-y-8">
              {STATUS_TIMELINE.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                const isUpcoming = idx > currentIdx;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-8"
                  >
                    {/* Bullet */}
                    <div
                      className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-500 ${isCompleted ? 'bg-[#22C55E] border-[#22C55E]' : isActive ? 'bg-[#111827] border-[#FF6B00] scale-125 shadow-lg shadow-[#FF6B00]/20' : 'bg-[#111827] border-neutral-800'}`}
                    />
                    {/* Pulsing ring for active */}
                    {isActive && (
                      <div className="absolute -left-[13px] top-[2px] w-6 h-6 rounded-full border-2 border-[#FF6B00] animate-ping opacity-30" />
                    )}
                    <div className={isUpcoming ? 'opacity-30' : 'opacity-100'}>
                      <h4 className={`font-bold text-sm ${isActive ? 'text-[#FF6B00]' : isCompleted ? 'text-[#22C55E]' : 'text-neutral-200'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="md:col-span-5 space-y-6 text-left">
          {/* Address */}
          <div className="bg-neutral-900/60 border border-neutral-850 p-6 rounded-card space-y-3 shadow-light">
            <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-neutral-850 pb-2 uppercase tracking-wider text-neutral-300">
              <MapPin className="w-4 h-4 text-[#FF6B00]" />
              Delivery Address
            </h3>
            <div className="space-y-1 text-xs text-neutral-300">
              <p className="font-semibold text-white">{order.user.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city} - {order.shippingAddress.zipCode}</p>
              <p className="text-neutral-500 pt-1">Phone: {order.phone}</p>
            </div>
          </div>

          {/* Invoice Breakdown */}
          <div className="bg-neutral-900/60 border border-neutral-850 p-6 rounded-card space-y-4 shadow-light">
            <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-neutral-850 pb-2 uppercase tracking-wider text-neutral-300">
              <Receipt className="w-4 h-4 text-[#FF6B00]" />
              Payment Summary
            </h3>

            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 text-[10px]">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-neutral-300">
                  <span>{item.name} <span className="text-neutral-500">x{item.quantity}</span></span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-850 pt-3 space-y-2 text-[10px] text-neutral-400">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{order.totalAmount}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#22C55E]"><span>Discount</span><span>-₹{order.discountAmount}</span></div>
              )}
              <div className="flex justify-between"><span>GST</span><span>₹{order.gst}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{order.deliveryCharges === 0 ? 'Free' : `₹${order.deliveryCharges}`}</span></div>
              <div className="border-t border-neutral-850 pt-2 flex justify-between font-bold text-white text-sm">
                <span>Total Paid</span>
                <span className="text-[#FF6B00] font-extrabold text-base">₹{order.grandTotal}</span>
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 flex items-center gap-2 text-[9px] text-neutral-400">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
              <div>
                <p className="font-semibold text-neutral-300">Payment Verified</p>
                <p className="font-mono text-neutral-600">{order.paymentId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
