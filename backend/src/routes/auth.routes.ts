/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

import { FastifyInstance } from 'fastify';
import { authService, emailService } from '../services';
import {
  authenticate,
  AuthenticatedRequest,
  validateBody,
  schemas,
  BadRequestError,
  UnauthorizedError,
} from '../middleware';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  fastify.post(
    '/register',
    {
      preHandler: [validateBody(schemas.register)],
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          name: string;
          email: string;
          password: string;
          phone?: string;
          role?: number;
          hostel?: string;
          roomNumber?: string;
        };

        // Check if user already exists
        const existingUser = await authService.getUserByEmail(body.email);
        if (existingUser) {
          throw new BadRequestError('User with this email already exists');
        }

        // Create user
        const user = await authService.register(body);

        // Generate token
        const token = authService.generateToken({
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        });

        // Send welcome email (don't wait for it)
        if (emailService.isConfigured()) {
          emailService.sendWelcomeEmail(user).catch((error) => {
            fastify.log.error('Failed to send welcome email:', error);
          });
        }

        return reply.status(201).send({
          success: true,
          message: 'User registered successfully',
          data: {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              hostel: user.hostel,
              roomNumber: user.roomNumber,
              phone: user.phone,
            },
            token,
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /api/auth/login
   * Login user
   */
  fastify.post(
    '/login',
    {
      preHandler: [validateBody(schemas.login)],
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

        // Login user
        const user = await authService.login(email, password);

        if (!user) {
          throw new UnauthorizedError('Invalid email or password');
        }

        // Generate token
        const token = authService.generateToken({
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        });

        return reply.send({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              hostel: user.hostel,
              roomNumber: user.roomNumber,
              phone: user.phone,
              status: user.status,
              remarkScore: user.remarkScore,
              inCampus: user.inCampus,
            },
            token,
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  fastify.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;

        const user = await authService.getUserById(userId);

        if (!user) {
          throw new UnauthorizedError('User not found');
        }

        return reply.send({
          success: true,
          data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            hostel: user.hostel,
            roomNumber: user.roomNumber,
            phone: user.phone,
            status: user.status,
            remarkScore: user.remarkScore,
            inCampus: user.inCampus,
            createdAt: user.createdAt,
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  fastify.put(
    '/profile',
    {
      preHandler: [authenticate, validateBody(schemas.updateProfile)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;
        const updates = request.body as {
          name?: string;
          phone?: string;
          hostel?: string;
          roomNumber?: string;
        };

        const user = await authService.updateProfile(userId, updates);

        if (!user) {
          throw new UnauthorizedError('User not found');
        }

        return reply.send({
          success: true,
          message: 'Profile updated successfully',
          data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            hostel: user.hostel,
            roomNumber: user.roomNumber,
            phone: user.phone,
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  fastify.post(
    '/change-password',
    {
      preHandler: [authenticate, validateBody(schemas.changePassword)],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.userPayload!.id;
        const { currentPassword, newPassword } = request.body as {
          currentPassword: string;
          newPassword: string;
        };

        await authService.changePassword(userId, currentPassword, newPassword);

        // Get user for email
        const user = await authService.getUserById(userId);

        // Send password changed email (don't wait for it)
        if (user && emailService.isConfigured()) {
          emailService.sendPasswordChangedEmail(user).catch((error) => {
            fastify.log.error('Failed to send password changed email:', error);
          });
        }

        return reply.send({
          success: true,
          message: 'Password changed successfully',
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/auth/users
   * Get all users (Admin only)
   */
  fastify.get(
    '/users',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        // Check if user is admin
        if (request.userPayload!.role !== 1) {
          throw new UnauthorizedError('Only admins can access this resource');
        }

        const users = await authService.getAllUsers();

        return reply.send({
          success: true,
          data: users.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            hostel: user.hostel,
            roomNumber: user.roomNumber,
            phone: user.phone,
            status: user.status,
            remarkScore: user.remarkScore,
            inCampus: user.inCampus,
            createdAt: user.createdAt,
          })),
        });
      } catch (error) {
        throw error;
      }
    }
  );

  /**
   * GET /api/auth/students/:hostel
   * Get students by hostel (Warden only)
   */
  fastify.get(
    '/students/:hostel',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        // Check if user is warden or admin
        if (![1, 2].includes(request.userPayload!.role)) {
          throw new UnauthorizedError('Only wardens and admins can access this resource');
        }

        const { hostel } = request.params as { hostel: string };

        const students = await authService.getStudentsByHostel(hostel);

        return reply.send({
          success: true,
          data: students.map((student) => ({
            id: student._id,
            name: student.name,
            email: student.email,
            hostel: student.hostel,
            roomNumber: student.roomNumber,
            phone: student.phone,
            status: student.status,
            remarkScore: student.remarkScore,
            inCampus: student.inCampus,
          })),
        });
      } catch (error) {
        throw error;
      }
    }
  );
}


