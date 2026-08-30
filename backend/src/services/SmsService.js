import twilio from 'twilio';
import logger from '../utils/logger.js';

let client = null;

/**
 * Initialize Twilio client lazily.
 */
const getTwilioClient = () => {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      logger.warn('Twilio credentials not configured; SMS will not be sent.');
      return null;
    }
    client = twilio(accountSid, authToken);
  }
  return client;
};

/**
 * Send an SMS via Twilio.
 */
export const sendSms = async ({ to, body }) => {
  try {
    const twilioClient = getTwilioClient();
    if (!twilioClient) {
      return { success: false, message: 'Twilio not configured' };
    }

    const from = process.env.TWILIO_FROM_NUMBER;
    if (!from) {
      logger.warn('TWILIO_FROM_NUMBER not set');
      return { success: false, message: 'Sender number not configured' };
    }

    const message = await twilioClient.messages.create({
      body,
      from,
      to,
    });

    logger.info(`SMS sent to ${to}: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    logger.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send delivery OTP SMS to customer.
 */
export const sendDeliveryOTPSms = async ({ to, otp, orderNumber }) => {
  const body = `PizzaHub Delivery OTP for Order #${orderNumber}: ${otp}. Valid for 10 minutes. Do not share this with anyone.`;
  return await sendSms({ to, body });
};
