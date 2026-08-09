import {
  getDashboardOverview,
  getSalesAnalytics,
  getCustomerAnalytics,
  getOrderAnalytics,
  getPizzaAnalytics,
  getInventoryAnalytics,
  getPaymentAnalytics,
  getDeliveryAnalytics,
} from '../services/AnalyticsService.js';
import { getRevenueAndInventoryForecast } from '../services/ForecastService.js';

export const dashboardOverview = async (req, res, next) => {
  try {
    const range = req.query.range || '30days';
    const data = await getDashboardOverview(range);
    return res.status(200).json({ success: true, range, data });
  } catch (error) {
    next(error);
  }
};

export const revenueAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || '30days';
    const data = await getSalesAnalytics(range);
    return res.status(200).json({ success: true, range, data });
  } catch (error) {
    next(error);
  }
};

export const orderAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || '30days';
    const data = await getOrderAnalytics(range);
    return res.status(200).json({ success: true, range, data });
  } catch (error) {
    next(error);
  }
};

export const customerAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || '30days';
    const data = await getCustomerAnalytics(range);
    return res.status(200).json({ success: true, range, data });
  } catch (error) {
    next(error);
  }
};

export const pizzaAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || '30days';
    const data = await getPizzaAnalytics(range);
    return res.status(200).json({ success: true, range, data });
  } catch (error) {
    next(error);
  }
};

export const inventoryAnalytics = async (req, res, next) => {
  try {
    const data = await getInventoryAnalytics();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const paymentAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || '30days';
    const data = await getPaymentAnalytics(range);
    return res.status(200).json({ success: true, range, data });
  } catch (error) {
    next(error);
  }
};

export const deliveryAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || '30days';
    const data = await getDeliveryAnalytics(range);
    return res.status(200).json({ success: true, range, data });
  } catch (error) {
    next(error);
  }
};

export const forecastAnalytics = async (req, res, next) => {
  try {
    const data = await getRevenueAndInventoryForecast();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
