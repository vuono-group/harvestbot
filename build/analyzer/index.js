'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _calendar = require('../calendar');

var _calendar2 = _interopRequireDefault(_calendar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import logger from '../log';

exports.default = () => {
  const calendar = (0, _calendar2.default)();
  const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);

  const getPeriodRangeEnd = (entriesDate, latestFullDate, today = new Date()) => calendar.datesEqual(entriesDate, today) ? entriesDate : latestFullDate;

  const getBillablePercentage = (entries, totalHours = entries.reduce((result, entry) => entry.billable ? _extends({}, result, { billable: entry.hours + result.billable }) : _extends({}, result, { nonBillable: result.nonBillable + entry.hours }), { billable: 0, nonBillable: 0 }), allHours = totalHours.billable + totalHours.nonBillable) => allHours ? Math.floor(totalHours.billable / allHours * 100) : 0;

  const getBillablePercentageCurrentMonth = sortedEntries => getBillablePercentage(sortedEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getFullYear() === calendar.CURRENT_YEAR && entryDate.getMonth() === calendar.CURRENT_MONTH;
  }));

  const getPeriodRange = (entries, latestFullDate, sortedEntries = entries.sort(sortByDate), latestRecordDate = new Date(sortedEntries[sortedEntries.length - 1].date), endDate = getPeriodRangeEnd(latestRecordDate, latestFullDate)) => ({
    entries: sortedEntries.filter(entry => new Date(entry.date).getTime() <= endDate.getTime()),
    start: new Date(sortedEntries[0].date),
    end: endDate,
    latestRecord: latestRecordDate
  });

  const calculateWorkedHours = (entries, ignoreTaskIds) => entries.reduce((result, entry) => {
    const ignore = ignoreTaskIds.includes(entry.taskId);
    return _extends({}, result, {
      warnings: !ignore && !calendar.isWorkingDay(new Date(entry.date)) ? [...result.warnings, `Recorded hours in non-working day (${entry.date})!`] : result.warnings,
      total: ignore ? result.total : result.total + entry.hours
    });
  }, {
    warnings: [],
    total: 0,
    billablePercentageCurrentMonth: getBillablePercentageCurrentMonth(entries)
  });

  return {
    getPeriodRange,
    calculateWorkedHours
  };
};