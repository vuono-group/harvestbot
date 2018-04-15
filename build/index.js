'use strict';

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _harvest = require('./harvest');

var _harvest2 = _interopRequireDefault(_harvest);

var _analyzer = require('./analyzer');

var _analyzer2 = _interopRequireDefault(_analyzer);

var _calendar = require('./calendar');

var _calendar2 = _interopRequireDefault(_calendar);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _slack = require('./slack');

var _slack2 = _interopRequireDefault(_slack);

var _gcloud = require('./gcloud');

var _gcloud2 = _interopRequireDefault(_gcloud);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const analyzer = (0, _analyzer2.default)();
const calendar = (0, _calendar2.default)();
const slack = (0, _slack2.default)(_http2.default);
const gCloud = (0, _gcloud2.default)();
const tracker = (0, _harvest2.default)(_http2.default);
const ignoreTaskIds = process.env.IGNORE_FROM_FLEX_TASK_IDS ? process.env.IGNORE_FROM_FLEX_TASK_IDS.split(',').map(id => parseInt(id, 10)) : [];

const doCalcFlexTime = (email, res) => {
  _log2.default.info(`Ignore following task ids ${ignoreTaskIds}`);
  tracker.getTimeEntries(email).then(entries => {
    const latestFullDay = calendar.getLatestFullWorkingDay();
    _log2.default.info(`Latest full working day: ${latestFullDay}`);

    const range = analyzer.getPeriodRange(entries, latestFullDay);
    _log2.default.info(`Received range starting from ${range.start} to ${range.end}`);

    const totalHours = calendar.getTotalWorkHoursSinceDate(range.start, range.end);
    _log2.default.info(`Total working hours from range start ${totalHours}`);

    const result = analyzer.calculateWorkedHours(range.entries, ignoreTaskIds);
    if (result.warnings.length > 0) {
      _log2.default.info(result.warnings);
    } else {
      _log2.default.info('No warnings!');
    }

    _log2.default.info(`Your flex hours count: ${Math.floor(result.total - totalHours)}`);
    res.send(200);
  });
};

const validateEnv = req => {
  if (!process.env.HARVEST_ACCESS_TOKEN || !process.env.HARVEST_APP_ID || !process.env.SLACK_BOT_TOKEN) {
    _log2.default.error('Needed access tokens missing, exiting.');
  }
  if (!req.body.user_id) {
    _log2.default.error('User id missing, exiting.');
  }
  return req.body.user_id;
};

// TODO: move to gCloud specific project
exports.calcFlextime = (req, res) => {
  _log2.default.info('calcFlextime triggered');
  gCloud.applyConfig();
  _log2.default.info('gCloud config applied');
  const userId = validateEnv(req);
  _log2.default.info(`Fetching data for user id ${userId}`);
  slack.getUserEmailForId(userId).then(email => doCalcFlexTime(email, res)).catch(err => _log2.default.error(err));
};