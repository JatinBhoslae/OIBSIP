import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { Search, SlidersHorizontal, Plus, Star, X, Check, ShoppingCart } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/common/Button';

export default function Menu() {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [pizzas, setPizzas] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  // Add-to-cart animation state
  const [addedPizzaId, setAddedPizzaId] = useState(null);

  // Review Modal State
  const [selectedPizza, setSelectedPizza] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    fetchPizzas();
  }, [search, category, sort]);

  const fetchPizzas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pizzas', {
        params: { search, category, sort },
      });
      setPizzas(res.data.pizzas);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReviews = async (pizza) => {
    setSelectedPizza(pizza);
    setReviewsLoading(true);
    setReviewMessage('');
    try {
      const res = await api.get(`/pizzas/${pizza._id}/reviews`);
      setReviews(res.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    setReviewMessage('');
    try {
      await api.post(
        `/pizzas/${selectedPizza._id}/reviews`,
        { rating: newRating, comment: newComment }
      );
      setNewComment('');
      // Reload reviews
      const res = await api.get(`/pizzas/${selectedPizza._id}/reviews`);
      setReviews(res.data.reviews);
    } catch (error) {
      setReviewMessage(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleAddPresetToCart = (pizza, size) => {
    addToCart({
      pizza: pizza._id,
      name: pizza.name,
      isCustom: false,
      size,
      price: Math.round(size === 'Small' ? pizza.basePrice * 0.85 : size === 'Large' ? pizza.basePrice * 1.3 : pizza.basePrice),
      quantity: 1,
    });

    // Trigger animation
    setAddedPizzaId(pizza._id);
    setTimeout(() => setAddedPizzaId(null), 1500);
  };

  return (
    <div className="bg-[#111827] text-white min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">Our Signature Menu</h1>
          <p className="text-neutral-400 max-w-sm mx-auto text-sm">
            Hand-tossed preset pizzas crafted with fresh ingredients.
          </p>
        </div>

        {/* Filter Controls */}
        <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-900/40 p-5 rounded-card border border-neutral-850 shadow-light">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pizzas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-input pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Categories</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="specialty">Specialty</option>
            </select>
          </div>

          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <Button type="submit" className="py-2.5">
            Apply Filters
          </Button>
        </form>

        {/* Pizzas List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]" />
          </div>
        ) : pizzas.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            No pizzas match your query. Try adjusting your filters.
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {pizzas.map((pizza) => (
              <motion.div
                key={pizza._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-neutral-900/40 border border-neutral-850 rounded-card overflow-hidden hover:border-neutral-800 transition-all flex flex-col shadow-light relative"
              >
                {/* Add-to-Cart Success Overlay */}
                <AnimatePresence>
                  {addedPizzaId === pizza._id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-emerald-500/15 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-card pointer-events-none"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="bg-emerald-500 rounded-full p-3 shadow-lg shadow-emerald-500/30 mb-3"
                      >
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-emerald-400 font-bold text-sm flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-4 h-4" /> Added to Cart!
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {pizza.image ? (
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openReviews(pizza)}
                  />
                ) : (
                  <div
                    className="w-full h-48 bg-neutral-950 flex items-center justify-center text-5xl cursor-pointer"
                    onClick={() => openReviews(pizza)}
                  >
                    🍕
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3
                      className="text-base font-bold text-white hover:text-[#FF6B00] cursor-pointer transition-colors"
                      onClick={() => openReviews(pizza)}
                    >
                      {pizza.name}
                    </h3>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${pizza.category === 'veg' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : pizza.category === 'non-veg' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                      {pizza.category}
                    </span>
                  </div>

                  <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed flex-1">
                    {pizza.description}
                  </p>

                  <div className="pt-2 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Starting at</span>
                      <span className="text-lg font-extrabold text-[#FF6B00]">₹{pizza.basePrice}</span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddPresetToCart(pizza, 'Medium')}
                      className="bg-[#FF6B00] hover:bg-[#e05e00] px-4 py-2 rounded-btn text-xs font-bold text-white flex items-center gap-1 transition-all hover:scale-105"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Pizza Details & Reviews Modal */}
      <AnimatePresence>
        {selectedPizza && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-modal w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col text-left shadow-large"
            >
              <div className="relative">
                {selectedPizza.image ? (
                  <img src={selectedPizza.image} alt={selectedPizza.name} className="w-full h-64 object-cover" />
                ) : (
                  <div className="w-full h-64 bg-neutral-950 flex items-center justify-center text-6xl">🍕</div>
                )}
                <button
                  onClick={() => setSelectedPizza(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors font-bold text-sm w-8 h-8 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPizza.name}</h2>
                  <p className="text-neutral-400 text-xs mt-1 leading-relaxed">{selectedPizza.description}</p>
                </div>

                {/* Quick Add Sizes */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-400 uppercase">Select Size:</span>
                  <div className="flex gap-2">
                    {['Small', 'Medium', 'Large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          handleAddPresetToCart(selectedPizza, size);
                          setSelectedPizza(null);
                        }}
                        className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 hover:bg-[#FF6B00] hover:text-white text-[#FF6B00] text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all"
                      >
                        + {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Customer Reviews
                  </h3>

                  {reviews.length === 0 ? (
                    <p className="text-neutral-500 text-xs">No reviews yet for this pizza. Be the first to review!</p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <div key={rev._id} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/60 text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-neutral-300">{rev.user.name}</span>
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-700'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-neutral-400 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit a review */}
                {user ? (
                  <form onSubmit={handleAddReview} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3 text-xs">
                    <h4 className="font-bold text-neutral-300 uppercase">Write a Review</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-400">Rating:</span>
                      <select
                        value={newRating}
                        onChange={(e) => setNewRating(Number(e.target.value))}
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white focus:outline-none"
                      >
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                    <textarea
                      rows="2"
                      placeholder="Your review comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    <div className="flex justify-between items-center">
                      <button
                        type="submit"
                        className="bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        Post Review
                      </button>
                      {reviewMessage && <span className="text-[#FF6B00] font-semibold">{reviewMessage}</span>}
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-neutral-500 text-center">
                    Please log in to leave a review.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
