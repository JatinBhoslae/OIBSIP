import mongoose from 'mongoose';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Order from '../models/Order.js';
import {
  updateLiveLocation,
  updateDeliveryStatus,
  completeDeliveryWithOTP,
  resendDeliveryOTP,
} from '../services/DeliveryTrackingService.js';
import {
  getMonthlyTotal,
  getYearlyTotal,
  getEarningsHistory,
} from '../services/EarningService.js';

export const getPartnerProfile = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user.id })
      .populate('user', 'name email phone profileImage')
      .populate({
        path: 'activeDelivery',
        select: 'orderNumber items shippingAddress phone grandTotal deliveryInfo status paymentMethod',
      });

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner profile not found' });
    }

    // Fetch earnings summary
    const partnerId = partner._id;
    const [monthly, yearly] = await Promise.all([
      getMonthlyTotal(partnerId),
      getYearlyTotal(partnerId),
    ]);

    const analytics = {
      monthlyIncome: monthly.total,
      monthlyDeliveries: monthly.count,
      yearlyIncome: yearly.total,
      yearlyDeliveries: yearly.count,
    };

    return res.status(200).json({ success: true, data: { ...partner.toObject(), analytics } });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (req, res, next) => {
  try {
    const { availabilityStatus } = req.body;
    if (!['AVAILABLE', 'OFFLINE'].includes(availabilityStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid availability status' });
    }

    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner profile not found' });

    if (partner.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Account is not ACTIVE' });
    }

    partner.availabilityStatus = availabilityStatus;
    await partner.save();

    return res.status(200).json({ success: true, message: `Availability set to ${availabilityStatus}`, data: partner });
  } catch (error) {
    next(error);
  }
};

export const getAssignedOrders = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const orders = await Order.find({
      'deliveryPartner.partnerId': partner._id,
      'deliveryInfo.deliveryStatus': { $in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'REACHED_CUSTOMER'] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

export const acceptAssignment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const order = await updateDeliveryStatus(orderId, partner._id, 'ACCEPTED', 'Driver accepted order assignment');
    partner.availabilityStatus = 'BUSY';
    partner.activeDelivery = order._id;
    await partner.save();

    return res.status(200).json({ success: true, message: 'Order accepted!', data: order });
  } catch (error) {
    next(error);
  }
};

export const rejectAssignment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const order = await Order.findById(orderId);
    if (order) {
      order.deliveryPartner = null;
      order.deliveryInfo.deliveryStatus = 'UNASSIGNED';
      await order.save();
    }

    partner.availabilityStatus = 'AVAILABLE';
    partner.activeDelivery = null;
    await partner.save();

    return res.status(200).json({ success: true, message: 'Assignment rejected' });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, remarks } = req.body;

    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const updatedOrder = await updateDeliveryStatus(orderId, partner._id, status, remarks);
    return res.status(200).json({ success: true, message: `Status updated to ${status}`, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

export const sendLocationUpdate = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const result = await updateLiveLocation(orderId, partner._id, Number(lat), Number(lng));
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const verifyOTPAndComplete = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;

    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const completedOrder = await completeDeliveryWithOTP(orderId, partner._id, otp);
    return res.status(200).json({ success: true, message: 'Delivery completed successfully!', data: completedOrder });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const result = await resendDeliveryOTP(orderId, partner._id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ── Earnings Endpoints ──

export const getEarningsSummary = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const [monthly, yearly] = await Promise.all([
      getMonthlyTotal(partner._id),
      getYearlyTotal(partner._id),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        monthTotal: monthly.total,
        monthDeliveries: monthly.count,
        yearTotal: yearly.total,
        yearDeliveries: yearly.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEarningsHistoryEndpoint = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getEarningsHistory(partner._id, { page, limit });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getOrderHistory = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      Order.find({
        'deliveryPartner.partnerId': partner._id,
        status: 'Delivered',
      })
        .sort({ 'deliveryInfo.deliveredAt': -1 })
        .skip(skip)
        .limit(limit)
        .select('orderNumber grandTotal shippingAddress deliveryInfo createdAt'),
      Order.countDocuments({ 'deliveryPartner.partnerId': partner._id, status: 'Delivered' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
