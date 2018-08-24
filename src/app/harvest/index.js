import { empty } from 'rxjs/observable/empty';
import 'rxjs/add/operator/expand';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/reduce';

export default (config, http) => {
  const api = http(
    'https://api.harvestapp.com/v2/',
    {
      Authorization: `Bearer ${config.harvestAccessToken}`,
      'Harvest-Account-Id': config.harvestAccountId,
    },
  );

  const getRangeQueryString = year => `&from=${year}-01-01&to=${year}-12-31`;

  const getTimeEntriesForPage = (userId, year, page) =>
    api.getJson(`/time_entries?user_id=${userId}&page=${page}${year ? getRangeQueryString(year) : ''}`)
      .map(({ next_page: nextPage, time_entries: entries }) => ({ entries, nextPage }));

  const getTimeEntriesForId = (userId, year = null) =>
    getTimeEntriesForPage(userId, year, 1)
      .expand(({ nextPage }) => (nextPage
        ? getTimeEntriesForPage(userId, year, nextPage)
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

  const getUsersForPage = page => api.getJson(`/users?page=${page}`).map(({ users, next_page: nextPage }) => ({ users, nextPage }));

  const getAllUsers = () => getUsersForPage(1)
    .expand(({ nextPage }) => (nextPage ? getUsersForPage(nextPage) : empty()))
    .mergeMap(({ users }) => users);

  const getTimeEntriesForEmail = (userName, validateEmail = () => null) =>
    getAllUsers()
      .first(({ email }) => userName === validateEmail(email))
      .mergeMap(({ id }) => getTimeEntriesForId(id))
      .toPromise();

  const getTimeEntriesForUserId = (userId, year) =>
    getTimeEntriesForId(userId, year).toPromise();

  const getUsers = () => getAllUsers().reduce((result, item) => [...result, item], []).toPromise();

  return { getTimeEntriesForUserId, getTimeEntriesForEmail, getUsers };
};
