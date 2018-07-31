import analyzer from './index';

describe('Analyzer', () => {
  const mockEntries = [
    { date: '2017-12-07' },
    { date: '2017-06-07' },
    { date: '2017-12-05' },
    { date: '2018-07-20' },
    { date: '2018-05-09' },
  ];
  const { getPeriodRange } = analyzer();

  describe('getPeriodRange', () => {
    it('should get start and end dates', () =>
      expect(getPeriodRange(mockEntries, new Date('2018-07-20')))
        .toEqual({
          latestRecord: new Date('2018-07-20'),
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
});
