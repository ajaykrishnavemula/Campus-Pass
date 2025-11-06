/**
 * @summary Complete TypeScript type definitions for Campus-Pass
 */

import { FastifyRequest } from 'fastify';

// ============================================================================
// ENUMS
// ============================================================================

export enum UserRole {
  STUDENT = 0,
  ADMIN = 1,
  WARDEN = 2,
  SECURITY = 3,
}

export enum OutpassStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  CHECKED_OUT = 'checked_out',
  CHECKED_IN = 'checked_in',
  OVERDUE = 'overdue',
}

export enum PurposeType {
  PERSONAL = 0,
  MEDICAL = 1,
  HOME = 2,
  SHOPPING = 3,
  EMERGENCY = 4,
  OTHER = 5,
}

export enum NotificationType {
  OUTPASS_CREATED = 'outpass_created',
  OUTPASS_APPROVED = 'outpass_approved',
  OUTPASS_REJECTED = 'outpass_rejected',
  OUTPASS_CANCELLED = 'outpass_cancelled',
  CHECK_OUT = 'check_out',
  CHECK_IN = 'check_in',
  OVERDUE_WARNING = 'overdue_warning',
  SYSTEM_ALERT = 'system_alert',
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface IUser {
  _id?: string;
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStudent extends IUser {
  rollNumber: string;
  department: string;
  year: number;
  hostel: string;
  block?: string;
  roomNumber: string;
  parentPhone: string;
  bloodGroup?: string;
  gender: string;
  photoUrl?: string;
  inCampus: boolean;
  status: boolean;
  remarkScore: number;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
}

export interface IWarden extends IUser {
  employeeId: string;
  department: string;
  hostel: string;
}

export interface ISecurity extends IUser {
  employeeId: string;
  shift?: string;
  assignedGate?: string;
}

// ============================================================================
// OUTPASS TYPES
// ============================================================================

export interface IOutpass {
  _id?: string;
  outpassNumber?: string;
  student: string | IStudent;
  reason: string;
  destination: string;
  fromDate: Date;
  toDate: Date;
  contactNumber: string;
  emergencyContact?: string;
  status: OutpassStatus;
  purpose: PurposeType;
  
  // Approval details
  approvedBy?: string | IWarden;
  approvedAt?: Date;
  rejectionReason?: string;
  wardenRemarks?: string;
  
  // Check-in/out details
  checkOut?: {
    time: Date;
    securityOfficer: string | ISecurity;
    guardName: string;
    remarks?: string;
  };
  checkIn?: {
    time: Date;
    securityOfficer: string | ISecurity;
    guardName: string;
    remarks?: string;
  };
  
  // QR Code and verification
  qrCode?: string;
  qrCodeData?: string;
  isVerified: boolean;
  autoApproved?: boolean;
  
  // Metadata
  hostel: string;
  requestedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface INotification {
  _id?: string;
  user: string | IUser;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt?: Date;
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

export interface ISystem {
  _id?: string;
  allow: boolean;
  threshold: number;
  maintenanceMode: boolean;
  lastUpdated?: Date;
  settings?: {
    autoApprovalEnabled: boolean;
    maxOutpassPerMonth: number;
    maxRemarkScore: number;
    notificationsEnabled: boolean;
  };
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface LoginRequestPayload {
  email?: string;
  id?: string;
  password: string;
}

export interface RegisterStudentPayload {
  name: string;
  email: string;
  password: string;
  rollNumber: string;
  department: string;
  year: number;
  hostel: string;
  roomNumber: string;
  phone: string;
  parentPhone: string;
  bloodGroup?: string;
  gender: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
}

export interface RegisterWardenPayload {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  department: string;
  hostel: string;
  phone: string;
}

export interface CreateOutpassPayload {
  reason: string;
  destination: string;
  fromDate: Date | string;
  toDate: Date | string;
  contactNumber: string;
  emergencyContact?: string;
  purpose: PurposeType;
  remarks?: string;
}

export interface ApproveOutpassPayload {
  remarks?: string;
}

export interface RejectOutpassPayload {
  reason: string;
}

export interface CheckOutPayload {
  outpassId: string;
  guardName: string;
  remarks?: string;
}

export interface CheckInPayload {
  outpassId: string;
  guardName: string;
  remarks?: string;
}

export interface ScanQRPayload {
  qrData: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface StudentStats {
  totalOutpasses: number;
  pendingOutpasses: number;
  approvedOutpasses: number;
  rejectedOutpasses: number;
  cancelledOutpasses: number;
  approvalRate: number;
}

export interface WardenDashboardStats {
  totalStudents: number;
  totalOutpasses: number;
  pendingOutpasses: number;
  approvedToday: number;
  rejectedToday: number;
  studentsOut: number;
  overdueStudents: number;
}

export interface HostelAnalytics {
  totalOutpasses: number;
  approved: number;
  rejected: number;
  cancelled: number;
  approvalRate: number;
  averageProcessingTime: string;
  dailyTrend: Array<{
    date: string;
    total: number;
    approved: number;
    rejected: number;
  }>;
  topReasons: Array<{
    reason: string;
    count: number;
  }>;
}

// ============================================================================
// JWT PAYLOAD
// ============================================================================

export interface JWTPayload {
  sub: string;
  role: UserRole;
  email?: string;
  iat?: number;
  exp?: number;
}

// ============================================================================
// FASTIFY REQUEST EXTENSIONS
// ============================================================================

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    role: UserRole;
    email?: string;
  };
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface OutpassFilterQuery extends PaginationQuery {
  status?: OutpassStatus;
  fromDate?: string;
  toDate?: string;
  hostel?: string;
}

export interface StudentFilterQuery extends PaginationQuery {
  department?: string;
  year?: number;
  hostel?: string;
  status?: boolean;
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface OutpassEmailData {
  studentName: string;
  outpassNumber: string;
  reason: string;
  fromDate: string;
  toDate: string;
  status: OutpassStatus;
  approvedBy?: string;
  rejectionReason?: string;
}

// ============================================================================
// SOCKET.IO TYPES
// ============================================================================

export interface SocketUser {
  userId: string;
  role: UserRole;
  socketId: string;
}

export interface NotificationPayload {
  userId: string;
  notification: INotification;
}

export interface OutpassUpdatePayload {
  outpassId: string;
  status: OutpassStatus;
  data?: any;
}

// ============================================================================
// VALIDATION SCHEMAS (for Zod)
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  LoginRequestPayload as LoginRequest,
  RegisterStudentPayload as RegisterStudent,
  RegisterWardenPayload as RegisterWarden,
  CreateOutpassPayload as CreateOutpass,
};


