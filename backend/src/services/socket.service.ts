/**
 * @summary Socket.io Service for Real-time Notifications
 */

import { Server as SocketIOServer } from 'socket.io';
import { getSocketIO } from '../server';
import { 
  SocketEvent, 
  NotificationPayload,
  OutpassCreatedPayload,
  OutpassApprovedPayload,
  OutpassRejectedPayload,
  OutpassCheckedOutPayload,
  OutpassCheckedInPayload,
  OutpassOverduePayload,
  DashboardUpdatePayload,
  SystemAlertPayload,
  SocketRoom
} from '../socket/events';
import { INotification, IOutpass, UserRole } from '../types';
import logger from '../utils/logger';

export class SocketService {
  /**
   * Get Socket.io instance
   */
  private static getIO(): SocketIOServer | null {
    try {
      return getSocketIO();
    } catch (error) {
      logger.warn('Socket.io not initialized yet');
      return null;
    }
  }

  /**
   * Emit notification to specific user
   */
  static emitNotification(userId: string, notification: INotification): void {
    const io = this.getIO();
    if (!io) return;

    const payload: NotificationPayload = { notification };
    io.to(SocketRoom.user(userId)).emit(SocketEvent.NOTIFICATION_NEW, payload);
    logger.info(`Notification emitted to user ${userId}`);
  }

  /**
   * Emit outpass created event
   */
  static emitOutpassCreated(outpass: IOutpass, studentId: string, wardenId?: string): void {
    const io = this.getIO();
    if (!io) return;

    const payload: OutpassCreatedPayload = {
      outpass,
      studentId,
      wardenId,
    };

    // Notify student
    io.to(SocketRoom.user(studentId)).emit(SocketEvent.OUTPASS_CREATED, payload);

    // Notify warden if assigned
    if (wardenId) {
      io.to(SocketRoom.user(wardenId)).emit(SocketEvent.OUTPASS_CREATED, payload);
    }

    // Notify all wardens
    io.to(SocketRoom.role(UserRole.WARDEN)).emit(SocketEvent.OUTPASS_CREATED, payload);

    logger.info(`Outpass created event emitted for ${outpass.outpassNumber}`);
  }

  /**
   * Emit outpass approved event
   */
  static emitOutpassApproved(
    outpass: IOutpass,
    studentId: string,
    wardenId: string,
    wardenName: string
  ): void {
    const io = this.getIO();
    if (!io) return;

    const payload: OutpassApprovedPayload = {
      outpassId: outpass._id?.toString() || '',
      outpass,
      studentId,
      wardenId,
      wardenName,
    };

    // Notify student
    io.to(SocketRoom.user(studentId)).emit(SocketEvent.OUTPASS_APPROVED, payload);

    // Notify warden
    io.to(SocketRoom.user(wardenId)).emit(SocketEvent.OUTPASS_APPROVED, payload);

    logger.info(`Outpass approved event emitted for ${outpass.outpassNumber}`);
  }

  /**
   * Emit outpass rejected event
   */
  static emitOutpassRejected(
    outpass: IOutpass,
    studentId: string,
    wardenId: string,
    reason: string
  ): void {
    const io = this.getIO();
    if (!io) return;

    const payload: OutpassRejectedPayload = {
      outpassId: outpass._id?.toString() || '',
      outpass,
      studentId,
      wardenId,
      reason,
    };

    // Notify student
    io.to(SocketRoom.user(studentId)).emit(SocketEvent.OUTPASS_REJECTED, payload);

    // Notify warden
    io.to(SocketRoom.user(wardenId)).emit(SocketEvent.OUTPASS_REJECTED, payload);

    logger.info(`Outpass rejected event emitted for ${outpass.outpassNumber}`);
  }

  /**
   * Emit outpass checked out event
   */
  static emitOutpassCheckedOut(
    outpassId: string,
    studentId: string,
    securityId: string
  ): void {
    const io = this.getIO();
    if (!io) return;

    const payload: OutpassCheckedOutPayload = {
      outpassId,
      studentId,
      securityId,
      timestamp: new Date(),
    };

    // Notify student
    io.to(SocketRoom.user(studentId)).emit(SocketEvent.OUTPASS_CHECKED_OUT, payload);

    // Notify security
    io.to(SocketRoom.user(securityId)).emit(SocketEvent.OUTPASS_CHECKED_OUT, payload);

    // Notify all security personnel
    io.to(SocketRoom.role(UserRole.SECURITY)).emit(SocketEvent.OUTPASS_CHECKED_OUT, payload);

    logger.info(`Check-out event emitted for outpass ${outpassId}`);
  }

