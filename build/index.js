'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcFlextime = undefined;

var _rcloadenv = require('@google-cloud/rcloadenv');

var _rcloadenv2 = _interopRequireDefault(_rcloadenv);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _harvest = require('./harvest');

var _harvest2 = _interopRequireDefault(_harvest);

var _analyzer = require('./analyzer');

var _analyzer2 = _interopRequireDefault(_analyzer);

var _calendar = require('./calendar');

var _calendar2 = _interopRequireDefault(_calendar);

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _slack = require('./slack');

var _slack2 = _interopRequireDefault(_slack);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = {};

const formatDate = date => date.toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

const printResponse = msgs => Array.isArray(msgs) ? msgs.forEach(msg => _log2.default.info(msg)) : _log2.default.info(msgs);

const initialize = responseUrl => {
  app.analyzer = (0, _analyzer2.default)();
  app.calendar = (0, _calendar2.default)();
  app.db = (0, _db2.default)();
  app.slack = (0, _slack2.default)(_http2.default, responseUrl);
  app.response = responseUrl ? app.slack.postResponse : printResponse;
  app.tracker = (0, _harvest2.default)(_http2.default);
  app.ignoreTaskIds = process.env.IGNORE_FROM_FLEX_TASK_IDS ? process.env.IGNORE_FROM_FLEX_TASK_IDS.split(',').map(id => parseInt(id, 10)) : [];
  app.emailDomains = process.env.ALLOWED_EMAIL_DOMAINS ? process.env.ALLOWED_EMAIL_DOMAINS.split(',') : [];
  app.validateEmail = (email, emailParts = email.split('@')) => app.emailDomains.includes(emailParts[1]) ? emailParts[0] : null;
};

const doCalcFlexTime = email => {
  const userName = app.validateEmail(email);
  if (!userName) {
    return app.response(`Invalid email domain for ${email}`);
  }

  _log2.default.info(`Ignore following task ids ${app.ignoreTaskIds}`);
  _log2.default.info(`Fetch data for ${email}`);
  app.response(`Fetching time entries for email ${email}`);
  return app.tracker.getTimeEntries(userName, app.validateEmail).then(entries => {
    if (!entries) {
      return app.response(`Unable to find time entries for ${email}`);
    }
    const messages = [];
    const latestFullDay = app.calendar.getLatestFullWorkingDay();
    _log2.default.info(messages[0]);

    const range = app.analyzer.getPeriodRange(entries, latestFullDay);
    _log2.default.info(`Received range starting from ${formatDate(range.start)} to ${formatDate(range.end)}`);
    messages.push(`Latest calendar working day: ${formatDate(range.end)}`);
    messages.push(`Last time you have recorded hours: ${formatDate(range.latestRecord)}`);

    const totalHours = app.calendar.getTotalWorkHoursSinceDate(range.start, range.end);
    _log2.default.info(`Total working hours from range start ${totalHours}`);

    const result = app.analyzer.calculateWorkedHours(range.entries, app.ignoreTaskIds);
    if (result.warnings.length > 0) {
      _log2.default.info(result.warnings);
    } else {
      _log2.default.info('No warnings!');
    }
    result.warnings.forEach(msg => messages.push(msg));

    messages.push(`Current month ${result.billablePercentageCurrentMonth}% billable`);
    messages.push(`*Your flex hours count: ${Math.floor(result.total - totalHours)}*`);
    _log2.default.info(messages[messages.length - 1]);

    _log2.default.info('All done!');
    return app.response(messages);
  });
};

const validateEnv = req => {
  if (!process.env.HARVEST_ACCESS_TOKEN || !process.env.HARVEST_ACCOUNT_ID || !process.env.SLACK_BOT_TOKEN) {
    _log2.default.error('Needed access tokens missing.');
  }
  if (!req.body.user_id) {
    _log2.default.error('User id missing.');
  }
  return req.body.user_id;
};

/* eslint-disable import/prefer-default-export */
const calcFlextime = exports.calcFlextime = (req, res) => {
  if (req.body.text === 'help') {
    return res.json({ text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._' });
  }
  res.json({ text: 'Starting to calculate flextime. This may take a while...' });
  return _rcloadenv2.default.getAndApply('harvestbot-config').then(() => {
    _log2.default.info('gCloud config applied');
    const userId = validateEnv(req);
    if (userId) {
      initialize(req.body.response_url);
      _log2.default.info(`Fetching data for user id ${userId}`);
      app.slack.getUserEmailForId(userId).then(email => {
        app.db.storeUserData(userId, email);
        doCalcFlexTime(email, req, res);
      }).catch(err => _log2.default.error(err));
    }
  });
};
/* eslint-enable import/prefer-default-export */

if (process.argv.length === 3) {
  const email = process.argv[2];
  _log2.default.info(`Email ${email}`);
  initialize();
  doCalcFlexTime(email);
}