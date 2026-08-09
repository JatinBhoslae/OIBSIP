import User from '../models/User.js';
import Referral from '../models/Referral.js';

export const getMyReferralStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('name referralCode');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate code if missing
    if (!user.referralCode) {
      const cleanName = user.name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'PIZZA';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      user.referralCode = `PIZZA-${cleanName}${randomSuffix}`;
      await user.save();
    }

    const referrals = await Referral.find({ referrer: req.user.id })
      .populate('referredUser', 'name createdAt')
      .sort({ createdAt: -1 });

    const totalReferrals = referrals.length;
    const successfulReferrals = referrals.filter((r) => r.status === 'REWARDED').length;
    const pendingReferrals = referrals.filter((r) => r.status === 'REGISTERED' || r.status === 'QUALIFIED').length;
    const pointsEarned = successfulReferrals * 500;

    return res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink: `${req.headers.origin || 'http://localhost:5173'}/register?ref=${user.referralCode}`,
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        pointsEarned,
        history: referrals,
      },
    });
  } catch (error) {
    next(error);
  }
};
