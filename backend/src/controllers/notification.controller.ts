/**
 * @summary Notification Controller
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../services/notification.service';
import { ApiResponse, PaginationQuery } from '../types';
import logger from '../utils/logger';

export class NotificationController {
  /**
   * Get user notifications
   */
  static async getNotifications(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const userId = (request as any).user.id;
      const queryParams = request.query as PaginationQuery & { unread?: string };
      const { page = 1, limit = 20, unread } = queryParams;

      const unreadOnly = unread === 'true';

      const result = await NotificationService.getUserNotifications(
        userId,
        unreadOnly,
        page,
        limit
      );

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error(`Get notifications error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get notifications',
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const params = request.params as { id: string };
      const { id } = params;

      const success = await NotificationService.markAsRead(id);

      if (!success) {
        return reply.code(404).send({
          success: false,
          error: 'Notification not found',
          message: 'Notification not found',
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      logger.error(`Mark as read error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to mark notification as read',
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const userId = (request as any).user.id;

      const success = await NotificationService.markAllAsRead(userId);

      if (!success) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to update',
          message: 'Failed to mark all notifications as read',
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      logger.error(`Mark all as read error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to mark all notifications as read',
      });
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const params = request.params as { id: string };
      const { id } = params;

      const success = await NotificationService.deleteNotification(id);

      if (!success) {
        return reply.code(404).send({
          success: false,
          error: 'Notification not found',
          message: 'Notification not found',
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      logger.error(`Delete notification error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete notification',
      });
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const userId = (request as any).user.id;

      const count = await NotificationService.getUnreadCount(userId);

      return reply.code(200).send({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error(`Get unread count error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get unread count',
      });
    }
  }

  /**
   * Delete all notifications for user
   */
  static async deleteAllNotifications(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const userId = (request as any).user.id;

      const success = await NotificationService.deleteAllNotifications(userId);

      if (!success) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete',
          message: 'Failed to delete all notifications',
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'All notifications deleted successfully',
      });
    } catch (error) {
      logger.error(`Delete all notifications error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete all notifications',
      });
    }
  }
}
