import express from 'express';
import http from 'http';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

// Load config first before loading controllers & services
dotenv.config();

import connectDB from './config/db.js';
import { initSocket, getIO } from './utils/socket.js';
import setupInventoryCron from './cron/inventoryCron.js';
import { errorHandler } from './middlewares/error.js';
import logger from './utils/logger.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import pizzaRoutes from './routes/pizzaRoutes.js';
import ingredientRoutes from './routes/ingredientRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import deliveryPartnerRoutes from './routes/deliveryPartnerRoutes.js';
import adminDeliveryRoutes from './routes/adminDeliveryRoutes.js';
import deliveryRatingRoutes from './routes/deliveryRatingRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

// Init Socket.io
initSocket(server);

// Init Cron
setupInventoryCron();

// ─── Request ID Middleware ───
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ─── Security Middlewares ───
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to avoid breaking Razorpay, Google Maps, Cloudinary
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ───
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS: Origin not allowed'));
        }
      }
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ─── Compression ───
app.use(compression());

// ─── Body Parsing ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Request Logging ───
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ───
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Health Check ───
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    status: dbState === 1 ? 'ok' : 'degraded',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbStates[dbState] || 'unknown',
  });
});

// ─── Mount Routes ───
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/pizzas', pizzaRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders/:id/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/delivery', deliveryPartnerRoutes);
app.use('/api/delivery-ratings', deliveryRatingRoutes);
app.use('/api/admin/delivery-partners', adminDeliveryRoutes);
app.use('/api/admin', adminRoutes);

// ─── Fallback Route ───
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// ─── Error Handler ───
app.use(errorHandler);

// ─── Start Server ───
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  logger.info(`PizzaHub Server started`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    pid: process.pid,
  });
});

// ─── Graceful Shutdown ───
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // 1. Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // 2. Close Socket.IO
  const io = getIO();
  if (io) {
    io.close(() => {
      logger.info('Socket.IO server closed');
    });
  }

  // 3. Close MongoDB
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error('Error closing MongoDB connection', { error: err.message });
  }

  // 4. Give active requests time to finish (max 10s)
  setTimeout(() => {
    logger.warn('Forcefully shutting down after timeout');
    process.exit(1);
  }, 10000);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason: reason?.message || String(reason) });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

export default app;
