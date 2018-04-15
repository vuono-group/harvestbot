'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _empty = require('rxjs/observable/empty');

require('rxjs/add/operator/expand');

require('rxjs/add/operator/filter');

require('rxjs/add/operator/map');

require('rxjs/add/operator/mergeMap');

require('rxjs/add/operator/reduce');

// import logger from './log';

exports.default = http => {
  const api = http('https://api.harvestapp.com/v2/', {
    Authorization: `Bearer ${process.env.HARVEST_ACCESS_TOKEN}`,
    'Harvest-Account-Id': process.env.HARVEST_ACCOUNT_ID
  });

  const getTimeEntriesForPage = (userId, page) => api.getJson(`/time_entries?user_id=${userId}&page=${page}`).map(({ next_page: nextPage, time_entries: entries }) => ({ entries, nextPage }));

  const getTimeEntriesForUserId = userId => getTimeEntriesForPage(userId, 1).expand(({ nextPage }) => nextPage ? getTimeEntriesForPage(userId, nextPage) : (0, _empty.empty)()).mergeMap(({ entries }) => entries).map(({
    spent_date: date, hours, billable,
    project: { id: projectId, name: projectName },
    task: { id: taskId, name: taskName }
  }) => ({
    date, hours, billable, projectId, projectName, taskId, taskName
  })).reduce((result, item) => [...result, item], []);

  const getTimeEntries = userEmail => api.getJson('/users').mergeMap(({ users }) => users).filter(({ email }) => email === userEmail).mergeMap(({ id }) => getTimeEntriesForUserId(id)).toPromise();

  return { getTimeEntries };
};