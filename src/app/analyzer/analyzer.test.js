import analyzer from './index';

describe('Analyzer', () => {
  const mockEntries = [
    { date: '2017-12-07' },
    { date: '2017-06-07' },
    { date: '2017-12-05' },
    { date: '2018-07-20' },
    { date: '2018-05-09' },
  ];
  const mockTask = {
    user: { first_name: 'first', last_name: 'last' },
    entries: [
      {
        date: '2017-02-12',
        hours: 7.5,
        billable: true,
        projectId: 'projectId',
        projectName: 'projectName',
        taskId: 'taskId',
        taskName: 'taskName',
      }],
  };

  const mockConfig = {
    taskIds: {
      publicHoliday: '',
      vacation: '',
      unpaidLeave: '',
      sickLeave: '',
      flexLeave: '',
    },
  };


  const { getPeriodRange, getStats } = analyzer(mockConfig);

  describe('getPeriodRange', () => {
    it('should get start and end dates', () =>
      expect(getPeriodRange(mockEntries, new Date('2018-07-20')))
        .toEqual({
          start: new Date('2017-06-07'),
          end: new Date('2018-07-20'),
          entries: [
            { date: '2017-06-07' },
            { date: '2017-12-05' },
            { date: '2017-12-07' },
            { date: '2018-05-09' },
            { date: '2018-07-20' },
          ],
        }));
  });
  describe('getStats', () => {
    it('should get stats', () =>
      expect(getStats(mockTask))
        .toEqual({
          days: 1,
          hours: 7.5,
          hoursPerCalendar: 7.5,
          name: 'first last',
        }));
  });
});
