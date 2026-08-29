import mongoose from 'mongoose';

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
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    breakdown: {
      basePay: { type: Number, default: 0 },
      perKmPay: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

earningSchema.index({ deliveryPartner: 1, createdAt: -1 });

const Earning = mongoose.model('Earning', earningSchema);
export default Earning;
