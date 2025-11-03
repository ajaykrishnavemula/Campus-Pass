/**
 * @author Ajay Krishna
 * @summary Route APIs
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateUserPayload, SystemStatusPayload } from '../types';
import { createUser, getUsers, setSystemStatus } from './handler';

export const createUserAPI = async (
  req: FastifyRequest<{ Body: CreateUserPayload }>,
  reply: FastifyReply,
) => {
  try {
    const res = await createUser(req.body);
    reply.code(res.code);
    reply.send(res.response);
  } catch (error) {
    console.log(error);
    reply.send(error);
  }
};

export const getUsersAPI = async (
  req: FastifyRequest<{ Body: { type: number } }>,
  reply: FastifyReply,
) => {
  try {
    const res = await getUsers(req.body);
    reply.code(res.code);
    reply.send(res.response);
  } catch (error) {
    console.log(error);
    reply.send(error);
  }
};

export const setSystemStatusAPI = async (
  req: FastifyRequest<{ Body: SystemStatusPayload }>,
  reply: FastifyReply,
) => {
  try {
    const res = await setSystemStatus(req.body);
    reply.code(res?.code || 200);
    reply.send(res?.response);
  } catch (error) {
    console.log(error);
    reply.send(error);
  }
};
