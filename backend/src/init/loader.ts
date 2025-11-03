import { System } from '../model';
import system from '../class/system';
import config from '../config';
import logger from '../utils/logger';

export default async () => {
  try {
    const doc = await System.findOne({});
    if (doc) {
      system.setSystemStatus(doc.allow, new Date().toISOString());
    }
  } catch (error) {
    logger.error('Error: ', error);
    throw error;
  }
};
