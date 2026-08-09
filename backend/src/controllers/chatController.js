import ChatMessage from '../models/ChatMessage.js';
import Order from '../models/Order.js';

export const getOrderChatHistory = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check: Only the customer, the assigned delivery partner, or an admin can access
    const isCustomer = order.user.toString() === req.user._id.toString();
    const isAssignedRider = order.deliveryPartner?.partnerId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAssignedRider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this chat history' });
    }

    // Retrieve messages in chronological order
    const messages = await ChatMessage.find({ order: orderId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name profileImage');

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

export const markChatAsRead = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;

    // Mark messages sent by the other party as read
    await ChatMessage.updateMany(
      { order: orderId, sender: { $ne: req.user._id } },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
