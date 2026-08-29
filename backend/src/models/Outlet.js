import mongoose from 'mongoose';

const outletSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    address: {
      type: String,
      default: '',
    },
    serviceRadiusKm: {
      type: Number,
      default: 20,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    managerName: {
      type: String,
      default: 'Store Manager',
    },
    contactPhone: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

outletSchema.index({ isActive: 1 });

const Outlet = mongoose.model('Outlet', outletSchema);
export default Outlet;
