import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function DeliveryHistory() {
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (pageToFetch = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/delivery/orders/history?page=${pageToFetch}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setHistory(res.data.data.orders);
        setTotalPages(res.data.data.totalPages);
        setPage(res.data.data.page);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchHistory(1);
  }, [token]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight">History</h1>
          <p className="text-xs text-neutral-400 mt-1">Past completed deliveries</p>
        </div>
        <Link to="/delivery/dashboard" className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </header>

      {loading && history.length === 0 ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {history.length > 0 ? history.map((order) => (
            <div key={order._id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {order.deliveryInfo?.deliveryStatus || 'DELIVERED'}
                  </span>
                  <h3 className="font-bold text-lg mt-1 text-white">#{order.orderNumber}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {new Date(order.deliveryInfo?.deliveredAt || order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">₹{order.grandTotal}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-neutral-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                  📍
                </div>
                <div className="text-xs text-neutral-400 line-clamp-2">
                  {order.shippingAddress?.street}, {order.shippingAddress?.city}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">🛵</div>
              <p className="text-sm font-bold text-neutral-400">No completed deliveries yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8">
          <button 
            disabled={page === 1}
            onClick={() => fetchHistory(page - 1)}
            className="px-4 py-2 bg-neutral-900 text-xs font-bold rounded-xl disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-neutral-500">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => fetchHistory(page + 1)}
            className="px-4 py-2 bg-neutral-900 text-xs font-bold rounded-xl disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
