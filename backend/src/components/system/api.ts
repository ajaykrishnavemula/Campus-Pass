/**
 * @author AjayKrishna
 * @summary Route APIs
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { getSystemStatus } from './handler';

export const getStatusAPI = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const res = await getSystemStatus();
  reply.code(res.code);
  reply.send(res.response);
};
