'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.notifyUsers = exports.calcFlextime = exports.initFlextime = undefined;

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _queue = require('./queue');

var _queue2 = _interopRequireDefault(_queue);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _slack = require('./slack');

var _slack2 = _interopRequireDefault(_slack);

var _verifier = require('./verifier');

var _verifier2 = _interopRequireDefault(_verifier);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const validateEnv = () => {
  const getEnvParam = param => process.env[param] ? process.env[param] : _log2.default.error(`Environment variable ${param} missing.`);
  const ignoreTaskIds = getEnvParam('IGNORE_FROM_FLEX_TASK_IDS');
  const emailDomains = getEnvParam('ALLOWED_EMAIL_DOMAINS');
  const config = {
    ignoreTaskIds: ignoreTaskIds ? ignoreTaskIds.split(',').map(id => parseInt(id, 10)) : [],
    emailDomains: emailDomains ? emailDomains.split(',') : [],
    projectId: getEnvParam('GCLOUD_PROJECT'),
    harvestAccessToken: getEnvParam('HARVEST_ACCESS_TOKEN'),
    harvestAccountId: getEnvParam('HARVEST_ACCOUNT_ID'),
    slackBotToken: getEnvParam('SLACK_BOT_TOKEN'),
    slackSigningSecret: getEnvParam('SLACK_SIGNING_SECRET'),
    notifyChannelId: getEnvParam('SLACK_NOTIFY_CHANNEL_ID'),
    currentTime: new Date().getTime() / 1000
  };
  return config;
};

const initFlextime = exports.initFlextime = async (req, res) => {
  const config = validateEnv();
  if ((0, _verifier2.default)(config).verifySlackRequest(req)) {
    if (req.body.text === 'help') {
      return res.json({ text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._' });
    }
    const text = req.body.response_url ? 'Starting to calculate flextime. This may take a while... Join channel #harvest for weekly notifications.' : 'ok';
    await (0, _queue2.default)(config).enqueue({ userId: req.body.user_id, responseUrl: req.body.response_url });
    return res.json({ text });
  }
  return res.status(401).send('Unauthorized');
};

const calcFlextime = exports.calcFlextime = async message => {
  const config = validateEnv();
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
  const config = validateEnv();
  if ((0, _verifier2.default)(config).verifySlackRequest(req)) {
    const store = (0, _db2.default)(config);
    const msgQueue = (0, _queue2.default)(config);

    const users = await store.fetchUsers;
    _log2.default.info(`Found ${users.length} users`);

    await Promise.all(users.map(async ({ email, id }) => {
      _log2.default.info(`Notify ${email}`);
      return msgQueue.enqueue({ userId: id, email });
    }));
    return res.json({ text: 'ok' });
  }
  return res.status(401).send('Unauthorized');
};

if (process.argv.length === 3) {
  const printResponse = (header, msgs) => {
    _log2.default.info(header);
    if (msgs) {
      msgs.forEach(msg => _log2.default.info(msg));
    }
  };

  (async () => {
    const email = process.argv[2];
    _log2.default.info(`Email ${email}`);
    const app = (0, _app2.default)(validateEnv(), _http2.default);
    const data = await app.calcFlextime(email);
    printResponse(data.header, data.messages);
  })();
}