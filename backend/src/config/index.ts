/**
 * @author AjayKrishna
 * @summary app configuration file
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

interface Config {
  environment: string;
  serverPort: number;
  host: string;
  db: {
    url: string;
  };
  api: {
    prefix: string;
  };
  jwt: {
    secret: string;
    expires: string;
    refreshSecret: string;
    refreshExpires: string;
  };
  cors: {
    origin: string[];
  };
  rateLimit: {
    max: number;
    window: string;
  };
}

const config: Config = {
  environment: process.env.NODE_ENV || 'development',
  serverPort: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '127.0.0.1',
  
  db: {
    url: process.env.DATABASE_URL!,
  },
  
  api: {
    prefix: process.env.API_PREFIX || '/api/v1',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    expires: process.env.JWT_EXPIRES || '30d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '90d',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    window: process.env.RATE_LIMIT_WINDOW || '15m',
  },
};

// Log configuration in development (without sensitive data)
if (config.environment === 'development') {
  console.log('Configuration loaded:', {
    environment: config.environment,
    port: config.serverPort,
    host: config.host,
    apiPrefix: config.api.prefix,
    dbConnected: !!config.db.url,
  });
}

export default config;
