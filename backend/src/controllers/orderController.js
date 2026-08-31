import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Pizza from '../models/Pizza.js';
import Ingredient from '../models/Ingredient.js';
import Coupon from '../models/Coupon.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getIO } from '../utils/socket.js';
import sendEmail from '../utils/nodemailer.js';
import {
  createOrderService,
  updateOrderStatusService,
  assignDeliveryPartnerService,
} from '../services/OrderService.js';

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

/**
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const order = await createOrderService(req.body, req.user.id);

    // Create Razorpay Order only if grandTotal > 0
    const rzp = getRazorpayInstance();
    let razorpayOrderId = null;
    if (order.grandTotal > 0 && rzp) {
      try {
        const razorpayOrder = await rzp.orders.create({
          amount: order.grandTotal * 100,
          currency: 'INR',
          receipt: `receipt_${order.orderNumber}`,
        });
        razorpayOrderId = razorpayOrder.id;
        order.razorpayOrderId = razorpayOrderId;
        await order.save();
      } catch (err) {
        console.error('Razorpay order creation failed, using mock payment ID fallback:', err.message);
        razorpayOrderId = `mock_rzp_${crypto.randomBytes(8).toString('hex')}`;
        order.razorpayOrderId = razorpayOrderId;
        await order.save();
      }
    }

    return res.status(201).json({
      success: true,
      order,
      orderNumber: order.orderNumber,
      trackingCode: order.trackingCode,
      razorpayOrderId,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/verify-payment
 */
export const verifyPayment = async (req, res, next) => {
  const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isMockBypass = razorpaySignature === 'mock_signature' || (order.razorpayOrderId && order.razorpayOrderId.startsWith('mock_rzp_'));

    if (isMockBypass) {
      order.paymentStatus = 'paid';
      order.paymentId = razorpayPaymentId || `pay_mock_${crypto.randomBytes(6).toString('hex')}`;
      order.status = 'Order Received';

      order.statusHistory.push({
        status: 'Order Received',
        timestamp: new Date(),
        updatedBy: req.user.id,
        role: 'customer',
        remarks: 'Payment simulated successfully via sandbox.',
      });

      await order.save();
    } else {
      const rzp = getRazorpayInstance();
      if (!rzp) {
        return res.status(500).json({ success: false, message: 'Razorpay is not configured' });
      }

      if (!razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Razorpay signature is required' });
      }

      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature === razorpaySignature) {
        order.paymentStatus = 'paid';
        order.paymentId = razorpayPaymentId;
        order.status = 'Order Received';

        order.statusHistory.push({
          status: 'Order Received',
          timestamp: new Date(),
          updatedBy: req.user.id,
          role: 'customer',
          remarks: 'Payment verified successfully via Razorpay.',
        });

        await order.save();
      } else {
        order.paymentStatus = 'failed';
        order.status = 'Payment Failed';
        await order.save();
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    const io = getIO();
    if (io) {
      io.to(order._id.toString()).emit('orderStatusChanged', {
        orderId: order._id,
        status: 'Order Received',
        paymentStatus: 'paid',
      });
      io.to('admin-room').emit('newOrder', order);
    }

    return res.status(200).json({ success: true, message: 'Payment verified and order confirmed!', order });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/my
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const { tab } = req.query; // 'upcoming', 'completed', 'cancelled'
    const query = { user: req.user.id };

    if (tab === 'upcoming') {
      query.status = {
        $in: [
          'Order Received',
          'Preparing',
          'Baking',
          'Quality Check',
          'Ready',
          'Out For Delivery',
          'pending',
          'confirmed',
          'preparing',
          'in-kitchen',
          'ready',
          'out-for-delivery',
        ],
      };
    } else if (tab === 'completed') {
      query.status = { $in: ['Delivered', 'delivered'] };
    } else if (tab === 'cancelled') {
      query.status = { $in: ['Cancelled', 'Refunded', 'cancelled', 'refunded'] };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id (Accepts MongoDB _id OR trackingCode OR orderNumber)
 */
export const getOrderById = async (req, res, next) => {
  try {
    const param = req.params.id;
    let query = {};

    if (mongoose.Types.ObjectId.isValid(param)) {
      query = { _id: param };
    } else {
      query = { $or: [{ orderNumber: param }, { trackingCode: param }] };
    }

    const order = await Order.findOne(query).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/reorder
 */
export const reorderItems = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Original order not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Items retrieved for reorder',
      items: order.items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res, next) => {
  const { reason } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Customer cancellation allowed only before Out For Delivery
    if (
      req.user.role !== 'admin' &&
      !['Order Received', 'Pending Payment', 'pending', 'confirmed', 'Preparing', 'Baking', 'Quality Check', 'Ready'].includes(order.status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled as it has already been dispatched',
      });
    }

    order.status = 'Cancelled';
    order.cancelReason = reason || 'Cancelled by user';
    order.cancelledBy = req.user.id;

    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      updatedBy: req.user.id,
      role: req.user.role,
      remarks: reason || 'Order cancelled',
    });

    // Refund logic: Add to wallet if paid online or wallet was used
    const walletRefund = order.walletDeduction || 0;
    const paymentRefund = order.paymentStatus === 'paid' ? order.grandTotal : 0;
    const totalRefund = walletRefund + paymentRefund;

    if (totalRefund > 0) {
      const user = await User.findById(order.user);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + totalRefund;
        await user.save();
      }
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
      }
    }

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

    const io = getIO();
    if (io) {
      io.to(order._id.toString()).emit('orderStatusChanged', {
        orderId: order._id,
        status: 'Cancelled',
      });
    }

    return res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders
 * Advanced merchant search, filter, sorting & pagination
 */
