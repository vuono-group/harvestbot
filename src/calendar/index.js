import publicHolidays from './public-holidays';
// import logger from '../log';

export default () => {
  const HOURS_IN_DAY = 7.5;

  const isWeekLeave = date => date.getDay() === 0 || date.getDay() === 6;

  const datesEqual = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const isWorkingDay = date =>
    !isWeekLeave(date) &&
    !publicHolidays.find(holiday => datesEqual(holiday, date));

  const getYesterday = date => new Date(date.setDate(date.getDate() - 1));

  const getTotalWorkHoursSinceDate = (fromDate, toDate) => {
    let workingDate = toDate;
    let hours = 0;
    do {
      hours += isWorkingDay(workingDate) ? HOURS_IN_DAY : 0;
      workingDate = getYesterday(workingDate);
    } while (workingDate >= fromDate);
    return hours;
  };

  const getLatestFullWorkingDay = (date = new Date()) => {
    let workingDate = date;
    do {
      workingDate = getYesterday(workingDate);
    } while (!isWorkingDay(workingDate));
    return workingDate;
  };

  return {
    datesEqual,
    isWorkingDay,
    getLatestFullWorkingDay,
    getTotalWorkHoursSinceDate,
  };
};
