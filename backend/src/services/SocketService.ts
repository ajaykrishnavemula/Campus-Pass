/**
 * Socket.io Service
 * Handles real-time communication
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

export interface SocketUser {
  id: string;
  email: string;
  role: number;
}

export class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  /**
   * Initialize Socket.io server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        if (!process.env.JWT_SECRET) {
          return next(new Error('JWT_SECRET not configured'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
          id: string;
          email: string;
          role: number;
        };

        (socket as any).user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user as SocketUser;
      console.log(`User connected: ${user.email} (${socket.id})`);

      // Track user socket
      this.addUserSocket(user.id, socket.id);

      // Join user-specific room
      socket.join(`user:${user.id}`);

      // Join role-specific rooms
      switch (user.role) {
        case 0: // Student
          socket.join('students');
          break;
        case 1: // Admin
          socket.join('admins');
          break;
        case 2: // Warden
          socket.join('wardens');
          break;
        case 3: // Security
          socket.join('security');
          break;
      }

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${user.email} (${socket.id})`);
        this.removeUserSocket(user.id, socket.id);
      });

      // Handle ping
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    console.log('Socket.io server initialized');
  }

  /**
   * Get Socket.io server instance
   */
  getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io not initialized');
    }
    return this.io;
  }

  /**
   * Check if Socket.io is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }

  /**
   * Add user socket
   */
  private addUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(socketId);
    this.userSockets.set(userId, sockets);
  }

  /**
   * Remove user socket
   */
  private removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId) || [];
    const filtered = sockets.filter((id) => id !== socketId);
    
    if (filtered.length === 0) {
      this.userSockets.delete(userId);
    } else {
      this.userSockets.set(userId, filtered);
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit event to all students
   */
  emitToStudents(event: string, data: any): void {
    if (!this.io) return;
    this.io.to('students').emit(event, data);
  }

  /**
   * Emit event to all wardens
   */
  emitToWardens(event: string, data: any): void {
    if (!this.io) return;
    this.io.to('wardens').emit(event, data);
  }

  /**
   * Emit event to all security
   */
  emitToSecurity(event: string, data: any): void {
    if (!this.io) return;
    this.io.to('security').emit(event, data);
  }

  /**
   * Emit event to all admins
   */
  emitToAdmins(event: string, data: any): void {
    if (!this.io) return;
    this.io.to('admins').emit(event, data);
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  /**
   * Emit outpass created event
   */
  emitOutpassCreated(outpass: any): void {
    // Notify wardens
    this.emitToWardens('outpass:created', outpass);
  }

  /**
   * Emit outpass approved event
   */
  emitOutpassApproved(outpass: any): void {
    // Notify student
    const studentId = outpass.student._id?.toString() || outpass.student;
    this.emitToUser(studentId, 'outpass:approved', outpass);
  }

  /**
   * Emit outpass rejected event
   */
  emitOutpassRejected(outpass: any): void {
    // Notify student
    const studentId = outpass.student._id?.toString() || outpass.student;
    this.emitToUser(studentId, 'outpass:rejected', outpass);
  }

  /**
   * Emit outpass checked out event
   */
  emitOutpassCheckedOut(outpass: any): void {
    // Notify student
    const studentId = outpass.student._id?.toString() || outpass.student;
    this.emitToUser(studentId, 'outpass:checked_out', outpass);
    
    // Notify wardens and security
    this.emitToWardens('outpass:checked_out', outpass);
    this.emitToSecurity('outpass:checked_out', outpass);
  }

  /**
   * Emit outpass checked in event
   */
  emitOutpassCheckedIn(outpass: any): void {
    // Notify student
    const studentId = outpass.student._id?.toString() || outpass.student;
    this.emitToUser(studentId, 'outpass:checked_in', outpass);
    
    // Notify wardens and security
    this.emitToWardens('outpass:checked_in', outpass);
    this.emitToSecurity('outpass:checked_in', outpass);
  }

  /**
   * Emit outpass overdue event
   */
  emitOutpassOverdue(outpass: any): void {
    // Notify student
    const studentId = outpass.student._id?.toString() || outpass.student;
    this.emitToUser(studentId, 'outpass:overdue', outpass);
    
    // Notify wardens and security
    this.emitToWardens('outpass:overdue', outpass);
    this.emitToSecurity('outpass:overdue', outpass);
  }

  /**
   * Emit new notification event
   */
  emitNotification(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification:new', notification);
  }

  /**
   * Emit system alert
   */
  emitSystemAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info'): void {
    this.emitToAll('system:alert', { message, severity, timestamp: new Date() });
  }
}

export const socketService = new SocketService();


