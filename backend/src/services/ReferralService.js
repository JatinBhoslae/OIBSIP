import Referral from '../models/Referral.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { awardBonusPoints } from './LoyaltyService.js';

export const processReferralQualification = async (userId, orderId) => {
  // Check if this user was referred by someone
  const user = await User.findById(userId);
  if (!user || !user.referredBy) return null;

  // Verify this is the user's FIRST completed order
  const completedOrdersCount = await Order.countDocuments({
    user: userId,
    status: { $in: ['Delivered', 'delivered'] },
  });

  if (completedOrdersCount > 1) return null; // Must be first qualifying order

  // Check or create referral record
  let referral = await Referral.findOne({
    referrer: user.referredBy,
    referredUser: userId,
  });

  if (!referral) {
    const referrerUser = await User.findById(user.referredBy);
    if (!referrerUser) return null;

    referral = await Referral.create({
      referrer: user.referredBy,
      referredUser: userId,
      referralCode: referrerUser.referralCode,
      status: 'QUALIFIED',
      qualifyingOrder: orderId,
    });
  }

  if (referral.rewardIssued) return null; // Already rewarded

  // Award 500 bonus points to referrer
  const bonus = await awardBonusPoints(
    user.referredBy,
    referral.rewardPoints || 500,
    `Referral Bonus: ${user.name} completed their first order!`,
    'Referral',
    referral._id
  );

  referral.status = 'REWARDED';
  referral.rewardIssued = true;
  referral.completedAt = new Date();
  await referral.save();

  return { referral, bonus };
};
