import mongoose from 'mongoose';

/**
 * Earnings record for delivery partners.
 * One record per completed delivery.
 */
const earningSchema = new mongoose.Schema(
  {
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // One earning per order
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    distanceKm: {
      type: Number,
      required: true,
      min: 0,
    },
    // Breakdown for transparency
    baseFee: {
      type: Number,
      required: true,
      default: 30,
    },
    perKmRate: {
      type: Number,
      required: true,
      default: 5,
    },
    // Timestamp of the delivery completion (could be different from createdAt)
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for time-range queries (monthly/yearly earnings)
earningSchema.index({ deliveryPartner: 1, completedAt: -1 });

export default mongoose.model('Earning', earningSchema);
