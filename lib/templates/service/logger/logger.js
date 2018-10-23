import winston from 'winston';

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
