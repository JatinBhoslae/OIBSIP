import express from 'express';
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getLowStockAlerts,
} from '../controllers/ingredientController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
  .get(getIngredients) // Accessible by customers too to populate pizza customizer options
  .post(protect, adminOnly, createIngredient);

router.route('/low-stock')
  .get(protect, adminOnly, getLowStockAlerts);

router.route('/:id')
  .put(protect, adminOnly, updateIngredient)
  .delete(protect, adminOnly, deleteIngredient);

export default router;
