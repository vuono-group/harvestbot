import flex from './index';

describe('Flex counter', () => {
  const { getTotalWorkHoursSinceDate, getLatestFullWorkingDay } = flex();

  describe('getTotalWorkHoursSinceDate', () => {
    it('calculate total work hours since date', () => {
      expect(getTotalWorkHoursSinceDate(new Date('2018-01-01'), new Date('2018-01-31'))).toEqual(165);
    });
  });

  describe('getLatestFullWorkingDay', () => {
    it('get last full working day (yesterday)', () => {
      expect(getLatestFullWorkingDay(new Date('2018-01-31'))).toEqual(new Date('2018-01-30'));
    });
    it('get last full working day (public holiday)', () => {
      expect(getLatestFullWorkingDay(new Date('2017-12-27'))).toEqual(new Date('2017-12-22'));
    });
  });
});
