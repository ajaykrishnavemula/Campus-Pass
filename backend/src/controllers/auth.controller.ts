/**
 * @summary Authentication Controller
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { User, Student, Warden, Security } from '../models/User';
import { 
  RegisterStudentPayload, 
  RegisterWardenPayload, 
  LoginRequestPayload,
  ApiResponse,
  UserRole 
} from '../types';
import { hashPassword, checkPassword } from '../utils/hash';
import logger from '../utils/logger';

export class AuthController {
  /**
   * Register a new student
   */
  static async registerStudent(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const body = request.body as RegisterStudentPayload;
      const {
        name,
        email,
        password,
        rollNumber,
        department,
        year,
        hostel,
        roomNumber,
        phone,
        parentPhone,
        bloodGroup,
        gender,
        emergencyContact,
      } = body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { id: rollNumber }] 
      });

      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'User already exists',
          message: 'A user with this email or roll number already exists',
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create student
      const student = await Student.create({
        id: rollNumber,
        name,
        email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        phone,
        rollNumber,
        department,
        year,
        hostel,
        roomNumber,
        parentPhone,
        bloodGroup,
        gender,
        emergencyContact,
        isActive: true,
        inCampus: true,
        status: true,
        remarkScore: 0,
      });

      // Generate JWT token
      const token = request.server.jwt.sign({
        sub: student.id,
        role: student.role,
        email: student.email,
      });

      logger.info(`Student registered: ${student.email}`);

      return reply.code(201).send({
        success: true,
        message: 'Student registered successfully',
        data: {
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            rollNumber: student.rollNumber,
            role: 'student',
          },
          token,
        },
      });
    } catch (error) {
      logger.error(`Registration error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to register student',
      });
    }
  }

  /**
   * Register a new warden
   */
  static async registerWarden(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const body = request.body as RegisterWardenPayload;
      const {
        name,
        email,
        password,
        employeeId,
        department,
        hostel,
        phone,
      } = body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { id: employeeId }] 
      });

      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'User already exists',
          message: 'A user with this email or employee ID already exists',
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create warden
      const warden = await Warden.create({
        id: employeeId,
        name,
        email,
        password: hashedPassword,
        role: UserRole.WARDEN,
        phone,
        employeeId,
        department,
        hostel,
        isActive: true,
      });

      // Generate JWT token
      const token = request.server.jwt.sign({
        sub: warden.id,
        role: warden.role,
        email: warden.email,
      });

      logger.info(`Warden registered: ${warden.email}`);

      return reply.code(201).send({
        success: true,
        message: 'Warden registered successfully',
        data: {
          warden: {
            id: warden.id,
            name: warden.name,
            email: warden.email,
            employeeId: warden.employeeId,
            role: 'warden',
          },
          token,
        },
      });
    } catch (error) {
      logger.error(`Registration error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to register warden',
      });
    }
  }

  /**
   * Register a new security officer
   */
  static async registerSecurity(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const body = request.body as any;
      const {
        name,
        email,
        password,
        employeeId,
        phone,
        shift,
        assignedGate,
      } = body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { id: employeeId }] 
      });

      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'User already exists',
          message: 'A user with this email or employee ID already exists',
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create security officer
      const security = await Security.create({
        id: employeeId,
        name,
        email,
        password: hashedPassword,
        role: UserRole.SECURITY,
        phone,
        employeeId,
        shift,
        assignedGate,
        isActive: true,
      });

      // Generate JWT token
      const token = request.server.jwt.sign({
        sub: security.id,
        role: security.role,
        email: security.email,
      });

      logger.info(`Security officer registered: ${security.email}`);

      return reply.code(201).send({
        success: true,
        message: 'Security officer registered successfully',
        data: {
          security: {
            id: security.id,
            name: security.name,
            email: security.email,
            employeeId: security.employeeId,
            role: 'security',
          },
          token,
        },
      });
    } catch (error) {
      logger.error(`Registration error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to register security officer',
      });
    }
  }

  /**
   * Login user
   */
  static async login(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const body = request.body as LoginRequestPayload;
      const { email, id, password } = body;

      // Find user by email or id
      const user = await User.findOne({
        $or: [{ email }, { id }],
      }).select('+password');

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
          message: 'Email/ID or password is incorrect',
        });
      }

      // Check password
      const isPasswordValid = await checkPassword(password, user.password);

      if (!isPasswordValid) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
          message: 'Email/ID or password is incorrect',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return reply.code(403).send({
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact admin.',
        });
      }

      // Get full user profile based on role
      let profile;
      switch (user.role) {
        case UserRole.STUDENT:
          profile = await Student.findOne({ id: user.id });
          break;
        case UserRole.WARDEN:
          profile = await Warden.findOne({ id: user.id });
          break;
        case UserRole.SECURITY:
          profile = await Security.findOne({ id: user.id });
          break;
        default:
          profile = user;
      }

      // Generate JWT token
      const token = request.server.jwt.sign({
        sub: user.id,
        role: user.role,
        email: user.email,
      });

      logger.info(`User logged in: ${user.email}`);

      return reply.code(200).send({
        success: true,
        message: 'Login successful',
        data: {
          user: profile,
          token,
        },
      });
    } catch (error) {
      logger.error(`Login error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to login',
      });
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const userId = (request as any).user.id;
      const userRole = (request as any).user.role;

      let user;
      switch (userRole) {
        case UserRole.STUDENT:
          user = await Student.findOne({ id: userId });
          break;
        case UserRole.WARDEN:
          user = await Warden.findOne({ id: userId });
          break;
        case UserRole.SECURITY:
          user = await Security.findOne({ id: userId });
          break;
        default:
          user = await User.findOne({ id: userId });
      }

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
          message: 'User not found',
        });
      }

      return reply.code(200).send({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error(`Get current user error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get user',
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const userId = (request as any).user.id;
      const body = request.body as { currentPassword: string; newPassword: string };
      const { currentPassword, newPassword } = body;

      // Find user with password
      const user = await User.findOne({ id: userId }).select('+password');

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
          message: 'User not found',
        });
      }

      // Verify current password
      const isPasswordValid = await checkPassword(currentPassword, user.password);

      if (!isPasswordValid) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid password',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      user.password = hashedPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return reply.code(200).send({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error(`Change password error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to change password',
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success message
      
      logger.info(`User logged out`);

      return reply.code(200).send({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error(`Logout error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to logout',
      });
    }
  }
  /**
   * Unified register function that handles all user types
   */
  static async register(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    const { role } = request.body as any;
    
    switch (role) {
      case UserRole.STUDENT:
        return AuthController.registerStudent(request as any, reply);
      case UserRole.WARDEN:
        return AuthController.registerWarden(request as any, reply);
      case UserRole.SECURITY:
        return AuthController.registerSecurity(request as any, reply);
      default:
        return reply.code(400).send({
          success: false,
          error: 'Invalid role',
          message: 'Invalid user role specified',
        });
    }
  }

  /**
   * Get user profile (alias for getCurrentUser)
   */
  static async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    return AuthController.getCurrentUser(request, reply);
  }

  /**
   * Forgot password - send reset token
   */
  static async forgotPassword(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const body = request.body as { email: string };
      const { email } = body;

      const user = await User.findOne({ email });

      if (!user) {
        // Don't reveal if user exists
        return reply.code(200).send({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = request.server.jwt.sign(
        { sub: user.id, type: 'password-reset' },
        { expiresIn: '1h' }
      );

      // In production, send email with reset link
      // For now, just return the token
      logger.info(`Password reset requested for: ${email}`);

      return reply.code(200).send({
        success: true,
        message: 'Password reset link sent to your email',
        data: { resetToken }, // Remove in production
      });
    } catch (error) {
      logger.error(`Forgot password error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to process password reset request',
      });
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const body = request.body as { token: string; newPassword: string };
      const { token, newPassword } = body;

      // Verify token
      let decoded;
      try {
        decoded = request.server.jwt.verify(token) as any;
      } catch (error) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid token',
          message: 'Password reset token is invalid or expired',
        });
      }

      if (decoded.type !== 'password-reset') {
        return reply.code(401).send({
          success: false,
          error: 'Invalid token',
          message: 'Invalid token type',
        });
      }

      // Find user
      const user = await User.findOne({ id: decoded.sub });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
          message: 'User not found',
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      user.password = hashedPassword;
      await user.save();

      logger.info(`Password reset successful for: ${user.email}`);

      return reply.code(200).send({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      logger.error(`Reset password error: ${error}`);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to reset password',
      });
    }
  }
}

// Export individual functions for easier route binding
export const register = AuthController.register.bind(AuthController);
export const login = AuthController.login.bind(AuthController);
export const getProfile = AuthController.getProfile.bind(AuthController);
export const getCurrentUser = AuthController.getCurrentUser.bind(AuthController);
export const changePassword = AuthController.changePassword.bind(AuthController);
export const forgotPassword = AuthController.forgotPassword.bind(AuthController);
export const resetPassword = AuthController.resetPassword.bind(AuthController);
export const logout = AuthController.logout.bind(AuthController);
