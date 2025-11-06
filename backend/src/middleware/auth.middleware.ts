/**
 * Authentication Middleware
 * Handles JWT verification and user authentication
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { authService } from '../services';

export interface UserPayload {
  id: string;
  email: string;
  role: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  userPayload?: UserPayload;
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;

    // Get user from database to ensure they still exist
    const user = await authService.getUserById(decoded.id);

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: 'User not found',
      });
    }

    // Attach user to request
    request.userPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return reply.status(401).send({
        success: false,
        message: 'Token expired',
      });
    }

    return reply.status(500).send({
      success: false,
      message: 'Authentication failed',
    });
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...allowedRoles: number[]) {
  return async (
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.userPayload) {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(request.userPayload.role)) {
      return reply.status(403).send({
        success: false,
        message: 'Insufficient permissions',
      });
    }
  };
}

/**
 * Require student role
 */
export const requireStudent = requireRole(0);

/**
 * Require admin role
 */
export const requireAdmin = requireRole(1);

/**
 * Require warden role
 */
export const requireWarden = requireRole(2);

/**
 * Require security role
 */
export const requireSecurity = requireRole(3);

/**
 * Require admin or warden role
 */
export const requireAdminOrWarden = requireRole(1, 2);

/**
 * Require warden or security role
 */
export const requireWardenOrSecurity = requireRole(2, 3);

/**
 * Optional authentication (doesn't fail if no token)
 */
export async function optionalAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return;
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;

    const user = await authService.getUserById(decoded.id);

    if (user) {
      request.userPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    return;
  }
}


