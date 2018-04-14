import log from './log';
import harvest from './harvest';

const tracker = harvest();

(async () => {
  if (!process.env.HARVEST_ACCESS_TOKEN || process.env.HARVEST_APP_ID) {
    logger.error('Harvest access token or app id missing, exiting.');
  }

  const res = await tracker.getUsers();
  log.info(res);
})();
