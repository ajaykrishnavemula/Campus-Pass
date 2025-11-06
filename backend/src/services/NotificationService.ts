/**
 * Notification Service
 * Handles user notifications creation and management
 */

import { Notification, NotificationType, type INotification } from '../models/Notification';
import { Types } from 'mongoose';

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationDTO): Promise<INotification> {
    const notification = new Notification({
      user: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      read: false,
    });

    await notification.save();
    return notification;
  }

  /**
   * Create multiple notifications
   */
  async createBulkNotifications(
    notifications: CreateNotificationDTO[]
  ): Promise<INotification[]> {
    const docs = notifications.map((n) => ({
      user: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      read: false,
    }));

    return Notification.insertMany(docs);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    filters?: {
      read?: boolean;
      type?: NotificationType;
      page?: number;
      limit?: number;
    }
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const query: any = { user: userId };

    if (filters?.read !== undefined) {
      query.read = filters.read;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: userId, read: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<INotification | null> {
    return Notification.findById(notificationId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    return result.modifiedCount;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId: string): Promise<number> {
    const result = await Notification.deleteMany({
      user: userId,
      read: true,
    });

    return result.deletedCount;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      user: userId,
      read: false,
    });
  }

  /**
   * Create outpass approved notification
   */
  async notifyOutpassApproved(
    studentId: string,
    outpassNumber: string,
    wardenName: string
  ): Promise<INotification> {
    return this.createNotification({
      userId: studentId,
      type: NotificationType.OUTPASS_APPROVED,
      title: 'Outpass Approved',
      message: `Your outpass ${outpassNumber} has been approved by ${wardenName}`,
      data: { outpassNumber },
    });
  }

  /**
   * Create outpass rejected notification
   */
  async notifyOutpassRejected(
    studentId: string,
    outpassNumber: string,
    wardenName: string,
    reason: string
  ): Promise<INotification> {
    return this.createNotification({
      userId: studentId,
      type: NotificationType.OUTPASS_REJECTED,
      title: 'Outpass Rejected',
      message: `Your outpass ${outpassNumber} has been rejected by ${wardenName}. Reason: ${reason}`,
      data: { outpassNumber, reason },
    });
  }

  /**
   * Create outpass checked out notification
   */
  async notifyOutpassCheckedOut(
    studentId: string,
    outpassNumber: string
  ): Promise<INotification> {
    return this.createNotification({
      userId: studentId,
      type: NotificationType.OUTPASS_CHECKED_OUT,
      title: 'Checked Out',
      message: `You have been checked out for outpass ${outpassNumber}`,
      data: { outpassNumber },
    });
  }

  /**
   * Create outpass checked in notification
   */
  async notifyOutpassCheckedIn(
    studentId: string,
    outpassNumber: string,
    isOverdue: boolean
  ): Promise<INotification> {
    const message = isOverdue
      ? `You have been checked in for outpass ${outpassNumber}. Note: You returned late.`
      : `You have been checked in for outpass ${outpassNumber}`;

    return this.createNotification({
      userId: studentId,
      type: NotificationType.OUTPASS_CHECKED_IN,
      title: isOverdue ? 'Checked In (Late)' : 'Checked In',
      message,
      data: { outpassNumber, isOverdue },
    });
  }

  /**
   * Create outpass overdue notification
   */
  async notifyOutpassOverdue(
    studentId: string,
    outpassNumber: string
  ): Promise<INotification> {
    return this.createNotification({
      userId: studentId,
      type: NotificationType.OUTPASS_OVERDUE,
      title: 'Outpass Overdue',
      message: `Your outpass ${outpassNumber} is overdue. Please return to campus immediately.`,
      data: { outpassNumber },
    });
  }

  /**
   * Create system alert notification
   */
  async notifySystemAlert(
    userId: string,
    title: string,
    message: string
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      type: NotificationType.SYSTEM_ALERT,
      title,
      message,
    });
  }

  /**
   * Notify warden of new outpass request
   */
  async notifyWardenNewRequest(
    wardenId: string,
    studentName: string,
    outpassNumber: string
  ): Promise<INotification> {
    return this.createNotification({
      userId: wardenId,
      type: NotificationType.GENERAL,
      title: 'New Outpass Request',
      message: `${studentName} has submitted a new outpass request (${outpassNumber})`,
      data: { outpassNumber, studentName },
    });
  }
}

export const notificationService = new NotificationService();


