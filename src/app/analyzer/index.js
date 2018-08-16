import cal from '../calendar';
// import logger from '../log';

export default ({ ignoreTaskIds, taskIds }) => {
  const calendar = cal();
  const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);

  const getPeriodRangeEnd = (entriesDate, latestFullDate, today = new Date()) =>
    (
      calendar.datesEqual(entriesDate, today)
        ? entriesDate
        : latestFullDate
    );

  const getBillablePercentage = (
    entries,
    totalHours = entries.reduce(
      (result, entry) =>
        (entry.billable
          ? { ...result, billable: entry.hours + result.billable }
          : { ...result, nonBillable: result.nonBillable + entry.hours }),
      { billable: 0, nonBillable: 0 },
    ),
    allHours = totalHours.billable + totalHours.nonBillable,
  ) => (allHours ? Math.floor((totalHours.billable / (allHours)) * 100) : 0);

  const getBillablePercentageCurrentMonth = sortedEntries =>
    getBillablePercentage(sortedEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === calendar.CURRENT_YEAR
        && entryDate.getMonth() === calendar.CURRENT_MONTH;
    }));

  const getPeriodRange = (
    entries,
    latestFullDate,
    sortedEntries = entries.sort(sortByDate),
    latestRecordDate = new Date(sortedEntries[sortedEntries.length - 1].date),
    endDate = getPeriodRangeEnd(
      latestRecordDate,
      latestFullDate,
    ),
    sortedRangeEntries = sortedEntries.filter(entry =>
      new Date(entry.date).getTime() <= endDate.getTime()),
  ) => ({
    entries: sortedRangeEntries, // sorted entries for range
    start: new Date(sortedEntries[0].date), // start date
    end: endDate, // today or last calendar working day
  });

  const calculateWorkedHours = entries => entries.reduce((result, entry) => {
    const ignore = ignoreTaskIds.includes(entry.taskId);
    return {
      ...result,
      warnings: !ignore && !calendar.isWorkingDay(new Date(entry.date))
        ? [...result.warnings, `Recorded hours in non-working day (${entry.date})!`] : result.warnings,
      total: ignore ? result.total : result.total + entry.hours,
    };
  }, {
    warnings: [],
    total: 0,
    billablePercentageCurrentMonth: getBillablePercentageCurrentMonth(entries),
  });

  const isPublicHoliday = taskId => taskId === taskIds.publicHoliday;
  const isVacation = taskId => taskId === taskIds.vacation;
  const isUnpaidLeave = taskId => taskId === taskIds.unpaidLeave;
  const isFlexLeave = taskId => taskId === taskIds.flexLeave;
  const isSickLeave = taskId => taskId === taskIds.sickLeave;
  const isHoliday = taskId => isPublicHoliday(taskId) ||
    isVacation(taskId) ||
    isUnpaidLeave(taskId);
  const isHolidayOrFlex = taskId => isHoliday(taskId) || isFlexLeave(taskId);
  const isAbsence = taskId => isHolidayOrFlex(taskId) || isSickLeave(taskId);

  const addDay = (entry, result) => {
    const {
      dates,
      daysCount: {
        working,
        absence,
        sickLeave,
        vacation,
        unpaidLeave,
        flexLeave,
      },
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
        flexLeave: isFlexLeave(entry.taskId) ? flexLeave + 1 : flexLeave,
      },
    };
  };

  const getStats = (
    { user, entries },
    fullCalendarDays,
    recordedHours = entries.reduce(
      (result, entry) =>
        ({
          ...addDay(entry, result),
          hours: !isHolidayOrFlex(entry.taskId) ? result.hours + entry.hours : result.hours,
          billableHours: entry.billable ? result.billableHours + entry.hours : result.billableHours,
          projectNames: entry.billable && !result.projectNames.includes(entry.projectName)
            ? [...result.projectNames, entry.projectName] : result.projectNames,
        }),
      {
        dates: [],
        daysCount: {
          working: 0,
          absence: 0,
          sickLeave: 0,
          vacation: 0,
          unpaidLeave: 0,
          flexLeave: 0,
        },
        hours: 0,
        billableHours: 0,
        projectNames: [],
      },
    ),
    hoursPerCalendar = recordedHours.daysCount.working * calendar.HOURS_IN_DAY,
  ) => ({
    name: `${user.first_name} ${user.last_name}`,
    days: recordedHours.daysCount.working,
    hoursPerCalendar,
    hours: recordedHours.hours,
    billableHours: recordedHours.billableHours,
    projectName: recordedHours.projectNames.join(),
    billablePercentage: (recordedHours.billableHours / recordedHours.hours) * 100,
    flexSaldo: recordedHours.hours - hoursPerCalendar,
    absentDays: recordedHours.daysCount.absence,
    sickDays: recordedHours.daysCount.sickLeave,
    vacationDays: recordedHours.daysCount.vacation,
    unpaidLeaveDays: recordedHours.daysCount.unpaidLeave,
    flexLeaveDays: recordedHours.daysCount.flexLeave,
    markedDays: recordedHours.dates.length,
    missingDays: recordedHours.dates.length - fullCalendarDays,
  });

  return {
    getPeriodRange,
    calculateWorkedHours,
    getStats,
  };
};
