/**
 * @author AjayKrishna
 * @summary Route APIs
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginRequestPayload } from '../../types';
import { login } from './handler';

export const loginAPI = async (
  req: FastifyRequest<{ Body: LoginRequestPayload }>,
  reply: FastifyReply,
) => {
  try {
    const res = await login(req.body, req.server.jwt.sign);
    reply.code(res.code);
    reply.send(res.response);
  } catch (error) {
    console.log(error);
    reply.send(error);
  }
};

export const logoutAPI = (req: FastifyRequest, reply: FastifyReply) => {};
