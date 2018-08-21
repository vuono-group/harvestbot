'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcStats = exports.notifyUsers = exports.calcFlextime = exports.initFlextime = undefined;

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _cli = require('./cli');

var _cli2 = _interopRequireDefault(_cli);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _db = require('./cloud/db');

var _db2 = _interopRequireDefault(_db);

var _queue = require('./cloud/queue');

var _queue2 = _interopRequireDefault(_queue);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _slack = require('./slack');

var _slack2 = _interopRequireDefault(_slack);

var _verifier = require('./verifier');

var _verifier2 = _interopRequireDefault(_verifier);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let appConfig = null;

const getAppConfig = async () => {
  if (appConfig) {
    return appConfig;
  }
  appConfig = await (0, _settings2.default)().getConfig();
  return appConfig;
};

const initFlextime = exports.initFlextime = async (req, res) => {
  const config = await getAppConfig();
  if ((0, _verifier2.default)(config).verifySlackRequest(req)) {
    if (req.body.text === 'help') {
      return res.json({ text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._' });
    }
    const cmdParts = req.body.text.split(' ');
    if (cmdParts.length > 0 && cmdParts[0] === 'stats') {
      const currentDate = new Date();
      const year = cmdParts.length > 1 ? cmdParts[1] : currentDate.getFullYear();
      const month = cmdParts.length > 2 ? cmdParts[2] : currentDate.getMonth() + 1;
      await (0, _queue2.default)(config).enqueueStatsRequest({
        userId: req.body.user_id, responseUrl: req.body.response_url, year, month
      });
      return res.json({ text: 'Starting to generate stats. This may take a while...' });
    }
    await (0, _queue2.default)(config).enqueueFlexTimeRequest({ userId: req.body.user_id, responseUrl: req.body.response_url });
    return res.json({ text: 'Starting to calculate flextime. This may take a while... Join channel #harvest for weekly notifications.' });
  }
  return res.status(401).send('Unauthorized');
};

const calcFlextime = exports.calcFlextime = async message => {
  const config = await getAppConfig();
  const request = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const slack = (0, _slack2.default)(config, _http2.default, request.responseUrl);
  const { userId } = request;

  if (userId) {
    _log2.default.info(`Fetching data for user id ${userId}`);
    const email = request.email || (await slack.getUserEmailForId(userId));
    if (!email) {
      return slack.postMessage(userId, 'Cannot find email for Slack user id');
    }
    if (!request.email) {
      await slack.postMessage(userId, `Fetching time entries for email ${email}`);
    }
    await (0, _db2.default)(config).storeUserData(userId, email);
    _log2.default.info('User data stored');

    const data = await (0, _app2.default)(config, _http2.default).calcFlextime(email);
    _log2.default.info('Flextime calculated');

    return slack.postMessage(userId, data.header, data.messages);
  }
  return _log2.default.error('Cannot find Slack user id');
};

const notifyUsers = exports.notifyUsers = async (req, res) => {
  const config = await getAppConfig();
  if ((0, _verifier2.default)(config).verifySlackRequest(req)) {
    const store = (0, _db2.default)(config);
    const msgQueue = (0, _queue2.default)(config);

    const users = await store.fetchUsers;
    _log2.default.info(`Found ${users.length} users`);

    await Promise.all(users.map(async ({ email, id }) => {
      _log2.default.info(`Notify ${email}`);
      return msgQueue.enqueueFlexTimeRequest({ userId: id, email });
    }));
    return res.json({ text: 'ok' });
  }
  return res.status(401).send('Unauthorized');
};

const calcStats = exports.calcStats = async message => {
  const config = await getAppConfig();
  const request = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const slack = (0, _slack2.default)(config, _http2.default, request.responseUrl);
  const { userId, year, month } = request;

  if (userId) {
    _log2.default.info(`Calculating stats requested by user ${userId}`);
    const email = await slack.getUserEmailForId(userId); // TODO: need slack admin role?
    if (!email) {
      return slack.postMessage(userId, 'Cannot find email for Slack user id');
    }

    const result = await (0, _app2.default)(config, _http2.default).generateReport(year, month, email);
    _log2.default.info('Stats generated');

    return slack.postMessage(userId, result);
  }
  return _log2.default.error('Cannot find Slack user id');
};

if (!process.env.FUNCTION_NAME) {
  (async () => {
    const config = await getAppConfig();
    (0, _cli2.default)(config, _http2.default).start();
  })();
}