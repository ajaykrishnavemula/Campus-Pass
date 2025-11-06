/**
 * @summary Student Controller
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { Outpass } from '../models/Outpass';
import { Student } from '../models/User';
import { 
  CreateOutpassPayload, 
  ApiResponse, 
  OutpassStatus,
  PaginationQuery 
} from '../types';
import { QRCodeService } from '../services/qrcode.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { PDFService } from '../services/pdf.service';
import logger from '../utils/logger';

export class StudentController {
  /**
   * Create outpass request
   */
  static async createOutpass(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const studentId = (request as any).user.id;
      const body = request.body as CreateOutpassPayload;
      const {
        reason,
        destination,
        fromDate,
        toDate,
        contactNumber,
        emergencyContact,
        purpose,
      } = body;

      // Get student details
      const student = await Student.findOne({ id: studentId });

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      // Check if student has active status
      if (!student.status) {
        return reply.code(403).send({
          success: false,
          error: 'Account restricted',
          message: 'Your account is restricted. Please contact warden.',
        });
      }

      // Check for overlapping outpasses
      const overlapping = await Outpass.findOne({
        student: student._id,
        status: { $in: [OutpassStatus.PENDING, OutpassStatus.APPROVED, OutpassStatus.CHECKED_OUT] },
        $or: [
          {
            fromDate: { $lte: new Date(toDate) },
            toDate: { $gte: new Date(fromDate) },
          },
        ],
      });

      if (overlapping) {
        return reply.code(409).send({
          success: false,
          error: 'Overlapping outpass',
          message: 'You already have an outpass for this time period',
        });
      }

      // Create outpass
      const outpass = await Outpass.create({
        student: student._id,
        reason,
        destination,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        contactNumber,
        emergencyContact,
        purpose,
        status: OutpassStatus.PENDING,
        hostel: student.hostel,
        requestedAt: new Date(),
        isVerified: false,
      });

      // Send notification to student
      await NotificationService.notifyOutpassCreated(
        studentId,
        outpass.outpassNumber || ''
      );

      // Send email notification
      await EmailService.sendOutpassCreatedEmail(student.email, {
        studentName: student.name,
        outpassNumber: outpass.outpassNumber || '',
        reason,
        fromDate: new Date(fromDate).toLocaleString(),
        toDate: new Date(toDate).toLocaleString(),
        status: OutpassStatus.PENDING,
      });

      logger.info(`Outpass created: ${outpass.outpassNumber} by ${studentId}`);

      return reply.code(201).send({
        success: true,
        message: 'Outpass request created successfully',
        data: { outpass },
      });
    } catch (error) {
      logger.error(`Create outpass error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create outpass request',
      });
    }
  }

  /**
   * Get student's outpasses
   */
  static async getMyOutpasses(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const studentId = (request as any).user.id;
      const queryParams = request.query as PaginationQuery & { status?: OutpassStatus };
      const { page = 1, limit = 20, status } = queryParams;

      // Get student
      const student = await Student.findOne({ id: studentId });

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      // Build query
      const query: any = { student: student._id };
      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      // Get outpasses
      const [outpasses, total] = await Promise.all([
        Outpass.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('approvedBy', 'name employeeId')
          .lean(),
        Outpass.countDocuments(query),
      ]);

      return reply.code(200).send({
        success: true,
        data: {
          outpasses,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      logger.error(`Get outpasses error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get outpasses',
      });
    }
  }

  /**
   * Get outpass by ID
   */
  static async getOutpassById(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const studentId = (request as any).user.id;
      const params = request.params as { id: string };
      const { id } = params;

      // Get student
      const student = await Student.findOne({ id: studentId });

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      // Get outpass
      const outpass = await Outpass.findOne({
        _id: id,
        student: student._id,
      })
        .populate('approvedBy', 'name employeeId')
        .populate('checkOut.securityOfficer', 'name employeeId')
        .populate('checkIn.securityOfficer', 'name employeeId')
        .lean();

      if (!outpass) {
        return reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
      }

      return reply.code(200).send({
        success: true,
        data: { outpass },
      });
    } catch (error) {
      logger.error(`Get outpass error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get outpass',
      });
    }
  }

  /**
   * Cancel outpass
   */
  static async cancelOutpass(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const studentId = (request as any).user.id;
      const params = request.params as { id: string };
      const body = request.body as { reason: string };
      const { id } = params;
      const { reason } = body;

      // Get student
      const student = await Student.findOne({ id: studentId });

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      // Get outpass
      const outpass = await Outpass.findOne({
        _id: id,
        student: student._id,
      });

      if (!outpass) {
        return reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
      }

      // Check if outpass can be cancelled
      if (outpass.status !== OutpassStatus.PENDING && outpass.status !== OutpassStatus.APPROVED) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot cancel',
          message: 'Only pending or approved outpasses can be cancelled',
        });
      }

      // Update outpass
      outpass.status = OutpassStatus.CANCELLED;
      outpass.rejectionReason = reason;
      await outpass.save();

      logger.info(`Outpass cancelled: ${outpass.outpassNumber} by ${studentId}`);

      return reply.code(200).send({
        success: true,
        message: 'Outpass cancelled successfully',
      });
    } catch (error) {
      logger.error(`Cancel outpass error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to cancel outpass',
      });
    }
  }

  /**
   * Download outpass PDF
   */
  static async downloadOutpassPDF(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const studentId = (request as any).user.id;
      const params = request.params as { id: string };
      const { id } = params;

      // Get student
      const student = await Student.findOne({ id: studentId });

      if (!student) {
        reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
        return;
      }

      // Get outpass
      const outpass = await Outpass.findOne({
        _id: id,
        student: student._id,
      }).lean();

      if (!outpass) {
        reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
        return;
      }

      // Check if outpass is approved
      if (outpass.status !== OutpassStatus.APPROVED && outpass.status !== OutpassStatus.CHECKED_OUT) {
        reply.code(400).send({
          success: false,
          error: 'Cannot download',
          message: 'Only approved outpasses can be downloaded',
        });
        return;
      }

      // Generate PDF
      const pdfBuffer = await PDFService.generateOutpassPDF(outpass, student);

      // Set headers
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="outpass-${outpass.outpassNumber}.pdf"`);

      reply.send(pdfBuffer);
    } catch (error) {
      logger.error(`Download PDF error: ${error}`);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to download PDF',
      });
    }
  }

  /**
   * Get student profile
   */
  static async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const studentId = (request as any).user.id;

      // Get student with stats
      const student = await Student.findOne({ id: studentId }).lean();

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      // Get outpass statistics
      const [total, pending, approved, rejected, cancelled] = await Promise.all([
        Outpass.countDocuments({ student: student._id }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.PENDING }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.APPROVED }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.REJECTED }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.CANCELLED }),
      ]);

      const stats = {
        totalOutpasses: total,
        pendingOutpasses: pending,
        approvedOutpasses: approved,
        rejectedOutpasses: rejected,
        cancelledOutpasses: cancelled,
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0,
      };

      return reply.code(200).send({
        success: true,
        data: {
          student: {
            ...student,
            stats,
          },
        },
      });
    } catch (error) {
      logger.error(`Get profile error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get profile',
      });
    }
  }

  /**
   * Update student profile
   */
  static async updateProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const studentId = (request as any).user.id;
      const updates = request.body as Partial<{ phone: string; parentPhone: string; emergencyContact: any }>;

      // Update student
      const student = await Student.findOneAndUpdate(
        { id: studentId },
        { $set: updates },
        { new: true }
      );

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      logger.info(`Profile updated for student: ${studentId}`);

      return reply.code(200).send({
        success: true,
        message: 'Profile updated successfully',
        data: { student },
      });
    } catch (error) {
      logger.error(`Update profile error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update profile',
      });
    }
  }

  /**
   * Update outpass (before approval)
   */
  static async updateOutpass(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const studentId = (request as any).user.id;
      const params = request.params as { id: string };
      const updates = request.body as Partial<CreateOutpassPayload>;
      const { id } = params;

      // Get student
      const student = await Student.findOne({ id: studentId });

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      // Get outpass
      const outpass = await Outpass.findOne({
        _id: id,
        student: student._id,
      });

      if (!outpass) {
        return reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
      }

      // Check if outpass can be updated
      if (outpass.status !== OutpassStatus.PENDING) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot update',
          message: 'Only pending outpasses can be updated',
        });
      }

      // Update outpass
      Object.assign(outpass, updates);
      await outpass.save();

      logger.info(`Outpass updated: ${outpass.outpassNumber} by ${studentId}`);

      return reply.code(200).send({
        success: true,
        message: 'Outpass updated successfully',
        data: { outpass },
      });
    } catch (error) {
      logger.error(`Update outpass error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update outpass',
      });
    }
  }

  /**
   * Get student statistics
   */
  static async getStats(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const studentId = (request as any).user.id;

      // Get student
      const student = await Student.findOne({ id: studentId });

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      // Get statistics
      const [total, pending, approved, rejected, cancelled, checkedOut, checkedIn] = await Promise.all([
        Outpass.countDocuments({ student: student._id }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.PENDING }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.APPROVED }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.REJECTED }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.CANCELLED }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.CHECKED_OUT }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.CHECKED_IN }),
      ]);

      const stats = {
        totalOutpasses: total,
        pendingOutpasses: pending,
        approvedOutpasses: approved,
        rejectedOutpasses: rejected,
        cancelledOutpasses: cancelled,
        checkedOutOutpasses: checkedOut,
        checkedInOutpasses: checkedIn,
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : '0',
        completionRate: total > 0 ? ((checkedIn / total) * 100).toFixed(2) : '0',
      };

      return reply.code(200).send({
        success: true,
        data: { stats },
      });
    } catch (error) {
      logger.error(`Get stats error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get statistics',
      });
    }
  }
}
