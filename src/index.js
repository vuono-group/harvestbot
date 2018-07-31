import rcloadenv from '@google-cloud/rcloadenv';

import logger from './log';
import harvest from './harvest';
import analyze from './analyzer';
import cal from './calendar';
import db from './db';
import http from './http';
import slackApi from './slack';

const app = {};

const formatDate = date => date.toLocaleDateString(
  'en-US',
  {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  },
);

const printResponse =
  msgs => (Array.isArray(msgs) ? msgs.forEach(msg => logger.info(msg)) : logger.info(msgs));

const initialize = (responseUrl) => {
  app.analyzer = analyze();
  app.calendar = cal();
  app.db = db();
  app.slack = slackApi(http, responseUrl);
  app.response = responseUrl ? app.slack.postResponse : printResponse;
  app.tracker = harvest(http);
  app.ignoreTaskIds = process.env.IGNORE_FROM_FLEX_TASK_IDS
    ? process.env.IGNORE_FROM_FLEX_TASK_IDS.split(',').map(id => parseInt(id, 10))
    : [];
  app.emailDomains = process.env.ALLOWED_EMAIL_DOMAINS ? process.env.ALLOWED_EMAIL_DOMAINS.split(',') : [];
  app.validateEmail = (email, emailParts = email.split('@')) => (app.emailDomains.includes(emailParts[1]) ? emailParts[0] : null);
};

const doCalcFlexTime = (email) => {
  const userName = app.validateEmail(email);
  if (!userName) {
    return app.response(`Invalid email domain for ${email}`);
  }

  logger.info(`Ignore following task ids ${app.ignoreTaskIds}`);
  logger.info(`Fetch data for ${email}`);
  app.response(`Fetching time entries for email ${email}`);
  return app.tracker.getTimeEntries(userName, app.validateEmail)
    .then((entries) => {
      if (!entries) {
        return app.response(`Unable to find time entries for ${email}`);
      }
      const messages = [];
      const latestFullDay = app.calendar.getLatestFullWorkingDay();
      logger.info(messages[0]);

      const range = app.analyzer.getPeriodRange(entries, latestFullDay);
      logger.info(`Received range starting from ${formatDate(range.start)} to ${formatDate(range.end)}`);
      messages.push(`Latest calendar working day: ${formatDate(range.end)}`);
      messages.push(`Last time you have recorded hours: ${formatDate(range.latestRecord)}`);

      const totalHours = app.calendar.getTotalWorkHoursSinceDate(range.start, range.end);
      logger.info(`Total working hours from range start ${totalHours}`);

      const result = app.analyzer.calculateWorkedHours(range.entries, app.ignoreTaskIds);
      if (result.warnings.length > 0) {
        logger.info(result.warnings);
      } else {
        logger.info('No warnings!');
      }
      result.warnings.forEach(msg => messages.push(msg));

      messages.push(`Current month ${result.billablePercentageCurrentMonth}% billable`);
      messages.push(`*Your flex hours count: ${Math.floor(result.total - totalHours)}*`);
      logger.info(messages[messages.length - 1]);

      logger.info('All done!');
      return app.response(messages);
    });
};

const validateEnv = (req) => {
  if (!process.env.HARVEST_ACCESS_TOKEN ||
      !process.env.HARVEST_ACCOUNT_ID ||
      !process.env.SLACK_BOT_TOKEN) {
    logger.error('Needed access tokens missing.');
  }
  if (!req.body.user_id) {
    logger.error('User id missing.');
  }
  return req.body.user_id;
};

/* eslint-disable import/prefer-default-export */
export const calcFlextime = (req, res) => {
  if (req.body.text === 'help') {
    return res.json({ text: '_Bot for calculating your harvest balance. Use /flextime with no parameters to start calculation._' });
  }
  res.json({ text: 'Starting to calculate flextime. This may take a while...' });
  return rcloadenv.getAndApply('harvestbot-config').then(() => {
    logger.info('gCloud config applied');
    const userId = validateEnv(req);
    if (userId) {
      initialize(req.body.response_url);
      logger.info(`Fetching data for user id ${userId}`);
      app.slack.getUserEmailForId(userId)
        .then((email) => {
          app.db.storeUserData(userId, email);
          doCalcFlexTime(email, req, res);
        })
        .catch(err => logger.error(err));
    }
  });
};
/* eslint-enable import/prefer-default-export */

if (process.argv.length === 3) {
  const email = process.argv[2];
  logger.info(`Email ${email}`);
  initialize();
  doCalcFlexTime(email);
}
