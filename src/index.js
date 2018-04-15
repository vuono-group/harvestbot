import logger from './log';
import harvest from './harvest';
import analyze from './analyzer';
import cal from './calendar';
import http from './http';
import slackApi from './slack';
import googleApi from './gcloud'

const analyzer = analyze();
const calendar = cal();
const slack = slackApi(http);
const gCloud = googleApi();
const tracker = harvest(http);
const ignoreTaskIds = process.env.IGNORE_FROM_FLEX_TASK_IDS
  ? process.env.IGNORE_FROM_FLEX_TASK_IDS.split(',').map(id => parseInt(id, 10))
  : [];

const doCalcFlexTime = (email, res) => {
  logger.info(`Ignore following task ids ${ignoreTaskIds}`);
  tracker.getTimeEntries(email)
    .then((entries) => {
      const latestFullDay = calendar.getLatestFullWorkingDay();
      logger.info(`Latest full working day: ${latestFullDay}`);

      const range = analyzer.getPeriodRange(entries, latestFullDay);
      logger.info(`Received range starting from ${range.start} to ${range.end}`);

      const totalHours = calendar.getTotalWorkHoursSinceDate(range.start, range.end);
      logger.info(`Total working hours from range start ${totalHours}`);

      const result = analyzer.calculateWorkedHours(range.entries, ignoreTaskIds);
      if (result.warnings.length > 0) {
        logger.info(result.warnings);
      } else {
        logger.info('No warnings!');
      }

      logger.info(`Your flex hours count: ${Math.floor(result.total - totalHours)}`);
      res.send(200);
    });
};

const validateEnv = (req) => {
  if (!process.env.HARVEST_ACCESS_TOKEN ||
      !process.env.HARVEST_APP_ID ||
      !process.env.SLACK_BOT_TOKEN) {
    logger.error('Needed access tokens missing, exiting.');
  }
  if (!req.body.user_id) {
    logger.error('User id missing, exiting.');
  }
  return req.body.user_id;
};

// TODO: move to gCloud specific project
exports.calcFlextime = (req, res) => {
  logger.info('calcFlextime triggered');
  /*gCloud.applyConfig();
  logger.info('gCloud config applied');
  const userId = validateEnv(req);
  logger.info(`Fetching data for user id ${userId}`);
  slack.getUserEmailForId(userId)
    .then(email => doCalcFlexTime(email, res))
    .catch(err => logger.error(err));*/
};
