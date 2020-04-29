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
    encryptSecret,
    decryptSecret
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
    logger.info('Encrypting configuration...');
    encryptSecret(JSON.stringify(_config.default));
  };

  const decryptConfiguration = async () => {
    const conf = JSON.parse(await decryptSecret());
    /* eslint-disable no-console */

    console.log(`export ALLOWED_EMAIL_DOMAINS=${conf.emailDomains}`);
    console.log(`export HARVEST_ACCESS_TOKEN=${conf.harvestAccessToken}`);
    console.log(`export HARVEST_ACCOUNT_ID=${conf.harvestAccountId}`);
    console.log(`export SLACK_BOT_TOKEN=${conf.slackBotToken}`);
    console.log(`export SLACK_SIGNING_SECRET=${conf.slackSigningSecret}`);
    console.log(`export SLACK_NOTIFY_CHANNEL_ID=${conf.notifyChannelId}`);
    console.log(`export HOURS_STATS_COLUMN_HEADERS=${conf.hoursStatsColumnHeaders}`);
    console.log(`export SENDGRID_API_KEY=${conf.sendGridApiKey}`);
    console.log(`export TASK_ID_PUBLIC_HOLIDAY=${conf.taskIds.publicHoliday}`);
    console.log(`export TASK_ID_VACATION=${conf.taskIds.vacation}`);
    console.log(`export TASK_ID_UNPAID_LEAVE=${conf.taskIds.unpaidLeave}`);
    console.log(`export TASK_ID_SICK_LEAVE=${conf.taskIds.sickLeave}`);
    console.log(`export TASK_ID_FLEX_LEAVE=${conf.taskIds.flexLeave}`);
    /* eslint-enable no-console */
  };

  const start = () => {
    _commander.default.version(_package.version, '-v, --version');

    _commander.default.command('stats <email> <year> <month>').description('Send monthly statistics to given email address.').action(generateStats);

    _commander.default.command('flextime <email>').description('Calculate flex saldo for given user.').action(calcFlexTime);

    _commander.default.command('encrypt').description('Encrypt and store app configuration.').action(encryptConfiguration);

    _commander.default.command('decrypt').description('Decrypt and show app configuration.').action(decryptConfiguration);

    _commander.default.parse(process.argv);
  };

  return {
    start
  };
};

exports.default = _default;