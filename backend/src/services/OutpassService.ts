/**
 * Outpass Service
 * Handles outpass creation, approval, rejection, and check-in/out operations
 */

import { Outpass, OutpassStatus, OutpassType, type IOutpass } from '../models/Outpass';
import { User, UserRole } from '../models/User';
import { Types } from 'mongoose';

export interface CreateOutpassDTO {
  studentId: string;
  type: OutpassType;
  purpose: string;
  destination: string;
  fromDate: Date;
  toDate: Date;
}

export interface ApproveOutpassDTO {
  wardenId: string;
  remarks?: string;
}

export interface RejectOutpassDTO {
  wardenId: string;
  reason: string;
}

export interface CheckOutDTO {
  securityId: string;
  remarks?: string;
}

export interface CheckInDTO {
  securityId: string;
  remarks?: string;
}

export interface OutpassFilters {
  status?: OutpassStatus;
  type?: OutpassType;
  studentId?: string;
  wardenId?: string;
  fromDate?: Date;
  toDate?: Date;
  hostel?: string;
  page?: number;
  limit?: number;
}

export interface StudentStats {
  totalOutpasses: number;
  pendingOutpasses: number;
  approvedOutpasses: number;
  rejectedOutpasses: number;
  activeOutpasses: number;
  overdueOutpasses: number;
}

export interface WardenStats {
  totalRequests: number;
  pendingRequests: number;
  approvedToday: number;
  rejectedToday: number;
  activeOutpasses: number;
  overdueOutpasses: number;
}

export interface SecurityStats {
  totalCheckOuts: number;
  totalCheckIns: number;
  activeOutpasses: number;
  overdueOutpasses: number;
  checkOutsToday: number;
  checkInsToday: number;
}

export class OutpassService {
  /**
   * Create a new outpass request
   */
  async createOutpass(data: CreateOutpassDTO): Promise<IOutpass> {
    // Validate student exists
    const student = await User.findById(data.studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new Error('Invalid student');
    }

    // Validate dates
    const fromDate = new Date(data.fromDate);
    const toDate = new Date(data.toDate);
    const now = new Date();

    if (fromDate < now) {
      throw new Error('From date cannot be in the past');
    }

    if (toDate <= fromDate) {
      throw new Error('To date must be after from date');
    }

    // Check for overlapping outpasses
    const overlapping = await Outpass.findOne({
      student: data.studentId,
      status: {
        $in: [
          OutpassStatus.PENDING,
          OutpassStatus.APPROVED,
          OutpassStatus.CHECKED_OUT,
        ],
      },
      $or: [
        {
          fromDate: { $lte: toDate },
          toDate: { $gte: fromDate },
        },
      ],
    });

    if (overlapping) {
      throw new Error('You have an overlapping outpass request');
    }

    // Create outpass
    const outpass = new Outpass({
      student: data.studentId,
      type: data.type,
      purpose: data.purpose,
      destination: data.destination,
      fromDate,
      toDate,
      status: OutpassStatus.PENDING,
    });

    await outpass.save();
    return outpass.populate('student', '-password');
  }

  /**
   * Get outpass by ID
   */
  async getOutpassById(outpassId: string): Promise<IOutpass | null> {
    return Outpass.findById(outpassId)
      .populate('student', '-password')
      .populate('warden', '-password')
      .populate('checkOutBy', '-password')
      .populate('checkInBy', '-password');
  }

  /**
   * Get student's outpasses
   */
  async getStudentOutpasses(
    studentId: string,
    filters?: OutpassFilters
  ): Promise<{ outpasses: IOutpass[]; total: number }> {
    const query: any = { student: studentId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('warden', '-password'),
      Outpass.countDocuments(query),
    ]);

