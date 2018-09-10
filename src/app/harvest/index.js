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

  const collect = (result, item) => [...result, item];

  const getAllToPromise = (
    getAll,
    ...args
  ) => getAll(...args)
    .reduce(collect, [])
    .toPromise();

  const nextOrEmpty = (get, ...args) => ({ nextPage }) => (
    nextPage ? get(...args, nextPage) : empty()
  );

  const getTimeEntriesForPage = (userId, year, page) => api
    .getJson(`/time_entries?user_id=${userId}&page=${page}${year
      ? getRangeQueryString(year)
      : ''}`)
    .map(({ next_page: nextPage, time_entries: entries }) => ({ entries, nextPage }));

  const getUsersForPage = page => api
    .getJson(`/users?page=${page}`)
    .map(({ users, next_page: nextPage }) => ({ users, nextPage }));

  const getTaskAssignmentsForPage = page => api
    .getJson(`/task_assignments?page=${page}`)
    .map(({ task_assignments: tasks, next_page: nextPage }) => ({ tasks, nextPage }));

  const getTimeEntriesForId = (userId, year = null) => getTimeEntriesForPage(userId, year, 1)
    .expand(nextOrEmpty(getTimeEntriesForPage, userId, year))
    .mergeMap(({ entries }) => entries)
    .map(({
      spent_date: date, hours, billable,
      project: { id: projectId, name: projectName },
      task: { id: taskId, name: taskName },
    }) => ({
      date, hours, billable, projectId, projectName, taskId, taskName,
    }));

  const getAllUsers = () => getUsersForPage(1)
    .expand(nextOrEmpty(getUsersForPage))
    .mergeMap(({ users }) => users);

  const getAllTaskAssignments = () => getTaskAssignmentsForPage(1)
    .expand(nextOrEmpty(getTaskAssignmentsForPage))
    .mergeMap(({ tasks }) => tasks);

  const getTimeEntriesForUserId = (
    userId,
    year,
  ) => getAllToPromise(getTimeEntriesForId, userId, year);

  const getTimeEntriesForEmail = (userName, validateEmail = () => null) => getAllUsers()
    .first(({ email }) => userName === validateEmail(email))
    .mergeMap(({ id }) => getTimeEntriesForId(id))
    .reduce(collect, [])
    .toPromise();

  const getUsers = () => getAllToPromise(getAllUsers());

  const getTaskAssignments = () => getAllToPromise(getAllTaskAssignments());

  return {
    getTimeEntriesForUserId, getTimeEntriesForEmail, getUsers, getTaskAssignments,
  };
};
