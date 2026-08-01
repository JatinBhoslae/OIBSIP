import Ingredient from '../models/Ingredient.js';

export const getIngredients = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find({});
    return res.status(200).json({ success: true, count: ingredients.length, ingredients });
  } catch (error) {
    next(error);
  }
};

export const createIngredient = async (req, res, next) => {
  try {
    const { name, category, quantity, unit, threshold, price } = req.body;
    const ingredient = await Ingredient.create({
      name,
      category,
      quantity,
      unit,
      threshold,
      price,
    });
    return res.status(201).json({ success: true, ingredient });
  } catch (error) {
    next(error);
  }
};

export const updateIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }
    return res.status(200).json({ success: true, ingredient });
  } catch (error) {
    next(error);
  }
};

export const deleteIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }
    return res.status(200).json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getLowStockAlerts = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find({
      $expr: { $lte: ['$quantity', '$threshold'] },
    });
    return res.status(200).json({ success: true, count: ingredients.length, ingredients });
  } catch (error) {
    next(error);
  }
};
