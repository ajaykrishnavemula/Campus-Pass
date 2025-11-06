/**
 * Campus-Pass Backend Server
 * Main entry point for the application
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createServer } from 'http';
import { connectDatabase } from './config/database';
import { authRoutes, outpassRoutes, notificationRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { socketService, emailService } from './services';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    // Create Fastify instance
    const fastify = Fastify({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
      trustProxy: true,
    });

    // Register CORS
    await fastify.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    });

    // Register Helmet for security
    await fastify.register(helmet, {
      contentSecurityPolicy: false,
    });

    // Connect to MongoDB
    await connectDatabase();

    // Initialize Email Service
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
    ) {
      emailService.initialize({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        from: process.env.SMTP_FROM,
      });
      console.log('✅ Email service initialized');
    } else {
      console.warn('⚠️  Email service not configured (SMTP settings missing)');
    }

    // Health check endpoint
    fastify.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // Register API routes
    await fastify.register(
      async (instance) => {
        await instance.register(authRoutes, { prefix: '/auth' });
        await instance.register(outpassRoutes, { prefix: '/outpasses' });
        await instance.register(notificationRoutes, { prefix: '/notifications' });
      },
      { prefix: '/api' }
    );

    // Register error handlers
    fastify.setErrorHandler(errorHandler);
    fastify.setNotFoundHandler(notFoundHandler);

    // Create HTTP server for Socket.io
    const httpServer = createServer(fastify.server);

    // Initialize Socket.io
    socketService.initialize(httpServer);
    console.log('✅ Socket.io initialized');

    // Start server
    await fastify.listen({ port: PORT, host: HOST });

    console.log('');
    console.log('🚀 Campus-Pass Backend Server Started');
    console.log('=====================================');
    console.log(`📍 Server: http://${HOST}:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 API Base: http://${HOST}:${PORT}/api`);
    console.log(`🔌 Socket.io: ws://${HOST}:${PORT}`);
    console.log('=====================================');
    console.log('');

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        await fastify.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();


