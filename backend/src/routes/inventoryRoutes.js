import express from 'express';
import {
  createIngredient,
  getInventory,
  getInventoryStats,
  searchInventory,
  getIngredientsByCategory,
  getIngredientById,
  updateIngredient,
  deleteIngredient,
  bulkUpdateInventory,
  bulkDeleteInventory,
} from '../controllers/inventoryController.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import {
  validateIngredientPayload,
  validateObjectId,
} from '../middlewares/inventoryValidation.js';

const router = express.Router();

// All routes here are admin protected
router.use(protect, adminOnly);

// Special & Utility endpoints
router.get('/stats', getInventoryStats);
router.get('/search', searchInventory);
router.get('/category/:category', getIngredientsByCategory);
router.put('/bulk-update', bulkUpdateInventory);
router.delete('/bulk-delete', bulkDeleteInventory);

// Standard CRUD
router
  .route('/')
  .get(getInventory)
  .post(validateIngredientPayload, createIngredient);

router
  .route('/:id')
  .all(validateObjectId)
  .get(getIngredientById)
  .put(validateIngredientPayload, updateIngredient)
  .delete(deleteIngredient);

export default router;
