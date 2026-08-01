import Order from '../models/Order.js';
import User from '../models/User.js';
import Ingredient from '../models/Ingredient.js';

/**
 * Computes dashboard overview metrics for the admin panel.
 * @returns {Object} Dashboard metrics
 */
export const getDashboardOverview = async () => {
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({
    status: { $in: ['pending', 'confirmed', 'preparing', 'in-kitchen', 'ready', 'out-for-delivery'] },
  });
  const completedOrders = await Order.countDocuments({ status: 'delivered' });
  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

  const revenueAggregation = await Order.aggregate([
    { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
    { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } },
  ]);
  const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

  const lowStockItems = await Ingredient.find({
    $expr: { $lte: ['$quantity', '$threshold'] },
  }).select('name quantity threshold category');

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(5)
    .lean();

  return {
    totalUsers,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    recentOrders,
  };
};
