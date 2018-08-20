'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _app = require('../app');

var _app2 = _interopRequireDefault(_app);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _package = require('../../package.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (config, http) => {
  const app = (0, _app2.default)(config, http);

  const printResponse = (header, msgs) => {
    _log2.default.info(header);
    if (msgs) {
      msgs.forEach(msg => _log2.default.info(msg));
    }
  };

  const generateStats = async (email, year, month) => {
    _log2.default.info(`Generating stats for ${year}-${month}`);
    await app.generateReport(year, month, email);
    _log2.default.info(`Sent report to ${email}`);
  };

  const calcFlexTime = async email => {
    _log2.default.info(`Calculating flextime for ${email}`);
    const data = await app.calcFlextime(email);
    printResponse(data.header, data.messages);
  };

  const start = () => {
    _commander2.default.version(_package.version, '-v, --version');
    _commander2.default.command('stats <email> <year> <month>').description('Send monthly statistics to given email address.').action(generateStats);
    _commander2.default.command('flextime <email>').description('Calculate flex saldo for given user.').action(calcFlexTime);
    _commander2.default.parse(process.argv);
  };

  return {
    start
  };
};