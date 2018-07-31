import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const { Console } = winston.transports;

const transports = {
  default: [
    new Console({ json: false, timestamp: true, colorize: true }),
    new LoggingWinston(),
  ],
};

const exceptionHandlers = {
  default: [new Console({ json: false, timestamp: true, colorize: true })],
};

const config = {
  transports: transports.default,
  exceptionHandlers: exceptionHandlers.default,
  exitOnError: true,
};

export default new winston.Logger(config);
