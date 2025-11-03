/**
 * @author AjayKrishna
 * @summary Logger Utility
 */

import winston from 'winston';

const dateFormat = () => {
  return new Date(Date.now()).toString();
};
class LoggerService {
  log_data: null;
  route: string;
  logger: winston.Logger;

  constructor(route: string) {
    this.log_data = null;
    this.route = route;

    const logger = winston.createLogger({
      transports: [
        //new winston.transports.Console(),
        new winston.transports.File({
          filename: `./logs/${route}.log`,
        }),
      ],

      format: winston.format.printf((info) => {
        let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${route}.log | ${
          info.message
        } | `;
        message = info.obj
          ? message + `data:${JSON.stringify(info.obj)} | `
          : message;
        message = this.log_data
          ? message + `log_data:${JSON.stringify(this.log_data)} | `
          : message;
        return message;
      }),
    });
    this.logger = logger;
  }
  setLogData(log_data: any) {
    this.log_data = log_data;
  }

  debug(message: string, obj?: any) {
    if (obj) {
      this.logger.log('info', message, {
        obj,
      });
    } else {
      this.logger.log('info', message);
    }
  }

  info(message: string, obj?: any) {
    if (obj) {
      this.logger.log('info', message, {
        obj,
      });
    } else {
      this.logger.log('info', message);
    }
  }

  error(message: any, obj?: any) {
    if (obj) {
      this.logger.log('info', message, {
        obj,
      });
    } else {
      this.logger.log('info', message);
    }
  }
}

const logger = new LoggerService('app');
export default logger;
