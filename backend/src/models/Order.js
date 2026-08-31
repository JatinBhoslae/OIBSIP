import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'system', 'delivery'],
    default: 'system',
  },
  remarks: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
});

const orderItemSchema = new mongoose.Schema({
  pizza: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pizza',
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    enum: ['Small', 'Medium', 'Large'],
    default: 'Medium',
  },
  customization: {
    base: { type: String },
    sauce: { type: String },
    cheese: { type: String },
    vegetables: [{ type: String }],
    meats: [{ type: String }],
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    trackingCode: {
      type: String,
      unique: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    outlet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      index: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      required: true,
    },
    deliveryCharges: {
      type: Number,
      required: true,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    walletDeduction: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        'Pending Payment',
        'Payment Failed',
        'Order Received',
        'Preparing',
        'Baking',
        'Quality Check',
        'Ready',
        'Out For Delivery',
        'Delivered',
        'Cancelled',
        'Refund Pending',
        'Refunded',
        // Backward compatibility lowercase aliases
        'pending',
        'confirmed',
        'preparing',
        'in-kitchen',
        'ready',
        'out-for-delivery',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'Order Received',
      index: true,
    },
    statusHistory: [statusHistorySchema],
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Razorpay', 'COD', 'Card', 'UPI', 'Wallet'],
      default: 'Razorpay',
    },
    paymentId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
      lat: { type: Number, default: 12.9716 }, // Default Bangalore
      lng: { type: Number, default: 77.5946 },
    },
    phone: {
      type: String,
      required: true,
    },
    orderNotes: {
      type: String,
      default: '',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    deliveryPartner: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      vehicleNumber: { type: String, default: '' },
      assignedAt: { type: Date },
      deliveryNotes: { type: String, default: '' },
      partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', index: true },
    },
    deliveryInfo: {
      deliveryStatus: {
        type: String,
        enum: [
          'UNASSIGNED',
          'ASSIGNED',
          'ACCEPTED',
          'REJECTED',
          'PICKED_UP',
          'OUT_FOR_DELIVERY',
          'REACHED_CUSTOMER',
          'DELIVERED',
          'FAILED',
        ],
        default: 'UNASSIGNED',
        index: true,
      },
      deliveryOTP: {
        type: String,
        default: '',
      },
      otpGeneratedAt: {
        type: Date,
        default: null,
      },
      otpAttempts: {
        type: Number,
        default: 0,
      },
      otpResendCount: {
        type: Number,
        default: 0,
      },
      acceptedAt: { type: Date },
      pickedUpAt: { type: Date },
      outForDeliveryAt: { type: Date },
      reachedCustomerAt: { type: Date },
      deliveredAt: { type: Date },
      failureReason: { type: String, default: '' },
      currentLocation: {
        lat: { type: Number, default: 19.0760 },
        lng: { type: Number, default: 72.8777 },
        timestamp: { type: Date, default: Date.now },
      },
    },
    cancelReason: {
      type: String,
      default: '',
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    refundStatus: {
      type: String,
      enum: ['None', 'Pending', 'Processing', 'Completed', 'Rejected'],
      default: 'None',
    },
    refundReason: {
      type: String,
      default: '',
    },
    refundNotes: {
      type: String,
      default: '',
    },
    refundedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Virtual for formatted status string
orderSchema.virtual('normalizedStatus').get(function () {
  const map = {
    pending: 'Pending Payment',
    confirmed: 'Order Received',
    preparing: 'Preparing',
    'in-kitchen': 'Baking',
    ready: 'Ready',
    'out-for-delivery': 'Out For Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return map[this.status] || this.status;
});

orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
