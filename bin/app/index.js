"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _os = require("os");

var _fs = require("fs");

var _log = _interopRequireDefault(require("../log"));

var _analyzer = _interopRequireDefault(require("./analyzer"));

var _excel = _interopRequireDefault(require("./excel"));

var _calendar = _interopRequireDefault(require("./calendar"));

var _harvest = _interopRequireDefault(require("./harvest"));

var _emailer = _interopRequireDefault(require("./emailer"));

var _default = (config, http) => {
  const logger = (0, _log.default)(config);

  const formatDate = date => date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const validateEmail = (email, emailParts = email.split('@')) => config.emailDomains.includes(emailParts[1]) ? emailParts[0] : null;

  const analyzer = (0, _analyzer.default)(config);
  const calendar = (0, _calendar.default)();
  const tracker = (0, _harvest.default)(config, http);

  const round = val => Math.floor(val * 2) / 2;

  const calcFlextime = async email => {
    const userName = validateEmail(email);

    if (!userName) {
      return {
        header: `Invalid email domain for ${email}`
      };
    }

    logger.info(`Fetch data for ${email}`);
    const entries = await tracker.getTimeEntriesForEmail(userName, validateEmail);

    if (!entries) {
      return {
        header: `Unable to find time entries for ${email}`
      };
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
    const messages = [`Latest calendar working day: ${formatDate(range.end)}`, `Last time you have recorded hours: ${formatDate(new Date(range.entries[range.entries.length - 1].date))}`, ...result.warnings, `Current month ${result.billablePercentageCurrentMonth}% billable`];
    logger.info(header);
    logger.info('All done!');
    return {
      header,
      messages
    };
  }; // TODO: refactor and optimise


  const generateReport = async (yearArg, monthArg, email, year = parseInt(yearArg, 10), month = parseInt(monthArg, 10)) => {
    const orderValue = (a, b) => a < b ? -1 : 1;

    const compare = (a, b) => a === b ? 0 : orderValue(a, b);

    const userName = validateEmail(email);

    if (!userName) {
      return `Invalid email domain for ${email}`;
    }

    const users = await tracker.getUsers();
    const authorisedUser = users.find(user => user.is_admin && validateEmail(user.email) === userName);

    if (!authorisedUser) {
      return `Unable to authorise harvest user ${email}`;
    }

    const sortedUsers = users.sort((a, b) => compare(a.first_name, b.first_name) || compare(a.last_name, b.last_name)); // Find all users who have tracked hours this year to keep the rows consistent

    const timeEntries = await Promise.all(sortedUsers.map(({
      id
    }) => tracker.getTimeEntriesForUserId(id, year)));
    const validEntries = timeEntries.map((entries, index) => ({
      user: sortedUsers[index],
      entries
    })).filter(({
      entries
    }) => entries.length > 0).map(({
      user,
      entries
    }) => ({
      user,
      entries: entries.filter(({
        date
      }) => {
        const entryDate = new Date(date);
        return entryDate.getFullYear() === year && entryDate.getMonth() + 1 === month;
      })
    }));
    const workDaysInMonth = calendar.getWorkingDaysForMonth(year, month);
    const rows = [{
      name: 'CALENDAR DAYS',
      days: workDaysInMonth
    }, ...validEntries.map(userData => analyzer.getStats(userData, workDaysInMonth))];
    const sheetTitle = `${year}-${month}`;
    const fileName = `${sheetTitle}-${new Date().getTime()}.xlsx`;
    const filePath = `${(0, _os.tmpdir)()}/${fileName}`;
    logger.info(`Writing stats to ${filePath}`);
    (0, _excel.default)().writeSheet(rows, filePath, sheetTitle, config.statsColumnHeaders);
    await (0, _emailer.default)(config).sendExcelFile(email, 'Monthly harvest stats', `${year}-${month}`, filePath, fileName);
    (0, _fs.unlinkSync)(filePath);
    return `Stats sent to email ${email}.`;
  };

  return {
    calcFlextime,
    generateReport
  };
};

exports.default = _default;