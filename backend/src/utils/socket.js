import { Server } from 'socket.io';
import logger from './logger.js';
import ChatMessage from '../models/ChatMessage.js';

let io = null;

export const initSocket = (server) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
    : ['http://localhost:5173'];

  io = new Server(server, {
    cors: {
      origin: isProduction ? allowedOrigins : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket client connected: ${socket.id}`);

    // Join tracking room for specific order
    socket.on('joinOrderRoom', ({ orderId }) => {
      socket.join(orderId);
      logger.debug(`Socket ${socket.id} joined room for order: ${orderId}`);
    });

    // Join admin room
    socket.on('joinAdminRoom', () => {
      socket.join('admin-room');
      logger.debug(`Socket ${socket.id} joined admin-room`);
    });

    // ─── Chat System WebSockets ───
    socket.on('joinChatRoom', ({ orderId }) => {
      if (orderId) {
        socket.join(`chat:${orderId}`);
        logger.debug(`Socket ${socket.id} joined chat room: chat:${orderId}`);
      }
    });

    socket.on('sendChatMessage', async ({ orderId, message, senderId, senderRole }) => {
      if (!orderId || !message || !senderId || !senderRole) return;
      try {
        const chatMsg = await ChatMessage.create({
          order: orderId,
          sender: senderId,
          senderRole,
          message,
        });

        const populated = await chatMsg.populate('sender', 'name profileImage');

        // Broadcast to both customer & delivery partner in the room
        io.to(`chat:${orderId}`).emit('receiveChatMessage', populated);
      } catch (err) {
        logger.error('Error saving socket chat message', { error: err.message });
      }
    });

    // --- Delivery Partner System Rooms ---

    // Delivery partner joins their personal channel for assignment alerts
    socket.on('joinDeliveryPartnerRoom', ({ partnerId }) => {
      if (partnerId) {
        socket.join(`delivery:${partnerId}`);
        logger.debug(`Socket ${socket.id} joined delivery partner room: delivery:${partnerId}`);
      }
    });

    // Admin joins live fleet management room
    socket.on('joinAdminDeliveryRoom', () => {
      socket.join('admin-delivery');
      logger.debug(`Socket ${socket.id} joined admin-delivery fleet room`);
    });

    // Delivery partner sends live GPS location (client → server → broadcast)
    socket.on('deliveryPartnerLocationUpdate', ({ orderId, partnerId, lat, lng }) => {
      if (
        typeof lat === 'number' && typeof lng === 'number' &&
        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
      ) {
        const payload = { orderId, partnerId, lat, lng, timestamp: new Date() };

        // Broadcast to customer tracking room
        if (orderId) {
          io.to(orderId.toString()).emit('deliveryLocationUpdated', payload);
        }
        // Broadcast to admin fleet room
        io.to('admin-delivery').emit('partnerLocationUpdated', payload);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket client disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO server initialized', { transports: ['websocket', 'polling'] });

  return io;
};

export const getIO = () => {
  return io;
};
