import Outlet from '../models/Outlet.js';

export const getOutlets = async (req, res, next) => {
  try {
    const outlets = await Outlet.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: outlets });
  } catch (error) {
    next(error);
  }
};
