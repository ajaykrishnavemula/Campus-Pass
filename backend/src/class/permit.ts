import { PurposeType } from '../types';
import logger from '../utils/logger';
import { TypePermit, Permit as PermitModel } from '../model/index';
import { Date } from 'mongoose';
import Student from './student';
class Permit {
  public static async canAutoApprove(payload: TypePermit) {
    if (!this.checkPurposeValidity(payload.purpose)) {
      return {
        check: false,
        code: 1,
        message:
          'You have choosen "other" as your purpose. Contact your Warden to avail Outpass',
      };
    }
    if (!(await this.checkPresenceInCampus(payload.id))) {
      return {
        check: false,
        code: 2,
        message: 'Cannot Create Outpass as there is an existing outpass on you',
      };
    }

    if (!(await this.checkRemarkScore(payload.id))) {
      return {
        check: false,
        code: 3,
        message:
          'Cannot Create Outpass at the moment. Contact your Hostel Warden',
      };
    }

    if (!this.checkDates(payload.outTime, payload.inTime)) {
      return {
        check: false,
        code: 4,
        message: 'Please check your Incoming Time and Outgoing Time ',
      };
    }

    return {
      check: true,
      code: 0,
      message: 'Outpass is auto Verified',
    };
  }

  public static checkPurposeValidity(purpose: number) {
    switch (purpose) {
      case PurposeType.saloon:
      case PurposeType.groceries:
      case PurposeType.medical:
      case PurposeType.sports:
      case PurposeType.localPilgrimage:
        return true;
      case PurposeType.other:
        return false;
    }
  }

  public static async checkPresenceInCampus(id: String) {
    const status = await Student.getInCampusStatus(id);
    return status;
  }

  public static async checkRemarkScore(id: String) {
    const remarkScore = await Student.getRemarkScore(id);
    return remarkScore < 3;
  }

  public static checkDates(outTime: Date, inTime: Date) {
    const outTimeDate = new Date(outTime.toString());
    const inTimeDate = new Date(inTime.toString());
    return outTimeDate < inTimeDate;
  }

  public static async saveToDb(payload: TypePermit, autoSave: boolean) {
    let res, _;
    [res, _] = await Promise.all([
      await new PermitModel({
        name: payload.name,
        phoneNumber: payload.phoneNumber,
        outTime: payload.outTime,
        inTime: payload.inTime,
        purpose: payload.purpose,
        hostel: payload.hostel,
        photoUrl: payload.photoUrl,
        id: payload.id,
        autoVerified: autoSave,
      }).save(),
      await Student.updateInCampusStatus(payload.id, false),
    ]);
    return res;
  }

  public static async verifyPass(id: any, update: any) {
    const res = await PermitModel.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (res?.isInVerified && res?.isOutVerified) {
      await Student.updateInCampusStatus(res.id, true);
    }
    return res;
  }

  public static async Fetch(query: any) {
    return await PermitModel.find(query);
  }

  public static async DeleteById(id: string) {
    return await PermitModel.findByIdAndDelete(id);
  }
  

  public static async UpdateById(id: string, update: any) {
    return await PermitModel.findByIdAndUpdate(id, update, { new: true });
  }
}

export default Permit;
