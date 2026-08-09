import Review from '../models/Review.js';
import Order from '../models/Order.js';
import ReviewHelpfulVote from '../models/ReviewHelpfulVote.js';
import { awardBonusPoints } from './LoyaltyService.js';

/**
 * Validates whether user is eligible for verified review
 */
export const checkReviewEligibility = async (userId, pizzaId) => {
  const completedOrder = await Order.findOne({
    user: userId,
    status: { $in: ['Delivered', 'delivered'] },
    'items.pizza': pizzaId,
  }).sort({ createdAt: -1 });

  return {
    isEligible: !!completedOrder,
    orderId: completedOrder ? completedOrder._id : null,
  };
};

/**
 * Calculates rating breakdown for a pizza
 */
export const getPizzaRatingSummary = async (pizzaId) => {
  const stats = await Review.aggregate([
    { $match: { pizza: pizzaId, status: 'Approved' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ]);

  let totalReviews = 0;
  let sumRating = 0;
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const item of stats) {
    ratingCounts[item._id] = item.count;
    totalReviews += item.count;
    sumRating += item._id * item.count;
  }

  const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

  return {
    averageRating,
    totalReviews,
    ratingDistribution: {
      5: totalReviews > 0 ? Math.round((ratingCounts[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((ratingCounts[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((ratingCounts[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((ratingCounts[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((ratingCounts[1] / totalReviews) * 100) : 0,
    },
    ratingCounts,
  };
};

/**
 * Toggle helpful vote for a review
 */
export const voteHelpful = async (reviewId, userId) => {
  const existingVote = await ReviewHelpfulVote.findOne({ review: reviewId, user: userId });

  if (existingVote) {
    await ReviewHelpfulVote.findByIdAndDelete(existingVote._id);
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: -1 } },
      { new: true }
    );
    return { voted: false, helpfulCount: review.helpfulCount };
  } else {
    await ReviewHelpfulVote.create({ review: reviewId, user: userId });
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );
    return { voted: true, helpfulCount: review.helpfulCount };
  }
};
