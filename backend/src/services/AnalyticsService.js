import Order from '../models/Order.js';
import User from '../models/User.js';
import Ingredient from '../models/Ingredient.js';
import Pizza from '../models/Pizza.js';

/**
 * Resolves date range filter object for MongoDB queries
 */
const getDateFilter = (range) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  switch (range) {
    case 'today':
      return { $gte: startOfDay };
    case 'yesterday': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - 1);
      const end = new Date(startOfDay);
      end.setMilliseconds(-1);
      return { $gte: start, $lte: end };
    }
    case '7days':
      return { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    case '30days':
      return { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    case '90days':
      return { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { $gte: startOfYear };
    }
    default:
      return { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
};

/**
 * Executive Dashboard Overview KPIs
 */
export const getDashboardOverview = async (range = '30days') => {
  const dateFilter = getDateFilter(range);

  const [revenueData, statusCounts, activeCustomers, lowStockItems, topPizza, walletLiabilityData] = await Promise.all([
    // Revenue & Order Aggregation
    Order.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalOrders: { $sum: 1 },
          totalGST: { $sum: '$gst' },
          totalDiscounts: { $sum: '$discountAmount' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgOrderValue: { $avg: '$grandTotal' },
        },
      },
    ]),

    // Status breakdown
    Order.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Active customers count
    Order.distinct('user', { createdAt: dateFilter }),

    // Low stock ingredient count
    Ingredient.countDocuments({
      $expr: { $lte: ['$quantity', '$minimumStock'] },
      isAvailable: true,
    }),

    // Top selling pizza
    Order.aggregate([
      { $match: { createdAt: dateFilter } },
      { $unwind: '$items' },
      { $match: { 'items.isCustom': false } },
      {
        $group: {
          _id: '$items.name',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 1 },
    ]),
    
    // Total Wallet Liability
    User.aggregate([
      { $group: { _id: null, totalWallet: { $sum: '$walletBalance' } } }
    ])
  ]);

  const rev = revenueData[0] || {};
  const totalWalletLiability = walletLiabilityData[0]?.totalWallet || 0;

  // Calculate avg delivery time (from orders with actualDeliveryTime set)
  const deliveryTimeData = await Order.aggregate([
    {
      $match: {
        createdAt: dateFilter,
        actualDeliveryTime: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        deliveryMinutes: {
          $divide: [{ $subtract: ['$actualDeliveryTime', '$createdAt'] }, 60000],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgDeliveryTime: { $avg: '$deliveryMinutes' },
      },
    },
  ]);

  // Normalize status counts
  const statusMap = {};
  for (const s of statusCounts) {
    statusMap[s._id] = s.count;
  }

  return {
    totalRevenue: Math.round(rev.totalRevenue || 0),
    totalOrders: rev.totalOrders || 0,
    totalGST: Math.round(rev.totalGST || 0),
    totalDiscounts: Math.round(rev.totalDiscounts || 0),
    totalDeliveryCharges: Math.round(rev.totalDeliveryCharges || 0),
    avgOrderValue: Math.round(rev.avgOrderValue || 0),
    avgDeliveryTime: Math.round(deliveryTimeData[0]?.avgDeliveryTime || 35),
    activeCustomers: activeCustomers.length,
    lowStockItems,
    pendingOrders:
      (statusMap['Order Received'] || 0) +
      (statusMap['Preparing'] || 0) +
      (statusMap['Baking'] || 0) +
      (statusMap['pending'] || 0) +
      (statusMap['confirmed'] || 0),
    completedOrders: (statusMap['Delivered'] || 0) + (statusMap['delivered'] || 0),
    cancelledOrders: (statusMap['Cancelled'] || 0) + (statusMap['cancelled'] || 0),
    refundedOrders: (statusMap['Refunded'] || 0) + (statusMap['refunded'] || 0),
    topSellingPizza: topPizza[0] || { _id: 'N/A', totalSold: 0, totalRevenue: 0 },
    statusBreakdown: statusCounts,
    totalWalletLiability,
  };
};

/**
 * Sales & Revenue Analytics (Daily Trend, Tax, Discounts)
 */
export const getSalesAnalytics = async (range = '30days') => {
  const dateFilter = getDateFilter(range);

  // Daily revenue trend
  const dailyRevenue = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
        gst: { $sum: '$gst' },
        discounts: { $sum: '$discountAmount' },
        deliveryFees: { $sum: '$deliveryCharges' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Hourly order trend
  const hourlyTrend = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        orders: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Gross vs Net
  const totals = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: null,
        grossRevenue: { $sum: '$grandTotal' },
        netRevenue: { $sum: { $subtract: ['$grandTotal', '$gst'] } },
        totalRefunds: {
          $sum: {
            $cond: [
              { $in: ['$status', ['Refunded', 'refunded']] },
              '$grandTotal',
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    dailyRevenue,
    hourlyTrend: hourlyTrend.map((h) => ({
      hour: `${h._id}:00`,
      orders: h.orders,
      revenue: Math.round(h.revenue),
    })),
    grossRevenue: Math.round(totals[0]?.grossRevenue || 0),
    netRevenue: Math.round(totals[0]?.netRevenue || 0),
    totalRefunds: Math.round(totals[0]?.totalRefunds || 0),
  };
};

/**
 * Customer Analytics (CLV, Retention, Top Spenders)
 */
export const getCustomerAnalytics = async (range = '30days') => {
  const dateFilter = getDateFilter(range);

  const totalCustomers = await User.countDocuments({ role: 'user' });

  // New customers in date range
  const newCustomers = await User.countDocuments({
    role: 'user',
    createdAt: dateFilter,
  });

  // Repeat customers: users who have > 1 order
  const repeatCustomerData = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    { $group: { _id: '$user', orderCount: { $sum: 1 } } },
    { $match: { orderCount: { $gt: 1 } } },
    { $count: 'repeatCustomers' },
  ]);

  const uniqueCustomersInRange = await Order.distinct('user', { createdAt: dateFilter });

  // Top 5 customers by spending
  const topCustomers = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$grandTotal' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: '$userInfo.name',
        email: '$userInfo.email',
        totalSpent: 1,
        orderCount: 1,
      },
    },
  ]);

  const repeatCount = repeatCustomerData[0]?.repeatCustomers || 0;
  const totalActive = uniqueCustomersInRange.length || 1;

  return {
    totalCustomers,
    newCustomers,
    returningCustomers: totalActive - newCustomers,
    repeatPurchaseRate: Math.round((repeatCount / totalActive) * 100),
    avgSpending: topCustomers.length
      ? Math.round(topCustomers.reduce((acc, c) => acc + c.totalSpent, 0) / topCustomers.length)
      : 0,
    topCustomers,
  };
};

