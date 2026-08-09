import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'QUALIFIED', 'REWARDED', 'CANCELLED'],
      default: 'REGISTERED',
    },
    qualifyingOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    rewardPoints: {
      type: Number,
      default: 500,
    },
    rewardIssued: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, referredUser: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);
export default Referral;
