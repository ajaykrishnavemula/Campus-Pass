/**
 * @summary Security Routes
 */

import { FastifyInstance } from 'fastify';
import { SecurityController } from '../controllers/security.controller';
import { authenticate, securityOnly } from '../middleware/auth.middleware';
import {
  validateScanQR,
  validateCheckIn,
  validateCheckOut,
} from '../middleware/validate.middleware';

export default async function securityRoutes(fastify: FastifyInstance) {
  // All routes require authentication and security role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', securityOnly);

  // QR Code operations
  fastify.post(
    '/scan',
    {
      preHandler: [validateScanQR],
    },
    SecurityController.scanQRCode.bind(SecurityController)
  );

  // Check-in/Check-out operations
  fastify.post(
    '/check-out',
    {
      preHandler: [validateCheckOut],
    },
    SecurityController.checkOut.bind(SecurityController)
  );

  fastify.post(
    '/check-in',
    {
      preHandler: [validateCheckIn],
    },
    SecurityController.checkIn.bind(SecurityController)
  );

  // Outpass management
  fastify.get(
    '/active-passes',
    SecurityController.getActivePasses.bind(SecurityController)
  );

  fastify.get(
    '/overdue-passes',
    SecurityController.getOverduePasses.bind(SecurityController)
  );

  fastify.get(
    '/logs',
    SecurityController.getSecurityLogs.bind(SecurityController)
  );

  // Profile
  fastify.get(
    '/profile',
    SecurityController.getProfile.bind(SecurityController)
  );

  fastify.put(
    '/profile',
    SecurityController.updateProfile.bind(SecurityController)
  );
}


