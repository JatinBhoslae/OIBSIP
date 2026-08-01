import Pizza from '../models/Pizza.js';
import Review from '../models/Review.js';

export const getPizzas = async (req, res, next) => {
  try {
    const { search, category, sort } = req.query;
    let query = { isAvailable: true };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    let apiQuery = Pizza.find(query).populate('ingredients');

    if (sort) {
      if (sort === 'price-low') apiQuery = apiQuery.sort('basePrice');
      else if (sort === 'price-high') apiQuery = apiQuery.sort('-basePrice');
      else if (sort === 'newest') apiQuery = apiQuery.sort('-createdAt');
    }

    const pizzas = await apiQuery;
    return res.status(200).json({ success: true, count: pizzas.length, pizzas });
  } catch (error) {
    next(error);
  }
};

export const getPizzaById = async (req, res, next) => {
  try {
    const pizza = await Pizza.findById(req.params.id).populate('ingredients');
    if (!pizza) {
      return res.status(404).json({ success: false, message: 'Pizza not found' });
    }
    return res.status(200).json({ success: true, pizza });
  } catch (error) {
    next(error);
  }
};

export const createPizza = async (req, res, next) => {
  try {
    const { name, description, image, category, basePrice, ingredients } = req.body;
    const pizza = await Pizza.create({
      name,
      description,
      image,
      category,
      basePrice,
      ingredients,
    });
    return res.status(201).json({ success: true, pizza });
  } catch (error) {
    next(error);
  }
};

export const updatePizza = async (req, res, next) => {
  try {
    const pizza = await Pizza.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!pizza) {
      return res.status(404).json({ success: false, message: 'Pizza not found' });
    }
    return res.status(200).json({ success: true, pizza });
  } catch (error) {
    next(error);
  }
};

export const deletePizza = async (req, res, next) => {
  try {
    const pizza = await Pizza.findByIdAndDelete(req.params.id);
    if (!pizza) {
      return res.status(404).json({ success: false, message: 'Pizza not found' });
    }
    return res.status(200).json({ success: true, message: 'Pizza deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req, res, next) => {
  const { rating, comment, images } = req.body;
  const pizzaId = req.params.id;

  try {
    const pizza = await Pizza.findById(pizzaId);
    if (!pizza) {
      return res.status(404).json({ success: false, message: 'Pizza not found' });
    }

    // Check if user already reviewed
    let review = await Review.findOne({ user: req.user.id, pizza: pizzaId });

    if (review) {
      review.rating = rating;
      review.comment = comment;
      if (images) review.images = images;
      await review.save();
    } else {
      review = await Review.create({
        user: req.user.id,
        pizza: pizzaId,
        rating,
        comment,
        images: images || [],
      });
    }

    return res.status(200).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

export const getPizzaReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ pizza: req.params.id })
      .populate('user', 'name')
      .sort('-createdAt');
    return res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};
