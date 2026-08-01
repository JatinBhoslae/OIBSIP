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
  },
  { timestamps: true }
);

// Ensure unique review per user per pizza
reviewSchema.index({ user: 1, pizza: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
