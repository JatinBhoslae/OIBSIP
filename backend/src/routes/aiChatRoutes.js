import express from 'express';
import { protect, deliveryPartnerOnly } from '../middlewares/auth.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import { handleChatbotMessage } from '../services/DeliveryChatbotService.js';

const router = express.Router();

router.post('/chat', protect, deliveryPartnerOnly, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const partner = await DeliveryPartner.findOne({ user: req.user.id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    const result = await handleChatbotMessage(partner._id, message, history || []);

    return res.status(200).json({
      success: true,
      reply: result.reply,
      escalated: result.escalated || false,
    });
  } catch (error) {
    console.error('[AI Chat] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Chatbot temporarily unavailable.' });
  }
});

export default router;
