import mongoose from 'mongoose';
import slugify from 'slugify';

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      index: { unique: true, sparse: true },
      lowercase: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['base', 'sauce', 'cheese', 'vegetable', 'meat', 'other'],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400',
    },
    unit: {
      type: String,
      required: true,
      default: 'pcs',
      trim: true,
    },
    // Selling price added when customizing pizza (Synonym with price)
    price: {
      type: Number,
      required: true,
      min: [0, 'Selling price cannot be negative'],
      default: 0,
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
      default: 0,
    },
    // Current stock (quantity kept in sync for backward compatibility)
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    minimumStock: {
      type: Number,
      default: 10,
      min: [0, 'Minimum stock cannot be negative'],
    },
    maximumStock: {
      type: Number,
      default: 500,
      min: [0, 'Maximum stock cannot be negative'],
    },
    // Threshold kept in sync with minimumStock
    threshold: {
      type: Number,
      default: 10,
    },
    supplierName: {
      type: String,
      default: 'General Foods Ltd',
      trim: true,
    },
    supplierPhone: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    supplierEmail: {
      type: String,
      default: 'supplier@pizzahub.com',
      trim: true,
      lowercase: true,
    },
    expiryDate: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days out default
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-validate hook to generate slug and sync fields
// This fires on both .save() and .insertMany()
ingredientSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // Synchronize threshold & minimumStock
  if (this.minimumStock !== undefined && this.isModified('minimumStock')) {
    this.threshold = this.minimumStock;
  } else if (this.threshold !== undefined && this.isModified('threshold')) {
    this.minimumStock = this.threshold;
  }

  next();
});

// Computed Status Virtual
ingredientSchema.virtual('status').get(function () {
  if (!this.isAvailable) return 'Inactive';
  if (this.quantity === 0) return 'Out Of Stock';
  if (this.quantity <= (this.minimumStock || this.threshold)) return 'Low Stock';
  return 'Available';
});

// Alias virtuals for clean API responses
ingredientSchema.virtual('stock').get(function () {
  return this.quantity;
});
ingredientSchema.virtual('sellingPrice').get(function () {
  return this.price;
});

const Ingredient = mongoose.model('Ingredient', ingredientSchema);
export default Ingredient;
