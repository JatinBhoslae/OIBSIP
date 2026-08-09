import mongoose from 'mongoose';

const reviewHelpfulVoteSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

reviewHelpfulVoteSchema.index({ review: 1, user: 1 }, { unique: true });

const ReviewHelpfulVote = mongoose.model('ReviewHelpfulVote', reviewHelpfulVoteSchema);
export default ReviewHelpfulVote;
