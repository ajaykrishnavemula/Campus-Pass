/**
 * Notification Routes
 * Handles user notifications
 */

import { FastifyInstance } from 'fastify';
import { notificationService, socketService } from '../services';
import {
  authenticate,
  AuthenticatedRequest,
  validateParams,
  validateQuery,
  schemas,
  NotFoundError,
} from '../middleware';

export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/notifications
   * Get user notifications
   */
  fastify.get(
    '/',
    {
      preHandler: [authenticate, validateQuery(schemas.notificationFilters)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;
        const filters = request.query as any;

        const result = await notificationService.getUserNotifications(userId, filters);

        return reply.send({
          success: true,
          data: result.notifications,
          pagination: {
            total: result.total,
            page: filters.page || 1,
            limit: filters.limit || 20,
            pages: Math.ceil(result.total / (filters.limit || 20)),
          },
          unreadCount: result.unreadCount,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count
   */
  fastify.get(
    '/unread-count',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;

        const count = await notificationService.getUnreadCount(userId);

        return reply.send({
          success: true,
          data: { count },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/notifications/:id
   * Get notification by ID
   */
  fastify.get(
    '/:id',
    {
      preHandler: [authenticate, validateParams(schemas.idParam)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.userPayload!.id;

        const notification = await notificationService.getNotificationById(id);

        if (!notification) {
          throw new NotFoundError('Notification not found');
        }

        // Check ownership
        if (notification.user.toString() !== userId) {
          throw new NotFoundError('Notification not found');
        }

        return reply.send({
          success: true,
          data: notification,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  fastify.patch(
    '/:id/read',
    {
      preHandler: [authenticate, validateParams(schemas.idParam)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.userPayload!.id;

        const notification = await notificationService.markAsRead(id, userId);

        // Emit Socket.io event for unread count update
        if (socketService.isInitialized()) {
          const unreadCount = await notificationService.getUnreadCount(userId);
          socketService.emitToUser(userId, 'notification:unread_count', { count: unreadCount });
        }

        return reply.send({
          success: true,
          message: 'Notification marked as read',
          data: notification,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read
   */
  fastify.patch(
    '/read-all',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;

        const count = await notificationService.markAllAsRead(userId);

        // Emit Socket.io event for unread count update
        if (socketService.isInitialized()) {
          socketService.emitToUser(userId, 'notification:unread_count', { count: 0 });
        }

        return reply.send({
          success: true,
          message: `${count} notifications marked as read`,
          data: { count },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * DELETE /api/notifications/:id
   * Delete notification
   */
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticate, validateParams(schemas.idParam)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.userPayload!.id;

        await notificationService.deleteNotification(id, userId);

        return reply.send({
          success: true,
          message: 'Notification deleted',
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * DELETE /api/notifications/read
   * Delete all read notifications
   */
  fastify.delete(
    '/read',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;

        const count = await notificationService.deleteAllRead(userId);

        return reply.send({
          success: true,
          message: `${count} read notifications deleted`,
          data: { count },
        });
      } catch (error) {
        throw error;
      }
    }
  );
}


