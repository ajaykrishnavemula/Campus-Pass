/**
 * @summary Notification Service for managing notifications
 */

import { Notification } from '../models/Notification';
import { INotification, NotificationType } from '../types';
import logger from '../utils/logger';

export class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ): Promise<INotification | null> {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        data,
        read: false,
      });

      logger.info(`Notification created for user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      logger.error(`Failed to create notification: ${error}`);
      return null;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const query: any = { user: userId };
      if (unreadOnly) {
        query.read = false;
      }

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({ user: userId, read: false }),
      ]);

      return {
        notifications,
        unreadCount,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      logger.error(`Failed to get notifications: ${error}`);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
      return true;
    } catch (error) {
      logger.error(`Failed to mark notification as read: ${error}`);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await Notification.updateMany({ user: userId, read: false }, { read: true });
      return true;
    } catch (error) {
      logger.error(`Failed to mark all notifications as read: ${error}`);
      return false;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await Notification.findByIdAndDelete(notificationId);
      return true;
    } catch (error) {
      logger.error(`Failed to delete notification: ${error}`);
      return false;
    }
  }

  /**
   * Delete old notifications (older than 30 days)
   */
  static async deleteOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        read: true,
      });

      logger.info(`Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount || 0;
    } catch (error) {
      logger.error(`Failed to delete old notifications: ${error}`);
      return 0;
    }
  }

  /**
   * Create outpass notification
   */
  static async notifyOutpassCreated(
    studentId: string,
    outpassNumber: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      NotificationType.OUTPASS_CREATED,
      'Outpass Request Submitted',
      `Your outpass request ${outpassNumber} has been submitted and is pending approval.`,
      { outpassNumber }
    );
  }

  /**
   * Notify outpass approved
   */
  static async notifyOutpassApproved(
    studentId: string,
    outpassNumber: string,
    approvedBy: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      NotificationType.OUTPASS_APPROVED,
      'Outpass Approved',
      `Your outpass request ${outpassNumber} has been approved by ${approvedBy}.`,
      { outpassNumber, approvedBy }
    );
  }

  /**
   * Notify outpass rejected
   */
  static async notifyOutpassRejected(
    studentId: string,
    outpassNumber: string,
    reason: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      NotificationType.OUTPASS_REJECTED,
      'Outpass Rejected',
      `Your outpass request ${outpassNumber} has been rejected. Reason: ${reason}`,
      { outpassNumber, reason }
    );
  }

  /**
   * Notify check out
   */
  static async notifyCheckOut(
    studentId: string,
    outpassNumber: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      NotificationType.CHECK_OUT,
      'Checked Out',
      `You have been checked out for outpass ${outpassNumber}.`,
      { outpassNumber }
    );
  }

  /**
   * Notify check in
   */
  static async notifyCheckIn(
    studentId: string,
    outpassNumber: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      NotificationType.CHECK_IN,
      'Checked In',
      `You have been checked in for outpass ${outpassNumber}.`,
      { outpassNumber }
    );
  }

  /**
   * Notify overdue
   */
  static async notifyOverdue(
    studentId: string,
    outpassNumber: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      NotificationType.OVERDUE_WARNING,
      'Outpass Overdue',
      `Your outpass ${outpassNumber} is overdue. Please return to campus immediately.`,
      { outpassNumber }
    );
  }

  /**
   * Notify warden of new request
   */
  static async notifyWardenNewRequest(
    wardenId: string,
    studentName: string,
    outpassNumber: string
  ): Promise<void> {
    await this.createNotification(
      wardenId,
      NotificationType.OUTPASS_CREATED,
      'New Outpass Request',
      `${studentName} has submitted a new outpass request ${outpassNumber}.`,
      { studentName, outpassNumber }
    );
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await Notification.countDocuments({
        user: userId,
        read: false,
      });

      return count;
    } catch (error) {
      logger.error(`Get unread count error: ${error}`);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId: string): Promise<boolean> {
    try {
      await Notification.deleteMany({ user: userId });
      return true;
    } catch (error) {
      logger.error(`Delete all notifications error: ${error}`);
      return false;
    }
  }
}


