'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _defaults = require('./defaults');

var _keyRing = require('../cloud/key-ring');

var _keyRing2 = _interopRequireDefault(_keyRing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = () => {
  const inGoogleCloud = !process.env.FUNCTION_NAME;
  const logger = (0, _log2.default)({ inGoogleCloud });
  const getEnvParam = param => process.env[param] ? process.env[param] : logger.error(`Environment variable ${param} missing.`);
  const baseConfig = {
    inGoogleCloud,
    projectId: getEnvParam('GCLOUD_PROJECT'),
    region: getEnvParam('FUNCTION_REGION')
  };
  const { decryptSecret } = (0, _keyRing2.default)(baseConfig);

  const getConfig = async () => {
    const secretConfigString = await decryptSecret();
    const secretConfig = JSON.parse(secretConfigString);
    return _extends({}, baseConfig, secretConfig, {
      emailDomains: secretConfig.emailDomains ? secretConfig.emailDomains.split(',') : [],
      statsColumnHeaders: secretConfig.statsColumnHeaders ? secretConfig.statsColumnHeaders.split(',') : _defaults.DEFAULT_COLUMN_HEADERS,
      taskIds: {
        publicHoliday: parseInt(secretConfig.taskIds.publicHoliday, 10),
        vacation: parseInt(secretConfig.taskIds.vacation, 10),
        unpaidLeave: parseInt(secretConfig.taskIds.unpaidLeave, 10),
        sickLeave: parseInt(secretConfig.taskIds.sickLeave, 10),
        flexLeave: parseInt(secretConfig.taskIds.flexLeave, 10)
      },
      currentTime: new Date().getTime() / 1000
    });
  };

  return {
    getConfig
  };
};