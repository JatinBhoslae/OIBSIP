import Order from '../models/Order.js';
import Pizza from '../models/Pizza.js';
import Ingredient from '../models/Ingredient.js';
import Coupon from '../models/Coupon.js';
import { generateOrderNumber, generateTrackingCode, generateInvoiceNumber } from '../utils/orderGenerators.js';
import { getIO } from '../utils/socket.js';
import sendEmail from '../utils/nodemailer.js';

/**
 * Creates a new order with auto-generated orderNumber, trackingCode, invoiceNumber, and initial audit trail.
 */
export const createOrderService = async (orderData, userId) => {
  const { items, shippingAddress, phone, couponCode, paymentMethod } = orderData;

  if (!items || items.length === 0) {
    const error = new Error('Cart items are required');
    error.statusCode = 400;
    throw error;
  }

  let subTotal = 0;
  const validatedItems = [];

  // Deduct ingredient quantities & validate stock
  for (const item of items) {
    let itemPrice = 0;
    let sizeFactor = 1.0;
    if (item.size === 'Small') sizeFactor = 0.85;
    if (item.size === 'Large') sizeFactor = 1.3;

    if (item.isCustom) {
      const customization = item.customization;
      let customizationCost = 150;

      const ingredientNames = [
        customization.base,
        customization.sauce,
        customization.cheese,
        ...(customization.vegetables || []),
        ...(customization.meats || []),
      ].filter(Boolean);

      const dbIngredients = await Ingredient.find({ name: { $in: ingredientNames } });

      for (const ingName of ingredientNames) {
        const ing = dbIngredients.find((i) => i.name === ingName);
        if (!ing) {
          const error = new Error(`Ingredient '${ingName}' not found`);
          error.statusCode = 400;
          throw error;
        }
        if (ing.quantity < 1 * item.quantity) {
          const error = new Error(`Insufficient stock for ingredient: ${ingName}`);
          error.statusCode = 400;
          throw error;
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

      for (const ingName of ingredientNames) {
        const ing = dbIngredients.find((i) => i.name === ingName);
        ing.quantity -= 1 * item.quantity;
        await ing.save();
      }
    } else {
      const pizzaId = item.pizza || item._id;
      let pizza = null;
      if (pizzaId) {
        pizza = await Pizza.findById(pizzaId).populate('ingredients');
      }
      if (!pizza && item.name) {
        pizza = await Pizza.findOne({ name: item.name }).populate('ingredients');
      }

      if (!pizza) {
        const error = new Error(`Preset pizza '${item.name || 'item'}' not found`);
        error.statusCode = 404;
        throw error;
      }

      for (const ing of pizza.ingredients) {
        if (ing.quantity < 1 * item.quantity) {
          const error = new Error(`Insufficient stock of ingredients for: ${pizza.name}`);
          error.statusCode = 400;
          throw error;
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

      for (const ing of pizza.ingredients) {
        const dbIng = await Ingredient.findById(ing._id);
        if (dbIng) {
          dbIng.quantity -= 1 * item.quantity;
          await dbIng.save();
        }
      }
    }

    subTotal += itemPrice * item.quantity;
  }

  // Coupon discount calculation
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && new Date() <= coupon.expiryDate && subTotal >= coupon.minOrderValue) {
      const rawDiscount = (subTotal * coupon.discountPercentage) / 100;
      discountAmount = Math.round(Math.min(rawDiscount, coupon.maxDiscount));
    }
  }

  const gst = Math.round((subTotal - discountAmount) * 0.05);
  const deliveryCharges = subTotal - discountAmount > 500 ? 0 : 40;
  const grandTotal = subTotal - discountAmount + gst + deliveryCharges;

  // Auto-generate identifiers
  const orderNumber = await generateOrderNumber();
  const trackingCode = generateTrackingCode();
  const invoiceNumber = await generateInvoiceNumber();

  // Calculated estimated delivery (+45 minutes from now)
  const estimatedDeliveryTime = new Date(Date.now() + 45 * 60 * 1000);

  const initialStatusHistory = [
    {
      status: 'Order Received',
      timestamp: new Date(),
      updatedBy: userId,
      role: 'customer',
      remarks: 'Order placed successfully by customer.',
    },
  ];

  const order = await Order.create({
    orderNumber,
    trackingCode,
    invoiceNumber,
    user: userId,
    items: validatedItems,
    totalAmount: subTotal,
    discountAmount,
    gst,
    deliveryCharges,
    grandTotal,
    couponCode,
    paymentMethod: paymentMethod || 'Razorpay',
    status: 'Order Received',
    statusHistory: initialStatusHistory,
    shippingAddress,
    phone,
    estimatedDeliveryTime,
  });

  // Emit Socket Event
  const io = getIO();
  if (io) {
    io.to('admin-room').emit('orderCreated', order);
  }

  return order;
};

/**
 * Updates order status and logs audit entry.
 */
export const updateOrderStatusService = async (orderId, newStatus, remarks, updaterUser) => {
  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  order.status = newStatus;

  // If marked as Delivered, set actualDeliveryTime and trigger Loyalty + Referral logic
  if (newStatus === 'Delivered' || newStatus === 'delivered') {
    order.actualDeliveryTime = new Date();

    try {
      const { awardOrderPoints } = await import('./LoyaltyService.js');
      const { processReferralQualification } = await import('./ReferralService.js');

      await awardOrderPoints(order.user._id || order.user, order._id, order.grandTotal);
      await processReferralQualification(order.user._id || order.user, order._id);
    } catch (err) {
      console.error('Loyalty/Referral reward trigger error:', err);
    }
  }

  // Push to audit history
  order.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updaterUser?._id,
    role: updaterUser?.role || 'admin',
    remarks: remarks || `Order status updated to ${newStatus}`,
  });

  await order.save();

  // Broadcast Real-time socket events
  const io = getIO();
  if (io) {
    io.to(order._id.toString()).emit('orderStatusChanged', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: newStatus,
      statusHistory: order.statusHistory,
    });
    io.to('admin-room').emit('orderUpdated', order);
  }

  // Send status update email for major milestones
  if (order.user && order.user.email) {
    sendEmail({
      email: order.user.email,
      subject: `PizzaHub Order ${order.orderNumber} - ${newStatus.toUpperCase()}`,
      message: `Hi ${order.user.name}, your order ${order.orderNumber} is now: ${newStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ff5e36; text-align: center;">Order Status Update</h2>
          <p>Hi ${order.user.name},</p>
          <p>Your order <strong>#${order.orderNumber}</strong> has been updated to:</p>
          <div style="font-size: 22px; font-weight: bold; text-align: center; margin: 20px 0; padding: 15px; background-color: #fff2ee; border-radius: 5px; color: #ff5e36;">
            ${newStatus.toUpperCase()}
          </div>
          <p>Tracking Code: <strong>${order.trackingCode}</strong></p>
        </div>
      `,
    }).catch((err) => console.error('Status email failed:', err));
  }

  return order;
};

/**
 * Assigns delivery partner to order.
 */
export const assignDeliveryPartnerService = async (orderId, partnerData, adminUser) => {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  order.deliveryPartner = {
    ...partnerData,
    assignedAt: new Date(),
  };

  if (order.status !== 'Out For Delivery' && order.status !== 'out-for-delivery') {
    order.status = 'Out For Delivery';
  }

  order.statusHistory.push({
    status: 'Out For Delivery',
    timestamp: new Date(),
    updatedBy: adminUser?._id,
    role: 'admin',
    remarks: `Assigned delivery partner: ${partnerData.name} (${partnerData.phone})`,
  });

  await order.save();

  const io = getIO();
  if (io) {
    io.to(order._id.toString()).emit('deliveryAssigned', {
      orderId: order._id,
      deliveryPartner: order.deliveryPartner,
    });
    io.to('admin-room').emit('orderUpdated', order);
  }

  return order;
};
