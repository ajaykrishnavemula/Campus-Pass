/**
 * @author AjayKrishna
 * @summary Route Options
 */

import { FastifyInstance } from 'fastify';
import { loginAPI } from './api';

export default (fastify: FastifyInstance, options: any, done: any) => {
  fastify.route({
    method: 'POST',
    url: '/login',
    handler: loginAPI,
  });

  done();
};
