import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
  User, MapPin, Phone, Mail, Wallet, Plus, Trash2, Edit3, Save, X,
  Award, Gift, Share2, Copy, Check, Clock, Sparkles, ArrowRight, ShieldCheck, Zap, AlertCircle
} from 'lucide-react';

const TABS = ['General', 'Rewards'];

export default function Profile() {
  const { user: authUser, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('General');

  // Profile State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState(null);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrZip, setAddrZip] = useState('');

  // Rewards State
  const [balanceData, setBalanceData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(null);
  const [redeemedCoupon, setRedeemedCoupon] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'Rewards' && token) fetchLoyaltyData();
  }, [activeTab, token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile');
      const u = res.data.user;
      setProfile(u);
      setEditName(u.name || '');
      setEditPhone(u.phone || '');
      setAddresses(u.addresses || []);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage('');
      const res = await api.put('/auth/profile', { name: editName, phone: editPhone });
      if (res.data.success) {
        setProfile(prev => ({ ...prev, name: editName, phone: editPhone }));
        setEditing(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const resetAddressForm = () => {
    setAddrLabel('Home');
    setAddrStreet('');
    setAddrCity('');
    setAddrZip('');
    setShowAddressForm(false);
    setEditingAddressIdx(null);
  };

  const handleAddAddress = async () => {
    if (!addrStreet || !addrCity || !addrZip) return;
    const newAddr = { label: addrLabel, street: addrStreet, city: addrCity, zipCode: addrZip };
    let updated;
    if (editingAddressIdx !== null) {
      updated = [...addresses];
      updated[editingAddressIdx] = newAddr;
    } else {
      updated = [...addresses, newAddr];
    }
    try {
      setSaving(true);
      const res = await api.put('/auth/profile', { addresses: updated });
      if (res.data.success) {
        setAddresses(updated);
        resetAddressForm();
        setMessage(editingAddressIdx !== null ? 'Address updated!' : 'Address added!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (idx) => {
    const updated = addresses.filter((_, i) => i !== idx);
    try {
      await api.put('/auth/profile', { addresses: updated });
      setAddresses(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAddress = (idx) => {
    const a = addresses[idx];
    setAddrLabel(a.label);
    setAddrStreet(a.street);
    setAddrCity(a.city);
    setAddrZip(a.zipCode);
    setEditingAddressIdx(idx);
    setShowAddressForm(true);
  };

  // Wallet Handlers
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  const handleTopup = async () => {
    try {
      setSaving(true);
      const res = await api.post('/wallet/topup', { amount: topupAmount });
      if (res.data.success) {
        setProfile(prev => ({ ...prev, walletBalance: res.data.walletBalance }));
        setMessage(res.data.message);
        setShowTopup(false);
        setTopupAmount('');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to top up wallet');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setSaving(true);
      const res = await api.post('/wallet/withdraw', { 
        amount: withdrawAmount, 
        bankDetails: { accountNumber: bankAcc, ifsc: bankIfsc } 
      });
      if (res.data.success) {
        setProfile(prev => ({ ...prev, walletBalance: res.data.walletBalance }));
        setMessage(res.data.message);
        setShowWithdraw(false);
        setWithdrawAmount('');
        setBankAcc('');
        setBankIfsc('');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to withdraw from wallet');
    } finally {
      setSaving(false);
    }
  };

  // Loyalty / Rewards
  const fetchLoyaltyData = async () => {
    try {
      const [balRes, rewRes, txRes, refRes] = await Promise.all([
        api.get('/loyalty/balance'),
        api.get('/loyalty/rewards'),
        api.get('/loyalty/transactions'),
        api.get('/referrals/stats'),
      ]);
      if (balRes.data.success) setBalanceData(balRes.data.data);
      if (rewRes.data.success) setRewards(rewRes.data.data);
      if (txRes.data.success) setTransactions(txRes.data.data);
      if (refRes.data.success) setReferralData(refRes.data.data);
    } catch (err) {
      console.error('Failed to load loyalty data:', err);
      setError('Unable to load loyalty portal');
    }
  };

  const handleCopyReferral = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRedeemReward = async (rewardId) => {
    try {
      setRedeeming(rewardId);
      setError('');
      const res = await api.post('/loyalty/redeem', { rewardId });
      if (res.data.success) {
        setRedeemedCoupon(res.data.data.coupon);
        fetchLoyaltyData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Redemption failed');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tierColors = {
    Bronze: 'from-amber-700 to-amber-900 text-amber-200 border-amber-600/30',
    Silver: 'from-slate-400 to-slate-600 text-slate-100 border-slate-400/30',
    Gold: 'from-yellow-500 to-amber-600 text-yellow-100 border-yellow-400/30',
    Platinum: 'from-violet-600 to-purple-800 text-purple-100 border-purple-400/30',
  };

  const currentTier = balanceData?.tier || profile?.loyaltyTier || 'Bronze';
  const points = balanceData?.points || profile?.loyaltyPoints || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <User className="w-8 h-8 text-[#FF6B00]" />
            My Profile
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage your account, saved addresses, wallet, and rewards.
          </p>
        </div>
        {/* Wallet Balance & Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 bg-gradient-to-r from-[#FF6B00]/20 to-[#FF6B00]/5 border border-[#FF6B00]/30 px-5 py-3 rounded-2xl w-fit">
            <Wallet className="w-6 h-6 text-[#FF6B00]" />
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Pizza Wallet</p>
              <p className="text-xl font-black text-[#FF6B00]">₹{profile?.walletBalance || 0}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button 
                onClick={() => { setShowTopup(!showTopup); setShowWithdraw(false); }}
                className="bg-[#FF6B00] text-white text-[10px] px-3 py-1.5 rounded-lg font-bold"
              >
                Top Up
              </button>
              <button 
                onClick={() => { setShowWithdraw(!showWithdraw); setShowTopup(false); }}
                className="bg-neutral-800 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold"
              >
                Withdraw
              </button>
            </div>
          </div>
          
          {/* Top-up Form */}
          {showTopup && (
            <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl flex gap-2 items-center w-fit animate-in fade-in zoom-in-95 duration-200">
              <span className="text-neutral-400 text-xs">₹</span>
              <input 
                type="number" 
                value={topupAmount} 
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="Amount" 
                className="bg-transparent border-b border-neutral-600 text-white text-xs w-20 outline-none"
              />
              <button onClick={handleTopup} disabled={saving} className="bg-emerald-500 text-neutral-950 text-[10px] px-2 py-1 rounded font-bold ml-2">Add</button>
            </div>
          )}
          
          {/* Withdraw Form */}
          {showWithdraw && (
            <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-xl space-y-2 w-fit animate-in fade-in zoom-in-95 duration-200">
              <div className="flex gap-2 items-center">
                <span className="text-neutral-400 text-xs">₹</span>
                <input 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount" 
                  className="bg-transparent border-b border-neutral-600 text-white text-xs w-20 outline-none"
                />
              </div>
              <input 
                type="text" 
                value={bankAcc} 
                onChange={(e) => setBankAcc(e.target.value)}
                placeholder="Bank Account No." 
                className="bg-transparent border-b border-neutral-600 text-white text-[10px] w-full outline-none mt-1"
              />
              <input 
                type="text" 
                value={bankIfsc} 
                onChange={(e) => setBankIfsc(e.target.value)}
                placeholder="IFSC Code" 
                className="bg-transparent border-b border-neutral-600 text-white text-[10px] w-full outline-none mt-1"
              />
              <button onClick={handleWithdraw} disabled={saving} className="bg-rose-500 text-white text-[10px] px-2 py-1 rounded font-bold w-full mt-1">Withdraw to Bank</button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl font-semibold">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900/60 border border-neutral-800 p-1 rounded-2xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {tab === 'General' ? '👤 General' : '🏆 Rewards'}
          </button>
        ))}
      </div>

      {/* GENERAL TAB */}
      {activeTab === 'General' && (
        <div className="space-y-6">
          {/* Personal Info Card */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#FF6B00]" />
                Personal Information
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-[#FF6B00] hover:underline flex items-center gap-1 font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="text-xs bg-[#FF6B00] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-orange-600 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setEditName(profile.name); setEditPhone(profile.phone || ''); }}
                    className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-700 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-neutral-400 flex items-center gap-1.5 font-semibold"><User className="w-3.5 h-3.5" /> Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FF6B00] transition"
                  />
                ) : (
                  <p className="text-white font-semibold text-sm">{profile?.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 flex items-center gap-1.5 font-semibold"><Mail className="w-3.5 h-3.5" /> Email</label>
                <p className="text-white font-semibold text-sm">{profile?.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 flex items-center gap-1.5 font-semibold"><Phone className="w-3.5 h-3.5" /> Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FF6B00] transition"
                  />
                ) : (
                  <p className="text-white font-semibold text-sm">{profile?.phone || 'Not set'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 flex items-center gap-1.5 font-semibold"><Award className="w-3.5 h-3.5" /> Loyalty Tier</label>
                <p className="text-white font-semibold text-sm">{profile?.loyaltyTier || 'Bronze'} · {profile?.loyaltyPoints || 0} pts</p>
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6B00]" />
                Saved Delivery Addresses
              </h2>
              <button
                onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                className="text-xs bg-[#FF6B00] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-orange-600 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            {/* Address Form */}
            {showAddressForm && (
              <div className="bg-neutral-950 border border-neutral-700 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-white">{editingAddressIdx !== null ? 'Edit Address' : 'New Address'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-semibold uppercase">Label</label>
                    <select
                      value={addrLabel}
                      onChange={(e) => setAddrLabel(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#FF6B00]"
                    >
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-semibold uppercase">Street</label>
                    <input
                      type="text"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="Street address"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-semibold uppercase">City</label>
                    <input
                      type="text"
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      placeholder="City"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-semibold uppercase">Zip Code</label>
                    <input
                      type="text"
                      value={addrZip}
                      onChange={(e) => setAddrZip(e.target.value)}
                      placeholder="Pin code"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddAddress}
                    disabled={saving}
                    className="px-4 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition"
                  >
                    {saving ? 'Saving...' : editingAddressIdx !== null ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    onClick={resetAddressForm}
                    className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-lg hover:bg-neutral-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Address Cards */}
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-neutral-700 transition-all group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] text-[10px] font-bold rounded-full border border-[#FF6B00]/20 uppercase">
                          {addr.label}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {addr.street}, {addr.city} - {addr.zipCode}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditAddress(idx)}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(idx)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 text-center py-6">No saved addresses. Add one to speed up your checkout!</p>
            )}
          </div>
        </div>
      )}

      {/* REWARDS TAB */}
      {activeTab === 'Rewards' && (
        <div className="space-y-8">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-4 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Redeemed Success Banner */}
          {redeemedCoupon && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Reward Unlocked!</p>
                  <p className="text-xs text-neutral-300">Coupon Code: <span className="font-mono text-emerald-400 font-bold bg-neutral-900 px-2 py-0.5 rounded ml-1">{redeemedCoupon.code}</span></p>
                </div>
              </div>
              <button
                onClick={() => setRedeemedCoupon(null)}
                className="px-4 py-2 bg-emerald-500 text-neutral-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Tier & Points Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier Card */}
            <div className={`bg-gradient-to-br ${tierColors[currentTier]} border rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full border border-white/10">
                  {currentTier} Member
                </span>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <p className="text-4xl font-black">{points.toLocaleString()} <span className="text-base font-normal">pts</span></p>
                <p className="text-xs opacity-80 mt-1">₹1 spent = 1 Loyalty Point</p>
              </div>
              {balanceData && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span>Progress to {balanceData?.nextTier}</span>
                    <span>{points} / {balanceData?.nextTierPoints}</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-white h-full transition-all duration-500 rounded-full"
                      style={{ width: `${balanceData?.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Benefits Card */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Your Tier Perks</h3>
              </div>
              <div className="space-y-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Earn 1x points on every order</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>50 Bonus points for every review</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>500 Referral bonus per invited friend</span>
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between text-xs text-neutral-400">
                <span>Current Multiplier:</span>
                <span className="font-bold text-orange-400">{balanceData?.tierConfig?.multiplier || 1.0}x</span>
              </div>
            </div>

            {/* Referral Card */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Refer & Earn 500 Pts</h3>
              </div>

              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 space-y-2">
                <p className="text-[11px] text-neutral-400">Your Unique Referral Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralData?.referralLink || ''}
                    className="bg-transparent text-xs font-mono text-neutral-300 w-full outline-none truncate"
                  />
                  <button
                    onClick={handleCopyReferral}
                    className="p-2 bg-[#FF6B00] text-white rounded-xl hover:bg-orange-600 transition-colors flex-shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                <span>Successful Referrals:</span>
                <span className="font-bold text-emerald-400">{referralData?.successfulReferrals || 0}</span>
              </div>
            </div>
          </div>

          {/* Rewards Catalog */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#FF6B00]" />
              Redeem Rewards
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {rewards.map((reward) => {
                const canAfford = points >= reward.pointsRequired;
                return (
                  <div
                    key={reward._id}
                    className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-neutral-700 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="p-2 rounded-xl bg-orange-500/10 text-[#FF6B00]">
                          <Gift className="w-5 h-5" />
                        </span>
                        <span className="px-2.5 py-1 bg-neutral-800 text-xs font-bold text-orange-400 rounded-full">
                          {reward.pointsRequired} Pts
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{reward.name}</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">{reward.description}</p>
                    </div>

                    <button
                      onClick={() => handleRedeemReward(reward._id)}
                      disabled={!canAfford || redeeming === reward._id}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        canAfford
                          ? 'bg-[#FF6B00] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      {redeeming === reward._id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : canAfford ? (
                        <>Redeem Now <ArrowRight className="w-3.5 h-3.5" /></>
                      ) : (
                        `Need ${reward.pointsRequired - points} more pts`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Points Ledger */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Clock className="w-4 h-4 text-[#FF6B00]" />
              Points Ledger & Activity History
            </h2>

            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3 text-right">Points</th>
                      <th className="pb-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850 text-neutral-300">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-neutral-850/50 transition-colors">
                        <td className="py-3 text-neutral-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.points > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-white">{tx.description}</td>
                        <td className={`py-3 text-right font-bold ${tx.points > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.points > 0 ? `+${tx.points}` : tx.points}
                        </td>
                        <td className="py-3 text-right font-mono text-neutral-400">{tx.balanceAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 text-center py-6">No loyalty transactions recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
