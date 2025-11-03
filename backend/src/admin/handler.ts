/**
 * @author AjayKrishna
 * @summary Route Handlers
 */

import { CreateUserPayload, SystemStatusPayload } from '../types';
import { Warden, Student, Security, User, System } from '../model';
import { hashPassword } from '../utils/hash';
import logger from '../utils/logger';

export const createUser = async (payload: CreateUserPayload) => {
  try {
    let res;
    payload.password = await hashPassword(payload.password);
    switch (payload.role) {
      case 1:
        throw new Error('Forbidden');
      case 0:
        res = await Student.create(payload);
        break;
      case 2:
        res = await Warden.create(payload);
        break;
      case 3:
        res = await Security.create(payload);
        break;
      default:
        break;
    }
    return { code: 201, response: { res } };
  } catch (error) {
    logger.error('Error : ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const getUsers = async (payload: { type: number }) => {
  try {
    let res;
    switch (payload.type) {
      case 1:
        throw new Error('Forbidden');
      case 0:
        res = await Student.find();
        break;
      case 2:
        res = await Warden.find();
        break;
      case 3:
        res = await Security.find(payload);
        break;
      default:
        break;
    }
    return { code: 200, response: { res } };
  } catch (error) {
    logger.error('Error : ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const setSystemStatus = async (payload: SystemStatusPayload) => {
  try {
    const filter = {};
    const update = payload;
    const res = await System.findOneAndUpdate(filter, update, { new: true });
    return { code: 201, response: { res } };
  } catch (error) {
    logger.error('Error : ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};
