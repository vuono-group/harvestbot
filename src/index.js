import application from './app';
import logger from './log';
import db from './cloud/db';
import queue from './cloud/queue';
import http from './http';
import slackApi from './slack';
import verifier from './verifier';
import { DEFAULT_COLUMN_HEADERS } from './defaults';

const validateEnv = () => {
  const getEnvParam = param => (process.env[param] ? process.env[param] : logger.error(`Environment variable ${param} missing.`));
  const ignoreTaskIds = getEnvParam('IGNORE_FROM_FLEX_TASK_IDS');
  const emailDomains = getEnvParam('ALLOWED_EMAIL_DOMAINS');
  const columnHeaders = getEnvParam('STATS_COLUMN_HEADERS');
  const config = {
    ignoreTaskIds: ignoreTaskIds ? ignoreTaskIds.split(',').map(id => parseInt(id, 10)) : [],
    emailDomains: emailDomains ? emailDomains.split(',') : [],
    projectId: getEnvParam('GCLOUD_PROJECT'),
    harvestAccessToken: getEnvParam('HARVEST_ACCESS_TOKEN'),
    harvestAccountId: getEnvParam('HARVEST_ACCOUNT_ID'),
    slackBotToken: getEnvParam('SLACK_BOT_TOKEN'),
    slackSigningSecret: getEnvParam('SLACK_SIGNING_SECRET'),
    notifyChannelId: getEnvParam('SLACK_NOTIFY_CHANNEL_ID'),
    currentTime: new Date().getTime() / 1000,
    statsColumnHeaders: columnHeaders ? columnHeaders.split(',') : DEFAULT_COLUMN_HEADERS,
    sendGridApiKey: getEnvParam('SENDGRID_API_KEY'),
    taskIds: {
      publicHoliday: parseInt(getEnvParam('TASK_ID_PUBLIC_HOLIDAY'), 10),
      vacation: parseInt(getEnvParam('TASK_ID_VACATION'), 10),
      unpaidLeave: parseInt(getEnvParam('TASK_ID_UNPAID_LEAVE'), 10),
      sickLeave: parseInt(getEnvParam('TASK_ID_SICK_LEAVE'), 10),
      flexLeave: parseInt(getEnvParam('TASK_ID_FLEX_LEAVE'), 10),
    },
  };
  return config;
};

export const initFlextime = async (req, res) => {
  const config = validateEnv();
  if (verifier(config).verifySlackRequest(req)) {
    if (req.body.text === 'help') {
      return res.json({ text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._' });
    }
    const cmdParts = req.body.text.split(' ');
    if (cmdParts.length > 0 && cmdParts[0] === 'stats') {
      const currentDate = new Date();
      const year = cmdParts.length > 1 ? parseInt(cmdParts[1], 10) : currentDate.getFullYear();
      const month = cmdParts.length > 2 ? parseInt(cmdParts[2], 10) : currentDate.getMonth() + 1;
      await queue(config)
        .enqueueStatsRequest({
          userId: req.body.user_id, responseUrl: req.body.response_url, year, month,
        });
      return res.json({ text: 'Starting to generate stats. This may take a while...' });
    }
    await queue(config)
      .enqueueFlexTimeRequest({ userId: req.body.user_id, responseUrl: req.body.response_url });
    return res.json({ text: 'Starting to calculate flextime. This may take a while... Join channel #harvest for weekly notifications.' });
  }
  return res.status(401).send('Unauthorized');
};

export const calcFlextime = async (message) => {
  const config = validateEnv();
  const request = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const slack = slackApi(config, http, request.responseUrl);
  const { userId } = request;

  if (userId) {
    logger.info(`Fetching data for user id ${userId}`);
    const email = request.email || await slack.getUserEmailForId(userId);
    if (!email) {
      return slack.postMessage(userId, 'Cannot find email for Slack user id');
    }
    if (!request.email) {
      await slack.postMessage(userId, `Fetching time entries for email ${email}`);
    }
    await db(config).storeUserData(userId, email);
    logger.info('User data stored');

    const data = await application(config, http).calcFlextime(email);
    logger.info('Flextime calculated');

    return slack.postMessage(userId, data.header, data.messages);
  }
  return logger.error('Cannot find Slack user id');
};

export const notifyUsers = async (req, res) => {
  const config = validateEnv();
  if (verifier(config).verifySlackRequest(req)) {
    const store = db(config);
    const msgQueue = queue(config);

    const users = await store.fetchUsers;
    logger.info(`Found ${users.length} users`);

    await Promise.all(users.map(async ({ email, id }) => {
      logger.info(`Notify ${email}`);
      return msgQueue.enqueueFlexTimeRequest({ userId: id, email });
    }));
    return res.json({ text: 'ok' });
  }
  return res.status(401).send('Unauthorized');
};

export const calcStats = async (message) => {
  const config = validateEnv();
  const request = JSON.parse(Buffer.from(message.data, 'base64').toString());
  const slack = slackApi(config, http, request.responseUrl);
  const { userId, year, month } = request;

  if (userId) {
    logger.info(`Calculating stats requested by user ${userId}`);
    const email = await slack.getUserEmailForId(userId); // TODO: need slack admin role?
    if (!email) {
      return slack.postMessage(userId, 'Cannot find email for Slack user id');
    }

    const result = await application(config, http).generateReport(year, month, email);
    logger.info('Stats generated');

    return slack.postMessage(userId, result);
  }
  return logger.error('Cannot find Slack user id');
};

// Local testing
if (process.argv.length === 3) {
  const printResponse =
    (header, msgs) => {
      logger.info(header);
      if (msgs) {
        msgs.forEach(msg => logger.info(msg));
      }
    };

  (async () => {
    const email = process.argv[2];
    logger.info(`Email ${email}`);
    const app = application(validateEnv(), http);
    const data = await app.calcFlextime(email);
    printResponse(data.header, data.messages);
  })();
}
