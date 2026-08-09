import User from '../models/User.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import Reward from '../models/Reward.js';
import Coupon from '../models/Coupon.js';

// Configuration
export const POINTS_PER_RUPEE = 1;

export const TIER_THRESHOLDS = {
  Bronze: { min: 0, max: 499, multiplier: 1.0, discount: 0 },
  Silver: { min: 500, max: 1499, multiplier: 1.1, discount: 5 },
  Gold: { min: 1500, max: 2999, multiplier: 1.25, discount: 10 },
  Platinum: { min: 3000, max: Infinity, multiplier: 1.5, discount: 15 },
};

export const calculateTier = (totalPoints) => {
  if (totalPoints >= 3000) return 'Platinum';
  if (totalPoints >= 1500) return 'Gold';
  if (totalPoints >= 500) return 'Silver';
  return 'Bronze';
};

/**
 * Awards loyalty points for a completed order
 */
export const awardOrderPoints = async (userId, orderId, orderTotal) => {
  const user = await User.findById(userId);
  if (!user) return null;

  // Prevent duplicate points for the same order
  const existingTx = await LoyaltyTransaction.findOne({
    user: userId,
    referenceType: 'Order',
    referenceId: orderId,
    type: 'EARN',
  });
  if (existingTx) return null;

  const tierConfig = TIER_THRESHOLDS[user.loyaltyTier] || TIER_THRESHOLDS.Bronze;
  const basePoints = Math.floor(orderTotal * POINTS_PER_RUPEE);
  const earnedPoints = Math.floor(basePoints * tierConfig.multiplier);

  user.loyaltyPoints = (user.loyaltyPoints || 0) + earnedPoints;
  const newTier = calculateTier(user.loyaltyPoints);
  user.loyaltyTier = newTier;
  await user.save();

  const tx = await LoyaltyTransaction.create({
    user: userId,
    type: 'EARN',
    points: earnedPoints,
    description: `Earned ${earnedPoints} points for order #${orderId.toString().slice(-6)}`,
    referenceType: 'Order',
    referenceId: orderId,
    balanceAfter: user.loyaltyPoints,
  });

  return { points: earnedPoints, newTier, balance: user.loyaltyPoints, tx };
};

/**
 * Award points for generic activities (reviews, profile completion, etc.)
 */
export const awardBonusPoints = async (userId, points, description, refType = 'Bonus', refId = null) => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
  user.loyaltyTier = calculateTier(user.loyaltyPoints);
  await user.save();

  const tx = await LoyaltyTransaction.create({
    user: userId,
    type: 'BONUS',
    points,
    description,
    referenceType: refType,
    referenceId: refId,
    balanceAfter: user.loyaltyPoints,
  });

  return tx;
};

/**
 * Redeems points for a reward
 */
export const redeemPoints = async (userId, rewardId) => {
  const reward = await Reward.findById(rewardId);
  if (!reward || !reward.isActive) {
    throw new Error('Reward is not available for redemption');
  }

  const user = await User.findById(userId);
  if (!user || user.loyaltyPoints < reward.pointsRequired) {
    throw new Error('Insufficient loyalty points');
  }

  user.loyaltyPoints -= reward.pointsRequired;
  user.loyaltyTier = calculateTier(user.loyaltyPoints);
  await user.save();

  // Generate unique reward coupon code
  const code = `REWARD-${user.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const expiresAt = new Date(Date.now() + (reward.validityDays || 30) * 24 * 60 * 60 * 1000);

  const coupon = await Coupon.create({
    code,
    discountType: reward.rewardType === 'discount_percent' ? 'percentage' : 'flat',
    discountValue: reward.discountValue,
    minOrderAmount: reward.minimumOrderValue || 0,
    expiresAt,
    isActive: true,
  });

  const tx = await LoyaltyTransaction.create({
    user: userId,
    type: 'REDEEM',
    points: -reward.pointsRequired,
    description: `Redeemed ${reward.pointsRequired} points for reward: ${reward.name} (Coupon: ${code})`,
    referenceType: 'Reward',
    referenceId: reward._id,
    balanceAfter: user.loyaltyPoints,
  });

  return { coupon, tx, remainingPoints: user.loyaltyPoints };
};
