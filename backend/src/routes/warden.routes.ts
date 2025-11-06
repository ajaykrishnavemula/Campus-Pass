/**
 * @summary Warden Routes
 */

import { FastifyInstance } from 'fastify';
import { WardenController } from '../controllers/warden.controller';
import { authenticate, wardenOnly } from '../middleware/auth.middleware';
import {
  validateApproveOutpass,
  validateRejectOutpass,
} from '../middleware/validate.middleware';

export default async function wardenRoutes(fastify: FastifyInstance) {
  // All routes require authentication and warden role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', wardenOnly);

  // Dashboard
  fastify.get(
    '/dashboard',
    WardenController.getDashboard.bind(WardenController)
  );

  // Outpass management
  fastify.get(
    '/outpasses/pending',
    WardenController.getPendingOutpasses.bind(WardenController)
  );

  fastify.get(
    '/outpasses',
    WardenController.getAllOutpasses.bind(WardenController)
  );

  fastify.get(
    '/outpasses/:id',
    WardenController.getOutpassById.bind(WardenController)
  );

  fastify.post(
    '/outpasses/:id/approve',
    {
      preHandler: [validateApproveOutpass],
    },
    WardenController.approveOutpass.bind(WardenController)
  );

  fastify.post(
    '/outpasses/:id/reject',
    {
      preHandler: [validateRejectOutpass],
    },
    WardenController.rejectOutpass.bind(WardenController)
  );

  // Student management
  fastify.get(
    '/students',
    WardenController.getStudents.bind(WardenController)
  );

  fastify.get(
    '/students/:id',
    WardenController.getStudentById.bind(WardenController)
  );

  fastify.put(
    '/students/:id/status',
    WardenController.updateStudentStatus.bind(WardenController)
  );

  // Analytics
  fastify.get(
    '/analytics',
    WardenController.getAnalytics.bind(WardenController)
  );

  // Profile
  fastify.get(
    '/profile',
    WardenController.getProfile.bind(WardenController)
  );

  fastify.put(
    '/profile',
    WardenController.updateProfile.bind(WardenController)
  );
}


