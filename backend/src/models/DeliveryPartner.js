import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    vehicleType: {
      type: String,
      enum: ['Bike', 'Scooter', 'Car', 'Bicycle', 'Other'],
      default: 'Bike',
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'PENDING',
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
      default: 'OFFLINE',
    },
    currentLocation: {
      lat: { type: Number, default: 19.0760 },
      lng: { type: Number, default: 72.8777 },
      lastUpdated: { type: Date, default: Date.now },
    },
    activeDelivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
    },
    cancelledDeliveries: {
      type: Number,
      default: 0,
    },
    averageDeliveryTime: {
      type: Number,
      default: 30, // in minutes
    },
    averageRating: {
      type: Number,
      default: 5.0,
    },
    maxActiveDeliveries: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ status: 1, availabilityStatus: 1 });

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
export default DeliveryPartner;
