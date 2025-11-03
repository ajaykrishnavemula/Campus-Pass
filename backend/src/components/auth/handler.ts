/**
 * @author AjayKrishna
 * @summary Route Handlers
 */

import { LoginRequestPayload } from '../../types';
import { User, Student, Warden, Permit } from '../../model';
import { checkPassword } from '../../utils/hash';
import logger from '../../utils/logger';

export const login = async (payload: LoginRequestPayload, sign: any) => {
  try {
    let { id, password } = payload;
    let data, profile;
    const user = await User.findOne({ id: id });

    if (user && (await checkPassword(password, user.password))) {
      switch (user.role) {
        case 0:
          [profile, data] = await Promise.all([
            await Student.findOne({ id }),
            await Permit.find({ id }),
          ]);
          break;
        case 1:
        case 3:
          [profile] = await Promise.all([await User.findOne({ id })]);
          break;
        case 2:
          profile = await Warden.findOne({ id });
          data = await Student.find({ hostel: profile.hostel });
          break;
      }
      const token = sign({ sub: user.id, role: user.role });
      return { code: 200, response: { user: profile, data, token } };
    } else {
      return { code: 404, response: { message: 'Invalid Credentials' } };
    }
  } catch (error) {
    logger.error('Error : ', error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};
