'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _calendar = require('../calendar');

var _calendar2 = _interopRequireDefault(_calendar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = ({ taskIds }) => {
  const calendar = (0, _calendar2.default)();
  const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);

  const isPublicHoliday = taskId => taskId === taskIds.publicHoliday;
  const isVacation = taskId => taskId === taskIds.vacation;
  const isUnpaidLeave = taskId => taskId === taskIds.unpaidLeave;
  const isFlexLeave = taskId => taskId === taskIds.flexLeave;
  const isSickLeave = taskId => taskId === taskIds.sickLeave;
  const isHoliday = taskId => isPublicHoliday(taskId) || isVacation(taskId) || isUnpaidLeave(taskId);
  const isHolidayOrFlex = taskId => isHoliday(taskId) || isFlexLeave(taskId);
  const isAbsence = taskId => isHolidayOrFlex(taskId) || isSickLeave(taskId);

  const getPeriodRangeEnd = (entriesDate, latestFullDate, today = new Date()) => calendar.datesEqual(entriesDate, today) ? entriesDate : latestFullDate;

  const getPeriodRange = (entries, latestFullDate, sortedEntries = entries.sort(sortByDate), latestRecordDate = new Date(sortedEntries[sortedEntries.length - 1].date), endDate = getPeriodRangeEnd(latestRecordDate, latestFullDate), sortedRangeEntries = sortedEntries.filter(entry => new Date(entry.date).getTime() <= endDate.getTime())) => ({
    entries: sortedRangeEntries, // sorted entries for range
    start: new Date(sortedEntries[0].date), // start date
    end: endDate // today or last calendar working day
  });

  const isCurrentMonth = date => date.getFullYear() === calendar.CURRENT_YEAR && date.getMonth() === calendar.CURRENT_MONTH;

  const calculateWorkedHours = (entries, filtered = entries.reduce((result, entry) => {
    const entryDate = new Date(entry.date);
    const isWorkingDay = calendar.isWorkingDay(entryDate);
    const ignoreEntry = isPublicHoliday(entry.taskId) || isFlexLeave(entry.taskId);
    const ignoreFromTotal = !isWorkingDay || ignoreEntry;
    const isCurrenMonthEntry = !ignoreFromTotal && isCurrentMonth(entryDate);

    return _extends({}, result, {
      warnings: !ignoreEntry && !isWorkingDay ? [...result.warnings, `Recorded hours in non-working day (${entry.date}) - ignoring!`] : result.warnings,
      total: ignoreFromTotal ? result.total : result.total + entry.hours,
      billable: isCurrenMonthEntry && entry.billable ? result.billable + entry.hours : result.billable,
      nonBillable: isCurrenMonthEntry && !entry.billable ? result.nonBillable + entry.hours : result.nonBillable
    });
  }, {
    warnings: [],
    total: 0,
    billable: 0,
    nonBillable: 0
  }), allHours = filtered.billable + filtered.nonBillable) => ({
    warnings: filtered.warnings,
    total: filtered.total,
    billablePercentageCurrentMonth: allHours ? Math.floor(filtered.billable / allHours * 100) : 0
  });

  const addDay = (entry, result) => {
    const {
      dates,
      daysCount: {
        working,
        absence,
        sickLeave,
        vacation,
        unpaidLeave,
        flexLeave
      }
    } = result;
    if (dates.includes(entry.date)) {
      return result;
    }
    return {
      dates: [...dates, entry.date],
      daysCount: {
        working: isHoliday(entry.taskId) ? working : working + 1,
        absence: isAbsence(entry.taskId) ? absence + 1 : absence,
        sickLeave: isSickLeave(entry.taskId) ? sickLeave + 1 : sickLeave,
        vacation: isVacation(entry.taskId) ? vacation + 1 : vacation,
        unpaidLeave: isUnpaidLeave(entry.taskId) ? unpaidLeave + 1 : unpaidLeave,
        flexLeave: isFlexLeave(entry.taskId) ? flexLeave + 1 : flexLeave
      }
    };
  };

  const getStats = ({ user, entries }, fullCalendarDays, recordedHours = entries.reduce((result, entry) => {
    if (calendar.isWorkingDay(new Date(entry.date))) {
      const isWorkingOrSickDay = !isHolidayOrFlex(entry.taskId);
      const isBillable = isWorkingOrSickDay && entry.billable;
      const projectNotAdded = isBillable && !result.projectNames.includes(entry.projectName);
      return _extends({}, addDay(entry, result), {
        hours: isWorkingOrSickDay ? result.hours + entry.hours : result.hours,
        billableHours: isBillable ? result.billableHours + entry.hours : result.billableHours,
        projectNames: projectNotAdded ? [...result.projectNames, entry.projectName] : result.projectNames
      });
    }
    return result;
  }, {
    dates: [],
    daysCount: {
      working: 0,
      absence: 0,
      sickLeave: 0,
      vacation: 0,
      unpaidLeave: 0,
      flexLeave: 0
    },
    hours: 0,
    billableHours: 0,
    projectNames: []
  }), hoursPerCalendar = recordedHours.daysCount.working * calendar.HOURS_IN_DAY) => ({
    name: `${user.first_name} ${user.last_name}`,
    days: recordedHours.daysCount.working,
    hoursPerCalendar,
    hours: recordedHours.hours,
    billableHours: recordedHours.billableHours,
    projectName: recordedHours.projectNames.join(),
    billablePercentage: recordedHours.billableHours / recordedHours.hours * 100,
    flexSaldo: recordedHours.hours - hoursPerCalendar,
    absentDays: recordedHours.daysCount.absence,
    sickDays: recordedHours.daysCount.sickLeave,
    vacationDays: recordedHours.daysCount.vacation,
    unpaidLeaveDays: recordedHours.daysCount.unpaidLeave,
    flexLeaveDays: recordedHours.daysCount.flexLeave,
    markedDays: recordedHours.dates.length,
    missingDays: recordedHours.dates.length - fullCalendarDays
  });

  return {
    getPeriodRange,
    calculateWorkedHours,
    getStats
  };
};