/**
 * Notification Model - User notifications
 * Tracks system notifications for users
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export enum NotificationType {
  OUTPASS_APPROVED = 'outpass_approved',
  OUTPASS_REJECTED = 'outpass_rejected',
  OUTPASS_CHECKED_OUT = 'outpass_checked_out',
  OUTPASS_CHECKED_IN = 'outpass_checked_in',
  OUTPASS_OVERDUE = 'outpass_overdue',
  SYSTEM_ALERT = 'system_alert',
  GENERAL = 'general',
}

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(NotificationType),
      default: NotificationType.GENERAL,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
NotificationSchema.index({ user: 1, read: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

// Auto-delete old read notifications after 30 days
NotificationSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { read: true },
  }
);

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);


