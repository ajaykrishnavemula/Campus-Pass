/**
 * @author AjayKrishna
 * @summary Routes are registered on the server object.
 */

import { FastifyInstance } from 'fastify';
import adminRoute from '../admin';
import authRoute from '../components/auth';
import populateRoute from '../components/populate';
import config from '../config';
import systemRoute from '../components/system';

export default (fastify: FastifyInstance) => {
  fastify.register(adminRoute, { prefix: `${config.api.prefix}/admin` });
  fastify.register(authRoute, { prefix: `${config.api.prefix}/auth` });
  fastify.register(populateRoute, { prefix: `${config.api.prefix}/populate` });
  fastify.register(systemRoute, { prefix: `${config.api.prefix}/system` });
};
