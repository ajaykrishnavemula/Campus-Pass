/**
 * @author AjayKrishna
 * @summary Route Options
 */

import { FastifyInstance } from 'fastify';
import { getStatusAPI } from './api';

export default (fastify: FastifyInstance, options: any, done: any) => {
  fastify.route({
    method: 'GET',
    url: '/',
    handler: getStatusAPI,
  });
  done();
};
