import Ingredient from '../models/Ingredient.js';

/**
 * Creates a new ingredient item in inventory.
 */
export const createIngredientService = async (data, userId) => {
  const existing = await Ingredient.findOne({
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
  });

  if (existing) {
    const error = new Error('An ingredient with this name already exists');
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    ...data,
    price: data.price !== undefined ? data.price : (data.sellingPrice || 0),
    quantity: data.quantity !== undefined ? data.quantity : (data.stock || 0),
    minimumStock: data.minimumStock !== undefined ? data.minimumStock : (data.threshold || 10),
    threshold: data.minimumStock !== undefined ? data.minimumStock : (data.threshold || 10),
    createdBy: userId,
    updatedBy: userId,
  };

  const ingredient = await Ingredient.create(payload);
  return ingredient;
};

/**
 * Retrieves inventory with filtering, searching, sorting, and pagination.
 */
export const getInventoryService = async (queryParams) => {
  const {
    search,
    category,
    status,
    sortBy = 'newest',
    page = 1,
    limit = 10,
  } = queryParams;

  const query = {};

  // Category filter
  if (category && category !== 'all') {
    query.category = category.toLowerCase().trim();
  }

  // Search filter across name, category, supplierName
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { category: searchRegex },
      { supplierName: searchRegex },
      { description: searchRegex },
    ];
  }

  // Status Filter handling
  if (status && status !== 'all') {
    const statusLower = status.toLowerCase();
    if (statusLower === 'available') {
      query.isAvailable = true;
      query.$expr = { $gt: ['$quantity', '$minimumStock'] };
    } else if (statusLower === 'low stock' || statusLower === 'low-stock') {
      query.isAvailable = true;
      query.$expr = {
        $and: [
          { $gt: ['$quantity', 0] },
          { $lte: ['$quantity', '$minimumStock'] },
        ],
      };
    } else if (statusLower === 'out of stock' || statusLower === 'out-of-stock') {
      query.isAvailable = true;
      query.quantity = 0;
    } else if (statusLower === 'unavailable' || statusLower === 'inactive') {
      query.isAvailable = false;
    }
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sortBy === 'oldest') sortOption = { createdAt: 1 };
  else if (sortBy === 'price') sortOption = { price: -1 };
  else if (sortBy === 'price-low') sortOption = { price: 1 };
  else if (sortBy === 'stock') sortOption = { quantity: -1 };
  else if (sortBy === 'stock-low') sortOption = { quantity: 1 };
  else if (sortBy === 'alphabetical') sortOption = { name: 1 };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const totalItems = await Ingredient.countDocuments(query);
  const ingredients = await Ingredient.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  return {
    ingredients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
    },
  };
};

/**
 * Gets a single ingredient by ID
 */
export const getIngredientByIdService = async (id) => {
  const ingredient = await Ingredient.findById(id);
  if (!ingredient) {
    const error = new Error('Ingredient item not found');
    error.statusCode = 404;
    throw error;
  }
  return ingredient;
};

/**
 * Updates an ingredient
 */
export const updateIngredientService = async (id, updateData, userId) => {
  if (updateData.name) {
    const existing = await Ingredient.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
    });
    if (existing) {
      const error = new Error('Another ingredient with this name already exists');
      error.statusCode = 400;
      throw error;
    }
  }

  const payload = {
    ...updateData,
    updatedBy: userId,
  };

  if (updateData.stock !== undefined && updateData.quantity === undefined) {
    payload.quantity = updateData.stock;
  }
  if (updateData.sellingPrice !== undefined && updateData.price === undefined) {
    payload.price = updateData.sellingPrice;
  }
  if (updateData.minimumStock !== undefined && updateData.threshold === undefined) {
    payload.threshold = updateData.minimumStock;
  }

  const ingredient = await Ingredient.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!ingredient) {
    const error = new Error('Ingredient not found');
    error.statusCode = 404;
    throw error;
  }

  return ingredient;
};

/**
 * Deletes an ingredient
 */
export const deleteIngredientService = async (id) => {
  const ingredient = await Ingredient.findByIdAndDelete(id);
  if (!ingredient) {
    const error = new Error('Ingredient not found');
    error.statusCode = 404;
    throw error;
  }
  return ingredient;
};

/**
 * Computes inventory statistics
 */
export const getInventoryStatsService = async () => {
  const totalIngredients = await Ingredient.countDocuments();
  const availableCount = await Ingredient.countDocuments({
    isAvailable: true,
    $expr: { $gt: ['$quantity', '$minimumStock'] },
  });

  const lowStockCount = await Ingredient.countDocuments({
    isAvailable: true,
    $expr: {
      $and: [
        { $gt: ['$quantity', 0] },
        { $lte: ['$quantity', '$minimumStock'] },
      ],
    },
  });

  const outOfStockCount = await Ingredient.countDocuments({
    isAvailable: true,
    quantity: 0,
  });

  const inactiveCount = await Ingredient.countDocuments({ isAvailable: false });

  // Calculate Total Inventory Valuation (sum of purchasePrice * quantity)
  const valuation = await Ingredient.aggregate([
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$purchasePrice', '$quantity'] } },
        totalPotentialRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
      },
    },
  ]);

  return {
    totalIngredients,
    availableCount,
    lowStockCount,
    outOfStockCount,
    inactiveCount,
    totalInventoryValue: valuation[0]?.totalValue || 0,
    totalPotentialRevenue: valuation[0]?.totalPotentialRevenue || 0,
  };
};

/**
 * Bulk updates stock levels or status
 */
export const bulkUpdateInventoryService = async (items, userId) => {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id || item._id },
      update: {
        $set: {
          ...(item.quantity !== undefined && { quantity: item.quantity }),
          ...(item.stock !== undefined && { quantity: item.stock }),
          ...(item.isAvailable !== undefined && { isAvailable: item.isAvailable }),
          ...(item.lastRestocked && { lastRestocked: item.lastRestocked }),
          updatedBy: userId,
        },
      },
    },
  }));

  const result = await Ingredient.bulkWrite(bulkOps);
  return result;
};

/**
 * Bulk deletes ingredients
 */
export const bulkDeleteInventoryService = async (ids) => {
  const result = await Ingredient.deleteMany({ _id: { $in: ids } });
  return result;
};