/**
 * Order Analytics (Peak Hours, Completion Rate, Cancellation Rate)
 */
export const getOrderAnalytics = async (range = '30days') => {
  const dateFilter = getDateFilter(range);

  // Peak hours
  const peakHours = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Peak days of the week
  const peakDays = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Rates
  const totalOrders = await Order.countDocuments({ createdAt: dateFilter });
  const deliveredOrders = await Order.countDocuments({
    createdAt: dateFilter,
    status: { $in: ['Delivered', 'delivered'] },
  });
  const cancelledOrders = await Order.countDocuments({
    createdAt: dateFilter,
    status: { $in: ['Cancelled', 'cancelled'] },
  });
  const refundedOrders = await Order.countDocuments({
    createdAt: dateFilter,
    status: { $in: ['Refunded', 'refunded'] },
  });

  return {
    totalOrders,
    peakHours: peakHours.slice(0, 5).map((h) => ({ hour: `${h._id}:00`, orders: h.count })),
    peakDays: peakDays.map((d) => ({ day: dayNames[d._id] || d._id, orders: d.count })),
    completionRate: totalOrders ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
    cancellationRate: totalOrders ? Math.round((cancelledOrders / totalOrders) * 100) : 0,
    refundRate: totalOrders ? Math.round((refundedOrders / totalOrders) * 100) : 0,
  };
};

/**
 * Pizza Menu Analytics (Top Sellers, Sizes, Customizations)
 */
