"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

var _luxon = require("luxon");

var _default = (config, http) => {
  const api = http('https://api.harvestapp.com/v2/', {
    Authorization: `Bearer ${config.harvestAccessToken}`,
    'Harvest-Account-Id': config.harvestAccountId
  });

  const getRangeQueryString = year => `&from=${year}-01-01&to=${year}-12-31`;

  const getMonthlyRangeQueryString = (year, month) => `&from=${_luxon.DateTime.local(year, month, 1).toISODate()}&to=${_luxon.DateTime.local(year, month, 1).endOf('month').toISODate()}`;

  const collect = (result, item) => [...result, item];

  const getAllToPromise = (getAll, ...args) => getAll(...args).pipe((0, _operators.reduce)(collect, [])).toPromise();

  const nextOrEmpty = (get, ...args) => ({
    nextPage
  }) => nextPage ? get(...args, nextPage) : _rxjs.EMPTY;

  const getTimeEntriesForPage = (userId, year, page) => api.getJson(`/time_entries?user_id=${userId}&page=${page}${year ? getRangeQueryString(year) : ''}`).pipe((0, _operators.map)(({
    next_page: nextPage,
    time_entries: entries
  }) => ({
    entries,
    nextPage
  })));

  const getMonthlyTimeEntriesForPage = (year, month, page) => {
    const url = `/time_entries?page=${page}${year ? getMonthlyRangeQueryString(year, month) : ''}`;
    return api.getJson(url).pipe((0, _operators.map)(({
      next_page: nextPage,
      time_entries: entries
    }) => ({
      entries,
      nextPage
    })));
  };

  const getUsersForPage = page => api.getJson(`/users?page=${page}`).pipe((0, _operators.map)(({
    users,
    next_page: nextPage
  }) => ({
    users,
    nextPage
  })));

  const getTaskAssignmentsForPage = page => api.getJson(`/task_assignments?page=${page}`).pipe((0, _operators.map)(({
    task_assignments: tasks,
    next_page: nextPage
  }) => ({
    tasks,
    nextPage
  })));

  const getTimeEntriesForId = (userId, year = null) => getTimeEntriesForPage(userId, year, 1).pipe((0, _operators.expand)(nextOrEmpty(getTimeEntriesForPage, userId, year)), (0, _operators.mergeMap)(({
    entries
  }) => entries), (0, _operators.map)(({
    spent_date: date,
    hours,
    billable,
    project: {
      id: projectId,
      name: projectName
    },
    task: {
      id: taskId,
      name: taskName
    }
  }) => ({
    date,
    hours,
    billable,
    projectId,
    projectName,
    taskId,
    taskName
  })));

  const getAllMonthlyTimeEntries = (year, month) => getMonthlyTimeEntriesForPage(year, month, 1).pipe((0, _operators.expand)(nextOrEmpty(getMonthlyTimeEntriesForPage, year, month)), (0, _operators.mergeMap)(({
    entries
  }) => entries));

  const getAllUsers = () => getUsersForPage(1).pipe((0, _operators.expand)(nextOrEmpty(getUsersForPage)), (0, _operators.mergeMap)(({
    users
  }) => users));

  const getAllTaskAssignments = () => getTaskAssignmentsForPage(1).pipe((0, _operators.expand)(nextOrEmpty(getTaskAssignmentsForPage)), (0, _operators.mergeMap)(({
    tasks
  }) => tasks));

  const getTimeEntriesForUserId = (userId, year) => getAllToPromise(getTimeEntriesForId, userId, year);

  const getMonthlyTimeEntries = (year, month) => getAllToPromise(getAllMonthlyTimeEntries, year, month);

  const getTimeEntriesForEmail = (userName, validateEmail = () => null) => getAllUsers().pipe((0, _operators.first)(({
    email
  }) => userName === validateEmail(email)), (0, _operators.mergeMap)(({
    id
  }) => getTimeEntriesForId(id)), (0, _operators.reduce)(collect, [])).toPromise();

  const getUsers = () => getAllToPromise(getAllUsers);

  const getTaskAssignments = () => getAllToPromise(getAllTaskAssignments);

  return {
    getTimeEntriesForUserId,
    getMonthlyTimeEntries,
    getTimeEntriesForEmail,
    getUsers,
    getTaskAssignments
  };
};

exports.default = _default;