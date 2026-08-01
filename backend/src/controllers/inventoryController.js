import {
  createIngredientService,
  getInventoryService,
  getIngredientByIdService,
  updateIngredientService,
  deleteIngredientService,
  getInventoryStatsService,
  bulkUpdateInventoryService,
  bulkDeleteInventoryService,
} from '../services/inventoryService.js';
import Ingredient from '../models/Ingredient.js';

/**
 * POST /api/admin/inventory
 */
export const createIngredient = async (req, res, next) => {
  try {
    const ingredient = await createIngredientService(req.body, req.user._id);
    return res.status(201).json({
      success: true,
      message: 'Ingredient added to inventory successfully',
      ingredient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/inventory
 */
export const getInventory = async (req, res, next) => {
  try {
    const result = await getInventoryService(req.query);
    return res.status(200).json({
      success: true,
      count: result.ingredients.length,
      pagination: result.pagination,
      ingredients: result.ingredients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/inventory/stats
 */
export const getInventoryStats = async (req, res, next) => {
  try {
    const stats = await getInventoryStatsService();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/inventory/search
 */
export const searchInventory = async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const result = await getInventoryService({ search: q, category, limit: 50 });
    return res.status(200).json({
      success: true,
      count: result.ingredients.length,
      ingredients: result.ingredients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/inventory/category/:category
 */
export const getIngredientsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const result = await getInventoryService({ category, limit: 100 });
    return res.status(200).json({
      success: true,
      category,
      count: result.ingredients.length,
      ingredients: result.ingredients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/inventory/:id
 */
export const getIngredientById = async (req, res, next) => {
  try {
    const ingredient = await getIngredientByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      ingredient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/inventory/:id
 */
export const updateIngredient = async (req, res, next) => {
  try {
    const ingredient = await updateIngredientService(req.params.id, req.body, req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Ingredient updated successfully',
      ingredient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/inventory/:id
 */
export const deleteIngredient = async (req, res, next) => {
  try {
    await deleteIngredientService(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Ingredient removed from inventory successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/inventory/bulk-update
 */
export const bulkUpdateInventory = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of items required for bulk update' });
    }
    const result = await bulkUpdateInventoryService(items, req.user._id);
    return res.status(200).json({
      success: true,
      message: `Bulk update successful for ${result.modifiedCount || items.length} items`,
      result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/inventory/bulk-delete
 */
export const bulkDeleteInventory = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of IDs required for bulk deletion' });
    }
    const result = await bulkDeleteInventoryService(ids);
    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} ingredients`,
    });
  } catch (error) {
    next(error);
  }
};
