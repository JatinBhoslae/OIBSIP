import mongoose from 'mongoose';

const pizzaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pizza name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Pizza description is required'],
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['veg', 'non-veg', 'specialty'],
      default: 'veg',
    },
    basePrice: {
      type: Number,
      required: true,
      min: [0, 'Base price cannot be negative'],
    },
    ingredients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Pizza = mongoose.model('Pizza', pizzaSchema);
export default Pizza;
