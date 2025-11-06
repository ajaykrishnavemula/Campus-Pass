/**
 * @summary Student Routes
 */

import { FastifyInstance } from 'fastify';
import { StudentController } from '../controllers/student.controller';
import { authenticate, studentOnly } from '../middleware/auth.middleware';
import {
  validateCreateOutpass,
  validateUpdateOutpass,
} from '../middleware/validate.middleware';

export default async function studentRoutes(fastify: FastifyInstance) {
  // All routes require authentication and student role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', studentOnly);

  // Outpass management
  fastify.post(
    '/outpasses',
    {
      preHandler: [validateCreateOutpass],
    },
    StudentController.createOutpass.bind(StudentController)
  );

  fastify.get(
    '/outpasses',
    StudentController.getMyOutpasses.bind(StudentController)
  );

  fastify.get(
    '/outpasses/:id',
    StudentController.getOutpassById.bind(StudentController)
  );

  fastify.put(
    '/outpasses/:id',
    {
      preHandler: [validateUpdateOutpass],
    },
    StudentController.updateOutpass.bind(StudentController)
  );

  fastify.delete(
    '/outpasses/:id',
    StudentController.cancelOutpass.bind(StudentController)
  );

  fastify.get(
    '/outpasses/:id/download',
    StudentController.downloadOutpassPDF.bind(StudentController)
  );

  // Profile management
  fastify.get(
    '/profile',
    StudentController.getProfile.bind(StudentController)
  );

  fastify.put(
    '/profile',
    StudentController.updateProfile.bind(StudentController)
  );

  // Statistics
  fastify.get(
    '/stats',
    StudentController.getStats.bind(StudentController)
  );
}


