import calendar from './index';

describe('Calendar', () => {
  const {
    CURRENT_YEAR, CURRENT_MONTH, getTotalWorkHoursSinceDate, getLatestFullWorkingDay,
  } = calendar();

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

  describe('currentDate', () => {
    it('get current month', () => {
      expect(CURRENT_MONTH).toEqual(new Date().getMonth());
    });
    it('get current year', () => {
      expect(CURRENT_YEAR).toEqual(new Date().getFullYear());
    });
  });
});
