// User Types
export enum UserRole {
  STUDENT = 0,
  ADMIN = 1,
  WARDEN = 2,
  SECURITY = 3,
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  hostel?: string;
  roomNumber?: string;
  department?: string;
  year?: number;
  rollNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Outpass Types
export enum OutpassStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHECKED_OUT = 'checked_out',
  CHECKED_IN = 'checked_in',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum OutpassType {
  LOCAL = 'local',
  HOME = 'home',
  EMERGENCY = 'emergency',
  MEDICAL = 'medical',
  OTHER = 'other',
}

export interface Outpass {
  _id: string;
  student: User | string;
  outpassNumber: string;
  type: OutpassType;
  reason: string;
  destination: string;
  fromDate: string;
  toDate: string;
  status: OutpassStatus;
  warden?: User | string;
  wardenRemarks?: string;
  approvedAt?: string;
  rejectedAt?: string;
  checkOutTime?: string;
  checkInTime?: string;
  checkOutBy?: User | string;
  checkInBy?: User | string;
  qrCode?: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export enum NotificationType {
  OUTPASS_APPROVED = 'outpass_approved',
  OUTPASS_REJECTED = 'outpass_rejected',
  OUTPASS_CHECKED_OUT = 'outpass_checked_out',
  OUTPASS_CHECKED_IN = 'outpass_checked_in',
  OUTPASS_OVERDUE = 'outpass_overdue',
  SYSTEM_ALERT = 'system_alert',
  GENERAL = 'general',
}

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  hostel?: string;
  roomNumber?: string;
  department?: string;
  year?: number;
  rollNumber?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Dashboard Stats Types
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

// Form Types
export interface OutpassFormData {
  type: OutpassType;
  reason: string;
  destination: string;
  fromDate: string;
  toDate: string;
}

export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  hostel?: string;
  roomNumber?: string;
  department?: string;
  year?: number;
}

// Filter Types
export interface OutpassFilters {
  status?: OutpassStatus;
  type?: OutpassType;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Socket Event Types
export interface SocketNotification {
  notification: Notification;
}

export interface SocketOutpassUpdate {
  outpassId: string;
  outpass: Outpass;
  studentId: string;
}

export interface SocketSystemAlert {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

