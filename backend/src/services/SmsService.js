/**
 * SMS Service using Twilio for OTP delivery.
 * Falls back to console logging if Twilio credentials are not configured.
 */

let twilioClient = null;

const initTwilio = () => {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn('[SmsService] Twilio credentials not configured — SMS will be logged to console only.');
    return null;
  }

  try {
    // Dynamic import to avoid crashing if twilio is not installed
    const twilio = await import('twilio');
    twilioClient = twilio.default(accountSid, authToken);
    return twilioClient;
  } catch {
    console.warn('[SmsService] twilio package not installed — SMS will be logged to console only.');
    return null;
  }
};

/**
 * Sends a delivery OTP SMS to the customer.
 * @param {Object} params
 * @param {string} params.toPhone - Customer phone number (with country code)
 * @param {string} params.otp - The plaintext OTP
 * @param {string} params.orderNumber - The order number for reference
 */
export const sendDeliveryOTPSms = async ({ toPhone, otp, orderNumber }) => {
  const body = `PizzaHub: Your delivery verification OTP for order #${orderNumber} is ${otp}. Share this with your delivery partner to confirm receipt.`;

  try {
    const client = await initTwilioAsync();
    if (client) {
      const fromNumber = process.env.TWILIO_FROM_NUMBER;
      if (!fromNumber) {
        console.warn('[SmsService] TWILIO_FROM_NUMBER not set — skipping SMS.');
        console.log(`[SmsService] [MOCK SMS] To: ${toPhone} | Body: ${body}`);
        return;
      }
      await client.messages.create({ body, from: fromNumber, to: toPhone });
      console.log(`[SmsService] OTP SMS sent to ${toPhone}`);
    } else {
      // Fallback: log to console in dev mode
      console.log(`[SmsService] [MOCK SMS] To: ${toPhone} | Body: ${body}`);
    }
  } catch (err) {
    console.error('[SmsService] Failed to send SMS:', err.message);
    // Log the mock anyway so development isn't blocked
    console.log(`[SmsService] [FALLBACK MOCK SMS] To: ${toPhone} | Body: ${body}`);
  }
};

/**
 * Async Twilio initialization helper.
 */
const initTwilioAsync = async () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  try {
    const twilio = (await import('twilio')).default;
    return twilio(accountSid, authToken);
  } catch {
    return null;
  }
};
