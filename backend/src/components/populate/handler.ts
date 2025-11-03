/**
 * @author Ajay Krishna
 * @summary Route Handlers
 */

import { TypePermit } from '../../model';
import {
  VerificationPayload,
  OutGoingStudentsPayload,
  SetStatusType,
} from '../../types';
import Permit from '../../class/permit';
import logger from '../../utils/logger';
import System from '../../class/system';
import Student from '../../class/student';

export const createPass = async (payload: TypePermit) => {
  try {
    if (System.getSystemStatus()) {
      const response = await Permit.canAutoApprove(payload);
      if (response.check) {
        const res = await Permit.saveToDb(payload, true);
        return { code: 201, response: res };
      } else if (response.code == 1) {
        const res = await Permit.saveToDb(payload, false);
        return { code: 201, response: res };
      } else {
        return {
          code: 400,
          response: response.message,
        };
      }
    } else {
      return {
        code: 500,
        response: {
          error: 'Outpass cannot be created now. Contact your warden',
        },
      };
    }
  } catch (error: any) {
    logger.error('Bad Request', error);
    return { code: 400, response: error };
  }
};

export const verifyPass = async (id: string, payload: VerificationPayload) => {
  try {
    let update;
    switch (payload.type) {
      case 0:
        update = {
          isOutVerified: true,
          outApprovedBy: id,
          verifiedOutTime: new Date().toISOString(),
        };
        break;
      case 1:
        update = {
          isInVerified: true,
          inAprrovedBy: id,
          verifiedInTime: new Date().toISOString(),
        };
        break;
      default:
        break;
    }
    const res = await Permit.verifyPass(payload.id, update);

    return { code: 200, response: { res } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const remark = async (payload: { id: string }) => {
  try {
    let res = await Student.IncrementRemark(payload.id);
    return { code: 200, response: { res } };
  } catch (error) {
    console.log(error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const setStatus = async (payload: SetStatusType) => {
  try {
    let update = payload.status
      ? { status: true, remarkScore: 0 }
      : { status: false };
    const res = await Student.UpdateStatus(payload, update);
    return { code: 200, response: { res } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const getOutgoingStudents = async (payload: OutGoingStudentsPayload) => {
  try {
    let fromString = payload.date.slice(0, 10) + ' UTC';
    let toString = payload.date.slice(0, 10) + ' 23:59 UTC';
    let fromDate = new Date(fromString).toJSON();
    let toDate = new Date(toString).toJSON();
    console.log(fromDate, toDate);

    let query = payload.hostel
      ? {
          inTime: {
            $gte: fromDate,
            $lte: toDate,
          },
          hostel: payload.hostel,
          autoVerified: true,
        }
      : {
          inTime: {
            $gte: fromDate,
            $lte: toDate,
          },
          autoVerified: true,
        };
    const students = await Permit.Fetch(query);
    return { code: 200, response: { students } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const getStudentsUnderWarden = async (hostel: string) => {
  try {
    const students = await Student.Fetch({ hostel });
    return { code: 200, response: { students } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const getProfile = async (id: string) => {
  try {
    const data = await Permit.Fetch({ id: id });
    return { code: 200, response: { data } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const getLocationStatus = async (id: string) => {
  try {
    const doc = await Student.FetchOne({ id: id });
    return { code: 200, response: { status: doc.inCampus } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const getAllowanceForPass = async (id: string) => {
  try {
    const doc = await Student.FetchOne({ id: id });
    return { code: 200, response: { status: doc.status } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const PendingPermits = async (id: string) => {
  try {
    const update = { autoVerified: true };
    const updatedPermit = await Permit.UpdateById(id, update);
    return { code: 200, response: { status: updatedPermit } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};



export const DeletePass = async (id: string)  => {
  try {
    const data = await Permit.DeleteById(id);
    return { code: 204, response: { data } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};

export const UpdatePass = async (id: string, payload: Partial<TypePermit>)  => {
  try {
    const data = await Permit.UpdateById(id,payload);
    return { code: 200, response: { data } };
  } catch (error) {
    logger.error('Error: ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};




