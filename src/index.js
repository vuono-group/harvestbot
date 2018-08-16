import application from './app';
import logger from './log';
import db from './db';
import queue from './queue';
import http from './http';
import slackApi from './slack';
import verifier from './verifier';

const validateEnv = () => {
  const getEnvParam = param => (process.env[param] ? process.env[param] : logger.error(`Environment variable ${param} missing.`));
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
    currentTime: new Date().getTime() / 1000,
  };
  return config;
};

export const initFlextime = async (req, res) => {
  const config = validateEnv();
  if (verifier(config).verifySlackRequest(req)) {
    if (req.body.text === 'help') {
      return res.json({ text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._' });
    }
    const text = req.body.response_url ? 'Starting to calculate flextime. This may take a while... Join channel #harvest for weekly notifications.' : 'ok';
    await queue(config).enqueue({ userId: req.body.user_id, responseUrl: req.body.response_url });
    return res.json({ text });
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
      return msgQueue.enqueue({ userId: id, email });
    }));
    return res.json({ text: 'ok' });
  }
  return res.status(401).send('Unauthorized');
};

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
