'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _os = require('os');

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _analyzer = require('./analyzer');

var _analyzer2 = _interopRequireDefault(_analyzer);

var _excel = require('./excel');

var _excel2 = _interopRequireDefault(_excel);

var _calendar = require('./calendar');

var _calendar2 = _interopRequireDefault(_calendar);

var _harvest = require('./harvest');

var _harvest2 = _interopRequireDefault(_harvest);

var _emailer = require('./emailer');

var _emailer2 = _interopRequireDefault(_emailer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (config, http) => {
  const formatDate = date => date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const validateEmail = (email, emailParts = email.split('@')) => config.emailDomains.includes(emailParts[1]) ? emailParts[0] : null;

  const analyzer = (0, _analyzer2.default)(config);
  const calendar = (0, _calendar2.default)();
  const tracker = (0, _harvest2.default)(config, http);
  const round = val => Math.floor(val * 2) / 2;

  const calcFlextime = async email => {
    const userName = validateEmail(email);
    if (!userName) {
      return { header: `Invalid email domain for ${email}` };
    }

    _log2.default.info(`Ignore following task ids ${config.ignoreTaskIds}`);
    _log2.default.info(`Fetch data for ${email}`);

    const entries = await tracker.getTimeEntriesForEmail(userName, validateEmail);
    if (!entries) {
      return { header: `Unable to find time entries for ${email}` };
    }
    const latestFullDay = calendar.getLatestFullWorkingDay();

    const range = analyzer.getPeriodRange(entries, latestFullDay);
    _log2.default.info(`Received range starting from ${formatDate(range.start)} to ${formatDate(range.end)}`);

    const totalHours = calendar.getTotalWorkHoursSinceDate(range.start, range.end);
    _log2.default.info(`Total working hours from range start ${totalHours}`);

    const result = analyzer.calculateWorkedHours(range.entries);
    if (result.warnings.length > 0) {
      _log2.default.info(result.warnings);
    } else {
      _log2.default.info('No warnings!');
    }

    const header = `*Your flex hours count: ${round(result.total - totalHours)}*`;
    const messages = [`Latest calendar working day: ${formatDate(range.end)}`, `Last time you have recorded hours: ${formatDate(new Date(range.entries[range.entries.length - 1].date))}`, ...result.warnings, `Current month ${result.billablePercentageCurrentMonth}% billable`];

    _log2.default.info(header);
    _log2.default.info('All done!');

    return { header, messages };
  };

  // TODO: refactor and optimise
  const generateReport = async (year, month, email) => {
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

    const sortedUsers = users.sort((a, b) => compare(a.first_name, b.first_name) || compare(a.last_name, b.last_name));

    // Find all users who have tracked hours this year to keep the rows consistent
    const timeEntries = await Promise.all(sortedUsers.map(({ id }) => tracker.getTimeEntriesForUserId(id, year)));
    const validEntries = timeEntries.map((entries, index) => ({ user: sortedUsers[index], entries })).filter(({ entries }) => entries.length > 0).map(({ user, entries }) => ({
      user,
      entries: entries.filter(({ date }) => {
        const entryDate = new Date(date);
        return entryDate.getFullYear() === year && entryDate.getMonth() + 1 === month;
      })
    }));
    const workDaysInMonth = calendar.getWorkingDaysForMonth(year, month);
    const rows = [{ name: 'CALENDAR DAYS', days: workDaysInMonth }, ...validEntries.map(userData => analyzer.getStats(userData, workDaysInMonth))];
    const sheetTitle = `${year}-${month}`;
    const fileName = `${sheetTitle}-${new Date().getTime()}.xlsx`;
    const filePath = `${(0, _os.tmpdir)()}/${fileName}`;
    _log2.default.info(`Writing stats to ${filePath}`);
    (0, _excel2.default)().writeSheet(rows, filePath, sheetTitle, config.statsColumnHeaders);
    (0, _emailer2.default)(config).sendExcelFile(email, 'Monthly harvest stats', `${year}-${month}`, filePath, fileName);
    return `Stats sent to email ${email}.`;
  };

  return {
    calcFlextime,
    generateReport
  };
};