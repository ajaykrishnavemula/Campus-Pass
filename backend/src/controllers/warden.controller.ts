/**
 * @summary Warden Controller
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { Outpass } from '../models/Outpass';
import { Student, Warden } from '../models/User';
import { 
  ApiResponse, 
  OutpassStatus,
  PaginationQuery,
  ApproveOutpassPayload,
  RejectOutpassPayload 
} from '../types';
import { QRCodeService } from '../services/qrcode.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import logger from '../utils/logger';

export class WardenController {
  /**
   * Get warden dashboard statistics
   */
  static async getDashboard(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      // Get statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalStudents,
        totalOutpasses,
        pendingOutpasses,
        approvedToday,
        rejectedToday,
        studentsOut,
        overdueStudents,
      ] = await Promise.all([
        Student.countDocuments({ hostel: warden.hostel }),
        Outpass.countDocuments({ hostel: warden.hostel }),
        Outpass.countDocuments({ hostel: warden.hostel, status: OutpassStatus.PENDING }),
        Outpass.countDocuments({
          hostel: warden.hostel,
          status: OutpassStatus.APPROVED,
          approvedAt: { $gte: today },
        }),
        Outpass.countDocuments({
          hostel: warden.hostel,
          status: OutpassStatus.REJECTED,
          updatedAt: { $gte: today },
        }),
        Outpass.countDocuments({
          hostel: warden.hostel,
          status: OutpassStatus.CHECKED_OUT,
        }),
        Outpass.countDocuments({
          hostel: warden.hostel,
          status: { $in: [OutpassStatus.APPROVED, OutpassStatus.CHECKED_OUT] },
          toDate: { $lt: new Date() },
        }),
      ]);

      // Get recent outpasses
      const recentOutpasses = await Outpass.find({
        hostel: warden.hostel,
        status: OutpassStatus.PENDING,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('student', 'name rollNumber roomNumber phone')
        .lean();

      const stats = {
        totalStudents,
        totalOutpasses,
        pendingOutpasses,
        approvedToday,
        rejectedToday,
        studentsOut,
        overdueStudents,
      };

      const alerts = [];
      if (overdueStudents > 0) {
        alerts.push({
          type: 'overdue',
          message: `${overdueStudents} students have not returned on time`,
          count: overdueStudents,
        });
      }
      if (pendingOutpasses > 10) {
        alerts.push({
          type: 'pending',
          message: `${pendingOutpasses} outpass requests pending approval`,
          count: pendingOutpasses,
        });
      }

      return reply.code(200).send({
        success: true,
        data: {
          stats,
          recentOutpasses,
          alerts,
        },
      });
    } catch (error) {
      logger.error(`Get dashboard error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get dashboard',
      });
    }
  }

  /**
   * Get pending outpass requests
   */
  static async getPendingRequests(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const queryParams = request.query as PaginationQuery;
      const { page = 1, limit = 20 } = queryParams;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      const skip = (page - 1) * limit;

      // Get pending outpasses
      const [outpasses, total] = await Promise.all([
        Outpass.find({
          hostel: warden.hostel,
          status: OutpassStatus.PENDING,
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('student', 'name rollNumber department year roomNumber phone')
          .lean(),
        Outpass.countDocuments({
          hostel: warden.hostel,
          status: OutpassStatus.PENDING,
        }),
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
      logger.error(`Get pending requests error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get pending requests',
      });
    }
  }

  /**
   * Approve outpass
   */
  static async approveOutpass(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const params = request.params as { id: string };
      const body = request.body as ApproveOutpassPayload;
      const { id } = params;
      const { remarks } = body;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      // Get outpass
      const outpass = await Outpass.findOne({
        _id: id,
        hostel: warden.hostel,
      }).populate('student');

      if (!outpass) {
        return reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
      }

      // Check if outpass is pending
      if (outpass.status !== OutpassStatus.PENDING) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot approve',
          message: 'Only pending outpasses can be approved',
        });
      }

      // Generate QR code
      const qrCode = await QRCodeService.generateQRCode(
        outpass._id?.toString() || '',
        (outpass.student as any).id
      );

      // Update outpass
      outpass.status = OutpassStatus.APPROVED;
      outpass.approvedBy = warden._id;
      outpass.approvedAt = new Date();
      outpass.wardenRemarks = remarks;
      outpass.qrCode = qrCode;
      outpass.isVerified = true;
      await outpass.save();

      const student = outpass.student as any;

      // Send notification
      await NotificationService.notifyOutpassApproved(
        student.id,
        outpass.outpassNumber || '',
        warden.name
      );

      // Send email
      await EmailService.sendOutpassApprovalEmail(student.email, {
        studentName: student.name,
        outpassNumber: outpass.outpassNumber || '',
        reason: outpass.reason,
        fromDate: outpass.fromDate.toLocaleString(),
        toDate: outpass.toDate.toLocaleString(),
        status: OutpassStatus.APPROVED,
        approvedBy: warden.name,
      });

      logger.info(`Outpass approved: ${outpass.outpassNumber} by ${wardenId}`);

      return reply.code(200).send({
        success: true,
        message: 'Outpass approved successfully',
        data: {
          outpass: {
            id: outpass._id,
            status: outpass.status,
            approvedAt: outpass.approvedAt,
          },
        },
      });
    } catch (error) {
      logger.error(`Approve outpass error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to approve outpass',
      });
    }
  }

  /**
   * Reject outpass
   */
  static async rejectOutpass(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const params = request.params as { id: string };
      const body = request.body as RejectOutpassPayload;
      const { id } = params;
      const { reason } = body;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      // Get outpass
      const outpass = await Outpass.findOne({
        _id: id,
        hostel: warden.hostel,
      }).populate('student');

      if (!outpass) {
        return reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
      }

      // Check if outpass is pending
      if (outpass.status !== OutpassStatus.PENDING) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot reject',
          message: 'Only pending outpasses can be rejected',
        });
      }

      // Update outpass
      outpass.status = OutpassStatus.REJECTED;
      outpass.rejectionReason = reason;
      await outpass.save();

      const student = outpass.student as any;

      // Send notification
      await NotificationService.notifyOutpassRejected(
        student.id,
        outpass.outpassNumber || '',
        reason
      );

      // Send email
      await EmailService.sendOutpassRejectionEmail(student.email, {
        studentName: student.name,
        outpassNumber: outpass.outpassNumber || '',
        reason: outpass.reason,
        fromDate: outpass.fromDate.toLocaleString(),
        toDate: outpass.toDate.toLocaleString(),
        status: OutpassStatus.REJECTED,
        rejectionReason: reason,
      });

      logger.info(`Outpass rejected: ${outpass.outpassNumber} by ${wardenId}`);

      return reply.code(200).send({
        success: true,
        message: 'Outpass rejected successfully',
        data: {
          outpass: {
            id: outpass._id,
            status: outpass.status,
          },
        },
      });
    } catch (error) {
      logger.error(`Reject outpass error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to reject outpass',
      });
    }
  }

  /**
   * Get all students in hostel
   */
  static async getStudents(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const queryParams = request.query as PaginationQuery;
      const { page = 1, limit = 20 } = queryParams;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      const skip = (page - 1) * limit;

      // Get students
      const [students, total] = await Promise.all([
        Student.find({ hostel: warden.hostel })
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .select('-password')
          .lean(),
        Student.countDocuments({ hostel: warden.hostel }),
      ]);

      return reply.code(200).send({
        success: true,
        data: {
          students,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      logger.error(`Get students error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get students',
      });
    }
  }

  /**
   * Get hostel analytics
   */
  static async getAnalytics(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const queryParams = request.query as { startDate?: string; endDate?: string };
      const { startDate, endDate } = queryParams;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      // Build date filter
      const dateFilter: any = { hostel: warden.hostel };
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Get statistics
      const [total, approved, rejected, cancelled] = await Promise.all([
        Outpass.countDocuments(dateFilter),
        Outpass.countDocuments({ ...dateFilter, status: OutpassStatus.APPROVED }),
        Outpass.countDocuments({ ...dateFilter, status: OutpassStatus.REJECTED }),
        Outpass.countDocuments({ ...dateFilter, status: OutpassStatus.CANCELLED }),
      ]);

      const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(2) : 0;

      // Get top reasons
      const topReasons = await Outpass.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { reason: '$_id', count: 1, _id: 0 } },
      ]);

      // Get department breakdown
      const departmentBreakdown = await Outpass.aggregate([
        { $match: dateFilter },
        {
          $lookup: {
            from: 'users',
            localField: 'student',
            foreignField: '_id',
            as: 'studentInfo',
          },
        },
        { $unwind: '$studentInfo' },
        { $group: { _id: '$studentInfo.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { department: '$_id', count: 1, _id: 0 } },
      ]);

      return reply.code(200).send({
        success: true,
        data: {
          summary: {
            totalOutpasses: total,
            approved,
            rejected,
            cancelled,
            approvalRate,
          },
          topReasons,
          departmentBreakdown,
        },
      });
    } catch (error) {
      logger.error(`Get analytics error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get analytics',
      });
    }
  }

  /**
   * Get pending outpasses (alias for getPendingRequests)
   */
  static async getPendingOutpasses(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    return WardenController.getPendingRequests(request, reply);
  }

  /**
   * Get all outpasses
   */
  static async getAllOutpasses(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const queryParams = request.query as PaginationQuery & { status?: OutpassStatus };
      const { page = 1, limit = 20, status } = queryParams;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      const skip = (page - 1) * limit;

      // Build query
      const query: any = { hostel: warden.hostel };
      if (status) {
        query.status = status;
      }

      // Get outpasses
      const [outpasses, total] = await Promise.all([
        Outpass.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('student', 'name rollNumber department year roomNumber phone')
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
      logger.error(`Get all outpasses error: ${error}`);
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
      const wardenId = (request as any).user.id;
      const params = request.params as { id: string };
      const { id } = params;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      // Get outpass
      const outpass = await Outpass.findOne({
        _id: id,
        hostel: warden.hostel,
      })
        .populate('student', 'name rollNumber department year roomNumber phone parentPhone')
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
   * Get student by ID
   */
  static async getStudentById(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const params = request.params as { id: string };
      const { id } = params;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      // Get student
      const student = await Student.findOne({
        id,
        hostel: warden.hostel,
      }).select('-password').lean();

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      // Get student's outpass statistics
      const [total, pending, approved, rejected] = await Promise.all([
        Outpass.countDocuments({ student: student._id }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.PENDING }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.APPROVED }),
        Outpass.countDocuments({ student: student._id, status: OutpassStatus.REJECTED }),
      ]);

      return reply.code(200).send({
        success: true,
        data: {
          student: {
            ...student,
            stats: {
              totalOutpasses: total,
              pendingOutpasses: pending,
              approvedOutpasses: approved,
              rejectedOutpasses: rejected,
            },
          },
        },
      });
    } catch (error) {
      logger.error(`Get student error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get student',
      });
    }
  }

  /**
   * Update student status
   */
  static async updateStudentStatus(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const params = request.params as { id: string };
      const body = request.body as { status: boolean; reason?: string };
      const { id } = params;
      const { status, reason } = body;

      // Get warden details
      const warden = await Warden.findOne({ id: wardenId });

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      // Update student
      const student = await Student.findOneAndUpdate(
        { id, hostel: warden.hostel },
        { $set: { status } },
        { new: true }
      ).select('-password');

      if (!student) {
        return reply.code(404).send({
          success: false,
          error: 'Student not found',
          message: 'Student not found',
        });
      }

      logger.info(`Student status updated: ${id} by ${wardenId}`);

      return reply.code(200).send({
        success: true,
        message: 'Student status updated successfully',
        data: { student },
      });
    } catch (error) {
      logger.error(`Update student status error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update student status',
      });
    }
  }

  /**
   * Get warden profile
   */
  static async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;

      const warden = await Warden.findOne({ id: wardenId }).select('-password').lean();

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      return reply.code(200).send({
        success: true,
        data: { warden },
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
   * Update warden profile
   */
  static async updateProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const wardenId = (request as any).user.id;
      const updates = request.body as Partial<{ phone: string }>;

      const warden = await Warden.findOneAndUpdate(
        { id: wardenId },
        { $set: updates },
        { new: true }
      ).select('-password');

      if (!warden) {
        return reply.code(404).send({
          success: false,
          error: 'Warden not found',
          message: 'Warden not found',
        });
      }

      logger.info(`Profile updated for warden: ${wardenId}`);

      return reply.code(200).send({
        success: true,
        message: 'Profile updated successfully',
        data: { warden },
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
}
