import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pizza: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pizza',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please provide a comment'],
    },
    images: [
      {
        type: String,
      },
    ],
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Flagged'],
      default: 'Approved',
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    adminResponse: {
      comment: { type: String, default: '' },
      respondedAt: { type: Date },
    },
  },
  { timestamps: true }
);

reviewSchema.index({ pizza: 1, status: 1 });
reviewSchema.index({ user: 1, pizza: 1, order: 1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
