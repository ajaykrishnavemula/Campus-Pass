/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log error
  request.log.error(error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      errors: Object.values((error as any).errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  // Mongoose duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern)[0];
    return reply.status(409).send({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return reply.status(400).send({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({
      success: false,
      message: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      success: false,
      message: 'Token expired',
    });
  }

  // Fastify validation error
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: 'Validation failed',
      errors: error.validation,
    });
  }

  // Custom app errors
  const statusCode = (error as AppError).statusCode || error.statusCode || 500;
  const message = error.message || 'Internal server error';

  return reply.status(statusCode).send({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

/**
 * 404 Not Found handler
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return reply.status(404).send({
    success: false,
    message: 'Route not found',
    path: request.url,
  });
}

/**
 * Custom error classes
 */
export class BadRequestError extends Error implements AppError {
  statusCode = 400;
  code = 'BAD_REQUEST';

  constructor(message: string = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends Error implements AppError {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements AppError {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends Error implements AppError {
  statusCode = 500;
  code = 'INTERNAL_SERVER_ERROR';

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
  }
}


