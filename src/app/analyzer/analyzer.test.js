import analyzer from './index';

describe('Analyzer', () => {
  const mockDates = [
    { date: '2017-12-07' },
    { date: '2017-06-07' },
    { date: '2017-12-05' },
    { date: '2018-07-20' },
    { date: '2018-05-09' },
  ];
  const mockEntry = {
    date: '2018-08-20',
    hours: 7.5,
    billable: true,
    projectId: 'projectId',
    projectName: 'projectName',
    taskId: 'taskId',
    taskName: 'taskName',
  };

  const mockEntries = [
    mockEntry,
    {
      ...mockEntry,
      date: '2018-08-27',
      taskId: 'flexLeaveTaskId',
    },
    {
      ...mockEntry,
      date: '2017-12-24',
    },
  ];

  const mockTask = {
    user: { first_name: 'first', last_name: 'last' },
    entries: mockEntries,
  };

  const mockConfig = {
    taskIds: {
      publicHoliday: '',
      vacation: '',
      unpaidLeave: '',
      sickLeave: '',
      flexLeave: 'flexLeaveTaskId',
    },
  };


  const { calculateWorkedHours, getPeriodRange, getStats } = analyzer(mockConfig);

  describe('getPeriodRange', () => {
    it('should get start and end dates', () => expect(getPeriodRange(mockDates, new Date('2018-07-20')))
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
  describe('calculateWorkedHours', () => {
    it('should calculate worked hours', () => expect(calculateWorkedHours(mockEntries))
      .toEqual({
        billablePercentageCurrentMonth: 0,
        total: 7.5,
        warnings: ['Recorded hours in non-working day (2017-12-24) - ignoring!'],
      }));
  });
  describe('getStats', () => {
    it('should get stats', () => expect(getStats(mockTask, 1))
      .toEqual({
        absentDays: 1,
        billableHours: 7.5,
        billablePercentage: 100,
        days: 2,
        flexLeaveDays: 1,
        flexSaldo: -7.5,
        hours: 7.5,
        hoursPerCalendar: 15,
        name: 'first last',
        markedDays: 2,
        missingDays: 1,
        projectName: 'projectName',
        sickDays: 0,
        unpaidLeaveDays: 0,
        vacationDays: 0,
      }));
  });
});
