import jwt from 'jsonwebtoken';

/**
 * Verifies a JWT token signature and decodes payload.
 * @param {String} token - Bearer JWT token string
 * @returns {Object} Decoded payload
 */
export const verifyJWT = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_123456');
};
