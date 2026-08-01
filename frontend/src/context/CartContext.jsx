import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('pizzahub_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const { token } = useContext(AuthContext);

  useEffect(() => {
    localStorage.setItem('pizzahub_cart', JSON.stringify(cartItems));
    // Reset coupon if cart becomes empty
    if (cartItems.length === 0) {
      setCouponCode('');
      setCouponDiscount(0);
    } else if (couponCode) {
      // Re-validate coupon with new subtotal
      revalidateCoupon(couponCode, getSubtotal());
    }
  }, [cartItems]);

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const revalidateCoupon = async (code, amount) => {
    if (!token) return;
    try {
      const res = await api.post(
        '/coupons/validate',
        { code, amount }
      );
      setCouponDiscount(res.data.discount);
      setCouponError('');
    } catch (error) {
      setCouponDiscount(0);
      setCouponError(error.response?.data?.message || 'Invalid coupon');
    }
  };

  const applyCoupon = async (code) => {
    if (!token) {
      setCouponError('Please log in to apply coupons.');
      return false;
    }
    const amount = getSubtotal();
    try {
      const res = await api.post(
        '/coupons/validate',
        { code, amount }
      );
      setCouponCode(res.data.couponCode);
      setCouponDiscount(res.data.discount);
      setCouponError('');
      return true;
    } catch (error) {
      setCouponDiscount(0);
      setCouponError(error.response?.data?.message || 'Invalid coupon');
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError('');
  };

  const addToCart = (item) => {
    setCartItems((prev) => {
      // For custom pizza, generate a unique key based on customization elements
      const itemKey = item.isCustom
        ? `custom-${item.size}-${item.customization.base}-${item.customization.sauce}-${item.customization.cheese}-${(item.customization.vegetables || []).join('-')}-${(item.customization.meats || []).join('-')}`
        : `preset-${item.pizza}-${item.size}`;

      const existingIndex = prev.findIndex((i) => i.cartId === itemKey);
      if (existingIndex > -1) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += item.quantity || 1;
        return newItems;
      }
      return [...prev, { ...item, cartId: itemKey, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, action) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    removeCoupon();
  };

  const getCartTotals = () => {
    const subtotal = getSubtotal();
    const discount = couponDiscount;
    const netAmount = subtotal - discount;
    const gst = Math.round(netAmount * 0.05);
    const deliveryCharges = netAmount > 0 && netAmount < 500 ? 40 : 0;
    const grandTotal = netAmount + gst + deliveryCharges;

    return {
      subtotal,
      discount,
      gst,
      deliveryCharges,
      grandTotal,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        couponCode,
        couponDiscount,
        couponError,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        getCartTotals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
