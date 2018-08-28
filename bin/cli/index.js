'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _app = require('../app');

var _app2 = _interopRequireDefault(_app);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _keyRing = require('../cloud/key-ring');

var _keyRing2 = _interopRequireDefault(_keyRing);

var _package = require('../../package.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-enable import/no-extraneous-dependencies */

/* eslint-disable import/no-extraneous-dependencies */
exports.default = (config, http) => {
  const logger = (0, _log2.default)(config);
  const app = (0, _app2.default)(config, http);
  const { encryptSecret } = (0, _keyRing2.default)(config);

  const printResponse = (header, msgs) => {
    logger.info(header);
    if (msgs) {
      msgs.forEach(msg => logger.info(msg));
    }
  };

  const generateStats = async (email, year, month) => {
    logger.info(`Generating stats for ${year}-${month}`);
    await app.generateReport(year, month, email);
    logger.info(`Sent report to ${email}`);
  };

  const calcFlexTime = async email => {
    logger.info(`Calculating flextime for ${email}`);
    const data = await app.calcFlextime(email);
    printResponse(data.header, data.messages);
  };

  const encryptConfiguration = async () => {
    encryptSecret(JSON.stringify(_config2.default));
  };

  const start = () => {
    _commander2.default.version(_package.version, '-v, --version');
    _commander2.default.command('stats <email> <year> <month>').description('Send monthly statistics to given email address.').action(generateStats);
    _commander2.default.command('flextime <email>').description('Calculate flex saldo for given user.').action(calcFlexTime);
    _commander2.default.command('encrypt').description('Encrypt and store app configuration.').action(encryptConfiguration);
    _commander2.default.parse(process.argv);
  };

  return {
    start
  };
};