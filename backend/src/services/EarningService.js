import Earning from '../models/Earning.js';
import { haversineKm } from '../utils/geo.js';

/**
 * Payout constants — easy to tune later.
 * ₹30 base per delivery + ₹5 per km distance.
 */
export const PAYOUT_BASE = 30; // INR
export const PAYOUT_PER_KM = 5; // INR per km

/**
 * Calculates the payout amount for a delivery based on distance.
 * @param {number} distanceKm
 * @returns {{ amount: number, basePay: number, perKmPay: number }}
 */
export const calculatePayout = (distanceKm) => {
  const basePay = PAYOUT_BASE;
  const perKmPay = Math.round(distanceKm * PAYOUT_PER_KM);
  const amount = basePay + perKmPay;
  return { amount, basePay, perKmPay };
};

/**
 * Creates an earning record for a completed delivery.
 * @param {string} partnerId - DeliveryPartner ObjectId
 * @param {string} orderId - Order ObjectId
 * @param {Object} outletLocation - { lat, lng } of the assigned outlet
 * @param {Object} customerLocation - { lat, lng } from shippingAddress
 * @returns {Promise<Object>} The created Earning document
 */
export const createEarningRecord = async (partnerId, orderId, outletLocation, customerLocation) => {
  const distanceKm = haversineKm(
    outletLocation.lat,
    outletLocation.lng,
    customerLocation.lat,
    customerLocation.lng
  );
  const { amount, basePay, perKmPay } = calculatePayout(distanceKm);

  const earning = await Earning.create({
    deliveryPartner: partnerId,
    order: orderId,
    amount,
    distanceKm,
    breakdown: { basePay, perKmPay },
  });

  return earning;
};

/**
 * Aggregates earnings for a partner within a date range.
 * @param {string} partnerId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<number>} Total earnings in the range
 */
const aggregateEarnings = async (partnerId, startDate, endDate) => {
  const result = await Earning.aggregate([
    {
      $match: {
        deliveryPartner: partnerId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return result.length > 0 ? { total: result[0].total, count: result[0].count } : { total: 0, count: 0 };
};

/**
 * Gets the current month's earnings total.
 */
export const getMonthlyTotal = async (partnerId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return aggregateEarnings(partnerId, startOfMonth, now);
};

/**
 * Gets the current year's earnings total.
 */
export const getYearlyTotal = async (partnerId) => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return aggregateEarnings(partnerId, startOfYear, now);
};

/**
 * Gets paginated per-delivery earnings history.
 */
export const getEarningsHistory = async (partnerId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [earnings, totalCount] = await Promise.all([
    Earning.find({ deliveryPartner: partnerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('order', 'orderNumber grandTotal shippingAddress createdAt'),
    Earning.countDocuments({ deliveryPartner: partnerId }),
  ]);

  return {
    earnings,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  };
};
