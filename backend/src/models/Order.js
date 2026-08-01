import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  pizza: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pizza',
    required: false, // Optional if it's a completely custom built pizza
  },
  name: {
    type: String,
    required: true, // e.g., 'Custom Pizza' or 'Margherita'
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    couponCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'in-kitchen', 'ready', 'out-for-delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
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
    },
    phone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
