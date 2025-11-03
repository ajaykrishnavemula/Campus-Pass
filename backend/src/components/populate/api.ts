/**
 * @author AjayKrishna
 * @summary Route APIs
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { TypePermit } from '../../model';
import {
  createPass,
  remark,
  setStatus,
  verifyPass,
  DeletePass,
  UpdatePass,
  getOutgoingStudents,
  getStudentsUnderWarden,
  getProfile,
  getLocationStatus,
  getAllowanceForPass,
  PendingPermits,
} from './handler';
import {
  VerificationPayload,
  DateQueryPayload,
  WardenStudentsPayload,
  StudentHistoryPayload,
  OutGoingStudentsPayload,
  SetStatusType,
} from '../../types';

import { getIdFromToken } from '../../utils/hash';

export const createPassAPI = async (
  req: FastifyRequest<{ Body: TypePermit }>,
  reply: FastifyReply,
) => {
  const res = await createPass(req.body);
  reply.code(res?.code);
  reply.send(res?.response);
};

export const verifyPassAPI = async (
  req: FastifyRequest<{ Body: VerificationPayload }>,
  reply: FastifyReply,
) => {
  const id = getIdFromToken(req);
  const res = await verifyPass(id, req.body);
  reply.code(res.code);
  reply.send(res.response);
};

export const DeletePassAPI = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const id = getIdFromToken(req);
  const res = await DeletePass(id);
  reply.code(res?.code || 200);
  reply.send(res?.response);
};

export const UpdatePassAPI = async (
  req: FastifyRequest<{ Body: Partial<TypePermit> }>,
  reply: FastifyReply,
) => {
  const id = getIdFromToken(req);
  const res = await UpdatePass(id, req.body);
  reply.code(res.code);
  reply.send(res.response);
};

export const remarkAPI = async (
  req: FastifyRequest<{ Body: { id: string } }>,
  reply: FastifyReply,
) => {
  const res = await remark(req.body);
  reply.code(res.code);
  reply.send(res.response);
};

export const setStatusAPI = async (
  req: FastifyRequest<{ Body: SetStatusType }>,
  reply: FastifyReply,
) => {
  const res = await setStatus(req.body);
  reply.code(res.code);
  reply.send(res.response);
};

export const getOutgoingStudentsAPI = async (
  req: FastifyRequest<{
    Body: OutGoingStudentsPayload;
  }>,
  reply: FastifyReply,
) => {
  const res = await getOutgoingStudents(req.body);
  reply.code(res.code);
  reply.send(res.response);
};

export const getStudentsUnderWardenAPI = async (
  req: FastifyRequest<{ Params: WardenStudentsPayload }>,
  reply: FastifyReply,
) => {
  const res = await getStudentsUnderWarden(req.params.hostel);
  reply.code(res?.code || 200);
  reply.send(res?.response);
};

export const getStudentHistoryAPI = async (
  req: FastifyRequest<{ Body: StudentHistoryPayload }>,
  reply: FastifyReply,
) => {
  const res = await getProfile(req.body.id);
  reply.code(res?.code || 200);
  reply.send(res?.response);
};

export const getProfileAPI = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const id = getIdFromToken(req);
  const res = await getProfile(id);
  reply.code(res?.code || 200);
  reply.send(res?.response);
};

export const getLocationStatusAPI = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const id = getIdFromToken(req);
  const res = await getLocationStatus(id);
  reply.code(res.code);
  reply.send(res.response);
};

export const getAllowanceAPI = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const id = getIdFromToken(req);
  const res = await getAllowanceForPass(id);
  reply.code(res.code);
  reply.send(res.response);
};

export const getOutGoingStudentsUnderWardenAPI = async (
  req: FastifyRequest<{ Body: OutGoingStudentsPayload }>,
  reply: FastifyReply,
) => {
  const res = await getOutgoingStudents(req.body);
  reply.code(res?.code || 200);
  reply.send(res?.response);
};

export const PendingPermitsAPI = async (
  req: FastifyRequest<{ Body: { id: string } }>,
  reply: FastifyReply,
) => {
  const res = await PendingPermits(req.body.id);
  reply.code(res?.code || 200);
  reply.send(res?.response);
};
