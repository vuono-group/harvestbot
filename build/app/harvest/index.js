'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _empty = require('rxjs/observable/empty');

require('rxjs/add/operator/expand');

require('rxjs/add/operator/first');

require('rxjs/add/operator/map');

require('rxjs/add/operator/mergeMap');

require('rxjs/add/operator/reduce');

exports.default = (config, http) => {
  const api = http('https://api.harvestapp.com/v2/', {
    Authorization: `Bearer ${config.harvestAccessToken}`,
    'Harvest-Account-Id': config.harvestAccountId
  });

  const getRangeQueryString = year => `&from=${year}-01-01&to=${year}-12-31`;

  const getTimeEntriesForPage = (userId, year, page) => api.getJson(`/time_entries?user_id=${userId}&page=${page}${year ? getRangeQueryString(year) : ''}`).map(({ next_page: nextPage, time_entries: entries }) => ({ entries, nextPage }));

  const getTimeEntriesForId = (userId, year = null) => getTimeEntriesForPage(userId, year, 1).expand(({ nextPage }) => nextPage ? getTimeEntriesForPage(userId, year, nextPage) : (0, _empty.empty)()).mergeMap(({ entries }) => entries).map(({
    spent_date: date, hours, billable,
    project: { id: projectId, name: projectName },
    task: { id: taskId, name: taskName }
  }) => ({
    date, hours, billable, projectId, projectName, taskId, taskName
  })).reduce((result, item) => [...result, item], []);

  const getUsersForPage = page => api.getJson(`/users?page=${page}`).map(({ users, next_page: nextPage }) => ({ users, nextPage }));

  const getAllUsers = () => getUsersForPage(1).expand(({ nextPage }) => nextPage ? getUsersForPage(nextPage) : (0, _empty.empty)()).mergeMap(({ users }) => users);

  const getTimeEntriesForEmail = (userName, validateEmail = () => null) => getAllUsers().first(({ email }) => userName === validateEmail(email)).mergeMap(({ id }) => getTimeEntriesForId(id)).toPromise();

  const getTimeEntriesForUserId = (userId, year) => getTimeEntriesForId(userId, year).toPromise();

  const getUsers = () => getAllUsers().reduce((result, item) => [...result, item], []).toPromise();

  return { getTimeEntriesForUserId, getTimeEntriesForEmail, getUsers };
};