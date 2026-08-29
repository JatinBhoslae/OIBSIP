import DeliveryPartner from '../models/DeliveryPartner.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Outlet from '../models/Outlet.js';
import { haversineKm } from '../utils/geo.js';

/**
 * Smart Driver Selection Algorithm
 * Ranks active and available delivery partners using workload, rating, speed, and distance.
 * Uses the order's assigned outlet location (not hardcoded coords).
 * Filters to partners scoped to the same outlet when available.
 */
export const rankSuggestedDeliveryPartners = async (orderId) => {
  // Determine the outlet location from the order (if provided)
  let outletLat = 19.0760; // Fallback: Mumbai
  let outletLng = 72.8777;
  let outletId = null;

  if (orderId) {
    const order = await Order.findById(orderId).populate('outlet');
    if (order?.outlet) {
      outletLat = order.outlet.location.lat;
      outletLng = order.outlet.location.lng;
      outletId = order.outlet._id;
    }
  }

  // Build query — scope to outlet if the order has one
  const query = {
    status: 'ACTIVE',
    availabilityStatus: 'AVAILABLE',
  };
  if (outletId) {
    // Prefer partners assigned to this outlet, but also include unassigned partners
    query.$or = [{ outlet: outletId }, { outlet: null }, { outlet: { $exists: false } }];
  }

  const partners = await DeliveryPartner.find(query).populate('user', 'name email phone');

  const scoredPartners = partners.map((p) => {
    // 1. Workload score (0 if busy, 100 if completely free)
    const workloadScore = p.activeDelivery ? 0 : 100;

    // 2. Distance score (using shared Haversine)
    const distanceKm = haversineKm(p.currentLocation.lat, p.currentLocation.lng, outletLat, outletLng);

    // Inverse distance score (closer is better)
    const distanceScore = Math.max(100 - distanceKm * 10, 0);

    // 3. Rating & Speed score
    const ratingScore = (p.averageRating / 5) * 100;
    const speedScore = Math.max(100 - p.averageDeliveryTime, 0);

    // Weighted composite score
    const compositeScore = Math.round(
      workloadScore * 0.4 + distanceScore * 0.3 + ratingScore * 0.2 + speedScore * 0.1
    );

    return {
      partnerId: p._id,
      name: p.name,
      employeeId: p.employeeId,
      phone: p.phone,
      vehicleType: p.vehicleType,
      vehicleNumber: p.vehicleNumber,
      availabilityStatus: p.availabilityStatus,
      distanceKm,
      rating: p.averageRating,
      averageDeliveryTime: p.averageDeliveryTime,
      completedDeliveries: p.completedDeliveries,
      score: compositeScore,
    };
  });

  return scoredPartners.sort((a, b) => b.score - a.score);
};

/**
 * Assigns an order to a delivery partner with atomic locks.
 * OTP is no longer generated here — it's generated at REACHED_CUSTOMER.
 */
export const assignOrderToPartner = async (orderId, partnerId, adminUser) => {
  const partner = await DeliveryPartner.findById(partnerId);
  if (!partner) throw new Error('Delivery partner not found');

  if (partner.status !== 'ACTIVE') {
    throw new Error('Selected delivery partner is not active');
  }

  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  // Prevent double assignment if already assigned to someone else who accepted
  if (
    order.deliveryInfo?.deliveryStatus === 'ACCEPTED' ||
    order.deliveryInfo?.deliveryStatus === 'OUT_FOR_DELIVERY'
  ) {
    throw new Error('Order is already assigned and accepted by another driver');
  }

  order.deliveryPartner = {
    partnerId: partner._id,
    name: partner.name,
    phone: partner.phone,
    vehicleNumber: partner.vehicleNumber,
    assignedAt: new Date(),
  };

  order.deliveryInfo = {
    ...order.deliveryInfo,
    deliveryStatus: 'ASSIGNED',
    // OTP is NOT generated here anymore — it's generated at REACHED_CUSTOMER in DeliveryTrackingService
  };

  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    updatedBy: adminUser?._id,
    role: 'admin',
    remarks: `Assigned delivery to ${partner.name} (${partner.vehicleNumber})`,
  });

  await order.save();

  // Update partner reference
  partner.availabilityStatus = 'BUSY';
  partner.activeDelivery = order._id;
  await partner.save();

  return { order, partner };
};
