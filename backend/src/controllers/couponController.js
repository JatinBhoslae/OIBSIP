import Coupon from '../models/Coupon.js';

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({});
    return res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountPercentage, maxDiscount, minOrderValue, expiryDate } = req.body;
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code,
      discountPercentage,
      maxDiscount,
      minOrderValue,
      expiryDate,
    });
    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    return res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const validateCoupon = async (req, res, next) => {
  const { code, amount } = req.body;

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ success: false, message: 'Coupon code has expired' });
    }

    if (amount < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
      });
    }

    const rawDiscount = (amount * coupon.discountPercentage) / 100;
    const finalDiscount = Math.min(rawDiscount, coupon.maxDiscount);

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully!',
      couponCode: coupon.code,
      discount: finalDiscount,
    });
  } catch (error) {
    next(error);
  }
};
