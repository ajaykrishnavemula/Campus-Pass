import { io, Socket } from 'socket.io-client';
import type { 
  SocketNotification, 
  SocketOutpassUpdate, 
  SocketSystemAlert 
} from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  // Connect to Socket.io server
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  // Disconnect from Socket.io server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Setup default event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.io connected');
      this.emit('connection', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
      this.emit('connection', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      this.emit('error', error);
    });

    this.socket.on('connected', (data) => {
      console.log('Socket.io server acknowledged connection:', data);
    });
  }

  // Subscribe to an event
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Also listen on socket
    if (this.socket) {
      this.socket.on(event, (...args: any[]) => {
        this.emit(event, ...args);
      });
    }
  }

  // Unsubscribe from an event
  off(event: string, callback?: Function): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
    } else {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  // Emit event to listeners
  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }

  // Send event to server
  send(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Notification events
  onNewNotification(callback: (data: SocketNotification) => void): void {
    this.on('notification:new', callback);
  }

  onNotificationRead(callback: (data: { notificationId: string }) => void): void {
    this.on('notification:read', callback);
  }

  // Outpass events
  onOutpassCreated(callback: (data: SocketOutpassUpdate) => void): void {
    this.on('outpass:created', callback);
  }

  onOutpassApproved(callback: (data: SocketOutpassUpdate & { wardenId: string; wardenName: string }) => void): void {
    this.on('outpass:approved', callback);
  }

  onOutpassRejected(callback: (data: SocketOutpassUpdate & { wardenId: string; reason: string }) => void): void {
    this.on('outpass:rejected', callback);
  }

  onOutpassCheckedOut(callback: (data: SocketOutpassUpdate & { securityId: string; timestamp: string }) => void): void {
    this.on('outpass:checked_out', callback);
  }

  onOutpassCheckedIn(callback: (data: SocketOutpassUpdate & { securityId: string; timestamp: string; isOverdue: boolean }) => void): void {
    this.on('outpass:checked_in', callback);
  }

  onOutpassOverdue(callback: (data: SocketOutpassUpdate & { wardenId?: string; overdueBy: number }) => void): void {
    this.on('outpass:overdue', callback);
  }

  // Dashboard events
  onDashboardUpdate(callback: (data: { userId: string; stats: any }) => void): void {
    this.on('dashboard:update', callback);
  }

  onStatsUpdate(callback: (data: { userId: string; type: string; stats: any }) => void): void {
    this.on('stats:update', callback);
  }

  // System events
  onSystemAlert(callback: (data: SocketSystemAlert) => void): void {
    this.on('system:alert', callback);
  }

  onSystemMaintenance(callback: (data: { enabled: boolean; message: string; estimatedDuration?: number }) => void): void {
    this.on('system:maintenance', callback);
  }

  // Connection events
  onConnection(callback: (data: { connected: boolean; reason?: string }) => void): void {
    this.on('connection', callback);
  }

  onError(callback: (error: Error) => void): void {
    this.on('error', callback);
  }

  // Ping/Pong for health check
  ping(): void {
    this.send('ping');
  }

  onPong(callback: (data: { timestamp: number }) => void): void {
    this.on('pong', callback);
  }

  // Mark notification as read (emit to server)
  markNotificationAsRead(notificationId: string): void {
    this.send('notification:read', { notificationId });
  }
}

export const socketService = new SocketService();

