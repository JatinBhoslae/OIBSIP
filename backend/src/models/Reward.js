import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a reward name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    pointsRequired: {
      type: Number,
      required: [true, 'Please specify required loyalty points'],
      min: 1,
    },
    rewardType: {
      type: String,
      enum: ['discount_flat', 'discount_percent', 'free_delivery'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumOrderValue: {
      type: Number,
      default: 0,
    },
    maximumDiscount: {
      type: Number,
      default: 0,
    },
    validityDays: {
      type: Number,
      default: 30,
    },
    usageLimit: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Reward = mongoose.model('Reward', rewardSchema);
export default Reward;
