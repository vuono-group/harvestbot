import { tmpdir } from 'os';

import logger from '../log';

import analyze from './analyzer';
import excel from './excel';
import cal from './calendar';
import harvest from './harvest';

export default (config, http) => {
  const formatDate = date => date.toLocaleDateString(
    'en-US',
    {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    },
  );
  const validateEmail = (email, emailParts = email.split('@')) =>
    (config.emailDomains.includes(emailParts[1]) ? emailParts[0] : null);

  const analyzer = analyze(config);
  const calendar = cal();
  const tracker = harvest(config, http);
  const round = val => Math.floor(val * 2) / 2;

  const calcFlextime = async (email) => {
    const userName = validateEmail(email);
    if (!userName) {
      return { header: `Invalid email domain for ${email}` };
    }

    logger.info(`Ignore following task ids ${config.ignoreTaskIds}`);
    logger.info(`Fetch data for ${email}`);

    const entries = await tracker.getTimeEntriesForEmail(userName, validateEmail);
    if (!entries) {
      return { header: `Unable to find time entries for ${email}` };
    }
    const latestFullDay = calendar.getLatestFullWorkingDay();

    const range = analyzer.getPeriodRange(entries, latestFullDay);
    logger.info(`Received range starting from ${formatDate(range.start)} to ${formatDate(range.end)}`);

    const totalHours = calendar.getTotalWorkHoursSinceDate(range.start, range.end);
    logger.info(`Total working hours from range start ${totalHours}`);

    const result = analyzer.calculateWorkedHours(range.entries);
    if (result.warnings.length > 0) {
      logger.info(result.warnings);
    } else {
      logger.info('No warnings!');
    }

    const header = `*Your flex hours count: ${round(result.total - totalHours)}*`;
    const messages = [
      `Latest calendar working day: ${formatDate(range.end)}`,
      `Last time you have recorded hours: ${formatDate(new Date(range.entries[range.entries.length - 1].date))}`,
      ...result.warnings,
      `Current month ${result.billablePercentageCurrentMonth}% billable`,
    ];

    logger.info(header);
    logger.info('All done!');

    return { header, messages };
  };

  const generateReport = async (year = 2018, month = 7) => {
    const orderValue = (a, b) => (a < b ? -1 : 1);
    const compare = (a, b) => (a === b ? 0 : orderValue(a, b));
    const users = await tracker.getUsers();
    const sortedUsers = users.sort((a, b) =>
      compare(a.first_name, b.first_name) || compare(a.last_name, b.last_name));

    // Find all users who have tracked hours this year to keep the rows consistent
    const timeEntries = await Promise.all(sortedUsers.map(({ id }) =>
      tracker.getTimeEntriesForUserId(id, year)));
    const validEntries = timeEntries
      .map((entries, index) => ({ user: sortedUsers[index], entries }))
      .filter(({ entries }) => entries.length > 0)
      .map(({ user, entries }) => ({
        user,
        entries: entries.filter(({ date }) => {
          const entryDate = new Date(date);
          return entryDate.getFullYear() === year && (entryDate.getMonth() + 1) === month;
        }),
      }));
    const workDaysInMonth = calendar.getWorkingDaysForMonth(year, month);
    const rows = [
      { name: 'CALENDAR DAYS', days: workDaysInMonth },
      ...validEntries.map(userData => analyzer.getStats(userData, workDaysInMonth)),
    ];
    const filePath = `${tmpdir()}/${year}-${month}-${new Date().getTime()}.xlsx`;
    logger.info(`Writing stats to ${filePath}`);
    excel().writeSheet(rows, filePath, config.statsColumnHeaders);
  };

  return {
    calcFlextime,
    generateReport,
  };
};
