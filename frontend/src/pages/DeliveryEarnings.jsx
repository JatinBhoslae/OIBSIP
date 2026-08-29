import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DeliveryEarnings() {
  const { token } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const [summaryRes, historyRes] = await Promise.all([
          axios.get('http://localhost:5001/api/delivery/earnings/summary', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5001/api/delivery/earnings/history?limit=10', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (summaryRes.data.success) {
          setSummary(summaryRes.data.data);
        }
        if (historyRes.data.success) {
          setHistory(historyRes.data.data.earnings);
        }
      } catch (err) {
        console.error('Failed to fetch earnings', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchEarnings();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Formatting for Recharts
  const chartData = history.slice(0, 7).reverse().map((e, idx) => ({
    name: `Order ${e.order?.orderNumber?.slice(-4) || idx}`,
    amount: e.amount,
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Earnings</h1>
          <p className="text-xs text-neutral-400 mt-1">Track your delivery payouts</p>
        </div>
        <Link to="/delivery/dashboard" className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center hover:bg-neutral-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider mb-1">This Month</p>
          <h3 className="text-3xl font-black text-white">₹{summary?.monthTotal || 0}</h3>
          <p className="text-xs text-neutral-400 mt-2">{summary?.monthDeliveries || 0} deliveries</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">This Year</p>
          <h3 className="text-3xl font-black text-white">₹{summary?.yearTotal || 0}</h3>
          <p className="text-xs text-neutral-500 mt-2">{summary?.yearDeliveries || 0} deliveries</p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-8">
        <h3 className="text-sm font-bold mb-6">Recent Earnings Activity</h3>
        <div className="h-48 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#222' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#FF6B00' : '#444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-neutral-600 text-xs">No recent data</div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Latest Payouts</h3>
          <Link to="/delivery/history" className="text-xs font-bold text-[#FF6B00]">View All</Link>
        </div>
        <div className="space-y-3">
          {history.length > 0 ? history.map((earning) => (
            <div key={earning._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-sm">Order #{earning.order?.orderNumber || 'N/A'}</p>
                  <p className="text-[10px] text-neutral-500">{new Date(earning.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-400">+₹{earning.amount}</p>
                <p className="text-[10px] text-neutral-500">{earning.distanceKm} km</p>
              </div>
            </div>
          )) : (
            <p className="text-xs text-neutral-500 text-center py-4">No payouts found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