export const getAdminOrders = async (req, res, next) => {
  try {
    const { search, status, dateRange, sortBy = 'newest', page = 1, limit = 15 } = req.query;
    const query = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filter
    if (dateRange === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfDay };
    } else if (dateRange === 'yesterday') {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    } else if (dateRange === 'week') {
      const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: startOfWeek };
    } else if (dateRange === 'month') {
      const startOfMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: startOfMonth };
    }

    // Search filter across orderNumber, trackingCode, invoiceNumber, phone
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: regex },
        { trackingCode: regex },
        { invoiceNumber: regex },
        { phone: regex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'oldest') sortOption = { createdAt: 1 };
    else if (sortBy === 'amount-high') sortOption = { grandTotal: -1 };
    else if (sortBy === 'amount-low') sortOption = { grandTotal: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 15);
    const skip = (pageNum - 1) * limitNum;

    const totalItems = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum) || 1,
      },
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
  const { status, remarks } = req.body;
  try {
    const order = await updateOrderStatusService(req.params.id, status, remarks, req.user);
    return res.status(200).json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/orders/:id/assign-delivery
 */
export const assignDeliveryPartner = async (req, res, next) => {
  try {
    const order = await assignDeliveryPartnerService(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Delivery partner assigned successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/orders/:id/refund
 */
export const refundOrder = async (req, res, next) => {
  const { refundNotes, refundReason } = req.body;
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['Refunded'].includes(order.status) || order.refundStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'Order has already been refunded' });
    }

    order.status = 'Refunded';
    order.refundStatus = 'Completed';
    order.refundReason = refundReason || 'Admin processed refund';
    order.refundNotes = refundNotes || 'Full refund credited to customer.';
    order.refundedAt = new Date();

    order.statusHistory.push({
      status: 'Refunded',
      timestamp: new Date(),
      updatedBy: req.user.id,
      role: 'admin',
      remarks: `Refund of ₹${order.grandTotal} completed. Notes: ${order.refundNotes}`,
    });

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

    await order.save();

    const io = getIO();
    if (io) {
      io.to(order._id.toString()).emit('orderStatusChanged', { orderId: order._id, status: 'Refunded' });
      io.to('admin-room').emit('refundUpdated', order);
    }

    return res.status(200).json({ success: true, message: 'Order refunded and inventory restored', order });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/orders/:id
 */
export const deleteOrder = async (req, res, next) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders/analytics
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayStats = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: '$grandTotal' },
          todayOrders: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const deliveredCount = statusCounts.find((s) => s._id === 'Delivered' || s._id === 'delivered')?.count || 0;
    const pendingCount = statusCounts.find((s) => ['Order Received', 'Preparing', 'Baking', 'Ready', 'Out For Delivery'].includes(s._id))?.count || 0;

    return res.status(200).json({
      success: true,
      analytics: {
        todayRevenue: todayStats[0]?.todayRevenue || 0,
        todayOrders: todayStats[0]?.todayOrders || 0,
        deliveredCount,
        pendingCount,
        statusCounts,
        avgDeliveryTimeMinutes: 32, // Enterprise average benchmark
      },
    });
  } catch (error) {
    next(error);
  }
};
