import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../utils/api';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle,
  AlertTriangle,
  Power,
  Navigation,
  Compass,
  Star,
  Activity,
  User,
  LogOut,
  Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWidget from '../components/common/ChatWidget';
import DeliveryChatbot from '../components/delivery/DeliveryChatbot';

export default function DeliveryDashboard() {
  const { user, logout } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [partner, setPartner] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [gpsSimulating, setGpsSimulating] = useState(false);
  const [gpsInterval, setGpsInterval] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Off');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/delivery/profile');
      if (res.data.success) {
        setPartner(res.data.data);
        if (res.data.data.activeDelivery) {
          setActiveOrder(res.data.data.activeDelivery);
        } else {
          setActiveOrder(null);
        }
      }
    } catch (err) {
      console.error('Error fetching partner profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Socket setup
  useEffect(() => {
    if (!socket || !partner?._id) return;

    socket.emit('joinDeliveryPartnerRoom', { partnerId: partner._id });

    const handleAssignmentAlert = (data) => {
      // Order assignment or update notification
      fetchProfile();
    };

    socket.on('orderAssigned', handleAssignmentAlert);

    return () => {
      socket.off('orderAssigned', handleAssignmentAlert);
    };
  }, [socket, partner?._id]);

  // Clean up GPS simulation on unmount
  useEffect(() => {
    return () => {
      if (gpsInterval) clearInterval(gpsInterval);
    };
  }, [gpsInterval]);

  const toggleAvailability = async () => {
    try {
      const nextStatus = partner.availabilityStatus === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
      const res = await api.put('/delivery/availability', { availabilityStatus: nextStatus });
      if (res.data.success) {
        setPartner({ ...partner, availabilityStatus: nextStatus });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle availability');
    }
  };

  const updateStatus = async (status, remarks = '') => {
    if (!activeOrder) return;
    try {
      const res = await api.put(`/delivery/orders/${activeOrder._id}/status`, { status, remarks });
      if (res.data.success) {
        // Fetch fresh profile state
        fetchProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleOTPComplete = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    setOtpError(null);

    try {
      const res = await api.post(`/delivery/orders/${activeOrder._id}/complete`, { otp });
      if (res.data.success) {
        setOtpModalOpen(false);
        setOtp('');
        if (gpsInterval) {
          clearInterval(gpsInterval);
          setGpsInterval(null);
          setGpsSimulating(false);
          setLocationStatus('Off');
        }
        fetchProfile();
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleFailOrder = async () => {
    if (!activeOrder) return;
    const reason = prompt('Please enter reason for delivery failure:');
    if (!reason) return;

    try {
      const res = await api.put(`/delivery/orders/${activeOrder._id}/status`, {
        status: 'FAILED',
        remarks: reason
      });
      if (res.data.success) {
        if (gpsInterval) {
          clearInterval(gpsInterval);
          setGpsInterval(null);
          setGpsSimulating(false);
          setLocationStatus('Off');
        }
        fetchProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to report failure');
    }
  };

  // Haversine formula to calculate distance between two coordinates in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Start GPS Simulation
  const toggleGpsSimulation = () => {
    if (gpsSimulating) {
      clearInterval(gpsInterval);
      setGpsInterval(null);
      setGpsSimulating(false);
      setLocationStatus('Off');
    } else {
      setGpsSimulating(true);
      setLocationStatus('Simulating Active GPS...');
      
      const storeLat = 12.9700; 
      const storeLng = 77.5900;
      const destLat = activeOrder?.shippingAddress?.lat || 12.9780;
      const destLng = activeOrder?.shippingAddress?.lng || 77.6010;

      const totalDistanceKm = calculateDistance(storeLat, storeLng, destLat, destLng);
      const totalDistanceMeters = totalDistanceKm * 1000;
      
      // Speed: 500 meters per minute = 8.33 meters per second
      // Update interval: 5 seconds -> covers 41.65 meters per tick
      const distancePerTick = (500 / 60) * 5; 
      const totalSteps = Math.ceil(totalDistanceMeters / distancePerTick);
      
      let currentStep = 0;

      // Update backend location periodically
      const interval = setInterval(async () => {
        currentStep++;
        let lat, lng;
        
        if (currentStep >= totalSteps) {
          lat = destLat;
          lng = destLng;
          clearInterval(interval);
          setGpsInterval(null);
          setGpsSimulating(false);
          setLocationStatus('Reached Destination');
        } else {
          // Linear interpolation mock
          const t = currentStep / totalSteps;
          lat = storeLat + (destLat - storeLat) * t;
          lng = storeLng + (destLng - storeLng) * t;
        }

        try {
          await api.post(`/delivery/orders/${activeOrder._id}/location`, { lat, lng });
          
          // Also emit to Socket.io directly to make dashboard feel lightning fast
          if (socket) {
            socket.emit('deliveryPartnerLocationUpdate', {
              orderId: activeOrder._id,
              partnerId: partner._id,
              lat,
              lng
            });
          }
        } catch (err) {
          console.error('Error sending simulated GPS updates:', err);
        }
      }, 5000); // every 5 seconds

      setGpsInterval(interval);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/delivery/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-10">
      {/* Header */}
      <header className="sticky top-0 bg-[#0B0F1A] border-b border-neutral-800 px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-amber-500 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold">{partner?.name}</h1>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{partner?.employeeId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              partner?.availabilityStatus === 'AVAILABLE'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-neutral-800 border border-neutral-750 text-neutral-400'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {partner?.availabilityStatus === 'AVAILABLE' ? 'Online' : 'Offline'}
          </button>

          <button onClick={handleLogout} className="p-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Fleet performance / driver summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase">Completed</p>
              <h4 className="text-lg font-black">{partner?.completedDeliveries || 0}</h4>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase">Rating</p>
              <h4 className="text-lg font-black">{partner?.averageRating?.toFixed(1) || '5.0'}</h4>
            </div>
          </div>
        </div>

        {/* Financial Analytics */}
        <div className="grid grid-cols-3 gap-2">
           <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl flex flex-col justify-center items-center">
              <p className="text-[10px] text-neutral-400 uppercase text-center">Rev/Order</p>
              <h4 className="text-base font-black text-[#22C55E]">₹{partner?.analytics?.revenuePerDelivery || 0}</h4>
           </div>
           <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl flex flex-col justify-center items-center">
              <p className="text-[10px] text-neutral-400 uppercase text-center">Monthly</p>
              <h4 className="text-base font-black text-[#22C55E]">₹{partner?.analytics?.monthlyIncome || 0}</h4>
           </div>
           <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl flex flex-col justify-center items-center">
              <p className="text-[10px] text-neutral-400 uppercase text-center">Yearly</p>
              <h4 className="text-base font-black text-[#22C55E]">₹{partner?.analytics?.yearlyIncome || 0}</h4>
           </div>
        </div>

        {/* Active assignment card */}
        {activeOrder ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Header info */}
            <div className="p-6 bg-gradient-to-r from-orange-600/10 to-amber-600/10 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] bg-[#FF6B00]/20 text-[#FF6B00] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {activeOrder.deliveryInfo?.deliveryStatus || 'ASSIGNED'}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Order #{activeOrder.orderNumber || activeOrder._id.slice(-6).toUpperCase()}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">Grand Total</span>
                <span className="text-sm font-bold text-orange-400">₹{activeOrder.grandTotal}</span>
              </div>
            </div>

            {/* Address / delivery target info */}
            <div className="p-6 space-y-5">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-300">Customer Address</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {activeOrder.shippingAddress?.addressLine1}, {activeOrder.shippingAddress?.city}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-300">Customer Contact</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    <a href={`tel:${activeOrder.phone}`} className="text-orange-400 font-semibold hover:underline">
                      {activeOrder.phone}
                    </a>
                  </p>
                </div>
              </div>

              {/* GPS Tracker simulation control */}
              <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Compass className={`w-5 h-5 ${gpsSimulating ? 'text-orange-500 animate-spin' : 'text-neutral-500'}`} />
                  <div>
                    <h5 className="text-xs font-bold text-white">Live Tracking</h5>
                    <p className="text-[10px] text-neutral-400">{locationStatus}</p>
                  </div>
                </div>
                <button
                  onClick={toggleGpsSimulation}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gpsSimulating
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/40 hover:bg-[#FF6B00]/30'
                  }`}
                >
                  {gpsSimulating ? 'Stop GPS' : 'Start GPS'}
                </button>
              </div>

              {/* Status workflow engine */}
              <div className="pt-2 space-y-3">
                {activeOrder.deliveryInfo?.deliveryStatus === 'ASSIGNED' && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updateStatus('ACCEPTED', 'Driver accepted')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl transition-all"
                    >
                      Accept Job
                    </button>
                    <button
                      onClick={handleFailOrder}
                      className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs py-3 rounded-xl border border-neutral-750 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {activeOrder.deliveryInfo?.deliveryStatus === 'ACCEPTED' && (
                  <button
                    onClick={() => updateStatus('PICKED_UP', 'Picked up from restaurant')}
                    className="w-full bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Picked Up Order
                  </button>
                )}

                {activeOrder.deliveryInfo?.deliveryStatus === 'PICKED_UP' && (
                  <button
                    onClick={() => updateStatus('OUT_FOR_DELIVERY', 'Out for delivery to customer')}
                    className="w-full bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" /> Out For Delivery
                  </button>
                )}

                {['OUT_FOR_DELIVERY', 'REACHED_CUSTOMER'].includes(activeOrder.deliveryInfo?.deliveryStatus) && (
                  <div className="space-y-3">
                    {activeOrder.deliveryInfo?.deliveryStatus === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => updateStatus('REACHED_CUSTOMER', 'Reached customer location')}
                        className="w-full bg-amber-500 hover:bg-amber-650 text-neutral-950 font-black text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Reached customer
                      </button>
                    )}
                    
                    <button
                      onClick={() => setOtpModalOpen(true)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      Verify OTP & Complete Delivery
                    </button>
                    
                    {activeOrder.deliveryInfo?.deliveryStatus === 'REACHED_CUSTOMER' && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.post(`/delivery/orders/${activeOrder._id}/resend-otp`);
                            if (res.data.success) {
                              toast.success('OTP Resent Successfully');
                            }
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed to resend OTP');
                          }
                        }}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Resend OTP to Customer
                      </button>
                    )}

                    <button
                      onClick={handleFailOrder}
                      className="w-full bg-neutral-800 hover:bg-neutral-750 text-rose-400 border border-rose-500/20 font-bold text-xs py-2.5 rounded-xl transition-all"
                    >
                      Report Delivery Failed
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
              🛵
            </div>
            <div>
              <h3 className="font-bold text-white">No active delivery assignments</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Make sure you are marked "Online" to receive smart order dispatches from PizzaHub Admin.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* OTP verification popup modal */}
      <AnimatePresence>
        {otpModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4"
            >
              <div className="text-center">
                <h3 className="font-bold text-white text-base">Verify Delivery OTP</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Ask the customer for the 4-digit code shown on their tracking page.
                </p>
              </div>

              {otpError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center rounded-xl">
                  {otpError}
                </div>
              )}

              <form onSubmit={handleOTPComplete} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 text-center text-xl font-bold tracking-widest text-white focus:outline-none focus:border-[#FF6B00]"
                  placeholder="0000"
                />

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="submit"
                    className="bg-[#FF6B00] hover:bg-[#e05e00] text-white py-3 rounded-xl font-bold text-xs"
                  >
                    Confirm & Deliver
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpModalOpen(false);
                      setOtpError(null);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 py-3 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeOrder && (
        <ChatWidget orderId={activeOrder._id} deliveryPartnerId={partner?._id} />
      )}

      {/* AI Chatbot Widget */}
      <DeliveryChatbot />
    </div>
  );
}
