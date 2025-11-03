/**
 * @author AjayKrishna
 * @summary Necessary Plugins for JWT Authentication of users.
 *
 *
 */

import fp from 'fastify-plugin';
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import jwt from '@fastify/jwt';
import config from '../config/index';
import { getRoleFromToken } from '../utils/hash';

const authPlugin: FastifyPluginAsync = fp(async (server: FastifyInstance) => {
  server.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expires,
    },
  });

  server.decorate(
    'authenticate',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch (error) {
        reply.send(error);
      }
    },
  );

  server.decorate(
    'adminAuth',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
        const role = getRoleFromToken(req);
        if (role != 1) {
          throw new Error('Forbidden');
        }
      } catch (error) {
        reply.code(403);
        reply.send(error);
      }
    },
  );

  server.decorate(
    'securityAuth',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
        const role = getRoleFromToken(req);
        if (role != 3) {
          throw new Error('Forbidden');
        }
      } catch (error) {
        reply.code(403);
        reply.send(error);
      }
    },
  );

  server.decorate(
    'wardenAuth',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
        const role = getRoleFromToken(req);
        if (role != 2) {
          throw new Error('Forbidden');
        }
      } catch (error) {
        reply.code(403);
        reply.send(error);
      }
    },
  );

  server.decorate(
    'studentAuth',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
        const role = getRoleFromToken(req);
        if (role != 0) {
          throw new Error('Forbidden');
        }
      } catch (error) {
        reply.code(403);
        reply.send(error);
      }
    },
  );

  server.decorate(
    'wardenOrAdminAuth',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
        const role = getRoleFromToken(req);
        if (role == 0 || role == 3) {
          throw new Error('Forbidden');
        }
      } catch (error) {
        reply.code(403);
        reply.send(error);
      }
    },
  );

  server.decorate(
    'wardenOrSecurityAuth',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
        const role = getRoleFromToken(req);
        if (role == 0) {
          throw new Error('Forbidden');
        }
      } catch (error) {
        reply.code(403);
        reply.send(error);
      }
    },
  );
});

export interface FastifyAuth {
  (req: FastifyRequest, res: FastifyReply): Promise<unknown> | void;
}

export default authPlugin;
