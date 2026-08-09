import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../utils/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingBag,
  Users, AlertTriangle, Clock, Package, BarChart3,
  Truck, CreditCard, Pizza, Download, RefreshCw,
  CheckCircle2, XCircle, Zap, Activity, Star, Target,
} from 'lucide-react';

const COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
const RANGE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: '90 Days', value: '90days' },
  { label: 'This Year', value: 'year' },
];

function KPICard({ icon: Icon, label, value, sub, color = 'orange', trend, trendVal }) {
  const colorMap = {
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400',
    green:  'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    blue:   'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    red:    'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
    amber:  'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    cyan:   'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  };
  const cls = colorMap[color] || colorMap.orange;
  return (
    <div className={`bg-gradient-to-br ${cls} border rounded-2xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-white/5">
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trendVal || trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-neutral-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
        {sub && <p className="text-[11px] text-neutral-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#FF6B00]" />
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-xs shadow-xl">
        <p className="text-neutral-400 mb-1.5">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Analytics() {
  const [range, setRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [orders, setOrders] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [pizzas, setPizzas] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [payments, setPayments] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [forecast, setForecast] = useState(null);

  const fetchAll = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [ov, rev, ord, cust, piz, inv, pay, del, fore] = await Promise.all([
        api.get(`/admin/analytics/overview?range=${range}`),
        api.get(`/admin/analytics/revenue?range=${range}`),
        api.get(`/admin/analytics/orders?range=${range}`),
        api.get(`/admin/analytics/customers?range=${range}`),
        api.get(`/admin/analytics/pizzas?range=${range}`),
        api.get(`/admin/analytics/inventory`),
        api.get(`/admin/analytics/payments?range=${range}`),
        api.get(`/admin/analytics/delivery?range=${range}`),
        api.get(`/admin/analytics/forecast`),
      ]);
      setOverview(ov.data.data);
      setRevenue(rev.data.data);
      setOrders(ord.data.data);
      setCustomers(cust.data.data);
      setPizzas(piz.data.data);
      setInventory(inv.data.data);
      setPayments(pay.data.data);
      setDelivery(del.data.data);
      setForecast(fore.data.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = async (type) => {
    try {
      const res = await api.get(`/admin/analytics/reports/${type}?range=${range}&type=sales`, {
        responseType: 'blob',
      });
      const mimeMap = { csv: 'text/csv', excel: 'application/vnd.ms-excel', pdf: 'text/html' };
      const extMap  = { csv: 'csv', excel: 'xls', pdf: 'html' };
      const blob = new Blob([res.data], { type: mimeMap[type] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PizzaHub_analytics.${extMap[type]}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: Activity },
    { id: 'revenue',   label: 'Revenue',   icon: TrendingUp },
    { id: 'orders',    label: 'Orders',    icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'pizzas',    label: 'Pizzas',    icon: Pizza },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'payments',  label: 'Payments',  icon: CreditCard },
    { id: 'delivery',  label: 'Delivery',  icon: Truck },
    { id: 'forecast',  label: 'Forecast',  icon: Zap },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#FF6B00]" />
              Business Intelligence
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">Real-time analytics & performance insights</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${range === r.value ? 'bg-[#FF6B00] text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {['csv','excel','pdf'].map((t) => (
                <button key={t} onClick={() => handleExport(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors uppercase">
                  <Download className="w-3.5 h-3.5" /> {t}
                </button>
              ))}
              <button onClick={() => fetchAll(true)} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-xs text-[#FF6B00] hover:bg-[#FF6B00]/20 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === id ? 'bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard icon={IndianRupee} label="Total Revenue" value={`\u20B9${overview.totalRevenue?.toLocaleString()}`} sub={`Avg \u20B9${overview.avgOrderValue}/order`} color="orange" trend={forecast?.growthPercentage} trendVal={forecast?.growthPercentage} />
                  <KPICard icon={ShoppingBag} label="Total Orders" value={overview.totalOrders} sub={`${overview.pendingOrders} active`} color="blue" />
                  <KPICard icon={Users} label="Active Customers" value={overview.activeCustomers} sub="Unique buyers" color="green" />
                  <KPICard icon={AlertTriangle} label="Low Stock Items" value={overview.lowStockItems} sub="Need restocking" color={overview.lowStockItems > 0 ? 'red' : 'green'} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard icon={CheckCircle2} label="Completed" value={overview.completedOrders} sub="Delivered" color="green" />
                  <KPICard icon={Clock} label="Pending" value={overview.pendingOrders} sub="In queue" color="amber" />
                  <KPICard icon={XCircle} label="Cancelled" value={overview.cancelledOrders} sub="Cancelled" color="red" />
                  <KPICard icon={Truck} label="Avg Delivery" value={`${overview.avgDeliveryTime} min`} sub="Fulfillment" color="cyan" />
                </div>
                {revenue?.dailyRevenue?.length > 0 && (
                  <SectionCard title="Revenue & Order Trend" icon={TrendingUp}>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={revenue.dailyRevenue}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(v) => v?.slice(5)} />
                        <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#FF6B00" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="orders" name="Orders" stroke="#3B82F6" fill="url(#ordGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </SectionCard>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard title="Order Status Breakdown" icon={ShoppingBag}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Completed', value: overview.completedOrders },
                            { name: 'Pending',   value: overview.pendingOrders },
                            { name: 'Cancelled', value: overview.cancelledOrders },
                            { name: 'Refunded',  value: overview.refundedOrders },
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                        >
                          {[0,1,2,3].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [v, 'Orders']} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </SectionCard>
                  <SectionCard title="Top Selling Pizza" icon={Star}>
                    {overview.topSellingPizza?._id && overview.topSellingPizza._id !== 'N/A' ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-3">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-500/5 border border-orange-500/20 flex items-center justify-center text-4xl">🍕</div>
                        <p className="text-lg font-black text-white">{overview.topSellingPizza._id}</p>
                        <div className="flex gap-6 text-center">
                          <div>
                            <p className="text-xl font-bold text-orange-400">{overview.topSellingPizza.totalSold}</p>
                            <p className="text-xs text-neutral-500">Units Sold</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-emerald-400">\u20B9{Math.round(overview.topSellingPizza.totalRevenue || 0).toLocaleString()}</p>
                            <p className="text-xs text-neutral-500">Revenue</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 text-center py-8">No sales data available for this period</p>
                    )}
                  </SectionCard>
                </div>
              </div>
            )}

            {/* REVENUE */}
            {activeTab === 'revenue' && revenue && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KPICard icon={IndianRupee} label="Gross Revenue" value={`\u20B9${revenue.grossRevenue?.toLocaleString()}`} color="orange" />
                  <KPICard icon={IndianRupee} label="Net Revenue"   value={`\u20B9${revenue.netRevenue?.toLocaleString()}`}   color="green" />
                  <KPICard icon={IndianRupee} label="Total Refunds" value={`\u20B9${revenue.totalRefunds?.toLocaleString()}`} color="red" />
                </div>
                <SectionCard title="Daily Revenue Breakdown" icon={TrendingUp}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenue.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(v) => v?.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#FF6B00" radius={[4,4,0,0]} />
                      <Bar dataKey="gst" name="GST" fill="#F59E0B" radius={[4,4,0,0]} />
                      <Bar dataKey="discounts" name="Discounts" fill="#8B5CF6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
                <SectionCard title="Hourly Revenue Distribution" icon={Clock}>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenue.hourlyTrend}>
                      <defs>
                        <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#737373' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" fill="url(#hourGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </SectionCard>
              </div>
            )}

            {/* ORDERS */}
            {activeTab === 'orders' && orders && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard icon={ShoppingBag}  label="Total Orders"      value={orders.totalOrders}           color="blue" />
                  <KPICard icon={CheckCircle2} label="Completion Rate"   value={`${orders.completionRate}%`}   color="green" />
                  <KPICard icon={XCircle}       label="Cancellation Rate" value={`${orders.cancellationRate}%`} color="red" />
                  <KPICard icon={IndianRupee}   label="Refund Rate"       value={`${orders.refundRate}%`}       color="amber" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard title="Peak Hours" icon={Clock}>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={orders.peakHours}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#737373' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="orders" name="Orders" fill="#FF6B00" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                  <SectionCard title="Orders by Day of Week" icon={Activity}>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={orders.peakDays}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#737373' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="orders" name="Orders" fill="#3B82F6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* CUSTOMERS */}
            {activeTab === 'customers' && customers && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard icon={Users}  label="Total Customers"     value={customers.totalCustomers}     color="blue" />
                  <KPICard icon={Users}  label="New Customers"       value={customers.newCustomers}       color="green" />
                  <KPICard icon={Users}  label="Returning"           value={customers.returningCustomers} color="violet" />
                  <KPICard icon={Target} label="Repeat Purchase Rate" value={`${customers.repeatPurchaseRate}%`} color="amber" />
                </div>
                <SectionCard title="Top 5 Customers by Spend" icon={Star}>
                  <div className="space-y-3">
                    {customers.topCustomers?.length > 0 ? customers.topCustomers.map((c, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/40 border border-neutral-800">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-yellow-400/20 text-yellow-400' : 'bg-neutral-700 text-neutral-300'}`}>{i+1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{c.name || 'Anonymous'}</p>
                          <p className="text-xs text-neutral-500 truncate">{c.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-400">\u20B9{Math.round(c.totalSpent).toLocaleString()}</p>
                          <p className="text-xs text-neutral-500">{c.orderCount} orders</p>
                        </div>
                      </div>
                    )) : <p className="text-xs text-neutral-500 text-center py-6">No customer data available</p>}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* PIZZAS */}
            {activeTab === 'pizzas' && pizzas && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard title="Top 10 Best Selling Pizzas" icon={Pizza}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={pizzas.topPizzas} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis type="number" tick={{ fontSize: 9, fill: '#737373' }} />
                        <YAxis type="category" dataKey="_id" tick={{ fontSize: 9, fill: '#a3a3a3' }} width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalSold" name="Units Sold" fill="#FF6B00" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                  <SectionCard title="Size Distribution" icon={BarChart3}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={pizzas.sizeDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="_id">
                          {pizzas.sizeDistribution?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [v, 'Units']} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <SectionCard title="Top Bases" icon={Pizza}>
                    <div className="space-y-2">
                      {pizzas.topBases?.map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-800/40">
                          <span className="text-neutral-300">{b._id || 'N/A'}</span>
                          <span className="font-bold text-orange-400">{b.count}</span>
                        </div>
                      ))}
                      {(!pizzas.topBases || pizzas.topBases.length === 0) && <p className="text-xs text-neutral-500 text-center py-4">No data</p>}
                    </div>
                  </SectionCard>
                  <SectionCard title="Top Sauces" icon={Pizza}>
                    <div className="space-y-2">
                      {pizzas.topSauces?.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-800/40">
                          <span className="text-neutral-300">{s._id || 'N/A'}</span>
                          <span className="font-bold text-blue-400">{s.count}</span>
                        </div>
                      ))}
                      {(!pizzas.topSauces || pizzas.topSauces.length === 0) && <p className="text-xs text-neutral-500 text-center py-4">No data</p>}
                    </div>
                  </SectionCard>
                  <SectionCard title="Custom vs Preset" icon={BarChart3}>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pizzas.customVsPreset} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="type">
                          {pizzas.customVsPreset?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* INVENTORY */}
            {activeTab === 'inventory' && inventory && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard icon={Package}       label="Total Ingredients" value={inventory.totalIngredients} color="blue" />
                  <KPICard icon={CheckCircle2}  label="Healthy Stock"     value={inventory.healthyCount}     color="green" />
                  <KPICard icon={AlertTriangle} label="Low Stock"         value={inventory.lowStockCount}    color="amber" />
                  <KPICard icon={XCircle}       label="Out of Stock"      value={inventory.outOfStockCount}  color="red" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard title="Fast Moving Ingredients" icon={Zap}>
                    <div className="space-y-2">
                      {inventory.fastMoving?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                          <div>
                            <p className="font-semibold text-white">{item.name}</p>
                            <p className="text-neutral-500">{item.dailyUsage} {item.unit}/day</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-400">{item.currentStock} {item.unit}</p>
                            <p className="text-neutral-500">{item.forecastDaysRemaining} days left</p>
                          </div>
                        </div>
                      ))}
                      {(!inventory.fastMoving || inventory.fastMoving.length === 0) && <p className="text-xs text-neutral-500 text-center py-4">No consumption data yet</p>}
                    </div>
                  </SectionCard>
                  <SectionCard title="Critical Stock Levels" icon={AlertTriangle}>
                    <div className="space-y-2">
                      {inventory.inventoryWithForecast?.filter(i => i.status !== 'Healthy').slice(0, 7).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                          <div>
                            <p className="font-semibold text-white">{item.name}</p>
                            <p className="text-neutral-500">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${item.status === 'Out of Stock' ? 'text-rose-400' : 'text-amber-400'}`}>{item.currentStock} {item.unit}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'Out of Stock' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>{item.status}</span>
                          </div>
                        </div>
                      ))}
                      {inventory.inventoryWithForecast?.filter(i => i.status !== 'Healthy').length === 0 && (
                        <p className="text-xs text-emerald-400 text-center py-6">All ingredients are well stocked</p>
                      )}
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* PAYMENTS */}
            {activeTab === 'payments' && payments && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KPICard icon={CheckCircle2} label="Success Rate"    value={`${payments.paymentSuccessRate}%`}   color="green" />
                  <KPICard icon={XCircle}      label="Failure Rate"    value={`${payments.paymentFailureRate}%`}   color="red" />
                  <KPICard icon={IndianRupee}  label="Avg Transaction" value={`\u20B9${payments.avgTransactionValue}`} color="orange" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard title="Payment Method Distribution" icon={CreditCard}>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={payments.methodBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="method">
                          {payments.methodBreakdown?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [v, 'Transactions']} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </SectionCard>
                  <SectionCard title="Revenue by Payment Method" icon={IndianRupee}>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={payments.methodBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="method" tick={{ fontSize: 10, fill: '#737373' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="total" name="Revenue" fill="#10B981" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* DELIVERY */}
            {activeTab === 'delivery' && delivery && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard icon={Clock}         label="Avg Delivery Time"  value={`${delivery.avgDeliveryTime} min`}  color="blue" />
                  <KPICard icon={Zap}           label="Fastest Delivery"   value={`${delivery.fastestDelivery} min`}  color="green" />
                  <KPICard icon={AlertTriangle} label="Slowest Delivery"   value={`${delivery.slowestDelivery} min`}  color="red" />
                  <KPICard icon={Truck}         label="Pending Deliveries" value={delivery.pendingDeliveries}          color="amber" />
                </div>
                <SectionCard title="Delivery Performance" icon={Truck}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
                    {[
                      { label: 'Total Delivered', value: delivery.totalDelivered, sub: 'Fulfilled orders', color: 'text-emerald-400' },
                      { label: 'Average Time',    value: `${delivery.avgDeliveryTime} min`, sub: 'Per order', color: 'text-blue-400' },
                      { label: 'Pending Queue',   value: delivery.pendingDeliveries, sub: 'Awaiting dispatch', color: 'text-amber-400' },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-4 rounded-2xl bg-neutral-800/40 border border-neutral-800">
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-sm font-semibold text-white mt-1">{s.label}</p>
                        <p className="text-xs text-neutral-500">{s.sub}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {/* FORECAST */}
            {activeTab === 'forecast' && forecast && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPICard icon={TrendingUp}  label="Next 7 Days Revenue"  value={`\u20B9${forecast.forecastNextWeekRevenue?.toLocaleString()}`}  color="orange" />
                  <KPICard icon={TrendingUp}  label="Next 30 Days Revenue" value={`\u20B9${forecast.forecastNextMonthRevenue?.toLocaleString()}`} color="green" />
                  <KPICard icon={ShoppingBag} label="Next Week Orders"     value={forecast.forecastNextWeekOrders} color="blue" />
                  <KPICard icon={Activity}    label="Revenue Growth"       value={`${forecast.growthPercentage}%`} color={forecast.growthPercentage >= 0 ? 'green' : 'red'} trend={forecast.growthPercentage} />
                </div>
                <SectionCard title="30-Day Revenue Trend" icon={TrendingUp}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={forecast.trendData}>
                      <defs>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="_id" tick={{ fontSize: 9, fill: '#737373' }} tickFormatter={(v) => v?.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#737373' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8B5CF6" fill="url(#forecastGrad)" strokeWidth={2.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </SectionCard>
                <SectionCard title="AI Business Insights" icon={Zap}>
                  <div className="space-y-3">
                    {forecast.insights?.map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-neutral-800/40 border border-neutral-800">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">{i+1}</div>
                        <p className="text-sm text-neutral-200 leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
                {forecast.criticalIngredients?.length > 0 && (
                  <SectionCard title="Ingredients Running Low (Forecast)" icon={AlertTriangle}>
                    <div className="space-y-2">
                      {forecast.criticalIngredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{ing.name}</p>
                            <p className="text-xs text-neutral-500">{ing.category} · {ing.dailyUsage} {ing.unit}/day</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-rose-400">{ing.daysRemaining} days</p>
                            <p className="text-xs text-neutral-500">{ing.currentStock} {ing.unit} left</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
