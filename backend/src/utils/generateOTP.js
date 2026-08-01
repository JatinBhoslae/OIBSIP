/**
 * Generates a 6-digit numeric OTP code for email verification.
 * @returns {String} 6-digit OTP code string
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
