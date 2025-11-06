/**
 * @summary Socket.io Server Setup and Event Handlers
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { UserRole, JWTPayload } from '../types';
import logger from '../utils/logger';

interface SocketUser {
  userId: string;
  role: UserRole;
  socketId: string;
}

// Store connected users
const connectedUsers = new Map<string, SocketUser>();

// Store user socket mappings
const userSockets = new Map<string, Set<string>>();

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // Attach user info to socket
      (socket as any).user = {
        userId: decoded.sub,
        role: decoded.role,
        email: decoded.email,
      };

      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error}`);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const user = (socket as any).user;
    
    logger.info(`User connected: ${user.userId} (${UserRole[user.role]}) - Socket: ${socket.id}`);

    // Store connected user
    connectedUsers.set(socket.id, {
      userId: user.userId,
      role: user.role,
      socketId: socket.id,
    });

    // Store user-socket mapping
    if (!userSockets.has(user.userId)) {
      userSockets.set(user.userId, new Set());
    }
    userSockets.get(user.userId)!.add(socket.id);

    // Join role-based rooms
    socket.join(`role:${user.role}`);
    socket.join(`user:${user.userId}`);

    // Join hostel-based rooms for students and wardens
    if (user.role === UserRole.STUDENT || user.role === UserRole.WARDEN) {
      // This would need to fetch hostel from database
      // For now, we'll handle it in the notification service
    }

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to Campus-Pass real-time server',
      userId: user.userId,
      role: user.role,
    });

    // Handle notification acknowledgment
    socket.on('notification:read', (data: { notificationId: string }) => {
      logger.info(`Notification read: ${data.notificationId} by ${user.userId}`);
      // Emit to other devices of the same user
      socket.to(`user:${user.userId}`).emit('notification:read', data);
    });

    // Handle typing indicators (for future chat feature)
    socket.on('typing:start', (data: { room: string }) => {
      socket.to(data.room).emit('typing:start', {
        userId: user.userId,
      });
    });

    socket.on('typing:stop', (data: { room: string }) => {
      socket.to(data.room).emit('typing:stop', {
        userId: user.userId,
      });
    });

    // Handle outpass status updates (for real-time dashboard updates)
    socket.on('outpass:status', (data: { outpassId: string }) => {
      logger.info(`Outpass status requested: ${data.outpassId}`);
      // This would fetch and emit the latest status
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnection handler
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${user.userId} - Reason: ${reason}`);

      // Remove from connected users
      connectedUsers.delete(socket.id);

      // Remove from user-socket mapping
      const userSocketSet = userSockets.get(user.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(user.userId);
        }
      }
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${user.userId}: ${error}`);
    });
  });

  return io;
}

/**
 * Emit notification to specific user
 */
export function emitToUser(io: SocketIOServer, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
  logger.info(`Emitted ${event} to user ${userId}`);
}

/**
 * Emit notification to all users with specific role
 */
export function emitToRole(io: SocketIOServer, role: UserRole, event: string, data: any) {
  io.to(`role:${role}`).emit(event, data);
  logger.info(`Emitted ${event} to role ${UserRole[role]}`);
}

/**
 * Emit notification to specific room
 */
export function emitToRoom(io: SocketIOServer, room: string, event: string, data: any) {
  io.to(room).emit(event, data);
  logger.info(`Emitted ${event} to room ${room}`);
}

/**
 * Broadcast to all connected users
 */
export function broadcast(io: SocketIOServer, event: string, data: any) {
  io.emit(event, data);
  logger.info(`Broadcasted ${event} to all users`);
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount(): number {
  return connectedUsers.size;
}

/**
 * Get connected users by role
 */
export function getConnectedUsersByRole(role: UserRole): SocketUser[] {
  return Array.from(connectedUsers.values()).filter(user => user.role === role);
}

/**
 * Check if user is online
 */
export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}

/**
 * Get user's active socket count
 */
export function getUserSocketCount(userId: string): number {
  return userSockets.get(userId)?.size || 0;
}


