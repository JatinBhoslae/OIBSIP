import Review from '../models/Review.js';
import Order from '../models/Order.js';
import {
  checkReviewEligibility,
  getPizzaRatingSummary,
  voteHelpful,
} from '../services/ReviewService.js';
import { awardBonusPoints } from '../services/LoyaltyService.js';

/**
 * Get reviews for a specific pizza
 */
export const getPizzaReviews = async (req, res, next) => {
  try {
    const { pizzaId } = req.params;
    const { sort = 'newest', page = 1, limit = 10 } = req.query;

    const query = { pizza: pizzaId, status: 'Approved' };

    let sortOption = { createdAt: -1 };
    if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
    if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };

    const skip = (page - 1) * limit;
    const reviews = await Review.find(query)
      .populate('user', 'name profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const summary = await getPizzaRatingSummary(pizzaId);

    return res.status(200).json({
      success: true,
      summary,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new review with verified purchase check
 */
export const createReview = async (req, res, next) => {
  try {
    const { pizzaId, rating, comment, title, images } = req.body;
    const userId = req.user.id;

    if (!pizzaId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Pizza ID, rating and comment are required' });
    }

    // Check verified purchase eligibility server-side
    const { isEligible, orderId } = await checkReviewEligibility(userId, pizzaId);

    const existingReview = await Review.findOne({ user: userId, pizza: pizzaId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this pizza' });
    }

    const review = await Review.create({
      user: userId,
      pizza: pizzaId,
      order: orderId,
      title: title || '',
      rating: Number(rating),
      comment,
      images: images || [],
      verifiedPurchase: isEligible,
      status: 'Approved', // Auto-approved for verified purchasers
    });

    // Award 50 bonus loyalty points for submitting a review
    await awardBonusPoints(userId, 50, 'Review Bonus Points', 'Review', review._id);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully! Earned 50 bonus loyalty points.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vote helpful on a review
 */
export const toggleHelpful = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await voteHelpful(id, req.user.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all reviews with status filter
 */
export const getAdminReviews = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 15 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('pizza', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(query);
    const pendingCount = await Review.countDocuments({ status: 'Pending' });

    return res.status(200).json({
      success: true,
      total,
      pendingCount,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update review status (Approved/Rejected/Flagged)
 */
export const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    return res.status(200).json({ success: true, message: `Review status set to ${status}`, data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Respond to a review
 */
export const respondToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      {
        adminResponse: {
          comment,
          respondedAt: new Date(),
        },
      },
      { new: true }
    );

    return res.status(200).json({ success: true, message: 'Admin response added', data: review });
  } catch (error) {
    next(error);
  }
};
