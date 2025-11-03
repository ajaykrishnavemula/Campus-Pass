/**
 * @author AjayKrishna
 * @summary Route Options
 */

import { FastifyInstance } from 'fastify';
import {
  createPassAPI,
  verifyPassAPI,
  remarkAPI,
  setStatusAPI,
  getOutgoingStudentsAPI,
  getStudentHistoryAPI,
  getProfileAPI,
  getLocationStatusAPI,
  getAllowanceAPI,
  getStudentsUnderWardenAPI,
  getOutGoingStudentsUnderWardenAPI,
  PendingPermitsAPI,
} from './api';

export default (fastify: FastifyInstance, options: any, done: any) => {
  fastify.route({
    method: 'POST',
    url: '/create',
    handler: createPassAPI,
    preHandler: [fastify.authenticate],
  });

  fastify.route({
    method: 'POST',
    url: '/verify',
    handler: verifyPassAPI,
    preHandler: [fastify.securityAuth],
  });

  fastify.route({
    method: 'POST',
    url: '/remark',
    handler: remarkAPI,
    preHandler: [fastify.securityAuth],
  });
  fastify.route({
    method: 'POST',
    url: '/student/status',
    handler: setStatusAPI,
    preHandler: [fastify.wardenOrAdminAuth],
  });
  fastify.route({
    method: 'POST',
    url: '/outgoing',
    handler: getOutgoingStudentsAPI,
    preHandler: [fastify.securityAuth],
  });

  fastify.route({
    method: 'POST',
    url: '/student/history',
    handler: getStudentHistoryAPI,
    preHandler: [fastify.wardenAuth],
  });

  fastify.route({
    method: 'GET',
    url: '/student/all/:hostel',
    handler: getStudentsUnderWardenAPI,
    preHandler: [fastify.wardenAuth],
  });

  fastify.route({
    method: 'GET',
    url: '/profile',
    handler: getProfileAPI,
    preHandler: [fastify.studentAuth],
  });

  fastify.route({
    method: 'GET',
    url: '/location',
    handler: getLocationStatusAPI,
    preHandler: [fastify.studentAuth],
  });

  fastify.route({
    method: 'GET',
    url: '/allow',
    handler: getAllowanceAPI,
    preHandler: [fastify.studentAuth],
  });

  fastify.route({
    method: 'POST',
    url: '/hostel/outgoing',
    handler: getOutGoingStudentsUnderWardenAPI,
    preHandler: [fastify.wardenAuth],
  });

  fastify.route({
    method: 'POST',
    url: '/hostel/verifyPass',
    handler: PendingPermitsAPI,
    preHandler: [fastify.wardenAuth],
  });

  done();
};
