/**
 * Delivery Partner AI Chatbot Service
 * Uses Anthropic Claude API when available, falls back to rule-based responses.
 */
import DeliveryPartner from '../models/DeliveryPartner.js';
import Notification from '../models/Notification.js';
import { getMonthlyTotal, getYearlyTotal } from './EarningService.js';
import { PAYOUT_BASE, PAYOUT_PER_KM } from './EarningService.js';

const SYSTEM_PROMPT = `You are PizzaHub's delivery support assistant. You help delivery partners with their daily operations.

Key policies:
- Payout: ₹${PAYOUT_BASE} base per delivery + ₹${PAYOUT_PER_KM}/km distance bonus.
- OTP is sent to the customer's email and phone when you mark "Reached Customer". The OTP is valid for 10 minutes and allows 3 attempts. You can resend OTP with a 60-second cooldown.
- If a customer is unreachable after 10 minutes, mark the delivery as "Failed" and return to the outlet.
- For accidents or emergencies, call 112 first, then contact PizzaHub support at 1800-PIZZA-HUB.
- Wrong address: verify the pin location on the map. If completely wrong, mark as "Failed" with reason.
- Traffic delays: the ETA is auto-recalculated from your live GPS. No action needed.
- Payment issues: all payments are handled digitally through the app. Never accept cash unless the order is explicitly marked as "COD".

Be concise, friendly, and helpful. If you cannot resolve an issue, say "I'll escalate this to the support team" and nothing more.`;

/**
 * Gets personalized context for the delivery partner.
 */
const getPartnerContext = async (partnerId) => {
  try {
    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) return '';

    const [monthly, yearly] = await Promise.all([
      getMonthlyTotal(partnerId),
      getYearlyTotal(partnerId),
    ]);

    return `
Partner context:
- Name: ${partner.name}
- Employee ID: ${partner.employeeId}
- Completed deliveries: ${partner.completedDeliveries}
- Rating: ${partner.averageRating}/5
- Monthly earnings: ₹${monthly.total} (${monthly.count} deliveries)
- Yearly earnings: ₹${yearly.total} (${yearly.count} deliveries)
- Current status: ${partner.availabilityStatus}
`;
  } catch {
    return '';
  }
};

/**
 * Rule-based fallback when Anthropic API is unavailable.
 */
const ruleBasedReply = (message) => {
  const msg = message.toLowerCase();

  if (msg.includes('traffic') || msg.includes('delay') || msg.includes('late') || msg.includes('stuck')) {
    return 'Your ETA is automatically recalculated from your live GPS. The customer sees the updated time. Drive safely — no action needed from your side.';
  }
  if (msg.includes('customer not reachable') || msg.includes('not answering') || msg.includes('call')) {
    return 'Please wait 10 minutes. Try calling the customer. If still unreachable, use the "Report Delivery Failed" button with the reason "Customer unreachable".';
  }
  if (msg.includes('accident') || msg.includes('crash') || msg.includes('emergency')) {
    return '⚠️ Safety first! Call emergency services (112) if needed. I\'ll escalate this to the support team immediately. Your current delivery will be reassigned.';
  }
  if (msg.includes('wrong address') || msg.includes('cannot find') || msg.includes('location')) {
    return 'Please verify the pin location on the delivery map. If the address is completely wrong, mark the delivery as "Failed" with reason "Wrong address" and the order will be handled by support.';
  }
  if (msg.includes('otp') || msg.includes('code') || msg.includes('verification')) {
    return 'The OTP is sent to the customer when you tap "Reached Customer". It\'s valid for 10 minutes with 3 attempts. Use the "Resend OTP" button if the customer didn\'t receive it (60-second cooldown).';
  }
  if (msg.includes('earning') || msg.includes('pay') || msg.includes('salary') || msg.includes('income')) {
    return `Your payout is ₹${PAYOUT_BASE} base per delivery + ₹${PAYOUT_PER_KM}/km distance bonus. Check your Earnings page for monthly and yearly totals.`;
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return 'Hello! I\'m the PizzaHub Support Assistant. How can I help you with your delivery today?';
  }

  return 'I\'m not sure about that. Could you provide more details about your issue? If it\'s urgent, I\'ll escalate to the support team.';
};

/**
 * Main chatbot handler.
 * Tries Anthropic Claude first, falls back to rule-based responses.
 */
export const handleChatbotMessage = async (partnerId, message, history = []) => {
  const partnerContext = await getPartnerContext(partnerId);

  // Check for escalation keywords
  const isEscalation = /accident|crash|emergency|escalat|urgent|help me/i.test(message);

  // Try Anthropic API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey });

      const messages = [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ];

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT + '\n' + partnerContext,
        messages,
      });

      const reply = response.content[0]?.text || 'Sorry, I couldn\'t process that. Please try again.';

      // Create escalation notification if needed
      if (isEscalation) {
        await createEscalationNotification(partnerId, message);
      }

      return { reply, escalated: isEscalation };
    } catch (err) {
      console.error('[Chatbot] Anthropic API error, falling back to rules:', err.message);
    }
  }

  // Fallback to rule-based
  const reply = ruleBasedReply(message);

  if (isEscalation) {
    await createEscalationNotification(partnerId, message);
  }

  return { reply, escalated: isEscalation };
};

/**
 * Creates a support escalation notification for the admin.
 */
const createEscalationNotification = async (partnerId, message) => {
  try {
    const partner = await DeliveryPartner.findById(partnerId);
    await Notification.create({
      title: `Support Escalation from ${partner?.name || 'Delivery Partner'}`,
      message: `Partner ${partner?.employeeId || 'unknown'} needs help: "${message.substring(0, 200)}"`,
      type: 'SUPPORT_ESCALATION',
      priority: 'HIGH',
      recipient: 'admin',
      emailStatus: 'pending',
    });
  } catch (err) {
    console.error('[Chatbot] Failed to create escalation notification:', err.message);
  }
};
