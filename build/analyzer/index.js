'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _calendar = require('../calendar');

var _calendar2 = _interopRequireDefault(_calendar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import logger from '../log';

exports.default = () => {
  const calendar = (0, _calendar2.default)();
  const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);

  const getPeriodRangeEnd = (entriesDate, latestFullDate, today = new Date()) => calendar.datesEqual(entriesDate, today) ? entriesDate : latestFullDate;

  const getPeriodRange = (entries, latestFullDate, sortedEntries = entries.sort(sortByDate), endDate = getPeriodRangeEnd(new Date(sortedEntries[sortedEntries.length - 1].date), latestFullDate)) => ({
    entries: sortedEntries.filter(entry => new Date(entry.date).getTime() <= endDate.getTime()),
    start: new Date(sortedEntries[0].date),
    end: endDate
  });

  const calculateWorkedHours = (entries, ignoreTaskIds) => entries.reduce((result, entry) => ({
    warnings: !calendar.isWorkingDay(new Date(entry.date)) ? [...result.warnings, `Recorded hours in non-working day (${entry.date})!)`] : result.warnings,
    total: ignoreTaskIds.includes(entry.taskId) ? result.total : result.total + entry.hours
  }), { warnings: [], total: 0 });

  return {
    getPeriodRange,
    calculateWorkedHours
  };
};