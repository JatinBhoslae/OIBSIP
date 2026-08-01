import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token for password resets and verification tokens.
 * @param {Number} bytes - Number of random bytes (default: 32)
 * @returns {String} Hex-encoded token string
 */
export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};
