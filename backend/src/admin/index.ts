/**
 * @author AjayKrishna
 * @summary Route Options
 */

import { FastifyInstance } from 'fastify';
import { createUserAPI, getUsersAPI, setSystemStatusAPI } from './api';

export default (fastify: FastifyInstance, options: any, done: any) => {
  fastify.route({
    method: 'POST',
    url: '/users/register',
    preHandler: fastify.adminAuth,
    handler: createUserAPI,
  });

  fastify.route({
    method: 'POST',
    url: '/users',
    preHandler: fastify.adminAuth,
    handler: getUsersAPI,
  });

  fastify.route({
    method: 'POST',
    url: '/system',
    preHandler: fastify.adminAuth,
    handler: setSystemStatusAPI,
  });

  done();
};
