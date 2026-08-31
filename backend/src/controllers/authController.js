import User from '../models/User.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/nodemailer.js';
import crypto from 'crypto';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwt_secret_fallback_key', {
    expiresIn: '30d',
  });
};

export const register = async (req, res, next) => {
  const { name, email, password, ref, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate unique referral code
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'PIZZA';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referralCode = `PIZZA-${cleanName}${randomSuffix}`;

    let referrer = null;
    if (ref) {
      const refUser = await User.findOne({ referralCode: ref });
      if (refUser) {
        referrer = refUser._id;
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      password,
      referralCode,
      referredBy: referrer,
      verificationOTP: otp,
      otpExpires,
      role: role && ['customer', 'delivery_partner'].includes(role) ? role : 'customer',
    });

    if (user.role === 'delivery_partner') {
      const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'DEL';
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const employeeId = `EMP-${cleanName}${randomSuffix}`;

      await DeliveryPartner.create({
        user: user._id,
        employeeId: employeeId,
        name: user.name,
        email: user.email,
        phone: req.body.phone || '0000000000', // Need some placeholder if not provided
        vehicleNumber: `VH-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'ACTIVE',
      });
    }

    const emailSent = await sendEmail({
      email: user.email,
      subject: 'PizzaHub Email Verification',
      message: `Your verification OTP code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ff5e36; text-align: center;">Welcome to PizzaHub!</h2>
          <p>Thank you for registering. Please verify your email using the OTP below:</p>
          <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; padding: 10px; background-color: #fff2ee; border-radius: 5px; color: #ff5e36; letter-spacing: 2px;">
            ${otp}
          </div>
          <p>Your unique referral code is <strong>${referralCode}</strong>. Share it with friends to earn 500 loyalty points!</p>
        </div>
      `,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Verification OTP sent to email.',
      userId: user._id,
      email: user.email,
      referralCode: user.referralCode,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    if (user.verificationOTP !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.otpExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        phone: user.phone,
        profileImage: user.profileImage,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyTier: user.loyaltyTier,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOTP = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'PizzaHub Email Verification',
        message: `Your verification OTP code is: ${otp}. It will expire in 10 minutes.`,
      });

      return res.status(403).json({
        success: false,
        message: 'Account not verified. A new verification OTP code has been sent to your email.',
        requiresVerification: true,
        email: user.email,
      });
    }

    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        phone: user.phone,
        profileImage: user.profileImage,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyTier: user.loyaltyTier,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Reset url (frontend route)
    const resetUrl = `${req.headers.origin}/reset-password/${resetToken}`;

    const emailSent = await sendEmail({
      email: user.email,
      subject: 'PizzaHub Password Reset',
      message: `You requested a password reset. Please click this link or paste it into your browser to reset your password:\n\n${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ff5e36; text-align: center;">Password Reset Request</h2>
          <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
          <p>Please click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #ff5e36; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 10 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Password reset link sent to email' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  const { name, phone, addresses } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (addresses !== undefined) user.addresses = addresses;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        walletBalance: user.walletBalance,
        addresses: user.addresses,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyTier: user.loyaltyTier,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    next(error);
  }
};
