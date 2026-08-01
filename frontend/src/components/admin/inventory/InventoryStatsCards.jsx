import React from 'react';
import { Package, CheckCircle2, AlertTriangle, XCircle, IndianRupee } from 'lucide-react';
import DashboardCard from '../DashboardCard';

export default function InventoryStatsCards({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-neutral-900/60 border border-neutral-850 h-28 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <DashboardCard
        icon={Package}
        title="Total Items"
        value={stats.totalIngredients || 0}
        accent="blue"
        subtitle="Catalog size"
      />
      <DashboardCard
        icon={CheckCircle2}
        title="Available"
        value={stats.availableCount || 0}
        accent="green"
        subtitle="Sufficient stock"
      />
      <DashboardCard
        icon={AlertTriangle}
        title="Low Stock"
        value={stats.lowStockCount || 0}
        accent="orange"
        subtitle="Needs restock"
      />
      <DashboardCard
        icon={XCircle}
        title="Out of Stock"
        value={stats.outOfStockCount || 0}
        accent="red"
        subtitle="Unavailable items"
      />
      <DashboardCard
        icon={IndianRupee}
        title="Inventory Value"
        value={`₹${(stats.totalInventoryValue || 0).toLocaleString('en-IN')}`}
        accent="purple"
        subtitle="Purchase cost basis"
      />
    </div>
  );
}
