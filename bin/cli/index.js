"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _commander = _interopRequireDefault(require("commander"));

var _config = _interopRequireDefault(require("config"));

var _app = _interopRequireDefault(require("../app"));

var _log = _interopRequireDefault(require("../log"));

var _keyRing = _interopRequireDefault(require("../cloud/key-ring"));

var _package = require("../../package.json");

/* eslint-disable import/no-extraneous-dependencies */

/* eslint-enable import/no-extraneous-dependencies */
var _default = (config, http) => {
  const logger = (0, _log.default)(config);
  const app = (0, _app.default)(config, http);
  const {
    encryptSecret
  } = (0, _keyRing.default)(config);

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
    encryptSecret(JSON.stringify(_config.default));
  };

  const start = () => {
    _commander.default.version(_package.version, '-v, --version');

    _commander.default.command('stats <email> <year> <month>').description('Send monthly statistics to given email address.').action(generateStats);

    _commander.default.command('flextime <email>').description('Calculate flex saldo for given user.').action(calcFlexTime);

    _commander.default.command('encrypt').description('Encrypt and store app configuration.').action(encryptConfiguration);

    _commander.default.parse(process.argv);
  };

  return {
    start
  };
};

exports.default = _default;