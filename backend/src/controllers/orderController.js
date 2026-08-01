import Order from '../models/Order.js';
import Pizza from '../models/Pizza.js';
import Ingredient from '../models/Ingredient.js';
import Coupon from '../models/Coupon.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getIO } from '../utils/socket.js';
import sendEmail from '../utils/nodemailer.js';

// Helper to get or init Razorpay instance dynamically
let razorpayInstance = null;
const getRazorpayInstance = () => {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// Low Stock Alert Checker Helper
const checkAndAlertLowStock = async (ingredient) => {
  if (ingredient.quantity <= ingredient.threshold) {
    console.log(`[LOW STOCK ALERT] ${ingredient.name} is low: ${ingredient.quantity} left.`);
    // Get all admin users
    // For simplicity, send to configured admin email or log
    const adminEmail = process.env.SMTP_USER || 'admin@pizzahub.com';
    await sendEmail({
      email: adminEmail,
      subject: `[ALERT] Low Stock: ${ingredient.name}`,
      message: `The stock level for "${ingredient.name}" is currently ${ingredient.quantity} ${ingredient.unit}. Please restock soon.`,
    });
  }
};

export const createOrder = async (req, res, next) => {
  const { items, shippingAddress, phone, couponCode } = req.body;

  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    let subTotal = 0;
    const validatedItems = [];

    // Resolve prices & check inventory
    for (const item of items) {
      let itemPrice = 0;
      let sizeFactor = 1.0;
      if (item.size === 'Small') sizeFactor = 0.85;
      if (item.size === 'Large') sizeFactor = 1.3;

      if (item.isCustom) {
        // Compute Custom Pizza cost
        const customization = item.customization;
        let customizationCost = 150; // Base crust price

        const ingredientNames = [
          customization.base,
          customization.sauce,
          customization.cheese,
          ...(customization.vegetables || []),
          ...(customization.meats || []),
        ].filter(Boolean);

        // Fetch ingredients
        const dbIngredients = await Ingredient.find({ name: { $in: ingredientNames } });

        // Verify stock for each
        for (const ingredientName of ingredientNames) {
          const ing = dbIngredients.find((i) => i.name === ingredientName);
          if (!ing) {
            return res.status(400).json({
              success: false,
              message: `Ingredient '${ingredientName}' not found`,
            });
          }
          if (ing.quantity < 1 * item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ingredient: ${ingredientName}`,
            });
          }
          customizationCost += ing.price;
        }

        itemPrice = Math.round(customizationCost * sizeFactor);
        validatedItems.push({
          name: `Custom Pizza (${item.size})`,
          isCustom: true,
          size: item.size,
          customization,
          price: itemPrice,
          quantity: item.quantity,
        });

        // Deduct quantities
        for (const ingredientName of ingredientNames) {
          const ing = dbIngredients.find((i) => i.name === ingredientName);
          ing.quantity -= 1 * item.quantity;
          await ing.save();
          await checkAndAlertLowStock(ing);
        }
      } else {
        // Standard Preset Pizza
        const pizza = await Pizza.findById(item.pizza).populate('ingredients');
        if (!pizza) {
          return res.status(404).json({ success: false, message: 'Pizza not found' });
        }

        // Check ingredients
        for (const ing of pizza.ingredients) {
          if (ing.quantity < 1 * item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock of ingredients for: ${pizza.name}`,
            });
          }
        }

        itemPrice = Math.round(pizza.basePrice * sizeFactor);
        validatedItems.push({
          pizza: pizza._id,
          name: pizza.name,
          isCustom: false,
          size: item.size,
          price: itemPrice,
          quantity: item.quantity,
        });

        // Deduct quantities
        for (const ing of pizza.ingredients) {
          const dbIng = await Ingredient.findById(ing._id);
          dbIng.quantity -= 1 * item.quantity;
          await dbIng.save();
          await checkAndAlertLowStock(dbIng);
        }
      }

      subTotal += itemPrice * item.quantity;
    }

    // Apply Coupon
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date() <= coupon.expiryDate && subTotal >= coupon.minOrderValue) {
        const rawDiscount = (subTotal * coupon.discountPercentage) / 100;
        discountAmount = Math.round(Math.min(rawDiscount, coupon.maxDiscount));
      }
    }

    const gst = Math.round((subTotal - discountAmount) * 0.05); // 5% GST
    const deliveryCharges = subTotal - discountAmount > 500 ? 0 : 40; // Free delivery above 500
    const grandTotal = subTotal - discountAmount + gst + deliveryCharges;

    // Create Razorpay Order
    const rzp = getRazorpayInstance();
    let razorpayOrderId = null;
    if (rzp) {
      const razorpayOrder = await rzp.orders.create({
        amount: grandTotal * 100, // In paise
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`,
      });
      razorpayOrderId = razorpayOrder.id;
    } else {
      return res.status(500).json({ success: false, message: 'Razorpay keys are not configured on the server' });
    }

    const order = await Order.create({
      user: req.user.id,
      items: validatedItems,
      totalAmount: subTotal,
      discountAmount,
      gst,
      deliveryCharges,
      grandTotal,
      couponCode,
      razorpayOrderId,
      shippingAddress,
      phone,
    });

    return res.status(201).json({
      success: true,
      order,
      razorpayOrderId,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const rzp = getRazorpayInstance();
    if (!rzp) {
      return res.status(500).json({ success: false, message: 'Razorpay is not configured' });
    }

    // Verification Logic (Require signature matching for production security)
    if (!razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Razorpay signature is required' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isVerified = generatedSignature === razorpaySignature;

    if (isVerified) {
      order.paymentStatus = 'paid';
      order.paymentId = razorpayPaymentId;
      order.status = 'confirmed';
      await order.save();

      // Emit real-time order update to Admin and User rooms
      const io = getIO();
      if (io) {
        io.to(order._id.toString()).emit('orderStatusChanged', {
          orderId: order._id,
          status: 'confirmed',
          paymentStatus: 'paid',
        });
        io.to('admin-room').emit('newOrder', order);
      }

      return res.status(200).json({ success: true, message: 'Payment verified and order placed!', order });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: Customer can only view their own order
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email').sort('-createdAt');
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    // Trigger Socket.io real-time update
    const io = getIO();
    if (io) {
      io.to(orderId).emit('orderStatusChanged', { orderId, status });
    }

    // Send status update email for key steps
    if (['confirmed', 'preparing', 'ready', 'delivered'].includes(status)) {
      await sendEmail({
        email: order.user.email,
        subject: `PizzaHub - Order Status Update: ${status.toUpperCase()}`,
        message: `Hi ${order.user.name}, your order status has been updated to "${status.toUpperCase()}". Thank you for ordering from PizzaHub!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ff5e36; text-align: center;">Order Status Update</h2>
            <p>Hi ${order.user.name},</p>
            <p>The status of your PizzaHub order <strong>#${order._id}</strong> is now:</p>
            <div style="font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0; padding: 15px; background-color: #fff2ee; border-radius: 5px; color: #ff5e36;">
              ${status.toUpperCase()}
            </div>
            <p>You can track your pizza in real time on our website.</p>
          </div>
        `,
      });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Cancel allowed only before Preparing
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled because preparation has started',
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Revert inventory stock
    for (const item of order.items) {
      if (item.isCustom) {
        const customization = item.customization;
        const ingredientNames = [
          customization.base,
          customization.sauce,
          customization.cheese,
          ...(customization.vegetables || []),
          ...(customization.meats || []),
        ].filter(Boolean);

        await Ingredient.updateMany(
          { name: { $in: ingredientNames } },
          { $inc: { quantity: 1 * item.quantity } }
        );
      } else {
        const pizza = await Pizza.findById(item.pizza);
        if (pizza) {
          await Ingredient.updateMany(
            { _id: { $in: pizza.ingredients } },
            { $inc: { quantity: 1 * item.quantity } }
          );
        }
      }
    }

    // Emit Socket
    const io = getIO();
    if (io) {
      io.to(order._id.toString()).emit('orderStatusChanged', {
        orderId: order._id,
        status: 'cancelled',
      });
    }

    return res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const salesData = await Order.aggregate([
      { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const inventoryStatus = await Ingredient.find({
      $expr: { $lte: ['$quantity', '$threshold'] },
    }).select('name quantity threshold unit');

    return res.status(200).json({
      success: true,
      analytics: {
        totalRevenue: salesData[0]?.totalRevenue || 0,
        totalOrders: salesData[0]?.totalOrders || 0,
        statusBreakdown,
        lowStockItems: inventoryStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
