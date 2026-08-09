import Order from '../models/Order.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import { getIO } from '../utils/socket.js';

/**
 * Validates GPS coordinates
 */
export const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Update Delivery GPS Location and emit real-time socket events
 */
export const updateLiveLocation = async (orderId, partnerId, lat, lng) => {
  if (!isValidCoordinate(lat, lng)) {
    throw new Error('Invalid GPS coordinates');
  }

  const timestamp = new Date();

  // Update order delivery location
  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      'deliveryInfo.currentLocation': { lat, lng, timestamp },
    },
    { new: true }
  );

  // Update partner current location
  await DeliveryPartner.findByIdAndUpdate(partnerId, {
    currentLocation: { lat, lng, lastUpdated: timestamp },
  });

  // Emit Socket.IO real-time event to order room & admin fleet room
  const io = getIO();
  if (io) {
    const payload = {
      orderId,
      partnerId,
      lat,
      lng,
      timestamp,
      deliveryStatus: order?.deliveryInfo?.deliveryStatus || 'OUT_FOR_DELIVERY',
    };

    io.to(orderId.toString()).emit('deliveryLocationUpdated', payload);
    io.to('admin-delivery').emit('partnerLocationUpdated', payload);
  }

  return { lat, lng, timestamp };
};

/**
 * Update Delivery Status (`ACCEPTED`, `PICKED_UP`, `OUT_FOR_DELIVERY`, `REACHED_CUSTOMER`, `DELIVERED`, `FAILED`)
 */
export const updateDeliveryStatus = async (orderId, partnerId, newStatus, remarks = '') => {
  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) throw new Error('Order not found');

  const partner = await DeliveryPartner.findById(partnerId);
  if (!partner) throw new Error('Delivery partner not found');

  order.deliveryInfo.deliveryStatus = newStatus;

  // Map delivery status to main Order status
  if (newStatus === 'ACCEPTED') {
    order.deliveryInfo.acceptedAt = new Date();
  } else if (newStatus === 'PICKED_UP') {
    order.deliveryInfo.pickedUpAt = new Date();
  } else if (newStatus === 'OUT_FOR_DELIVERY') {
    order.status = 'Out For Delivery';
    order.deliveryInfo.outForDeliveryAt = new Date();
  } else if (newStatus === 'REACHED_CUSTOMER') {
    order.deliveryInfo.reachedCustomerAt = new Date();
  } else if (newStatus === 'FAILED') {
    order.deliveryInfo.failureReason = remarks || 'Delivery failed';
    partner.availabilityStatus = 'AVAILABLE';
    partner.activeDelivery = null;
    partner.cancelledDeliveries += 1;
    await partner.save();
  }

  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    updatedBy: partner.user,
    role: 'delivery',
    remarks: remarks || `Delivery status changed to ${newStatus}`,
  });

  await order.save();

  // Socket.IO notifications
  const io = getIO();
  if (io) {
    io.to(orderId.toString()).emit('orderStatusChanged', {
      orderId,
      status: order.status,
      deliveryStatus: newStatus,
    });
    io.to('admin-delivery').emit('adminDeliveryStatusChanged', {
      orderId,
      partnerId,
      newStatus,
    });
  }

  return order;
};

/**
 * Complete Delivery using customer OTP verification
 */
export const completeDeliveryWithOTP = async (orderId, partnerId, enteredOTP) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  const partner = await DeliveryPartner.findById(partnerId);
  if (!partner) throw new Error('Delivery partner not found');

  if (order.deliveryInfo?.deliveryOTP !== enteredOTP) {
    throw new Error('Invalid Delivery OTP. Please ask customer for correct 4-digit code.');
  }

  // Mark Order & Delivery as DELIVERED
  order.status = 'Delivered';
  order.actualDeliveryTime = new Date();
  order.deliveryInfo.deliveryStatus = 'DELIVERED';
  order.deliveryInfo.deliveredAt = new Date();

  order.statusHistory.push({
    status: 'Delivered',
    timestamp: new Date(),
    updatedBy: partner.user,
    role: 'delivery',
    remarks: 'Delivery completed successfully with valid OTP.',
  });

  await order.save();

  // Update Partner stats & availability
  partner.availabilityStatus = 'AVAILABLE';
  partner.activeDelivery = null;
  partner.completedDeliveries += 1;
  await partner.save();

  // Socket.IO Notifications
  const io = getIO();
  if (io) {
    io.to(orderId.toString()).emit('orderStatusChanged', {
      orderId,
      status: 'Delivered',
      deliveryStatus: 'DELIVERED',
    });
    io.to('admin-delivery').emit('adminDeliveryCompleted', { orderId, partnerId });
  }

  return order;
};
