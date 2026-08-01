import { Server } from 'socket.io';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for simplicity in dev
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join tracking room for specific order
    socket.on('joinOrderRoom', ({ orderId }) => {
      socket.join(orderId);
      console.log(`Socket ${socket.id} joined room for order: ${orderId}`);
    });

    // Join admin room
    socket.on('joinAdminRoom', () => {
      socket.join('admin-room');
      console.log(`Socket ${socket.id} joined admin-room`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
