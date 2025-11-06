/**
 * @summary Security Controller
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { Outpass } from '../models/Outpass';
import { Security } from '../models/User';
import { 
  ApiResponse, 
  OutpassStatus,
  CheckOutPayload,
  CheckInPayload,
  ScanQRPayload 
} from '../types';
import { QRCodeService } from '../services/qrcode.service';
import { NotificationService } from '../services/notification.service';
import logger from '../utils/logger';

export class SecurityController {
  /**
   * Scan QR code
   */
  static async scanQRCode(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const body = request.body as ScanQRPayload;
      const { qrData } = body;

      // Verify QR code
      const verification = QRCodeService.verifyQRCode(qrData);

      if (!verification.valid) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid QR code',
          message: verification.error || 'QR code verification failed',
        });
      }

      const { outpassId } = verification.data;

      // Get outpass
      const outpass = await Outpass.findById(outpassId)
        .populate('student', 'name rollNumber department hostel roomNumber phone')
        .lean();

      if (!outpass) {
        return reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
      }

      // Check if outpass is approved
      if (outpass.status !== OutpassStatus.APPROVED && outpass.status !== OutpassStatus.CHECKED_OUT) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid outpass',
          message: 'Outpass is not approved or already used',
        });
      }

      return reply.code(200).send({
        success: true,
        message: 'QR code verified successfully',
        data: { outpass },
      });
    } catch (error) {
      logger.error(`Scan QR code error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to scan QR code',
      });
    }
  }

  /**
   * Check out student
   */
  static async checkOut(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const securityId = (request as any).user.id;
      const body = request.body as CheckOutPayload;
      const { outpassId, guardName, remarks } = body;
      const id = outpassId;

      // Get security officer
      const security = await Security.findOne({ id: securityId });

      if (!security) {
        return reply.code(404).send({
          success: false,
          error: 'Security officer not found',
          message: 'Security officer not found',
        });
      }

      // Get outpass
      const outpass = await Outpass.findById(id).populate('student');

      if (!outpass) {
        return reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
      }

      // Check if outpass is approved
      if (outpass.status !== OutpassStatus.APPROVED) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot check out',
          message: 'Only approved outpasses can be checked out',
        });
      }

      // Check if already checked out
      if (outpass.checkOut) {
        return reply.code(400).send({
          success: false,
          error: 'Already checked out',
          message: 'Student has already been checked out',
        });
      }

      // Update outpass
      outpass.status = OutpassStatus.CHECKED_OUT;
      outpass.checkOut = {
        time: new Date(),
        securityOfficer: security._id,
        guardName,
        remarks,
      };
      await outpass.save();

      const student = outpass.student as any;

      // Send notification
      await NotificationService.notifyCheckOut(
        student.id,
        outpass.outpassNumber || ''
      );

      logger.info(`Student checked out: ${student.rollNumber} for outpass ${outpass.outpassNumber}`);

      return reply.code(200).send({
        success: true,
        message: 'Student checked out successfully',
        data: {
          checkOut: outpass.checkOut,
        },
      });
    } catch (error) {
      logger.error(`Check out error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to check out student',
      });
    }
  }

  /**
   * Check in student
   */
  static async checkIn(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const securityId = (request as any).user.id;
      const body = request.body as CheckInPayload;
      const { outpassId, guardName, remarks } = body;
      const id = outpassId;

      // Get security officer
      const security = await Security.findOne({ id: securityId });

      if (!security) {
        return reply.code(404).send({
          success: false,
          error: 'Security officer not found',
          message: 'Security officer not found',
        });
      }

      // Get outpass
      const outpass = await Outpass.findById(id).populate('student');

      if (!outpass) {
        return reply.code(404).send({
          success: false,
          error: 'Outpass not found',
          message: 'Outpass not found',
        });
      }

      // Check if outpass is checked out
      if (outpass.status !== OutpassStatus.CHECKED_OUT) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot check in',
          message: 'Student must be checked out first',
        });
      }

      // Check if already checked in
      if (outpass.checkIn) {
        return reply.code(400).send({
          success: false,
          error: 'Already checked in',
          message: 'Student has already been checked in',
        });
      }

      // Update outpass
      outpass.status = OutpassStatus.CHECKED_IN;
      outpass.checkIn = {
        time: new Date(),
        securityOfficer: security._id,
        guardName,
        remarks,
      };
      await outpass.save();

      const student = outpass.student as any;

      // Send notification
      await NotificationService.notifyCheckIn(
        student.id,
        outpass.outpassNumber || ''
      );

      // Check if overdue
      if (new Date() > outpass.toDate) {
        await NotificationService.notifyOverdue(
          student.id,
          outpass.outpassNumber || ''
        );
      }

      logger.info(`Student checked in: ${student.rollNumber} for outpass ${outpass.outpassNumber}`);

      return reply.code(200).send({
        success: true,
        message: 'Student checked in successfully',
        data: {
          checkIn: outpass.checkIn,
        },
      });
    } catch (error) {
      logger.error(`Check in error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to check in student',
      });
    }
  }

  /**
   * Get active passes
   */
  static async getActivePasses(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      // Get active outpasses (checked out but not checked in)
      const activePasses = await Outpass.find({
        status: OutpassStatus.CHECKED_OUT,
      })
        .populate('student', 'name rollNumber department hostel roomNumber phone')
        .sort({ 'checkOut.time': -1 })
        .lean();

      return reply.code(200).send({
        success: true,
        data: {
          activePasses,
          count: activePasses.length,
        },
      });
    } catch (error) {
      logger.error(`Get active passes error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get active passes',
      });
    }
  }

  /**
   * Get overdue students
   */
  static async getOverdueStudents(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const now = new Date();

      // Get overdue outpasses
      const overdueOutpasses = await Outpass.find({
        status: { $in: [OutpassStatus.APPROVED, OutpassStatus.CHECKED_OUT] },
        toDate: { $lt: now },
      })
        .populate('student', 'name rollNumber department hostel roomNumber phone parentPhone')
        .sort({ toDate: 1 })
        .lean();

      return reply.code(200).send({
        success: true,
        data: {
          overdueOutpasses,
          count: overdueOutpasses.length,
        },
      });
    } catch (error) {
      logger.error(`Get overdue students error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get overdue students',
      });
    }
  }

  /**
   * Get security logs
   */
  static async getSecurityLogs(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const securityId = (request as any).user.id;
      const queryParams = request.query as { date?: string };
      const { date } = queryParams;

      // Get security officer
      const security = await Security.findOne({ id: securityId });

      if (!security) {
        return reply.code(404).send({
          success: false,
          error: 'Security officer not found',
          message: 'Security officer not found',
        });
      }

      // Build date filter
      let dateFilter = {};
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = {
          $or: [
            { 'checkOut.time': { $gte: startOfDay, $lte: endOfDay } },
            { 'checkIn.time': { $gte: startOfDay, $lte: endOfDay } },
          ],
        };
      }

      // Get logs
      const logs = await Outpass.find({
        $or: [
          { 'checkOut.securityOfficer': security._id },
          { 'checkIn.securityOfficer': security._id },
        ],
        ...dateFilter,
      })
        .populate('student', 'name rollNumber department hostel')
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();

      return reply.code(200).send({
        success: true,
        data: {
          logs,
          count: logs.length,
        },
      });
    } catch (error) {
      logger.error(`Get security logs error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get security logs',
      });
    }
  }

  /**
   * Get security dashboard
   */
  static async getDashboard(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        activePassesCount,
        checkedOutToday,
        checkedInToday,
        overdueCount,
      ] = await Promise.all([
        Outpass.countDocuments({ status: OutpassStatus.CHECKED_OUT }),
        Outpass.countDocuments({
          'checkOut.time': { $gte: today },
        }),
        Outpass.countDocuments({
          'checkIn.time': { $gte: today },
        }),
        Outpass.countDocuments({
          status: { $in: [OutpassStatus.APPROVED, OutpassStatus.CHECKED_OUT] },
          toDate: { $lt: new Date() },
        }),
      ]);

      // Get recent activities
      const recentActivities = await Outpass.find({
        $or: [
          { 'checkOut.time': { $gte: today } },
          { 'checkIn.time': { $gte: today } },
        ],
      })
        .populate('student', 'name rollNumber hostel')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean();

      return reply.code(200).send({
        success: true,
        data: {
          stats: {
            activePassesCount,
            checkedOutToday,
            checkedInToday,
            overdueCount,
          },
          recentActivities,
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
   * Get overdue passes (alias for getOverdueStudents)
   */
  static async getOverduePasses(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    return SecurityController.getOverdueStudents(request, reply);
  }

  /**
   * Get security profile
   */
  static async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const securityId = (request as any).user.id;

      const security = await Security.findOne({ id: securityId }).select('-password').lean();

      if (!security) {
        return reply.code(404).send({
          success: false,
          error: 'Security officer not found',
          message: 'Security officer not found',
        });
      }

      return reply.code(200).send({
        success: true,
        data: { security },
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
   * Update security profile
   */
  static async updateProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const securityId = (request as any).user.id;
      const updates = request.body as Partial<{ phone: string }>;

      const security = await Security.findOneAndUpdate(
        { id: securityId },
        { $set: updates },
        { new: true }
      ).select('-password');

      if (!security) {
        return reply.code(404).send({
          success: false,
          error: 'Security officer not found',
          message: 'Security officer not found',
        });
      }

      logger.info(`Profile updated for security: ${securityId}`);

      return reply.code(200).send({
        success: true,
        message: 'Profile updated successfully',
        data: { security },
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
