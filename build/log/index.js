'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _loggingWinston = require('@google-cloud/logging-winston');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = ({ inGoogleCloud }) => {
  const { Console } = _winston2.default.transports;

  const transports = {
    default: [...(inGoogleCloud ? [new _loggingWinston.LoggingWinston()] : []), new Console({ json: false, timestamp: true, colorize: true })]
  };

  const exceptionHandlers = {
    default: [new Console({ json: false, timestamp: true, colorize: true })]
  };

  const loggingConfig = {
    transports: transports.default,
    exceptionHandlers: exceptionHandlers.default,
    exitOnError: true
  };

  const logger = new _winston2.default.Logger(loggingConfig);

  return logger;
};