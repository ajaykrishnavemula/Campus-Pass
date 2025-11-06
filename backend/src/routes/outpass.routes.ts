/**
 * Outpass Routes
 * Handles outpass CRUD operations and workflow
 */

import { FastifyInstance } from 'fastify';
import {
  outpassService,
  notificationService,
  qrService,
  pdfService,
  emailService,
  authService,
  socketService,
} from '../services';
import {
  authenticate,
  AuthenticatedRequest,
  validateBody,
  validateParams,
  validateQuery,
  schemas,
  requireStudent,
  requireWarden,
  requireSecurity,
  requireWardenOrSecurity,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../middleware';

export async function outpassRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/outpasses
   * Create a new outpass (Student only)
   */
  fastify.post(
    '/',
    {
      preHandler: [authenticate, requireStudent, validateBody(schemas.createOutpass)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;
        const body = request.body as {
          type: string;
          destination: string;
          purpose: string;
          fromDate: string;
          toDate: string;
        };

        // Create outpass
        const outpass = await outpassService.createOutpass({
          studentId: userId,
          type: body.type as any,
          purpose: body.purpose,
          destination: body.destination,
          fromDate: new Date(body.fromDate),
          toDate: new Date(body.toDate),
        });

        // Get student and warden info for notification
        const student = await authService.getUserById(userId);
        if (student && student.hostel) {
          // Find warden for this hostel
          const wardens = await authService.getAllUsers({ role: 2, hostel: student.hostel });
          if (wardens.length > 0) {
            await notificationService.notifyWardenNewRequest(
              wardens[0]._id.toString(),
              student.name,
              outpass.outpassNumber
            );
          }
        }

        // Emit Socket.io event
        if (socketService.isInitialized()) {
          socketService.emitOutpassCreated(outpass);
        }

        return reply.status(201).send({
          success: true,
          message: 'Outpass created successfully',
          data: outpass,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses
   * Get student's outpasses
   */
  fastify.get(
    '/',
    {
      preHandler: [authenticate, requireStudent, validateQuery(schemas.outpassFilters)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;
        const filters = request.query as any;

        const result = await outpassService.getStudentOutpasses(userId, filters);

        return reply.send({
          success: true,
          data: result.outpasses,
          pagination: {
            total: result.total,
            page: filters.page || 1,
            limit: filters.limit || 10,
            pages: Math.ceil(result.total / (filters.limit || 10)),
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses/pending
   * Get pending outpasses (Warden only)
   */
  fastify.get(
    '/pending',
    {
      preHandler: [authenticate, requireWarden, validateQuery(schemas.pagination)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const filters = request.query as any;
        
        // Get warden's hostel
        const warden = await authService.getUserById(request.userPayload!.id);
        if (!warden || !warden.hostel) {
          throw new BadRequestError('Warden hostel not configured');
        }

        const result = await outpassService.getPendingOutpasses(warden.hostel, filters);

        return reply.send({
          success: true,
          data: result.outpasses,
          pagination: {
            total: result.total,
            page: filters.page || 1,
            limit: filters.limit || 10,
            pages: Math.ceil(result.total / (filters.limit || 10)),
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses/all
   * Get all outpasses (Warden/Security)
   */
  fastify.get(
    '/all',
    {
      preHandler: [authenticate, requireWardenOrSecurity, validateQuery(schemas.outpassFilters)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const filters = request.query as any;
        
        // Get user's hostel (for warden)
        const user = await authService.getUserById(request.userPayload!.id);
        if (!user || !user.hostel) {
          throw new BadRequestError('User hostel not configured');
        }

        const result = await outpassService.getAllOutpasses(user.hostel, filters);

        return reply.send({
          success: true,
          data: result.outpasses,
          pagination: {
            total: result.total,
            page: filters.page || 1,
            limit: filters.limit || 10,
            pages: Math.ceil(result.total / (filters.limit || 10)),
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses/active
   * Get active outpasses (checked out) (Security only)
   */
  fastify.get(
    '/active',
    {
      preHandler: [authenticate, requireSecurity],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const outpasses = await outpassService.getActiveOutpasses();

        return reply.send({
          success: true,
          data: outpasses,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses/stats
   * Get student statistics
   */
  fastify.get(
    '/stats',
    {
      preHandler: [authenticate, requireStudent],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;

        const stats = await outpassService.getStudentStats(userId);

        return reply.send({
          success: true,
          data: stats,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses/stats/warden
   * Get warden statistics
   */
  fastify.get(
    '/stats/warden',
    {
      preHandler: [authenticate, requireWarden],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        // Get warden's hostel
        const warden = await authService.getUserById(request.userPayload!.id);
        if (!warden || !warden.hostel) {
          throw new BadRequestError('Warden hostel not configured');
        }

        const stats = await outpassService.getWardenStats(warden.hostel);

        return reply.send({
          success: true,
          data: stats,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses/stats/security
   * Get security statistics
   */
  fastify.get(
    '/stats/security',
    {
      preHandler: [authenticate, requireSecurity],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const stats = await outpassService.getSecurityStats();

        return reply.send({
          success: true,
          data: stats,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses/:id
   * Get outpass by ID
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
        const userRole = request.userPayload!.role;

        const outpass = await outpassService.getOutpassById(id);

        if (!outpass) {
          throw new NotFoundError('Outpass not found');
        }

        // Check permissions
        if (userRole === 0 && outpass.student._id.toString() !== userId) {
          throw new ForbiddenError('You can only view your own outpasses');
        }

        return reply.send({
          success: true,
          data: outpass,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /api/outpasses/:id/approve
   * Approve outpass (Warden only)
   */
  fastify.post(
    '/:id/approve',
    {
      preHandler: [
        authenticate,
        requireWarden,
        validateParams(schemas.idParam),
        validateBody(schemas.approveOutpass),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const wardenId = request.userPayload!.id;
        const { remarks } = request.body as { remarks?: string };

        const outpass = await outpassService.approveOutpass(id, {
          wardenId,
          remarks,
        });

        // Generate QR code
        const qrData = await qrService.generateQRCode(outpass.qrCode!);
        
        // Get populated data
        const student = outpass.student as any;
        const warden = outpass.warden as any;
        
        // Send approval notification and email
        await notificationService.notifyOutpassApproved(
          student._id.toString(),
          outpass.outpassNumber,
          warden.name
        );
        
        if (emailService.isConfigured()) {
          emailService.sendOutpassApprovedEmail(student, outpass, warden.name).catch((error) => {
            fastify.log.error('Failed to send approval email:', error);
          });
        }

        // Emit Socket.io event
        if (socketService.isInitialized()) {
          socketService.emitOutpassApproved(outpass);
        }

        return reply.send({
          success: true,
          message: 'Outpass approved successfully',
          data: {
            ...outpass.toObject(),
            qrCodeImage: qrData,
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /api/outpasses/:id/reject
   * Reject outpass (Warden only)
   */
  fastify.post(
    '/:id/reject',
    {
      preHandler: [
        authenticate,
        requireWarden,
        validateParams(schemas.idParam),
        validateBody(schemas.rejectOutpass),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const wardenId = request.userPayload!.id;
        const { reason } = request.body as { reason: string };

        const outpass = await outpassService.rejectOutpass(id, {
          wardenId,
          reason,
        });

        // Get populated data
        const student = outpass.student as any;
        const warden = outpass.warden as any;
        
        // Send rejection notification and email
        await notificationService.notifyOutpassRejected(
          student._id.toString(),
          outpass.outpassNumber,
          warden.name,
          reason
        );
        
        if (emailService.isConfigured()) {
          emailService.sendOutpassRejectedEmail(student, outpass, warden.name, reason).catch((error) => {
            fastify.log.error('Failed to send rejection email:', error);
          });
        }

        // Emit Socket.io event
        if (socketService.isInitialized()) {
          socketService.emitOutpassRejected(outpass);
        }

        return reply.send({
          success: true,
          message: 'Outpass rejected',
          data: outpass,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /api/outpasses/:id/cancel
   * Cancel outpass (Student only)
   */
  fastify.post(
    '/:id/cancel',
    {
      preHandler: [authenticate, requireStudent, validateParams(schemas.idParam)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.userPayload!.id;

        const cancelledOutpass = await outpassService.cancelOutpass(id, userId);

        return reply.send({
          success: true,
          message: 'Outpass cancelled successfully',
          data: cancelledOutpass,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /api/outpasses/:id/checkout
   * Check out student (Security only)
   */
  fastify.post(
    '/:id/checkout',
    {
      preHandler: [
        authenticate,
        requireSecurity,
        validateParams(schemas.idParam),
        validateBody(schemas.checkOut),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const securityId = request.userPayload!.id;
        const { remarks } = request.body as { remarks?: string };

        const outpass = await outpassService.checkOut(id, {
          securityId,
          remarks,
        });

        // Get student info
        const student = outpass.student as any;
        
        // Send notification
        await notificationService.notifyOutpassCheckedOut(
          student._id.toString(),
          outpass.outpassNumber
        );

        // Emit Socket.io event
        if (socketService.isInitialized()) {
          socketService.emitOutpassCheckedOut(outpass);
        }

        return reply.send({
          success: true,
          message: 'Student checked out successfully',
          data: outpass,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /api/outpasses/:id/checkin
   * Check in student (Security only)
   */
  fastify.post(
    '/:id/checkin',
    {
      preHandler: [
        authenticate,
        requireSecurity,
        validateParams(schemas.idParam),
        validateBody(schemas.checkIn),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const securityId = request.userPayload!.id;
        const { remarks } = request.body as { remarks?: string };

        const outpass = await outpassService.checkIn(id, {
          securityId,
          remarks,
        });

        // Get student info
        const student = outpass.student as any;
        
        // Send notification
        await notificationService.notifyOutpassCheckedIn(
          student._id.toString(),
          outpass.outpassNumber,
          outpass.isOverdue
        );

        // Emit Socket.io event
        if (socketService.isInitialized()) {
          socketService.emitOutpassCheckedIn(outpass);
        }

        return reply.send({
          success: true,
          message: 'Student checked in successfully',
          data: outpass,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/outpasses/:id/pdf
   * Download outpass PDF
   */
  fastify.get(
    '/:id/pdf',
    {
      preHandler: [authenticate, validateParams(schemas.idParam)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.userPayload!.id;
        const userRole = request.userPayload!.role;

        const outpass = await outpassService.getOutpassById(id);

        if (!outpass) {
          throw new NotFoundError('Outpass not found');
        }

        // Check permissions
        if (userRole === 0 && outpass.student._id.toString() !== userId) {
          throw new ForbiddenError('You can only download your own outpass PDFs');
        }

        // Check if outpass is approved
        if (outpass.status === 'pending' || outpass.status === 'rejected') {
          throw new BadRequestError('PDF is only available for approved outpasses');
        }

        // Generate PDF
        const student = outpass.student as any;
        const pdfBuffer = await pdfService.generateOutpassPDF(outpass, student);

        return reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="outpass-${outpass.outpassNumber}.pdf"`)
          .send(pdfBuffer);
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /api/outpasses/verify-qr
   * Verify QR code (Security only)
   */
  fastify.post(
    '/verify-qr',
    {
      preHandler: [authenticate, requireSecurity],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { qrCode } = request.body as { qrCode: string };

        if (!qrCode) {
          throw new BadRequestError('QR code is required');
        }

        const result = await qrService.verifyQRCode(qrCode);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        throw error;
      }
    }
  );
}


