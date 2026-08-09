import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  Award, Gift, Share2, Copy, Check, Clock, TrendingUp,
  Sparkles, ArrowRight, ShieldCheck, Zap, AlertCircle
} from 'lucide-react';

export default function CustomerLoyalty() {
  const [balanceData, setBalanceData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(null);
  const [redeemedCoupon, setRedeemedCoupon] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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

  const currentTier = balanceData?.tier || 'Bronze';
  const points = balanceData?.points || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Award className="w-8 h-8 text-[#FF6B00]" />
          PizzaHub Rewards & Loyalty
        </h1>
        <p className="text-xs text-neutral-400 mt-1">Earn points on every pizza, unlock exclusive rewards & invite friends!</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Redeemed Success Modal Banner */}
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

      {/* Tier & Points Overview Banner */}
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
          {/* Progress Bar */}
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

      {/* Points Audit Ledger History */}
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
  );
}
