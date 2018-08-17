import { tmpdir } from 'os';
import { statSync, unlinkSync } from 'fs';

import excel from './index';

describe('Excel', () => {
  const writer = excel();

  describe('writeSheet', () => {
    it('calculate total work hours since date', () => {
      const fileName = `${tmpdir()}/temp.xlsx`;
      writer.writeSheet([{ name: 'name' }], fileName, 'Title');
      expect(statSync(fileName)).toBeTruthy();
      unlinkSync(fileName);
    });
  });
});
