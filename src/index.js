import rcloadenv from '@google-cloud/rcloadenv';

import application from './app';
import logger from './log';
import db from './db';
import http from './http';
import slackApi from './slack';

const validateEnv = () => {
  const getEnvParam = param => (process.env[param] ? process.env[param] : logger.error(`Environment variable ${param} missing.`));
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
export const calcFlextime = (req, res) => {
  if (req.body.text === 'help') {
    return res.json({ text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._' });
  }
  res.json({ text: 'Starting to calculate flextime. This may take a while...' });

  return rcloadenv.getAndApply('harvestbot-config').then(() => {
    logger.info('gCloud config applied');
    const config = validateEnv();
    const slack = slackApi(config, http, req.body.response_url);
    const userId = req.body.user_id;
    if (userId) {
      logger.info(`Fetching data for user id ${userId}`);
      slack.getUserEmailForId(userId)
        .then((email) => {
          db(config).storeUserData(userId, email);
          application(config, http, slack.postResponse).calcFlexTime(email);
        })
        .catch(err => logger.error(err));
    } else {
      logger.error('User id missing.');
    }
  });
};
/* eslint-enable import/prefer-default-export */

if (process.argv.length === 3) {
  const printResponse =
    msgs => (Array.isArray(msgs) ? msgs.forEach(msg => logger.info(msg)) : logger.info(msgs));

  const email = process.argv[2];
  logger.info(`Email ${email}`);
  application(validateEnv(), http, printResponse).calcFlexTime(email);
}
