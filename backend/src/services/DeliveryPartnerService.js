import DeliveryPartner from '../models/DeliveryPartner.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * Smart Driver Selection Algorithm
 * Ranks active and available delivery partners using workload, rating, speed, and status.
 */
export const rankSuggestedDeliveryPartners = async () => {
  const partners = await DeliveryPartner.find({
    status: 'ACTIVE',
    availabilityStatus: 'AVAILABLE',
  }).populate('user', 'name email phone');

  const storeLat = 19.0760; // Mumbai Store Benchmark
  const storeLng = 72.8777;

  const scoredPartners = partners.map((p) => {
    // 1. Workload score (0 if busy, 100 if completely free)
    const workloadScore = p.activeDelivery ? 0 : 100;

    // 2. Distance score (Haversine formula approximation)
    const dLat = (p.currentLocation.lat - storeLat) * (Math.PI / 180);
    const dLng = (p.currentLocation.lng - storeLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(storeLat * (Math.PI / 180)) *
        Math.cos(p.currentLocation.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(6371 * c * 10) / 10;

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
 * Assigns an order to a delivery partner with atomic locks
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

  // Generate 4-digit Delivery OTP for customer verification
  const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();

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
    deliveryOTP,
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

  return { order, partner, deliveryOTP };
};
