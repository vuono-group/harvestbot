"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcStats = exports.notifyUsers = exports.calcFlextime = exports.initFlextime = void 0;

var _app = _interopRequireDefault(require("./app"));

var _log = _interopRequireDefault(require("./log"));

var _db = _interopRequireDefault(require("./cloud/db"));

var _queue = _interopRequireDefault(require("./cloud/queue"));

var _http = _interopRequireDefault(require("./http"));

var _settings = _interopRequireDefault(require("./settings"));

var _slack = _interopRequireDefault(require("./slack"));

var _verifier = _interopRequireDefault(require("./verifier"));

let logger = null;
let appConfig = null;

const getAppConfig = async () => {
  if (appConfig) {
    return appConfig;
  }

  appConfig = await (0, _settings.default)().getConfig();
  logger = (0, _log.default)(appConfig);
  return appConfig;
};

const initFlextime = async (req, res) => {
  const config = await getAppConfig();

  if ((0, _verifier.default)(config).verifySlackRequest(req)) {
    const cmd = req.body.text;

    if (cmd === 'help') {
      return res.json({
        text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._'
      });
    }

    logger.info(`Received valid Slack request with cmd ${cmd}`);
    const cmdParts = cmd.split(' ');

    if (cmdParts.length > 0 && cmdParts[0] === 'stats') {
      const currentDate = new Date();
      const year = cmdParts.length > 1 ? cmdParts[1] : currentDate.getFullYear();
      const month = cmdParts.length > 2 ? cmdParts[2] : currentDate.getMonth() + 1;
      await (0, _queue.default)(config).enqueueStatsRequest({
        userId: req.body.user_id,
        responseUrl: req.body.response_url,
        year,
        month
      });
      return res.json({
        text: 'Starting to generate stats. This may take a while...'
      });
    }

    await (0, _queue.default)(config).enqueueFlexTimeRequest({
      userId: req.body.user_id,
      responseUrl: req.body.response_url
    });
    return res.json({
      text: 'Starting to calculate flextime. This may take a while... Join channel #harvest for weekly notifications.'
    });
  }

  logger.warn('Received invalid Slack request');
  return res.status(401).send('Unauthorized');
};

exports.initFlextime = initFlextime;

const calcFlextime = async message => {
  const config = await getAppConfig();
  const request = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const slack = (0, _slack.default)(config, _http.default, request.responseUrl);
  const {
    userId
  } = request;

  if (userId) {
    logger.info(`Fetching data for user id ${userId}`);
    const email = request.email || (await slack.getUserEmailForId(userId));

    if (!email) {
      return slack.postMessage(userId, 'Cannot find email for Slack user id');
    }

    if (!request.email) {
      await slack.postMessage(userId, `Fetching time entries for email ${email}`);
    }

    await (0, _db.default)(config).storeUserData(userId, email);
    logger.info('User data stored');
    const data = await (0, _app.default)(config, _http.default).calcFlextime(email);
    logger.info('Flextime calculated');
    return slack.postMessage(userId, data.header, data.messages);
  }

  return logger.error('Cannot find Slack user id');
};

exports.calcFlextime = calcFlextime;

const notifyUsers = async (req, res) => {
  const config = await getAppConfig();

  if ((0, _verifier.default)(config).verifySlackRequest(req)) {
    const store = (0, _db.default)(config);
    const msgQueue = (0, _queue.default)(config);
    const users = await store.fetchUsers;
    logger.info(`Found ${users.length} users`);
    await Promise.all(users.map(async ({
      email,
      id
    }) => {
      logger.info(`Notify ${email}`);
      return msgQueue.enqueueFlexTimeRequest({
        userId: id,
        email
      });
    }));
    return res.json({
      text: 'ok'
    });
  }

  return res.status(401).send('Unauthorized');
};

exports.notifyUsers = notifyUsers;

const calcStats = async message => {
  const config = await getAppConfig();
  const request = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const slack = (0, _slack.default)(config, _http.default, request.responseUrl);
  const {
    userId,
    year,
    month
  } = request;

  if (userId) {
    logger.info(`Calculating stats requested by user ${userId}`);
    const email = await slack.getUserEmailForId(userId); // TODO: need slack admin role?

    if (!email) {
      return slack.postMessage(userId, 'Cannot find email for Slack user id');
    }

    const result = await (0, _app.default)(config, _http.default).generateReport(year, month, email);
    logger.info('Stats generated');
    return slack.postMessage(userId, result);
  }

  return logger.error('Cannot find Slack user id');
};

exports.calcStats = calcStats;