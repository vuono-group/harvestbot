import { tmpdir } from 'os';
import { statSync, unlinkSync } from 'fs';

import excel from './index';

describe('Excel', () => {
  const writer = excel();

  describe('writeSheet', () => {
    it('calculate total work hours since date', () => {
      const fileName = `${tmpdir()}/temp.xlsx`;
      writer.writeSheet(
        fileName,
        [{
          rows: [{ name: 'name' }],
          title: 'Title',
          headers: [],
          columns: [],
        }],
      );
      expect(statSync(fileName)).toBeTruthy();
      unlinkSync(fileName);
    });
  });
});
