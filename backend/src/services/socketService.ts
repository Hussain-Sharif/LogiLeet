// backend/src/services/socketService.ts
import { Socket, Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import type mongoose from 'mongoose';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

export const setupSocketIO = (io: SocketIOServer) => {
  // Authentication middleware for socket connections
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('Invalid token or user not active'));
      }

      socket.userId = (user._id as mongoose.Types.ObjectId).toString();
      socket.role = user.role;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (${socket.role})`);

    // Join delivery-specific rooms for real-time tracking
    socket.on('join-delivery', (deliveryId: string) => {
      socket.join(`delivery-${deliveryId}`);
      console.log(`User ${socket.userId} joined delivery room: ${deliveryId}`);
    });

    // Leave delivery room
    socket.on('leave-delivery', (deliveryId: string) => {
      socket.leave(`delivery-${deliveryId}`);
      console.log(`User ${socket.userId} left delivery room: ${deliveryId}`);
    });

    // Handle driver location updates (real-time broadcasting)
    socket.on('driver-location-update', (data) => {
      const { deliveryId, location, timestamp, status } = data;
      
      // Broadcast to all clients tracking this delivery
      socket.to(`delivery-${deliveryId}`).emit('location-update', {
        deliveryId,
        location,
        timestamp,
        status,
        driverId: socket.userId
      });
    });

    // Handle delivery status updates
    socket.on('delivery-status-update', (data) => {
      const { deliveryId, status, timestamp } = data;
      
      // Broadcast to all clients tracking this delivery
      socket.to(`delivery-${deliveryId}`).emit('status-update', {
        deliveryId,
        status,
        timestamp,
        driverId: socket.userId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Helper function to emit events from controllers
export const emitToDelivery = (io: SocketIOServer, deliveryId: string, event: string, data: any) => {
  io.to(`delivery-${deliveryId}`).emit(event, data);
};
