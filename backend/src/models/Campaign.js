import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetSegment: {
      type: String,
      enum: ['Inactive', 'VIP', 'New', 'Loyal', 'At Risk', 'All'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    couponCode: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'Sent'],
      default: 'Draft',
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
