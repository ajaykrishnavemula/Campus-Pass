/**
 * @summary Socket.io Event Types and Payloads
 */

import { INotification, IOutpass, OutpassStatus } from '../types';

// ============================================================================
// Event Names
// ============================================================================

export enum SocketEvent {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // Notification events
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_DELETE = 'notification:delete',
  
  // Outpass events
  OUTPASS_CREATED = 'outpass:created',
  OUTPASS_UPDATED = 'outpass:updated',
  OUTPASS_APPROVED = 'outpass:approved',
  OUTPASS_REJECTED = 'outpass:rejected',
  OUTPASS_CANCELLED = 'outpass:cancelled',
  OUTPASS_CHECKED_OUT = 'outpass:checked_out',
  OUTPASS_CHECKED_IN = 'outpass:checked_in',
  OUTPASS_OVERDUE = 'outpass:overdue',
  
  // Dashboard events
  DASHBOARD_UPDATE = 'dashboard:update',
  STATS_UPDATE = 'stats:update',
  
  // System events
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  
  // Typing indicators (for future chat)
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  
  // Health check
  PING = 'ping',
  PONG = 'pong',
}

// ============================================================================
// Event Payloads
// ============================================================================

export interface ConnectedPayload {
  message: string;
  userId: string;
  role: number;
}

export interface NotificationPayload {
  notification: INotification;
}

export interface OutpassCreatedPayload {
  outpass: IOutpass;
  studentId: string;
  wardenId?: string;
}

export interface OutpassUpdatedPayload {
  outpassId: string;
  outpass: IOutpass;
  status: OutpassStatus;
  updatedBy: string;
}

export interface OutpassApprovedPayload {
  outpassId: string;
  outpass: IOutpass;
  studentId: string;
  wardenId: string;
  wardenName: string;
}

export interface OutpassRejectedPayload {
  outpassId: string;
  outpass: IOutpass;
  studentId: string;
  wardenId: string;
  reason: string;
}

export interface OutpassCancelledPayload {
  outpassId: string;
  studentId: string;
  reason?: string;
}

export interface OutpassCheckedOutPayload {
  outpassId: string;
  studentId: string;
  securityId: string;
  timestamp: Date;
}

export interface OutpassCheckedInPayload {
  outpassId: string;
  studentId: string;
  securityId: string;
  timestamp: Date;
  isOverdue: boolean;
}

export interface OutpassOverduePayload {
  outpassId: string;
  studentId: string;
  wardenId?: string;
  overdueBy: number; // hours
}

export interface DashboardUpdatePayload {
  userId: string;
  stats: {
    [key: string]: number;
  };
}

export interface StatsUpdatePayload {
  userId: string;
  type: 'student' | 'warden' | 'security';
  stats: any;
}

export interface SystemAlertPayload {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

export interface SystemMaintenancePayload {
  enabled: boolean;
  message: string;
  estimatedDuration?: number; // minutes
}

export interface TypingPayload {
  userId: string;
  room: string;
}

export interface PingPayload {
  timestamp: number;
}

export interface PongPayload {
  timestamp: number;
}

// ============================================================================
// Room Names
// ============================================================================

export class SocketRoom {
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static role(role: number): string {
    return `role:${role}`;
  }

  static hostel(hostelName: string): string {
    return `hostel:${hostelName}`;
  }

  static outpass(outpassId: string): string {
    return `outpass:${outpassId}`;
  }

  static warden(wardenId: string): string {
    return `warden:${wardenId}`;
  }

  static security(securityId: string): string {
    return `security:${securityId}`;
  }
}


