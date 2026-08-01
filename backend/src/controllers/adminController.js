import User from '../models/User.js';
import { generateJWT } from '../utils/generateJWT.js';
import { getDashboardOverview } from '../services/dashboardService.js';

/**
 * POST /api/admin/login
 * Admin-only login — no registration endpoint exists.
 * Validates email, password, and role === 'admin'.
 */
export const adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrator account required',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    const token = generateJWT({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/dashboard
 * Returns aggregate metrics for the admin overview dashboard.
 * Protected: requires JWT + admin role.
 */
export const getDashboard = async (req, res, next) => {
  try {
    const metrics = await getDashboardOverview();
    return res.status(200).json({ success: true, metrics });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/profile
 * Returns the authenticated admin's profile.
 */
export const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: admin,
    });
  } catch (error) {
    next(error);
  }
};
