import DeliveryRating from '../models/DeliveryRating.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Order from '../models/Order.js';

export const rateDeliveryPartner = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    const customerId = req.user.id;

    if (!orderId || !rating) {
      return res.status(400).json({ success: false, message: 'Order ID and rating (1-5) are required' });
    }

    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== customerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized or order not found' });
    }

    if (order.status !== 'Delivered' && order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Can only rate completed deliveries' });
    }

    const partnerId = order.deliveryPartner?.partnerId;
    if (!partnerId) {
      return res.status(400).json({ success: false, message: 'No delivery partner assigned to this order' });
    }

    const existingRating = await DeliveryRating.findOne({ order: orderId });
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'You have already rated this delivery' });
    }

    const deliveryRating = await DeliveryRating.create({
      order: orderId,
      customer: customerId,
      deliveryPartner: partnerId,
      rating: Number(rating),
      comment: comment || '',
    });

    // Recalculate delivery partner average rating
    const allRatings = await DeliveryRating.find({ deliveryPartner: partnerId });
    const avg = allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length;
    await DeliveryPartner.findByIdAndUpdate(partnerId, {
      averageRating: Math.round(avg * 10) / 10,
    });

    return res.status(201).json({ success: true, message: 'Thank you for rating your delivery partner!', data: deliveryRating });
  } catch (error) {
    next(error);
  }
};
