import express from 'express';
import {
  getPizzas,
  getPizzaById,
  createPizza,
  updatePizza,
  deletePizza,
  addReview,
  getPizzaReviews,
} from '../controllers/pizzaController.js';
import { protect, adminOnly } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
  .get(getPizzas)
  .post(protect, adminOnly, createPizza);

router.route('/:id')
  .get(getPizzaById)
  .put(protect, adminOnly, updatePizza)
  .delete(protect, adminOnly, deletePizza);

router.route('/:id/reviews')
  .get(getPizzaReviews)
  .post(protect, addReview);

export default router;
