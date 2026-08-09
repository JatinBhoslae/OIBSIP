import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import Reward from '../models/Reward.js';
import User from '../models/User.js';
import { redeemPoints, TIER_THRESHOLDS } from '../services/LoyaltyService.js';

export const getLoyaltyBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('loyaltyPoints loyaltyTier referralCode');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentTier = user.loyaltyTier || 'Bronze';
    const currentPoints = user.loyaltyPoints || 0;

    let nextTier = 'Platinum';
    let nextTierPoints = 3000;
    if (currentPoints < 500) { nextTier = 'Silver'; nextTierPoints = 500; }
    else if (currentPoints < 1500) { nextTier = 'Gold'; nextTierPoints = 1500; }
    else if (currentPoints < 3000) { nextTier = 'Platinum'; nextTierPoints = 3000; }

    const tierConfig = TIER_THRESHOLDS[currentTier];

    return res.status(200).json({
      success: true,
      data: {
        points: currentPoints,
        tier: currentTier,
        nextTier,
        nextTierPoints,
        progressPercent: Math.min(Math.round((currentPoints / nextTierPoints) * 100), 100),
        tierConfig,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await LoyaltyTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    next(error);
  }
};

export const getRewardsCatalog = async (req, res, next) => {
  try {
    let rewards = await Reward.find({ isActive: true }).sort({ pointsRequired: 1 });

    // Seed default rewards if database catalog is empty
    if (rewards.length === 0) {
      rewards = await Reward.insertMany([
        {
          name: '₹50 Flat Discount',
          description: 'Get ₹50 off on your next order',
          pointsRequired: 200,
          rewardType: 'discount_flat',
          discountValue: 50,
          minimumOrderValue: 299,
          validityDays: 30,
        },
        {
          name: 'Free Delivery Voucher',
          description: 'Zero delivery fees on your order',
          pointsRequired: 300,
          rewardType: 'free_delivery',
          discountValue: 40,
          minimumOrderValue: 199,
          validityDays: 30,
        },
        {
          name: '₹150 Super Saver Discount',
          description: 'Get ₹150 off on orders above ₹599',
          pointsRequired: 500,
          rewardType: 'discount_flat',
          discountValue: 150,
          minimumOrderValue: 599,
          validityDays: 30,
        },
        {
          name: '20% Mega Loyalty Discount',
          description: '20% off up to ₹200 on any order',
          pointsRequired: 800,
          rewardType: 'discount_percent',
          discountValue: 20,
          minimumOrderValue: 399,
          maximumDiscount: 200,
          validityDays: 30,
        },
      ]);
    }

    return res.status(200).json({ success: true, data: rewards });
  } catch (error) {
    next(error);
  }
};

export const redeemReward = async (req, res, next) => {
  try {
    const { rewardId } = req.body;
    if (!rewardId) {
      return res.status(400).json({ success: false, message: 'Reward ID is required' });
    }

    const result = await redeemPoints(req.user.id, rewardId);

    return res.status(200).json({
      success: true,
      message: 'Reward redeemed successfully!',
      data: result,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
