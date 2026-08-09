import User from '../models/User.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import Referral from '../models/Referral.js';

/**
 * Calculates customer status segment based on order history
 */
export const calculateCustomerSegment = (lastOrderDate, completedOrdersCount, totalSpent) => {
  if (completedOrdersCount >= 10 || totalSpent >= 5000) return 'VIP';
  if (!lastOrderDate) return 'New';

  const daysSinceLastOrder = (Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastOrder <= 30) return 'Active';
  if (daysSinceLastOrder <= 90) return 'Inactive';
  return 'At Risk';
};

/**
 * Generates Customer 360° Profile
 */
export const getCustomer360Profile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) return null;

  // Order statistics aggregation
  const orderStats = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $in: ['$status', ['Delivered', 'delivered']] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $in: ['$status', ['Cancelled', 'cancelled']] }, 1, 0] },
        },
        totalSpent: {
          $sum: {
            $cond: [{ $in: ['$status', ['Delivered', 'delivered']] }, '$grandTotal', 0],
          },
        },
        avgOrderValue: { $avg: '$grandTotal' },
        lastOrderDate: { $max: '$createdAt' },
      },
    },
  ]);

  const stats = orderStats[0] || {
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalSpent: 0,
    avgOrderValue: 0,
    lastOrderDate: null,
  };

  // Favorite pizza aggregation
  const favoritePizzaData = await Order.aggregate([
    { $match: { user: user._id } },
    { $unwind: '$items' },
    { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  // Preferred order day and hour
  const preferenceData = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: {
          day: { $dayOfWeek: '$createdAt' },
          hour: { $hour: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pref = preferenceData[0]?._id || {};

  // Reviews summary
  const reviewCount = await Review.countDocuments({ user: user._id });
  const avgRatingGivenData = await Review.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } },
  ]);

  // Referral summary
  const referralCount = await Referral.countDocuments({ referrer: user._id, status: 'REWARDED' });

  // Loyalty transaction audit history
  const recentTransactions = await LoyaltyTransaction.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(10);

  const segment = calculateCustomerSegment(
    stats.lastOrderDate,
    stats.completedOrders,
    stats.totalSpent
  );

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      role: user.role,
      loyaltyPoints: user.loyaltyPoints || 0,
      loyaltyTier: user.loyaltyTier || 'Bronze',
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
    metrics: {
      totalOrders: stats.totalOrders,
      completedOrders: stats.completedOrders,
      cancelledOrders: stats.cancelledOrders,
      totalSpent: Math.round(stats.totalSpent),
      avgOrderValue: Math.round(stats.avgOrderValue || 0),
      lastOrderDate: stats.lastOrderDate,
      customerLifetimeValue: Math.round(stats.totalSpent),
      segment,
    },
    preferences: {
      favoritePizza: favoritePizzaData[0]?._id || 'None',
      preferredOrderDay: pref.day ? dayNames[pref.day] : 'N/A',
      preferredOrderHour: pref.hour !== undefined ? `${pref.hour}:00` : 'N/A',
    },
    loyalty: {
      points: user.loyaltyPoints || 0,
      tier: user.loyaltyTier || 'Bronze',
      recentTransactions,
    },
    reviews: {
      count: reviewCount,
      avgRatingGiven: avgRatingGivenData[0]?.avgRating
        ? Math.round(avgRatingGivenData[0].avgRating * 10) / 10
        : 0,
    },
    referrals: {
      successfulReferrals: referralCount,
      earningsPoints: referralCount * 500,
    },
  };
};

/**
 * Admin CRM Customer Search & Pagination
 */
export const searchCrmCustomers = async ({ search, segment, tier, page = 1, limit = 10 }) => {
  const query = { role: 'customer' };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { referralCode: { $regex: search, $options: 'i' } },
    ];
  }

  if (tier) {
    query.loyaltyTier = tier;
  }

  const skip = (page - 1) * limit;
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  // Attach aggregated order metrics for each user
  const customerProfiles = await Promise.all(
    users.map(async (u) => {
      const orderStats = await Order.aggregate([
        { $match: { user: u._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $in: ['$status', ['Delivered', 'delivered']] }, 1, 0] },
            },
            totalSpent: {
              $sum: {
                $cond: [{ $in: ['$status', ['Delivered', 'delivered']] }, '$grandTotal', 0],
              },
            },
            lastOrderDate: { $max: '$createdAt' },
          },
        },
      ]);

      const s = orderStats[0] || { totalOrders: 0, completedOrders: 0, totalSpent: 0, lastOrderDate: null };
      const calcSeg = calculateCustomerSegment(s.lastOrderDate, s.completedOrders, s.totalSpent);

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        loyaltyPoints: u.loyaltyPoints || 0,
        loyaltyTier: u.loyaltyTier || 'Bronze',
        referralCode: u.referralCode,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        totalOrders: s.totalOrders,
        completedOrders: s.completedOrders,
        totalSpent: Math.round(s.totalSpent),
        lastOrderDate: s.lastOrderDate,
        segment: calcSeg,
      };
    })
  );

  // Filter by segment if specified
  const filteredProfiles = segment
    ? customerProfiles.filter((p) => p.segment.toLowerCase() === segment.toLowerCase())
    : customerProfiles;

  return {
    customers: filteredProfiles,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
};
