"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _winston = require("winston");

var _loggingWinston = require("@google-cloud/logging-winston");

var _default = ({
  inGoogleCloud
}) => {
  const {
    Console
  } = _winston.transports;
  const appTransports = {
    default: [...(inGoogleCloud ? [new _loggingWinston.LoggingWinston()] : []), new Console()]
  };
  const exceptionHandlers = {
    default: [...(inGoogleCloud ? [new _loggingWinston.LoggingWinston()] : []), new Console()]
  };
  const loggingConfig = (0, _objectSpread2.default)({}, inGoogleCloud ? {} : {
    format: _winston.format.combine(_winston.format.colorize(), _winston.format.timestamp(), _winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`))
  }, {
    level: 'info',
    transports: appTransports.default,
    exceptionHandlers: exceptionHandlers.default,
    exitOnError: true
  });
  const logger = (0, _winston.createLogger)(loggingConfig);
  return logger;
};

exports.default = _default;