export const getPizzaAnalytics = async (range = '30days') => {
  const dateFilter = getDateFilter(range);

  // Top selling pizzas
  const topPizzas = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  // Size distribution
  const sizeDistribution = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.size',
        count: { $sum: '$items.quantity' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Custom vs Preset ratio
  const customVsPreset = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.isCustom',
        count: { $sum: '$items.quantity' },
      },
    },
  ]);

  // Top bases from custom pizzas
  const topBases = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    { $unwind: '$items' },
    { $match: { 'items.isCustom': true, 'items.customization.base': { $exists: true, $ne: null } } },
    { $group: { _id: '$items.customization.base', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Top sauces
  const topSauces = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    { $unwind: '$items' },
    { $match: { 'items.isCustom': true, 'items.customization.sauce': { $exists: true, $ne: null } } },
    { $group: { _id: '$items.customization.sauce', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Top cheeses
  const topCheeses = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    { $unwind: '$items' },
    { $match: { 'items.isCustom': true, 'items.customization.cheese': { $exists: true, $ne: null } } },
    { $group: { _id: '$items.customization.cheese', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  return {
    topPizzas,
    leastPizzas: [...topPizzas].reverse().slice(0, 3),
    sizeDistribution,
    customVsPreset: customVsPreset.map((c) => ({
      type: c._id ? 'Custom' : 'Preset',
      count: c.count,
    })),
    topBases,
    topSauces,
    topCheeses,
  };
};

/**
 * Inventory Analytics (Depletion Velocity & Forecasting)
 */
export const getInventoryAnalytics = async () => {
  const ingredients = await Ingredient.find({ isAvailable: true })
    .select('name category quantity minimumStock unit price')
    .sort({ quantity: 1 });

  const lowStockItems = ingredients.filter(
    (i) => i.quantity <= (i.minimumStock || i.threshold || 10)
  );
  const outOfStockItems = ingredients.filter((i) => i.quantity === 0);

  // Estimate daily consumption from last 7 days of orders
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentOrders = await Order.find({ createdAt: { $gte: sevenDaysAgo } }).select('items');

  const consumptionMap = {};
  for (const order of recentOrders) {
    for (const item of order.items) {
      if (item.isCustom && item.customization) {
        const names = [
          item.customization.base,
          item.customization.sauce,
          item.customization.cheese,
          ...(item.customization.vegetables || []),
          ...(item.customization.meats || []),
        ].filter(Boolean);
        for (const name of names) {
          consumptionMap[name] = (consumptionMap[name] || 0) + item.quantity;
        }
      }
    }
  }

  // Calculate forecast depletion days
  const inventoryWithForecast = ingredients.map((ing) => {
    const weeklyUsage = consumptionMap[ing.name] || 0;
    const dailyUsage = weeklyUsage / 7;
    const forecastDaysRemaining =
      dailyUsage > 0 ? Math.round(ing.quantity / dailyUsage) : 999;

    return {
      _id: ing._id,
      name: ing.name,
      category: ing.category,
      currentStock: ing.quantity,
      minimumStock: ing.minimumStock,
      unit: ing.unit,
      weeklyUsage,
      dailyUsage: Math.round(dailyUsage * 10) / 10,
      forecastDaysRemaining,
      status:
        ing.quantity === 0
          ? 'Out of Stock'
          : ing.quantity <= (ing.minimumStock || 10)
          ? 'Low Stock'
          : 'Healthy',
    };
  });

  // Fast vs slow movers
  const fastMoving = [...inventoryWithForecast]
    .sort((a, b) => b.dailyUsage - a.dailyUsage)
    .slice(0, 5);
  const slowMoving = [...inventoryWithForecast]
    .filter((i) => i.dailyUsage > 0)
    .sort((a, b) => a.dailyUsage - b.dailyUsage)
    .slice(0, 5);

  return {
    totalIngredients: ingredients.length,
    lowStockCount: lowStockItems.length,
    outOfStockCount: outOfStockItems.length,
    healthyCount: ingredients.length - lowStockItems.length,
    inventoryWithForecast,
    fastMoving,
    slowMoving,
  };
};

/**
 * Payment Analytics (Method Breakdown)
 */
export const getPaymentAnalytics = async (range = '30days') => {
  const dateFilter = getDateFilter(range);

  const methodBreakdown = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        total: { $sum: '$grandTotal' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const paymentStatusBreakdown = await Order.aggregate([
    { $match: { createdAt: dateFilter } },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const paidOrders =
    paymentStatusBreakdown.find((p) => p._id === 'paid')?.count || 0;
  const failedOrders =
    paymentStatusBreakdown.find((p) => p._id === 'failed')?.count || 0;
  const totalPaymentAttempts = paidOrders + failedOrders || 1;

  return {
    methodBreakdown: methodBreakdown.map((m) => ({
      method: m._id || 'Razorpay',
      count: m.count,
      total: Math.round(m.total),
    })),
    paymentSuccessRate: Math.round((paidOrders / totalPaymentAttempts) * 100),
    paymentFailureRate: Math.round((failedOrders / totalPaymentAttempts) * 100),
    avgTransactionValue: methodBreakdown.length
      ? Math.round(
          methodBreakdown.reduce((a, m) => a + m.total, 0) /
            methodBreakdown.reduce((a, m) => a + m.count, 0)
        )
      : 0,
  };
};

/**
 * Delivery Fulfillment Analytics
 */
export const getDeliveryAnalytics = async (range = '30days') => {
  const dateFilter = getDateFilter(range);

  const deliveryStats = await Order.aggregate([
    {
      $match: {
        createdAt: dateFilter,
        actualDeliveryTime: { $exists: true, $ne: null },
      },
    },
    {
      $project: {
        deliveryMinutes: {
          $divide: [{ $subtract: ['$actualDeliveryTime', '$createdAt'] }, 60000],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgDeliveryTime: { $avg: '$deliveryMinutes' },
        fastestDelivery: { $min: '$deliveryMinutes' },
        slowestDelivery: { $max: '$deliveryMinutes' },
        totalDelivered: { $sum: 1 },
      },
    },
  ]);

  const pendingDeliveries = await Order.countDocuments({
    createdAt: dateFilter,
    status: {
      $in: ['Order Received', 'Preparing', 'Baking', 'Quality Check', 'Ready', 'Out For Delivery'],
    },
  });

  const stats = deliveryStats[0] || {};

  return {
    avgDeliveryTime: Math.round(stats.avgDeliveryTime || 35),
    fastestDelivery: Math.round(stats.fastestDelivery || 18),
    slowestDelivery: Math.round(stats.slowestDelivery || 62),
    totalDelivered: stats.totalDelivered || 0,
    pendingDeliveries,
  };
};
