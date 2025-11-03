import 'fastify';
import { FastifyAuth } from 'src/plugins/token';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: FastifyAuth;
    securityAuth: FastifyAuth;
    adminAuth: FastifyAuth;
    wardenAuth: FastifyAuth;
    studentAuth: FastifyAuth;
    wardenOrAdminAuth: FastifyAuth;
    wardenOrSecurityAuth: FastifyAuth;
  }
}
