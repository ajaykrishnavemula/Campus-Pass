/**
 * @summary Main Server Entry Point
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { createServer } from 'http';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { initializeSocket } from './socket';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Global Socket.io instance
let io: any;

export function getSocketIO() {
  return io;
}

export async function buildServer() {
  const fastify = Fastify({
    logger: false, // Using custom winston logger
    trustProxy: true,
    serverFactory: (handler) => {
      return createServer((req, res) => {
        handler(req, res);
      });
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Register routes
  await fastify.register(routes);

  // Error handlers
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  return fastify;
}

async function start() {
  try {
    // Connect to database
    await connectDatabase();

    // Build and start server
    const fastify = await buildServer();

    await fastify.listen({ port: PORT, host: HOST });

    // Initialize Socket.io
    io = initializeSocket(fastify.server);
    logger.info('Socket.io initialized');

    logger.info(`Server listening on ${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`WebSocket server ready for real-time connections`);
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Start server
start();


