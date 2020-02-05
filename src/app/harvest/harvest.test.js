import { of } from 'rxjs';
import harvest from './index';

describe('Harvest', () => {
  const mockUsers = { users: [{ email: 'user@email.com', id: 1 }] };
  const mockEntries = {
    time_entries: [{
      spent_date: '2017-02-12',
      hours: 7.5,
      billable: true,
      project: { id: 'projectId', name: 'projectName' },
      task: { id: 'taskId', name: 'taskName' },
    }],
    next_page: null,
  };
  const mockConfig = {};
  const mockHttp = () => ({
    getJson: (params) => of((params.includes('/users') ? mockUsers : mockEntries)),
  });
  const { getTimeEntriesForEmail, getUsers } = harvest(mockConfig, mockHttp);

  describe('getTimeEntriesForEmail', () => {
    it('should get time entries', () => {
      expect.assertions(1);
      getTimeEntriesForEmail('user', () => 'user')
        .then((res) => {
          const expected = mockEntries.time_entries[0];
          return expect(res).toEqual([{
            billable: expected.billable,
            hours: expected.hours,
            date: expected.spent_date,
            projectId: expected.project.id,
            projectName: expected.project.name,
            taskId: expected.task.id,
            taskName: expected.task.name,
          }]);
        });
    });
  });
  describe('getUsers', () => {
    it('should get users', () => {
      expect.assertions(1);
      getUsers()
        .then(
          (res) => expect(res).toEqual(mockUsers.users),
        );
    });
  });
});
