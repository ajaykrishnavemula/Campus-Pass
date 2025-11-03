/**
 * @author AjayKrishna
 * @summary Route Handlers
 */
import { System } from '../../model';

export const getSystemStatus = async () => {
  try {
    const doc = await System.findOne({});
    const status = { allow: doc?.allow, threshold: doc?.threshold };
    return { code: 200, response: { status } };
  } catch (error) {
    console.log(error);
    return {
      code: 500,
      response: { message: 'Internal Server Error', error: error },
    };
  }
};
