import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT token for an authenticated user.
 * @param {Object} payload - User information payload { id, email, role }
 * @returns {String} Signed JWT token
 */
export const generateJWT = (payload) => {
  return jwt.sign(
    {
      id: payload.id || payload._id,
      email: payload.email,
      role: payload.role,
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_123456',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};
