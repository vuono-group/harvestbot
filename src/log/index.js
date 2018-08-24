import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

export default (config) => {
  const { Console } = winston.transports;

  const transports = {
    default: [
      ...(config.cloudEnv ? [new LoggingWinston()] : []),
      new Console({ json: false, timestamp: true, colorize: true }),
    ],
  };

  const exceptionHandlers = {
    default: [new Console({ json: false, timestamp: true, colorize: true })],
  };

  const loggingConfig = {
    transports: transports.default,
    exceptionHandlers: exceptionHandlers.default,
    exitOnError: true,
  };

  const logger = new winston.Logger(loggingConfig);

  return logger;
};
