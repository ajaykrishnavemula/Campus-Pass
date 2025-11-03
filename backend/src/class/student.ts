import { Student as StudentModel } from '../model';
import { SetStatusType } from '../types';
class Student {
  public static async updateInCampusStatus(id: String, changeTo: boolean) {
    await StudentModel.findOneAndUpdate({ id }, { inCampus: changeTo });
  }

  public static async getInCampusStatus(id: String) {
    const doc = await StudentModel.findOne({ id });
    return doc.inCampus;
  }

  public static async getRemarkScore(id: String) {
    const doc = await StudentModel.findOne({ id });
    return doc.remarkScore;
  }

  public static async IncrementRemark(id: String) {
    let res = await StudentModel.findOneAndUpdate(
      { id: id },
      { $inc: { remarkScore: 1 } },
      { new: true },
    );
    if (res.remarkScore >= 3) {
      res = await StudentModel.findOneAndUpdate(
        { id: id },
        { status: false },
        { new: true },
      );
    }

    return res;
  }

  public static async UpdateStatus(payload: SetStatusType, update: any) {
    const res = await StudentModel.updateMany(
      { id: { $in: payload.id } },
      update,
    );

    return res;
  }

  public static async Fetch(query: any) {
    return await StudentModel.find(query);
  }

  public static async FetchOne(query: any) {
    return await StudentModel.findOne(query);
  }
}

export default Student;
