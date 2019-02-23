import { createLogger, format, transports } from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

export default ({ inGoogleCloud }) => {
  const { Console } = transports;

  const appTransports = {
    default: [
      ...(inGoogleCloud ? [new LoggingWinston()] : []),
      new Console(),
    ],
  };

  const exceptionHandlers = {
    default: [new Console()],
  };

  const loggingConfig = {
    format: format.combine(
      format.colorize(),
      format.timestamp(),
      format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`),
    ),
    level: inGoogleCloud ? 'INFO' : 'info',
    transports: appTransports.default,
    exceptionHandlers: exceptionHandlers.default,
    exitOnError: true,
  };

  const logger = createLogger(loggingConfig);

  return logger;
};
