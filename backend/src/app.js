import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load config first before loading controllers & services
dotenv.config();

import connectDB from './config/db.js';
import { initSocket } from './utils/socket.js';
import setupInventoryCron from './cron/inventoryCron.js';
import { errorHandler } from './middlewares/error.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import pizzaRoutes from './routes/pizzaRoutes.js';
import ingredientRoutes from './routes/ingredientRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Init Socket.io
initSocket(server);

// Init Cron
setupInventoryCron();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/pizzas', pizzaRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);

// Fallback Route
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`PizzaHub Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
