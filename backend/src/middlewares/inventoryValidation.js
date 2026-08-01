import mongoose from 'mongoose';

/**
 * Validates incoming create/update request payloads for Inventory Ingredients.
 */
export const validateIngredientPayload = (req, res, next) => {
  const {
    name,
    category,
    price,
    sellingPrice,
    quantity,
    stock,
    minimumStock,
    maximumStock,
    supplierEmail,
    image,
  } = req.body;

  const errors = [];

  // For POST (create), name and category are required
  if (req.method === 'POST') {
    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push('Ingredient name is required');
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      errors.push('Category is required');
    }
  }

  // Category validation if provided
  const validCategories = ['base', 'sauce', 'cheese', 'vegetable', 'meat', 'other'];
  if (category && !validCategories.includes(category.toLowerCase().trim())) {
    errors.push(`Invalid category. Allowed: ${validCategories.join(', ')}`);
  }

  // Price validation
  const effectivePrice = price !== undefined ? price : sellingPrice;
  if (effectivePrice !== undefined && (isNaN(effectivePrice) || Number(effectivePrice) < 0)) {
    errors.push('Price must be a non-negative number');
  }

  // Stock / Quantity validation
  const effectiveStock = quantity !== undefined ? quantity : stock;
  if (effectiveStock !== undefined && (isNaN(effectiveStock) || Number(effectiveStock) < 0)) {
    errors.push('Stock quantity must be a non-negative number');
  }

  // Min / Max Stock checks
  if (minimumStock !== undefined && (isNaN(minimumStock) || Number(minimumStock) < 0)) {
    errors.push('Minimum stock must be a non-negative number');
  }

  if (maximumStock !== undefined && minimumStock !== undefined) {
    if (Number(maximumStock) < Number(minimumStock)) {
      errors.push('Maximum stock must be greater than or equal to minimum stock');
    }
  }

  // Supplier email check
  if (supplierEmail) {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(supplierEmail)) {
      errors.push('Please provide a valid supplier email address');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates ObjectId parameters
 */
export const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ObjectId format: ${req.params.id}`,
    });
  }
  next();
};
