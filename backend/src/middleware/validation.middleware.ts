/**
 * Validation Middleware
 * Handles request validation using Zod schemas
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError } from 'zod';

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Validation error',
      });
    }
  };
}

/**
 * Validate request query parameters against a Zod schema
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.query = schema.parse(request.query);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Validation error',
      });
    }
  };
}

/**
 * Validate request params against a Zod schema
 */
export function validateParams<T extends z.ZodType>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.params = schema.parse(request.params);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return reply.status(500).send({
        success: false,
        message: 'Validation error',
      });
    }
  };
}

// Common validation schemas
export const schemas = {
  // MongoDB ObjectId
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),

  // Email
  email: z.string().email('Invalid email format'),

  // Password (min 6 characters)
  password: z.string().min(6, 'Password must be at least 6 characters'),

  // Phone number (Indian format)
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),

  // Pagination
  pagination: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),

  // User registration
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
    role: z.number().int().min(0).max(3).optional(),
    hostel: z.string().optional(),
    roomNumber: z.string().optional(),
  }),

  // User login
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),

  // Update profile
  updateProfile: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
    hostel: z.string().optional(),
    roomNumber: z.string().optional(),
  }),

  // Change password
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),

  // Create outpass
  createOutpass: z.object({
    type: z.enum(['local', 'home', 'emergency', 'medical', 'other']),
    destination: z.string().min(3, 'Destination must be at least 3 characters'),
    purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
    fromDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid from date'),
    toDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid to date'),
  }).refine(
    (data) => new Date(data.fromDate) < new Date(data.toDate),
    'From date must be before to date'
  ),

  // Update outpass
  updateOutpass: z.object({
    destination: z.string().min(3, 'Destination must be at least 3 characters').optional(),
    purpose: z.string().min(10, 'Purpose must be at least 10 characters').optional(),
    fromDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid from date').optional(),
    toDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid to date').optional(),
  }),

  // Approve/Reject outpass
  approveOutpass: z.object({
    remarks: z.string().optional(),
  }),

  rejectOutpass: z.object({
    reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  }),

  // Check-in/Check-out
  checkOut: z.object({
    remarks: z.string().optional(),
  }),

  checkIn: z.object({
    remarks: z.string().optional(),
  }),

  // Notification filters
  notificationFilters: z.object({
    type: z.string().optional(),
    read: z.string().optional().transform((val) => val === 'true'),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  }),

  // Outpass filters
  outpassFilters: z.object({
    status: z.string().optional(),
    type: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  }),

  // ID param
  idParam: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
};


