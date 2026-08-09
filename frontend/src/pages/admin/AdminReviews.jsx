import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../utils/api';
import {
  Star, CheckCircle2, XCircle, AlertTriangle, MessageSquare,
  ThumbsUp, ShieldCheck, CornerDownRight, RefreshCw, X
} from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/reviews/admin?status=${statusFilter}`
        : '/reviews/admin';
      const res = await api.get(url);
      if (res.data.success) {
        setReviews(res.data.data);
        setTotal(res.data.total);
        setPendingCount(res.data.pendingCount);
      }
    } catch (err) {
      console.error('Failed fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/reviews/admin/${id}/status`, { status });
      if (res.data.success) {
        fetchReviews();
      }
    } catch (err) {
      console.error('Failed updating review status:', err);
    }
  };

  const handleSendResponse = async (id) => {
    if (!responseText.trim()) return;
    try {
      const res = await api.post(`/reviews/admin/${id}/respond`, { comment: responseText });
      if (res.data.success) {
        setRespondingId(null);
        setResponseText('');
        fetchReviews();
      }
    } catch (err) {
      console.error('Failed adding admin response:', err);
    }
  };

  const renderStars = (rating) => (
    <div className="flex text-yellow-400 gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-700'}`}
        />
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-[#FF6B00]" />
              Customer Review Moderation
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">Monitor ratings, verify buyer badges, approve reviews & respond to customers</p>
          </div>

          <button
            onClick={fetchReviews}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto bg-neutral-900/60 p-1.5 border border-neutral-800 rounded-2xl">
          {[
            { label: 'All Reviews', value: '' },
            { label: 'Approved', value: 'Approved' },
            { label: `Pending (${pendingCount})`, value: 'Pending', badge: pendingCount > 0 },
            { label: 'Flagged', value: 'Flagged' },
            { label: 'Rejected', value: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.value
                  ? 'bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-3 hover:border-neutral-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-3">
                    {renderStars(rev.rating)}
                    <span className="text-xs font-bold text-white">{rev.pizza?.name || 'Pizza'}</span>
                    {rev.verifiedPurchase && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3" /> Verified Buyer
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      rev.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      rev.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      rev.status === 'Flagged' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      {rev.status}
                    </span>

                    {/* Status Action Buttons */}
                    <button
                      onClick={() => handleUpdateStatus(rev._id, 'Approved')}
                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg"
                      title="Approve"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(rev._id, 'Flagged')}
                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg"
                      title="Flag"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(rev._id, 'Rejected')}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                      title="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  {rev.title && <h3 className="text-xs font-bold text-white mb-1">{rev.title}</h3>}
                  <p className="text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-850">
                  <span>By {rev.user?.name || 'Customer'} ({rev.user?.email}) • {new Date(rev.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-neutral-400" /> {rev.helpfulCount || 0}</span>
                    <button
                      onClick={() => setRespondingId(respondingId === rev._id ? null : rev._id)}
                      className="flex items-center gap-1 text-[#FF6B00] hover:underline font-bold"
                    >
                      <MessageSquare className="w-3 h-3" /> Reply
                    </button>
                  </div>
                </div>

                {/* Existing Admin Response */}
                {rev.adminResponse?.comment && (
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs space-y-1 flex items-start gap-2">
                    <CornerDownRight className="w-4 h-4 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#FF6B00]">PizzaHub Response</p>
                      <p className="text-neutral-300">{rev.adminResponse.comment}</p>
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                {respondingId === rev._id && (
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Write official merchant response..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF6B00]"
                    />
                    <button
                      onClick={() => handleSendResponse(rev._id)}
                      className="px-4 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors"
                    >
                      Post Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 text-center py-12">No reviews found matching current filter.</p>
        )}
      </div>
    </AdminLayout>
  );
}
