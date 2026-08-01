import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['base', 'sauce', 'cheese', 'vegetable', 'meat', 'other'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'pcs',
    },
    threshold: {
      type: Number,
      required: true,
      default: 10,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
  },
  { timestamps: true }
);

const Ingredient = mongoose.model('Ingredient', ingredientSchema);
export default Ingredient;
