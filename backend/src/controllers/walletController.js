import User from '../models/User.js';

export const topupWallet = async (req, res, next) => {
  const { amount } = req.body;
  try {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Simulate Razorpay/Bank deposit success
    user.walletBalance = (user.walletBalance || 0) + parsedAmount;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully added ₹${parsedAmount} to your Pizza Wallet!`,
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawWallet = async (req, res, next) => {
  const { amount, bankDetails } = req.body;
  try {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifsc) {
      return res.status(400).json({ success: false, message: 'Bank details (Account Number, IFSC) are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((user.walletBalance || 0) < parsedAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance for withdrawal' });
    }

    // Simulate Bank withdrawal
    user.walletBalance -= parsedAmount;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully withdrew ₹${parsedAmount} to your bank account!`,
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    next(error);
  }
};
