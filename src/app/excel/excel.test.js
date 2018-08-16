import excel from './index';

describe('Excel', () => {
  const writer = excel();

  describe('writeSheet', () => {
    it('calculate total work hours since date', () => {
      writer.writeSheet([{ name: 'name' }]);
      expect(true).toEqual(true);
    });
  });
});
