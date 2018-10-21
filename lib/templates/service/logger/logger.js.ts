import winston from 'winston';

import { MongoTransport } from '/imports/startup/lib/services/logger-transports';

const Logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new MongoTransport(),
  ]
});

if (process.env.NODE_ENV !== 'production') {
  Logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default Logger;
