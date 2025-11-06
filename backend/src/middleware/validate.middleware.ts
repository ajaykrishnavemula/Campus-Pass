/**
 * @summary Request Validation Middleware using Zod
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserRole, PurposeType } from '../types';
import logger from '../utils/logger';

/**
 * Generic validation middleware factory
 */
export function validate(schema: z.ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const result = schema.safeParse(request.body);
      
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          message: 'Invalid request data',
          errors,
        });
      }

      // Replace request body with validated data
      request.body = result.data;
    } catch (error) {
      logger.error(`Validation error: ${error}`);
      reply.code(400).send({
        success: false,
        error: 'Validation Error',
        message: 'Failed to validate request',
      });
    }
  };
}

// ============================================================================
// Authentication Schemas
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  
  // Student specific fields
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  year: z.number().min(1).max(4).optional(),
  hostel: z.string().optional(),
  roomNumber: z.string().optional(),
  parentPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number').optional(),
  
  // Warden specific fields
  hostelAssigned: z.string().optional(),
  
  // Security specific fields
  gateAssigned: z.string().optional(),
  shiftTiming: z.string().optional(),
}).refine(
  (data) => {
    if (data.role === UserRole.STUDENT) {
      return !!(data.rollNumber && data.department && data.year && data.hostel && data.roomNumber && data.parentPhone);
    }
    if (data.role === UserRole.WARDEN) {
      return !!data.hostelAssigned;
    }
    if (data.role === UserRole.SECURITY) {
      return !!(data.gateAssigned && data.shiftTiming);
    }
    return true;
  },
  {
    message: 'Missing required fields for the specified role',
  }
);

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ============================================================================
// Outpass Schemas
// ============================================================================

export const createOutpassSchema = z.object({
  purpose: z.nativeEnum(PurposeType),
  destination: z.string().min(3, 'Destination must be at least 3 characters'),
  fromDate: z.string().datetime('Invalid date format'),
  toDate: z.string().datetime('Invalid date format'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  emergencyContact: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
}).refine(
  (data) => {
    const from = new Date(data.fromDate);
    const to = new Date(data.toDate);
    return to > from;
  },
  {
    message: 'End date must be after start date',
    path: ['toDate'],
  }
);

export const updateOutpassSchema = z.object({
  purpose: z.nativeEnum(PurposeType).optional(),
  destination: z.string().min(3).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  reason: z.string().min(10).optional(),
  emergencyContact: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
});

export const approveOutpassSchema = z.object({
  remarks: z.string().optional(),
});

export const rejectOutpassSchema = z.object({
  remarks: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

// ============================================================================
// Security Schemas
// ============================================================================

export const scanQRSchema = z.object({
  qrData: z.string().min(1, 'QR data is required'),
});

export const checkInSchema = z.object({
  outpassId: z.string().min(1, 'Outpass ID is required'),
  remarks: z.string().optional(),
});

export const checkOutSchema = z.object({
  outpassId: z.string().min(1, 'Outpass ID is required'),
  remarks: z.string().optional(),
});

// ============================================================================
// Profile Update Schemas
// ============================================================================

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  
  // Student specific
  department: z.string().optional(),
  year: z.number().min(1).max(4).optional(),
  hostel: z.string().optional(),
  roomNumber: z.string().optional(),
  parentPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  
  // Warden specific
  hostelAssigned: z.string().optional(),
  
  // Security specific
  gateAssigned: z.string().optional(),
  shiftTiming: z.string().optional(),
});

// ============================================================================
// Query Parameter Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// Validation Middleware Exports
// ============================================================================

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateChangePassword = validate(changePasswordSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPassword = validate(resetPasswordSchema);

export const validateCreateOutpass = validate(createOutpassSchema);
export const validateUpdateOutpass = validate(updateOutpassSchema);
export const validateApproveOutpass = validate(approveOutpassSchema);
export const validateRejectOutpass = validate(rejectOutpassSchema);

export const validateScanQR = validate(scanQRSchema);
export const validateCheckIn = validate(checkInSchema);
export const validateCheckOut = validate(checkOutSchema);

export const validateUpdateProfile = validate(updateProfileSchema);


