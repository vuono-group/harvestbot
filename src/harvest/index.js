import { empty } from 'rxjs/observable/empty';
import 'rxjs/add/operator/expand';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/reduce';

// import logger from './log';

export default (config, http) => {
  const api = http(
    'https://api.harvestapp.com/v2/',
    {
      Authorization: `Bearer ${config.harvestAccessToken}`,
      'Harvest-Account-Id': config.harvestAccountId,
    },
  );

  const getTimeEntriesForPage = (userId, page) =>
    api.getJson(`/time_entries?user_id=${userId}&page=${page}`)
      .map(({ next_page: nextPage, time_entries: entries }) => ({ entries, nextPage }));

  const getTimeEntriesForUserId = userId =>
    getTimeEntriesForPage(userId, 1)
      .expand(({ nextPage }) => (nextPage
        ? getTimeEntriesForPage(userId, nextPage)
        : empty()))
      .mergeMap(({ entries }) => entries)
      .map(({
        spent_date: date, hours, billable,
        project: { id: projectId, name: projectName },
        task: { id: taskId, name: taskName },
      }) => ({
        date, hours, billable, projectId, projectName, taskId, taskName,
      }))
      .reduce((result, item) => [...result, item], []);

  const getTimeEntries = (userName, validateEmail = () => null) =>
    api.getJson('/users')
      .mergeMap(({ users }) => users)
      .first(({ email }) => userName === validateEmail(email))
      .mergeMap(({ id }) => getTimeEntriesForUserId(id))
      .toPromise();

  return { getTimeEntries };
};
