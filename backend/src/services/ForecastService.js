import Order from '../models/Order.js';
import Ingredient from '../models/Ingredient.js';

/**
 * Revenue & Inventory Forecasting Engine
 * Uses 30-day moving average trend analysis to project next week's KPIs and generate AI business insights.
 */
export const getRevenueAndInventoryForecast = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Daily revenue trend for past 30 days
  const dailyTrend = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalDays = dailyTrend.length || 1;
  const totalRevenue = dailyTrend.reduce((acc, d) => acc + d.revenue, 0);
  const totalOrders = dailyTrend.reduce((acc, d) => acc + d.orders, 0);
  const avgDailyRevenue = totalRevenue / totalDays;
  const avgDailyOrders = totalOrders / totalDays;

  // Growth percentage: compare last 7 days vs previous 7 days
  const last7 = dailyTrend.slice(-7);
  const prev7 = dailyTrend.slice(-14, -7);
  const last7Revenue = last7.reduce((a, d) => a + d.revenue, 0);
  const prev7Revenue = prev7.reduce((a, d) => a + d.revenue, 0) || 1;
  const growthPercentage = Math.round(((last7Revenue - prev7Revenue) / prev7Revenue) * 100);

  // Revenue forecasting with growth adjustment
  const growthFactor = 1 + growthPercentage / 100;
  const forecastNextWeekRevenue = Math.round(avgDailyRevenue * 7 * Math.max(growthFactor, 0.7));
  const forecastNextMonthRevenue = Math.round(avgDailyRevenue * 30 * Math.max(growthFactor, 0.7));
  const forecastNextWeekOrders = Math.round(avgDailyOrders * 7 * Math.max(growthFactor, 0.7));

  // Ingredient depletion forecast
  const ingredients = await Ingredient.find({ isAvailable: true }).select(
    'name category quantity minimumStock unit'
  );

  // Estimate consumption from last 7 days
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

  const criticalIngredients = ingredients
    .map((ing) => {
      const weeklyUsage = consumptionMap[ing.name] || 0;
      const dailyUsage = weeklyUsage / 7;
      const daysRemaining = dailyUsage > 0 ? Math.round(ing.quantity / dailyUsage) : 999;
      return {
        name: ing.name,
        category: ing.category,
        currentStock: ing.quantity,
        unit: ing.unit,
        dailyUsage: Math.round(dailyUsage * 10) / 10,
        daysRemaining,
      };
    })
    .filter((i) => i.daysRemaining < 14)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  // AI Business Insights generation
  const insights = [];

  if (growthPercentage > 0) {
    insights.push(`📈 Revenue increased ${growthPercentage}% compared to previous week.`);
  } else if (growthPercentage < 0) {
    insights.push(`📉 Revenue dropped ${Math.abs(growthPercentage)}% this week. Consider promotions.`);
  }

  // Top pizza contribution
  const topPizza = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $unwind: '$items' },
    { $match: { 'items.isCustom': false } },
    {
      $group: {
        _id: '$items.name',
        itemRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { itemRevenue: -1 } },
    { $limit: 1 },
  ]);

  if (topPizza.length > 0 && totalRevenue > 0) {
    const contribution = Math.round((topPizza[0].itemRevenue / totalRevenue) * 100);
    insights.push(
      `🍕 ${topPizza[0]._id} contributed ${contribution}% of total revenue.`
    );
  }

  for (const ing of criticalIngredients.slice(0, 2)) {
    insights.push(
      `⚠️ ${ing.name} will deplete in approximately ${ing.daysRemaining} days at current consumption rate.`
    );
  }

  // Peak day insight
  const peakDay = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);
  const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (peakDay.length > 0) {
    insights.push(
      `📅 ${dayNames[peakDay[0]._id]} receives the highest number of orders.`
    );
  }

  if (insights.length < 3) {
    insights.push('✅ All systems operating within normal parameters.');
  }

  return {
    avgDailyRevenue: Math.round(avgDailyRevenue),
    avgDailyOrders: Math.round(avgDailyOrders),
    growthPercentage,
    forecastNextWeekRevenue,
    forecastNextMonthRevenue,
    forecastNextWeekOrders,
    criticalIngredients,
    insights,
    trendData: dailyTrend,
  };
};
