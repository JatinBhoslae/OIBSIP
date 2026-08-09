import React, { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import { SocketContext } from '../../context/SocketContext';
import {
  Truck,
  Users,
  UserCheck,
  UserX,
  Plus,
  Compass,
  CheckCircle,
  MapPin,
  TrendingUp,
  Map,
  Shield,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDelivery() {
  const socket = useContext(SocketContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [partners, setPartners] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activePartnerLocations, setActivePartnerLocations] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'Bike',
    vehicleNumber: '',
    licenseNumber: '',
  });
  const [formError, setFormError] = useState(null);

  // Recommendations drawer / suggestion state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const partnersRes = await api.get('/admin/delivery-partners/partners');
      // Fetch orders to assign (Confirmed / Preparing / Ready etc but unassigned or ready to deliver)
      const ordersRes = await api.get('/orders'); // Get all orders, filter for ready/preparing without partner
      
      if (partnersRes.data.success) {
        setPartners(partnersRes.data.data);
      }

      if (ordersRes.data.success) {
        const filterUnassigned = ordersRes.data.orders.filter(
          (o) => !['Delivered', 'Cancelled', 'Refunded'].includes(o.status) && 
                 (!o.deliveryPartner || o.deliveryInfo?.deliveryStatus === 'UNASSIGNED')
        );
        setPendingOrders(filterUnassigned);
      }
    } catch (err) {
      console.error('Error fetching admin delivery data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to live GPS location updates via Socket
  useEffect(() => {
    if (!socket) return;

    socket.emit('joinAdminDeliveryRoom');

    const handleLocationUpdate = (data) => {
      // Map updates by partner ID
      setActivePartnerLocations((prev) => ({
        ...prev,
        [data.partnerId]: {
          lat: data.lat,
          lng: data.lng,
          lastUpdated: new Date(),
          orderId: data.orderId,
          deliveryStatus: data.deliveryStatus
        }
      }));
    };

    socket.on('partnerLocationUpdated', handleLocationUpdate);

    return () => {
      socket.off('partnerLocationUpdated', handleLocationUpdate);
    };
  }, [socket]);

  const handleStatusChange = async (partnerId, nextStatus) => {
    try {
      const res = await api.put(`/admin/delivery-partners/partners/${partnerId}/status`, { status: nextStatus });
      if (res.data.success) {
        setPartners(partners.map((p) => (p._id === partnerId ? { ...p, status: nextStatus } : p)));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update partner status');
    }
  };

  const handleRegisterPartner = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.post('/admin/delivery-partners/partners', formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          vehicleType: 'Bike',
          vehicleNumber: '',
          licenseNumber: '',
        });
        fetchDashboardData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to register delivery partner');
    }
  };

  const handleGetSuggestions = async (order) => {
    setSelectedOrder(order);
    setLoadingSuggestions(true);
    try {
      const res = await api.get('/admin/delivery-partners/smart-suggestions');
      if (res.data.success) {
        // Suggestions returned from recommendation system
        setSuggestions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAssign = async (partnerId) => {
    if (!selectedOrder) return;
    try {
      const res = await api.post(`/admin/delivery-partners/assign/${selectedOrder._id}`, { partnerId });
      if (res.data.success) {
        setSelectedOrder(null);
        setSuggestions([]);
        fetchDashboardData();
        
        // Notify driver via socket
        if (socket) {
          socket.emit('orderAssigned', { orderId: selectedOrder._id, partnerId });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Dispatch assignment failed');
    }
  };

  // KPIs
  const totalPartners = partners.length;
  const activePartners = partners.filter((p) => p.status === 'ACTIVE').length;
  const onlineDrivers = partners.filter((p) => p.availabilityStatus === 'AVAILABLE').length;
  const busyDrivers = partners.filter((p) => p.availabilityStatus === 'BUSY').length;

  return (
    <div className="flex h-screen bg-[#0B0F19] text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} title="Live Delivery & Fleet Dispatch" />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dashboard metrics KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#111827] border border-neutral-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 uppercase font-semibold">Total Drivers</p>
                <h3 className="text-2xl font-black mt-1">{totalPartners}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#111827] border border-neutral-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 uppercase font-semibold">Approved Fleet</p>
                <h3 className="text-2xl font-black mt-1">{activePartners}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#111827] border border-neutral-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 uppercase font-semibold">Online Drivers</p>
                <h3 className="text-2xl font-black mt-1 text-emerald-400">{onlineDrivers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#111827] border border-neutral-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 uppercase font-semibold">On-Trip (Busy)</p>
                <h3 className="text-2xl font-black mt-1 text-amber-400">{busyDrivers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live GPS Fleet Map Mockup */}
            <div className="lg:col-span-2 bg-[#111827] border border-neutral-800 rounded-3xl p-6 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold">Interactive Live Fleet Map</h3>
                  <p className="text-xs text-neutral-400">Real-time driver location updates & telemetry</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed
                </span>
              </div>

              {/* Simulated Map Workspace */}
              <div className="flex-1 bg-neutral-950 border border-neutral-850 rounded-2xl relative overflow-hidden flex flex-col justify-center items-center p-6 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(#ff6b001a_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                
                {/* Active driver lists with locations */}
                {Object.keys(activePartnerLocations).length > 0 ? (
                  <div className="z-10 w-full max-w-md space-y-3">
                    <p className="text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Active Telemetry Coordinates</p>
                    {Object.entries(activePartnerLocations).map(([pId, loc]) => {
                      const partnerObj = partners.find((p) => p._id === pId);
                      return (
                        <div key={pId} className="p-3 bg-[#111827] border border-neutral-850 rounded-xl flex items-center justify-between text-xs text-left">
                          <div>
                            <span className="font-bold text-[#FF6B00]">{partnerObj?.name || 'Driver'}</span>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Status: {loc.deliveryStatus}</p>
                          </div>
                          <div className="text-right text-[10px] text-neutral-500 font-mono">
                            <div>Lat: {loc.lat.toFixed(4)}</div>
                            <div>Lng: {loc.lng.toFixed(4)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="z-10 max-w-sm">
                    <Map className="w-12 h-12 text-neutral-600 mb-3 mx-auto" />
                    <p className="text-xs font-bold text-neutral-300">Telemetry feed ready</p>
                    <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                      Start simulating driver GPS movement from the Delivery Partner Portal to stream location updates here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Dispatch Recommendations Drawer */}
            <div className="bg-[#111827] border border-neutral-800 rounded-3xl p-6 flex flex-col h-full">
              <h3 className="text-base font-bold">Unassigned Deliveries</h3>
              <p className="text-xs text-neutral-400 mb-4">Pending smart dispatches</p>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {pendingOrders.length > 0 ? (
                  pendingOrders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => handleGetSuggestions(order)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedOrder?._id === order._id
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00]'
                          : 'bg-neutral-950 hover:bg-neutral-900 border-neutral-850'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-[#FF6B00] font-bold">Order #{order.orderNumber}</span>
                          <h4 className="text-xs font-bold text-neutral-200 mt-0.5">
                            {order.shippingAddress?.addressLine1}
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-orange-400">₹{order.grandTotal}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-2">
                        Status: <strong className="text-neutral-400">{order.status}</strong>
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-neutral-500">
                    No orders waiting for assignment
                  </div>
                )}
              </div>

              {/* Suggestions drawer */}
              {selectedOrder && (
                <div className="mt-6 pt-6 border-t border-neutral-800 space-y-4">
                  <h4 className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">Smart Dispatch Recommendations</h4>
                  {loadingSuggestions ? (
                    <div className="flex justify-center py-4">
                      <span className="w-5 h-5 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="space-y-3">
                      {suggestions.map((s) => (
                        <div key={s.partnerId} className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-neutral-200">{s.name}</span>
                            <div className="text-[10px] text-neutral-500 mt-0.5">Score: {s.score.toFixed(1)} pts</div>
                          </div>
                          <button
                            onClick={() => handleAssign(s.partnerId)}
                            className="bg-[#FF6B00] hover:bg-[#e05e00] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold"
                          >
                            Dispatch
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 text-center py-2">
                      No active online drivers available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fleet Driver Directory */}
          <div className="bg-[#111827] border border-neutral-800 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold">Fleet Directory</h3>
                <p className="text-xs text-neutral-400">Manage, onboarding, approve and suspend delivery partners</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#FF6B00] hover:bg-[#e05e00] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Onboard Partner
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="py-3 font-semibold">Driver Info</th>
                    <th className="py-3 font-semibold">Vehicle</th>
                    <th className="py-3 font-semibold">Availability</th>
                    <th className="py-3 font-semibold">Performance</th>
                    <th className="py-3 font-semibold">Account Status</th>
                    <th className="py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {partners.map((p) => (
                    <tr key={p._id} className="hover:bg-neutral-800/20">
                      <td className="py-4">
                        <div className="font-bold text-neutral-200">{p.name}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{p.email} | {p.phone}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-neutral-300 font-semibold">{p.vehicleType}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{p.vehicleNumber}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.availabilityStatus === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : p.availabilityStatus === 'BUSY'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          {p.availabilityStatus}
                        </span>
                      </td>
                      <td className="py-4">
                        <div>⭐⭐⭐⭐⭐ {p.averageRating}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">Delivered: {p.completedDeliveries}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 space-x-2">
                        {p.status === 'PENDING' || p.status === 'INACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(p._id, 'ACTIVE')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded font-bold text-[10px]"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(p._id, 'INACTIVE')}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded font-bold text-[10px]"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Dialog modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6"
            >
              <div>
                <h3 className="text-base font-bold">Onboard Delivery Partner</h3>
                <p className="text-xs text-neutral-400 mt-1">Register new carrier driver to PizzaHub operations</p>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl">
                  {formError}
                </div>
              )}

              <form onSubmit={handleRegisterPartner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Driver Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Car">Car</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Vehicle Number</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                    placeholder="KA-01-XX-1234"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">License Number</label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-neutral-850 hover:bg-neutral-850 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#FF6B00] hover:bg-[#e05e00] text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Register
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
