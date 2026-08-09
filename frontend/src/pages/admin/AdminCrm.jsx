import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../utils/api';
import {
  Users, Search, Filter, Mail, Award, Clock, Star,
  TrendingUp, ShieldCheck, AlertCircle, X, Send, CheckCircle2
} from 'lucide-react';

export default function AdminCrm() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [tier, setTier] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customer360, setCustomer360] = useState(null);
  const [loading360, setLoading360] = useState(false);

  // Campaign modal state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignData, setCampaignData] = useState({
    name: '',
    targetSegment: 'Inactive',
    subject: '',
    message: '',
    couponCode: '',
  });
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignSuccess, setCampaignSuccess] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (segment) params.append('segment', segment);
      if (tier) params.append('tier', tier);

      const res = await api.get(`/crm/admin/customers?${params.toString()}`);
      if (res.data.success) {
        setCustomers(res.data.customers);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed fetching CRM customers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, segment, tier]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpen360 = async (cust) => {
    setSelectedCustomer(cust);
    setLoading360(true);
    try {
      const res = await api.get(`/crm/admin/customers/${cust._id}`);
      if (res.data.success) {
        setCustomer360(res.data.data);
      }
    } catch (err) {
      console.error('Failed fetching 360 profile:', err);
    } finally {
      setLoading360(false);
    }
  };

  const handleCreateAndSendCampaign = async (e) => {
    e.preventDefault();
    try {
      setSendingCampaign(true);
      setCampaignSuccess('');
      // 1. Create draft
      const createRes = await api.post('/crm/admin/campaigns', campaignData);
      if (createRes.data.success) {
        const campaignId = createRes.data.data._id;
        // 2. Trigger send
        const sendRes = await api.post(`/crm/admin/campaigns/${campaignId}/send`);
        if (sendRes.data.success) {
          setCampaignSuccess(sendRes.data.message);
          setTimeout(() => {
            setShowCampaignModal(false);
            setCampaignSuccess('');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Campaign send failed:', err);
    } finally {
      setSendingCampaign(false);
    }
  };

  const segmentColors = {
    VIP: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Inactive: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    'At Risk': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    New: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-[#FF6B00]" />
              Customer Relationship Management (CRM)
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">360° Customer Intelligence, Retention Segments & Campaigns</p>
          </div>

          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
          >
            <Mail className="w-4 h-4" />
            Launch Retention Campaign
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-900/60 p-4 border border-neutral-800 rounded-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-[#FF6B00]"
            />
          </div>

          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B00]"
          >
            <option value="">All Segments</option>
            <option value="VIP">VIP Customers</option>
            <option value="Active">Active (Ordered &lt; 30d)</option>
            <option value="Inactive">Inactive (30d - 90d)</option>
            <option value="At Risk">At Risk (&gt; 90d)</option>
            <option value="New">New Customers</option>
          </select>

          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B00]"
          >
            <option value="">All Loyalty Tiers</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </select>
        </div>

        {/* Customer Table */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Customers Directory ({total})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Segment</th>
                    <th className="p-4">Loyalty Tier</th>
                    <th className="p-4 text-right">Orders</th>
                    <th className="p-4 text-right">Lifetime Spend</th>
                    <th className="p-4">Last Order</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 text-neutral-300">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-neutral-850/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] text-neutral-500">{c.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${segmentColors[c.segment] || segmentColors.New}`}>
                          {c.segment}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-amber-400 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          {c.loyaltyTier}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-white">{c.completedOrders || 0}</td>
                      <td className="p-4 text-right font-bold text-emerald-400">₹{c.totalSpent?.toLocaleString()}</td>
                      <td className="p-4 text-neutral-400">
                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpen360(c)}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-[#FF6B00] text-white rounded-xl font-bold transition-colors"
                        >
                          View 360°
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-8">No customers matching current filters.</p>
          )}
        </div>

        {/* Customer 360 Drawer/Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
            <div className="w-full max-w-2xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto p-6 space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white">{selectedCustomer.name}</h2>
                  <p className="text-xs text-neutral-400">{selectedCustomer.email} • Code: {selectedCustomer.referralCode}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loading360 ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : customer360 ? (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                      <p className="text-[11px] text-neutral-400">Lifetime Value</p>
                      <p className="text-xl font-black text-emerald-400">₹{customer360.metrics?.totalSpent}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                      <p className="text-[11px] text-neutral-400">Completed Orders</p>
                      <p className="text-xl font-black text-white">{customer360.metrics?.completedOrders}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                      <p className="text-[11px] text-neutral-400">Loyalty Points</p>
                      <p className="text-xl font-black text-orange-400">{customer360.loyalty?.points}</p>
                    </div>
                  </div>

                  {/* Behavioral Insights */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                    <h3 className="font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#FF6B00]" /> Behavioral Preferences
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-neutral-300">
                      <div>Favorite Pizza: <span className="font-bold text-white">{customer360.preferences?.favoritePizza}</span></div>
                      <div>Preferred Day: <span className="font-bold text-white">{customer360.preferences?.preferredOrderDay}</span></div>
                      <div>Preferred Time: <span className="font-bold text-white">{customer360.preferences?.preferredOrderHour}</span></div>
                      <div>Avg Order Value: <span className="font-bold text-white">₹{customer360.metrics?.avgOrderValue}</span></div>
                    </div>
                  </div>

                  {/* Reviews & Referrals */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                      <p className="font-bold text-white mb-1">Reviews Submitted</p>
                      <p className="text-lg font-black text-amber-400">{customer360.reviews?.count} Reviews</p>
                      <p className="text-[11px] text-neutral-500">Avg Rating: {customer360.reviews?.avgRatingGiven} ★</p>
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                      <p className="font-bold text-white mb-1">Successful Referrals</p>
                      <p className="text-lg font-black text-blue-400">{customer360.referrals?.successfulReferrals} Friends</p>
                      <p className="text-[11px] text-neutral-500">{customer360.referrals?.earningsPoints} Pts Earned</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Campaign Modal */}
        {showCampaignModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#FF6B00]" /> Launch Retention Campaign
                </h2>
                <button onClick={() => setShowCampaignModal(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {campaignSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {campaignSuccess}
                </div>
              )}

              <form onSubmit={handleCreateAndSendCampaign} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. We Miss You 20% Off"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Target Customer Segment</label>
                  <select
                    value={campaignData.targetSegment}
                    onChange={(e) => setCampaignData({ ...campaignData, targetSegment: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Inactive">Inactive Customers (30d - 90d)</option>
                    <option value="At Risk">At Risk (&gt; 90d)</option>
                    <option value="VIP">VIP High Spenders</option>
                    <option value="New">New Registrations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Email Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Here is ₹100 off your next pizza!"
                    value={campaignData.subject}
                    onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Message Body</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Write custom message..."
                    value={campaignData.message}
                    onChange={(e) => setCampaignData({ ...campaignData, message: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Optional Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MISSYOU100"
                    value={campaignData.couponCode}
                    onChange={(e) => setCampaignData({ ...campaignData, couponCode: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCampaignModal(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingCampaign}
                    className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-bold flex items-center gap-2"
                  >
                    {sendingCampaign ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Send className="w-4 h-4" /> Send Campaign</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