  /**
   * Emit outpass checked in event
   */
  static emitOutpassCheckedIn(
    outpassId: string,
    studentId: string,
    securityId: string,
    isOverdue: boolean
  ): void {
    const io = this.getIO();
    if (!io) return;

    const payload: OutpassCheckedInPayload = {
      outpassId,
      studentId,
      securityId,
      timestamp: new Date(),
      isOverdue,
    };

    // Notify student
    io.to(SocketRoom.user(studentId)).emit(SocketEvent.OUTPASS_CHECKED_IN, payload);

    // Notify security
    io.to(SocketRoom.user(securityId)).emit(SocketEvent.OUTPASS_CHECKED_IN, payload);

    // Notify all security personnel
    io.to(SocketRoom.role(UserRole.SECURITY)).emit(SocketEvent.OUTPASS_CHECKED_IN, payload);

    logger.info(`Check-in event emitted for outpass ${outpassId}`);
  }

  /**
   * Emit outpass overdue event
   */
  static emitOutpassOverdue(
    outpassId: string,
    studentId: string,
    wardenId: string | undefined,
    overdueBy: number
  ): void {
    const io = this.getIO();
    if (!io) return;

    const payload: OutpassOverduePayload = {
      outpassId,
      studentId,
      wardenId,
      overdueBy,
    };

    // Notify student
    io.to(SocketRoom.user(studentId)).emit(SocketEvent.OUTPASS_OVERDUE, payload);

    // Notify warden if assigned
    if (wardenId) {
      io.to(SocketRoom.user(wardenId)).emit(SocketEvent.OUTPASS_OVERDUE, payload);
    }

    // Notify all wardens
    io.to(SocketRoom.role(UserRole.WARDEN)).emit(SocketEvent.OUTPASS_OVERDUE, payload);

    // Notify all security
    io.to(SocketRoom.role(UserRole.SECURITY)).emit(SocketEvent.OUTPASS_OVERDUE, payload);

    logger.info(`Overdue event emitted for outpass ${outpassId}`);
  }

  /**
   * Emit dashboard update
   */
  static emitDashboardUpdate(userId: string, stats: any): void {
    const io = this.getIO();
    if (!io) return;

    const payload: DashboardUpdatePayload = {
      userId,
      stats,
    };

    io.to(SocketRoom.user(userId)).emit(SocketEvent.DASHBOARD_UPDATE, payload);
    logger.info(`Dashboard update emitted to user ${userId}`);
  }

  /**
   * Emit system alert to all users
   */
  static emitSystemAlert(
    type: 'info' | 'warning' | 'error',
    title: string,
    message: string
  ): void {
    const io = this.getIO();
    if (!io) return;

    const payload: SystemAlertPayload = {
      type,
      title,
      message,
      timestamp: new Date(),
    };

    io.emit(SocketEvent.SYSTEM_ALERT, payload);
    logger.info(`System alert emitted: ${title}`);
  }

  /**
   * Emit system alert to specific role
   */
  static emitSystemAlertToRole(
    role: UserRole,
    type: 'info' | 'warning' | 'error',
    title: string,
    message: string
  ): void {
    const io = this.getIO();
    if (!io) return;

    const payload: SystemAlertPayload = {
      type,
      title,
      message,
      timestamp: new Date(),
    };

    io.to(SocketRoom.role(role)).emit(SocketEvent.SYSTEM_ALERT, payload);
    logger.info(`System alert emitted to role ${UserRole[role]}: ${title}`);
  }

  /**
   * Get connected users count
   */
  static async getConnectedUsersCount(): Promise<number> {
    const io = this.getIO();
    if (!io) return 0;

    const sockets = await io.fetchSockets();
    return sockets.length;
  }

  /**
   * Check if user is online
   */
  static async isUserOnline(userId: string): Promise<boolean> {
    const io = this.getIO();
    if (!io) return false;

    const socketsInRoom = await io.in(SocketRoom.user(userId)).fetchSockets();
    return socketsInRoom.length > 0;
  }
}


