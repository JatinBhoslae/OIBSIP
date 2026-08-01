import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Trash2, ShoppingBag, Plus, Minus, Tag, X } from 'lucide-react';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { motion } from 'framer-motion';

export default function Cart() {
  const {
    cartItems,
    couponCode,
    couponDiscount,
    couponError,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    getCartTotals,
  } = useContext(CartContext);

  const { user } = useContext(AuthContext);
  const [promoInput, setPromoInput] = useState('');
  const navigate = useNavigate();

  const totals = getCartTotals();

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const success = await applyCoupon(promoInput);
    if (success) {
      setPromoInput('');
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#111827] text-white min-h-screen flex items-center justify-center">
        <EmptyState
          title="Your Cart is Empty"
          message="Browse our signature fresh pizzas or build a custom recipe masterpiece."
          actionText="Browse Menu"
          onAction={() => navigate('/menu')}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#111827] text-white min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Title */}
        <div className="lg:col-span-12 text-left">
          <h1 className="text-3xl font-extrabold tracking-tight">Your Pizza Cart ({cartItems.length})</h1>
        </div>

        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <motion.div
              key={item.cartId}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-neutral-900/40 border border-neutral-850 p-5 rounded-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-light text-left"
            >
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-white">{item.name}</h3>
                <div className="flex flex-wrap gap-2 text-[10px] text-neutral-400">
                  <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-semibold">
                    Size: {item.size}
                  </span>
                  {item.isCustom && (
                    <>
                      <span className="bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2 py-0.5 rounded font-semibold">
                        Crust: {item.customization.base}
                      </span>
                    </>
                  )}
                </div>
                {item.isCustom && (item.customization.vegetables?.length > 0 || item.customization.meats?.length > 0) && (
                  <p className="text-[10px] text-neutral-500 max-w-sm">
                    Toppings: {[...(item.customization.vegetables || []), ...(item.customization.meats || [])].join(', ')}
                  </p>
                )}
              </div>

              {/* Qty and price details */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-850">
                <div className="flex items-center bg-neutral-950 border border-neutral-850 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.cartId, 'decrease')}
                    className="p-1 hover:bg-neutral-900 rounded text-neutral-400"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-3 font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartId, 'increase')}
                    className="p-1 hover:bg-neutral-900 rounded text-neutral-400"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <span className="font-extrabold text-[#FF6B00] text-base block">₹{item.price * item.quantity}</span>
                  <span className="text-[9px] text-neutral-500 block">₹{item.price} each</span>
                </div>

                <button
                  onClick={() => removeFromCart(item.cartId)}
                  className="p-2 hover:bg-[#E63946]/10 text-neutral-500 hover:text-[#E63946] rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Totals Summary and Promos */}
        <div className="lg:col-span-4 space-y-6">
          {/* Promo code entry */}
          <div className="bg-neutral-900/60 border border-neutral-850 p-6 rounded-card space-y-4 shadow-light text-left">
            <h3 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-300">
              <Tag className="w-4 h-4 text-[#FF6B00]" />
              Promo Coupon
            </h3>

            {couponCode ? (
              <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/25 p-3 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#FF6B00] uppercase block">{couponCode} Applied</span>
                  <span className="text-[10px] text-neutral-400">₹{couponDiscount} Saved</span>
                </div>
                <button onClick={removeCoupon} className="text-neutral-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. PIZZA50"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-input px-3 py-2 text-xs text-white focus:outline-none uppercase"
                />
                <button
                  type="submit"
                  className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-750 font-bold px-3 py-2 rounded-lg text-xs"
                >
                  Apply
                </button>
              </form>
            )}
            {couponError && <p className="text-[10px] text-[#E63946] font-semibold">{couponError}</p>}
          </div>

          {/* Breakdown summary */}
          <div className="bg-neutral-900/60 border border-neutral-850 p-6 rounded-card space-y-4 shadow-light text-left text-xs">
            <h3 className="font-bold text-sm border-b border-neutral-850 pb-2 uppercase tracking-wider text-neutral-300">
              Billing Breakup
            </h3>

            <div className="space-y-2.5">
              <div className="flex justify-between text-neutral-400">
                <span>Items Subtotal</span>
                <span>₹{totals.subtotal}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>Promo Discount</span>
                  <span>-₹{totals.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-400">
                <span>GST (5%)</span>
                <span>₹{totals.gst}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Delivery Charges</span>
                <span>{totals.deliveryCharges === 0 ? 'Free' : `₹${totals.deliveryCharges}`}</span>
              </div>

              <div className="border-t border-neutral-850 pt-3 flex justify-between items-center text-sm font-extrabold">
                <span>Grand Total</span>
                <span className="text-lg text-[#FF6B00]">₹{totals.grandTotal}</span>
              </div>
            </div>

            <Button onClick={handleProceedToCheckout} className="w-full mt-4 py-3">
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
