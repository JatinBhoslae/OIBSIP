import Earning from '../models/Earning.js';
import Order from '../models/Order.js';

// Payout constants
export const BASE_FEE = 30; // ₹
export const PER_KM_RATE = 5; // ₹ per km

/**
 * Calculate earning amount for a delivery based on distance.
 */
export const calculateEarning = (distanceKm) => {
  return BASE_FEE + PER_KM_RATE * distanceKm;
};

/**
 * Create an earning record for a completed delivery.
 * Should be called when delivery status changes to DELIVERED.
 */
export const createEarning = async (orderId, partnerId, distanceKm, completedAt = new Date()) => {
  // Check if earning already exists for this order
  const existing = await Earning.findOne({ order: orderId });
  if (existing) {
    return existing; // Idempotent
  }

  const amount = calculateEarning(distanceKm);

  const earning = new Earning({
    deliveryPartner: partnerId,
    order: orderId,
    amount,
    distanceKm,
    baseFee: BASE_FEE,
    perKmRate: PER_KM_RATE,
    completedAt,
  });

  await earning.save();
  return earning;
};

/**
 * Get total earnings for a partner in a date range.
 */
export const getEarningsTotal = async (partnerId, startDate, endDate) => {
  const match = {
    deliveryPartner: partnerId,
    completedAt: { $gte: startDate, $lte: endDate },
  };
  const result = await Earning.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Get monthly total earnings for a partner.
 * Returns total for the current calendar month (or specified month).
 */
export const getMonthlyTotal = async (partnerId, date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return await getEarningsTotal(partnerId, start, end);
};

/**
 * Get yearly total earnings for a partner.
 * Returns total for the current calendar year (or specified year).
 */
export const getYearlyTotal = async (partnerId, date = new Date()) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
  return await getEarningsTotal(partnerId, start, end);
};

/**
 * Get all-time total earnings for a partner.
 */
export const getAllTimeTotal = async (partnerId) => {
  const result = await Earning.aggregate([
    { $match: { deliveryPartner: partnerId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Get paginated earnings history for a partner.
 */
export const getEarningsHistory = async (partnerId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [earnings, total] = await Promise.all([
    Earning.find({ deliveryPartner: partnerId })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('order', 'orderNumber shippingAddress totalAmount'),
    Earning.countDocuments({ deliveryPartner: partnerId }),
  ]);

  return {
    earnings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get earnings summary for a partner.
 */
export const getEarningsSummary = async (partnerId) => {
  const now = new Date();
  const [monthTotal, yearTotal, allTimeTotal, count] = await Promise.all([
    getMonthlyTotal(partnerId, now),
    getYearlyTotal(partnerId, now),
    getAllTimeTotal(partnerId),
    Earning.countDocuments({ deliveryPartner: partnerId }),
  ]);

  return {
    monthTotal,
    yearTotal,
    allTimeTotal,
    totalDeliveries: count,
    baseFee: BASE_FEE,
    perKmRate: PER_KM_RATE,
  };
};

/**
 * Get earnings by month for a given year (for charts).
 */
export const getMonthlyEarningsForYear = async (partnerId, year) => {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 0, 23, 59, 59, 999);

  const results = await Earning.aggregate([
    {
      $match: {
        deliveryPartner: partnerId,
        completedAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$completedAt' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  // Fill in missing months with zero
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total: 0,
    count: 0,
  }));

  results.forEach((r) => {
    monthlyData[r._id.month - 1] = {
      month: r._id.month,
      total: r.total,
      count: r.count,
    };
  });

  return monthlyData;
};
