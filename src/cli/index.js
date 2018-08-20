import program from 'commander';

import application from '../app';
import logger from '../log';
import { version } from '../../package.json';

export default (config, http) => {
  const app = application(config, http);

  const printResponse =
    (header, msgs) => {
      logger.info(header);
      if (msgs) {
        msgs.forEach(msg => logger.info(msg));
      }
    };

  const generateStats = async (email, year, month) => {
    logger.info(`Generating stats for ${year}-${month}`);
    await app.generateReport(year, month, email);
    logger.info(`Sent report to ${email}`);
  };

  const calcFlexTime = async (email) => {
    logger.info(`Calculating flextime for ${email}`);
    const data = await app.calcFlextime(email);
    printResponse(data.header, data.messages);
  };

  const start = () => {
    program
      .version(version, '-v, --version');
    program
      .command('stats <email> <year> <month>')
      .description('Send monthly statistics to given email address.')
      .action(generateStats);
    program
      .command('flextime <email>')
      .description('Calculate flex saldo for given user.')
      .action(calcFlexTime);
    program.parse(process.argv);
  };

  return {
    start,
  };
};