    return { outpasses, total };
  }

  /**
   * Get pending outpasses for warden
   */
  async getPendingOutpasses(
    hostel: string,
    filters?: OutpassFilters
  ): Promise<{ outpasses: IOutpass[]; total: number }> {
    const query: any = {
      status: OutpassStatus.PENDING,
    };

    // Get students from this hostel
    const students = await User.find({
      role: UserRole.STUDENT,
      hostel,
    }).select('_id');

    query.student = { $in: students.map((s) => s._id) };

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .sort({ createdAt: 1 }) // Oldest first
        .skip(skip)
        .limit(limit)
        .populate('student', '-password'),
      Outpass.countDocuments(query),
    ]);

    return { outpasses, total };
  }

  /**
   * Get all outpasses for warden
   */
  async getAllOutpasses(
    hostel: string,
    filters?: OutpassFilters
  ): Promise<{ outpasses: IOutpass[]; total: number }> {
    const query: any = {};

    // Get students from this hostel
    const students = await User.find({
      role: UserRole.STUDENT,
      hostel,
    }).select('_id');

    query.student = { $in: students.map((s) => s._id) };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.fromDate) {
      query.fromDate = { $gte: filters.fromDate };
    }

    if (filters?.toDate) {
      query.toDate = { $lte: filters.toDate };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [outpasses, total] = await Promise.all([
      Outpass.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('student', '-password')
        .populate('warden', '-password'),
      Outpass.countDocuments(query),
    ]);

    return { outpasses, total };
  }

  /**
   * Approve outpass
   */
  async approveOutpass(
    outpassId: string,
    data: ApproveOutpassDTO
  ): Promise<IOutpass> {
    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      throw new Error('Outpass not found');
    }

    if (outpass.status !== OutpassStatus.PENDING) {
      throw new Error('Only pending outpasses can be approved');
    }

    // Verify warden exists
    const warden = await User.findById(data.wardenId);
    if (!warden || warden.role !== UserRole.WARDEN) {
      throw new Error('Invalid warden');
    }

    outpass.status = OutpassStatus.APPROVED;
    outpass.warden = new Types.ObjectId(data.wardenId);
    outpass.wardenRemarks = data.remarks;
    outpass.approvedAt = new Date();

    await outpass.save();
    await outpass.populate('student', '-password');
    await outpass.populate('warden', '-password');
    return outpass;
  }

  /**
   * Reject outpass
   */
  async rejectOutpass(
    outpassId: string,
    data: RejectOutpassDTO
  ): Promise<IOutpass> {
    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      throw new Error('Outpass not found');
    }

    if (outpass.status !== OutpassStatus.PENDING) {
      throw new Error('Only pending outpasses can be rejected');
    }

    // Verify warden exists
    const warden = await User.findById(data.wardenId);
    if (!warden || warden.role !== UserRole.WARDEN) {
      throw new Error('Invalid warden');
    }

    outpass.status = OutpassStatus.REJECTED;
    outpass.warden = new Types.ObjectId(data.wardenId);
    outpass.rejectionReason = data.reason;
    outpass.rejectedAt = new Date();

    await outpass.save();
    await outpass.populate('student', '-password');
    await outpass.populate('warden', '-password');
    return outpass;
  }

  /**
   * Cancel outpass (by student)
   */
  async cancelOutpass(outpassId: string, studentId: string): Promise<IOutpass> {
    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      throw new Error('Outpass not found');
    }

    if (outpass.student.toString() !== studentId) {
      throw new Error('You can only cancel your own outpasses');
    }

    if (
      outpass.status !== OutpassStatus.PENDING &&
      outpass.status !== OutpassStatus.APPROVED
    ) {
      throw new Error('Only pending or approved outpasses can be cancelled');
    }

    outpass.status = OutpassStatus.CANCELLED;
    await outpass.save();

    return outpass.populate('student', '-password');
  }

  /**
   * Check out student
   */
  async checkOut(outpassId: string, data: CheckOutDTO): Promise<IOutpass> {
    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      throw new Error('Outpass not found');
    }

    if (outpass.status !== OutpassStatus.APPROVED) {
      throw new Error('Only approved outpasses can be checked out');
    }

    // Verify security exists
    const security = await User.findById(data.securityId);
    if (!security || security.role !== UserRole.SECURITY) {
      throw new Error('Invalid security personnel');
    }

    outpass.status = OutpassStatus.CHECKED_OUT;
    outpass.checkOutTime = new Date();
    outpass.checkOutBy = new Types.ObjectId(data.securityId);

    await outpass.save();
    await outpass.populate('student', '-password');
    await outpass.populate('checkOutBy', '-password');
    return outpass;
  }

  /**
   * Check in student
   */
  async checkIn(outpassId: string, data: CheckInDTO): Promise<IOutpass> {
    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      throw new Error('Outpass not found');
    }

    if (outpass.status !== OutpassStatus.CHECKED_OUT) {
      throw new Error('Only checked out outpasses can be checked in');
    }

    // Verify security exists
    const security = await User.findById(data.securityId);
    if (!security || security.role !== UserRole.SECURITY) {
      throw new Error('Invalid security personnel');
    }

    const now = new Date();
    const isOverdue = now > outpass.toDate;

    outpass.status = isOverdue ? OutpassStatus.OVERDUE : OutpassStatus.CHECKED_IN;
    outpass.checkInTime = now;
    outpass.checkInBy = new Types.ObjectId(data.securityId);
    outpass.isOverdue = isOverdue;

    await outpass.save();
    await outpass.populate('student', '-password');
    await outpass.populate('checkInBy', '-password');
    return outpass;
  }

  /**
   * Get active outpasses (checked out)
   */
  async getActiveOutpasses(): Promise<IOutpass[]> {
    return Outpass.find({
      status: OutpassStatus.CHECKED_OUT,
    })
      .sort({ checkOutTime: -1 })
      .populate('student', '-password')
      .populate('checkOutBy', '-password');
  }

  /**
   * Get student statistics
   */
  async getStudentStats(studentId: string): Promise<StudentStats> {
    const [
      totalOutpasses,
      pendingOutpasses,
      approvedOutpasses,
      rejectedOutpasses,
      activeOutpasses,
      overdueOutpasses,
    ] = await Promise.all([
      Outpass.countDocuments({ student: studentId }),
      Outpass.countDocuments({
        student: studentId,
        status: OutpassStatus.PENDING,
      }),
      Outpass.countDocuments({
        student: studentId,
        status: OutpassStatus.APPROVED,
      }),
      Outpass.countDocuments({
        student: studentId,
        status: OutpassStatus.REJECTED,
      }),
      Outpass.countDocuments({
        student: studentId,
        status: OutpassStatus.CHECKED_OUT,
      }),
      Outpass.countDocuments({
        student: studentId,
        status: OutpassStatus.OVERDUE,
      }),
    ]);

    return {
      totalOutpasses,
      pendingOutpasses,
      approvedOutpasses,
      rejectedOutpasses,
      activeOutpasses,
      overdueOutpasses,
    };
  }

  /**
   * Get warden statistics
   */
  async getWardenStats(hostel: string): Promise<WardenStats> {
    // Get students from this hostel
    const students = await User.find({
      role: UserRole.STUDENT,
      hostel,
    }).select('_id');

    const studentIds = students.map((s) => s._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalRequests,
      pendingRequests,
      approvedToday,
      rejectedToday,
      activeOutpasses,
      overdueOutpasses,
    ] = await Promise.all([
      Outpass.countDocuments({ student: { $in: studentIds } }),
      Outpass.countDocuments({
        student: { $in: studentIds },
        status: OutpassStatus.PENDING,
      }),
      Outpass.countDocuments({
        student: { $in: studentIds },
        status: OutpassStatus.APPROVED,
        approvedAt: { $gte: today, $lt: tomorrow },
      }),
      Outpass.countDocuments({
        student: { $in: studentIds },
        status: OutpassStatus.REJECTED,
        rejectedAt: { $gte: today, $lt: tomorrow },
      }),
      Outpass.countDocuments({
        student: { $in: studentIds },
        status: OutpassStatus.CHECKED_OUT,
      }),
      Outpass.countDocuments({
        student: { $in: studentIds },
        status: OutpassStatus.OVERDUE,
      }),
    ]);

    return {
      totalRequests,
      pendingRequests,
      approvedToday,
      rejectedToday,
      activeOutpasses,
      overdueOutpasses,
    };
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(): Promise<SecurityStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalCheckOuts,
      totalCheckIns,
      activeOutpasses,
      overdueOutpasses,
      checkOutsToday,
      checkInsToday,
    ] = await Promise.all([
      Outpass.countDocuments({
        status: { $in: [OutpassStatus.CHECKED_OUT, OutpassStatus.CHECKED_IN] },
      }),
      Outpass.countDocuments({ status: OutpassStatus.CHECKED_IN }),
      Outpass.countDocuments({ status: OutpassStatus.CHECKED_OUT }),
      Outpass.countDocuments({ status: OutpassStatus.OVERDUE }),
      Outpass.countDocuments({
        checkOutTime: { $gte: today, $lt: tomorrow },
      }),
      Outpass.countDocuments({
        checkInTime: { $gte: today, $lt: tomorrow },
      }),
    ]);

    return {
      totalCheckOuts,
      totalCheckIns,
      activeOutpasses,
      overdueOutpasses,
      checkOutsToday,
      checkInsToday,
    };
  }

  /**
   * Check and update overdue outpasses
   */
  async checkOverdueOutpasses(): Promise<number> {
    const now = new Date();
    
    const result = await Outpass.updateMany(
      {
        status: OutpassStatus.CHECKED_OUT,
        toDate: { $lt: now },
      },
      {
        $set: {
          status: OutpassStatus.OVERDUE,
          isOverdue: true,
        },
      }
    );

    return result.modifiedCount;
  }
}

export const outpassService = new OutpassService();


