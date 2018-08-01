'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcFlextime = undefined;

var _rcloadenv = require('@google-cloud/rcloadenv');

var _rcloadenv2 = _interopRequireDefault(_rcloadenv);

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

var _slack = require('./slack');

var _slack2 = _interopRequireDefault(_slack);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const validateEnv = () => {
  const getEnvParam = param => process.env[param] ? process.env[param] : _log2.default.error(`Environment variable ${param} missing.`);
  const config = {};
  const ignoreTaskIds = getEnvParam('IGNORE_FROM_FLEX_TASK_IDS');
  const emailDomains = getEnvParam('ALLOWED_EMAIL_DOMAINS');
  config.ignoreTaskIds = ignoreTaskIds ? ignoreTaskIds.split(',').map(id => parseInt(id, 10)) : [];
  config.emailDomains = emailDomains ? emailDomains.split(',') : [];
  config.projectId = getEnvParam('GCLOUD_PROJECT');
  config.harvestAccessToken = getEnvParam('HARVEST_ACCESS_TOKEN');
  config.harvestAccountId = getEnvParam('HARVEST_ACCOUNT_ID');
  config.slackBotToken = getEnvParam('SLACK_BOT_TOKEN');
  return config;
};

/* eslint-disable import/prefer-default-export */
const calcFlextime = exports.calcFlextime = (req, res) => {
  if (req.body.text === 'help') {
    return res.json({ text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._' });
  }
  res.json({ text: 'Starting to calculate flextime. This may take a while...' });

  return _rcloadenv2.default.getAndApply('harvestbot-config').then(() => {
    _log2.default.info('gCloud config applied');
    const config = validateEnv();
    const slack = (0, _slack2.default)(_http2.default, req.body.response_url);
    const userId = req.body.user_id;
    if (userId) {
      _log2.default.info(`Fetching data for user id ${userId}`);
      slack.getUserEmailForId(userId).then(email => {
        (0, _db2.default)(config).storeUserData(userId, email);
        (0, _app2.default)(config, _http2.default, slack.postResponse).calcFlexTime(email);
      }).catch(err => _log2.default.error(err));
    } else {
      _log2.default.error('User id missing.');
    }
  });
};
/* eslint-enable import/prefer-default-export */

if (process.argv.length === 3) {
  const printResponse = msgs => Array.isArray(msgs) ? msgs.forEach(msg => _log2.default.info(msg)) : _log2.default.info(msgs);

  const email = process.argv[2];
  _log2.default.info(`Email ${email}`);
  (0, _app2.default)(validateEnv(), _http2.default, printResponse).calcFlexTime(email);
}