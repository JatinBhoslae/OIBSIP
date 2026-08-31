import DeliveryPartner from '../models/DeliveryPartner.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { rankSuggestedDeliveryPartners, assignOrderToPartner } from '../services/DeliveryPartnerService.js';

export const createDeliveryPartner = async (req, res, next) => {
  try {
    const { name, email, phone, password, vehicleType, vehicleNumber, licenseNumber, employeeId } = req.body;

    if (!name || !email || !phone || !password || !vehicleNumber) {
      return res.status(400).json({ success: false, message: 'All required partner details must be provided' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
    }

    const empId = employeeId || `EMP-DP-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'delivery_partner',
      isVerified: true,
    });

    const partner = await DeliveryPartner.create({
      user: user._id,
      employeeId: empId,
      name,
      email,
      phone,
      vehicleType: vehicleType || 'Bike',
      vehicleNumber,
      licenseNumber: licenseNumber || '',
      status: 'ACTIVE',
      availabilityStatus: 'OFFLINE',
    });

    return res.status(201).json({ success: true, message: 'Delivery Partner created successfully!', data: partner });
  } catch (error) {
    next(error);
  }
};

import { getMonthlyTotal } from '../services/EarningService.js';

export const getDeliveryPartners = async (req, res, next) => {
  try {
    const { status, availability, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (availability) query.availabilityStatus = availability;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const partners = await DeliveryPartner.find(query)
      .populate('user', 'name email phone')
      .populate('activeDelivery', 'orderNumber status grandTotal shippingAddress deliveryInfo')
      .populate('outlet', 'name location')
      .sort({ createdAt: -1 });

    const partnersWithEarnings = await Promise.all(
      partners.map(async (p) => {
        const monthly = await getMonthlyTotal(p._id);
        const obj = p.toObject();
        obj.analytics = { monthlyIncome: typeof monthly === 'number' ? monthly : (monthly?.total || 0) };
        return obj;
      })
    );

    const total = partnersWithEarnings.length;
    const activeCount = partnersWithEarnings.filter((p) => p.status === 'ACTIVE').length;
    const availableCount = partnersWithEarnings.filter((p) => p.availabilityStatus === 'AVAILABLE').length;

    return res.status(200).json({
      success: true,
      total,
      activeCount,
      availableCount,
      data: partnersWithEarnings,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePartnerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(id, { status }, { new: true });
    if (!partner) return res.status(404).json({ success: false, message: 'Delivery Partner not found' });

    return res.status(200).json({ success: true, message: `Status updated to ${status}`, data: partner });
  } catch (error) {
    next(error);
  }
};

export const getSmartSuggestions = async (req, res, next) => {
  try {
    const rankedPartners = await rankSuggestedDeliveryPartners();
    return res.status(200).json({ success: true, count: rankedPartners.length, data: rankedPartners });
  } catch (error) {
    next(error);
  }
};

export const assignOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { partnerId } = req.body;

    if (!partnerId) return res.status(400).json({ success: false, message: 'Partner ID is required' });

    const result = await assignOrderToPartner(orderId, partnerId, req.user);
    return res.status(200).json({
      success: true,
      message: 'Order assigned to delivery partner successfully!',
      data: result,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getLiveFleetMapData = async (req, res, next) => {
  try {
    const activePartners = await DeliveryPartner.find({
      status: 'ACTIVE',
      availabilityStatus: { $in: ['AVAILABLE', 'BUSY'] },
    }).populate('activeDelivery', 'orderNumber status shippingAddress deliveryInfo');

    return res.status(200).json({ success: true, count: activePartners.length, data: activePartners });
  } catch (error) {
    next(error);
  }
};
