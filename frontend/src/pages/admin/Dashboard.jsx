import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DashboardCard from '../../components/admin/DashboardCard';
import api from '../../utils/api';
import {
  ShoppingBag,
  IndianRupee,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-neutral-400">Live operational metrics and store performance</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DashboardCard
            icon={ShoppingBag}
            title="Total Orders"
            value={metrics?.totalOrders || 0}
            accent="orange"
            subtitle={`${metrics?.pendingOrders || 0} active now`}
          />
          <DashboardCard
            icon={IndianRupee}
            title="Total Revenue"
            value={`₹${metrics?.totalRevenue || 0}`}
            accent="green"
            subtitle="Completed payments"
          />
          <DashboardCard
            icon={Users}
            title="Total Customers"
            value={metrics?.totalUsers || 0}
            accent="blue"
            subtitle="Registered accounts"
          />
          <DashboardCard
            icon={AlertTriangle}
            title="Inventory Alerts"
            value={metrics?.lowStockCount || 0}
            accent={metrics?.lowStockCount > 0 ? 'red' : 'yellow'}
            subtitle="Items below threshold"
          />
          <DashboardCard
            icon={IndianRupee}
            title="Wallet Liability"
            value={`₹${metrics?.totalWalletLiability || 0}`}
            accent="purple"
            subtitle="Total customer wallets"
          />
        </div>

        {/* Breakdown Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">Pending Orders</p>
                <p className="text-lg font-bold">{metrics?.pendingOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">Completed Orders</p>
                <p className="text-lg font-bold">{metrics?.completedOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-850 p-5 rounded-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">Cancelled Orders</p>
                <p className="text-lg font-bold">{metrics?.cancelledOrders || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-neutral-900/60 border border-neutral-850 rounded-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
              Recent Orders
            </h2>
          </div>

          {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 text-neutral-300">
                  {metrics.recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-neutral-850/50 transition-colors">
                      <td className="py-3.5 font-mono text-[11px]">#{ord._id.slice(-6)}</td>
                      <td className="py-3.5">{ord.user?.name || 'Guest User'}</td>
                      <td className="py-3.5 font-semibold text-white">₹{ord.grandTotal}</td>
                      <td className="py-3.5">
                        <StatusBadge status={ord.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-6">No recent orders recorded</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
