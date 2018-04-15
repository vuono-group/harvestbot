'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { Console } = _winston2.default.transports;

const transports = {
  default: [new Console({ json: false, timestamp: true, colorize: true })]
};

const exceptionHandlers = {
  default: [new Console({ json: false, timestamp: true, colorize: true })]
};

const config = {
  transports: transports.default,
  exceptionHandlers: exceptionHandlers.default,
  exitOnError: true
};

exports.default = new _winston2.default.Logger(config);