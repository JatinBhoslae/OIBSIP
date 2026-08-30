import bcrypt from 'bcryptjs';
import Order from '../models/Order.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Outlet from '../models/Outlet.js';
import Notification from '../models/Notification.js';
import { getIO } from '../utils/socket.js';
import { haversineKm, etaMinutes } from '../utils/geo.js';
import sendEmail from '../utils/nodemailer.js';
import { sendDeliveryOTPSms } from './SmsService.js';
import { createEarning } from './EarningService.js';

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
 * Update Delivery GPS Location, recompute ETA, and emit real-time socket events
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

  // Recompute ETA from current location to customer shipping address
  let recomputedEta = null;
  if (order?.shippingAddress?.lat && order?.shippingAddress?.lng) {
    const remainingDistKm = haversineKm(lat, lng, order.shippingAddress.lat, order.shippingAddress.lng);
    recomputedEta = etaMinutes(remainingDistKm);

    // Update estimated delivery time on the order
    order.estimatedDeliveryTime = new Date(Date.now() + recomputedEta * 60000);
    await order.save();
  }

  // Emit Socket.IO real-time event to order room & admin fleet room
  const io = getIO();
  if (io) {
    const payload = {
      orderId,
      partnerId,
      lat,
      lng,
      timestamp,
      etaMinutes: recomputedEta,
      deliveryStatus: order?.deliveryInfo?.deliveryStatus || 'OUT_FOR_DELIVERY',
    };

    io.to(orderId.toString()).emit('deliveryLocationUpdated', payload);
    io.to('admin-delivery').emit('partnerLocationUpdated', payload);
  }

  return { lat, lng, timestamp, etaMinutes: recomputedEta };
};

/**
 * Generates a 4-digit OTP, hashes it with bcrypt, sends via email + SMS.
 * Returns the plaintext OTP (for logging/dev only — never sent to frontend).
 */
const generateAndSendOTP = async (order) => {
  const plainOtp = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedOtp = await bcrypt.hash(plainOtp, 10);

  order.deliveryInfo.deliveryOTP = hashedOtp;
  order.deliveryInfo.otpGeneratedAt = new Date();
  order.deliveryInfo.otpAttempts = 0;

  // Send email
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF6B00; text-align: center;">Delivery Arrived!</h2>
        <p>Your delivery partner has reached your location for order <strong>#${order.orderNumber}</strong>.</p>
        <p>Please provide the following OTP to the delivery partner:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #FF6B00; margin: 20px 0; padding: 15px; background: #fff2ee; border-radius: 8px;">
          ${plainOtp}
        </div>
        <p style="font-size: 12px; color: #999;">This OTP expires in 10 minutes.</p>
      </div>
    `;
    await sendEmail({
      email: order.user.email,
      subject: `Your OTP for PizzaHub Order #${order.orderNumber}`,
      html: emailHtml,
    });
    console.log(`[OTP] Email sent to ${order.user.email} for order #${order.orderNumber}`);
  } catch (err) {
    console.error('[OTP] Failed to send OTP email:', err.message);
  }

  // Send SMS
  try {
    await sendDeliveryOTPSms({
      toPhone: order.phone,
      otp: plainOtp,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    console.error('[OTP] Failed to send OTP SMS:', err.message);
  }

  return plainOtp;
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

    // ── Generate, hash, and send OTP at REACHED_CUSTOMER ──
    await generateAndSendOTP(order);

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
 * Complete Delivery using customer OTP verification.
 * Uses bcrypt.compare, enforces attempt limits (max 3), and 10-minute expiry.
 */
export const completeDeliveryWithOTP = async (orderId, partnerId, enteredOTP) => {
  const order = await Order.findById(orderId).populate('outlet');
  if (!order) throw new Error('Order not found');

  const partner = await DeliveryPartner.findById(partnerId);
  if (!partner) throw new Error('Delivery partner not found');

  // ── Check OTP expiry (10 minutes) ──
  const otpAge = Date.now() - new Date(order.deliveryInfo.otpGeneratedAt).getTime();
  if (otpAge > 10 * 60 * 1000) {
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  // ── Check attempt limit (max 3) ──
  if (order.deliveryInfo.otpAttempts >= 3) {
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  // ── Compare hashed OTP ──
  const isMatch = await bcrypt.compare(enteredOTP, order.deliveryInfo.deliveryOTP);
  if (!isMatch) {
    order.deliveryInfo.otpAttempts += 1;
    await order.save();
    const remaining = 3 - order.deliveryInfo.otpAttempts;
    throw new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
  }

  // ── Mark Order & Delivery as DELIVERED ──
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

  // ── Update Partner stats & availability ──
  partner.availabilityStatus = 'AVAILABLE';
  partner.activeDelivery = null;
  partner.completedDeliveries += 1;
  await partner.save();

  // ── Create Earning record ──
  try {
    const outletLocation = order.outlet?.location || { lat: 19.0760, lng: 72.8777 };
    const customerLocation = {
      lat: order.shippingAddress?.lat || 12.9716,
      lng: order.shippingAddress?.lng || 77.5946,
    };
    const distanceKm = haversineKm(outletLocation.lat, outletLocation.lng, customerLocation.lat, customerLocation.lng);
    await createEarning(order._id, partner._id, distanceKm);
  } catch (err) {
    console.error('[Earning] Failed to create earning record:', err.message);
  }

  // ── Create persistent delivery notification ──
  try {
    await Notification.create({
      title: `Delivery Completed: #${order.orderNumber}`,
      message: `Order #${order.orderNumber} was delivered by ${partner.name}.`,
      type: 'DELIVERY_COMPLETED',
      priority: 'LOW',
      recipient: 'admin',
      emailStatus: 'skipped',
    });
  } catch (err) {
    console.error('[Notification] Failed to create delivery notification:', err.message);
  }

  // ── Trigger Loyalty & Referral rewards ──
  try {
    const { awardOrderPoints } = await import('./LoyaltyService.js');
    const { processReferralQualification } = await import('./ReferralService.js');
    await awardOrderPoints(order.user._id || order.user, order._id, order.grandTotal);
    await processReferralQualification(order.user._id || order.user, order._id);
  } catch (err) {
    console.error('[Loyalty/Referral] trigger error:', err.message);
  }

  // ── Socket.IO Notifications ──
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

/**
 * Resend OTP — regenerates and re-sends via email + SMS.
 * Enforces a 60-second cooldown and increments resend count.
 */
export const resendDeliveryOTP = async (orderId, partnerId) => {
  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) throw new Error('Order not found');

  if (order.deliveryInfo?.deliveryStatus !== 'REACHED_CUSTOMER') {
    throw new Error('Cannot resend OTP at this delivery stage.');
  }

  // Cooldown check (60 seconds since last generation)
  const timeSinceLastOtp = Date.now() - new Date(order.deliveryInfo.otpGeneratedAt).getTime();
  if (timeSinceLastOtp < 60 * 1000) {
    const waitSec = Math.ceil((60000 - timeSinceLastOtp) / 1000);
    throw new Error(`Please wait ${waitSec} seconds before requesting a new OTP.`);
  }

  order.deliveryInfo.otpResendCount = (order.deliveryInfo.otpResendCount || 0) + 1;

  const plainOtp = await generateAndSendOTP(order);
  await order.save();

  console.log(`[OTP] Resent OTP for order #${order.orderNumber} (resend #${order.deliveryInfo.otpResendCount})`);
  return { message: 'OTP resent successfully.' };
};
