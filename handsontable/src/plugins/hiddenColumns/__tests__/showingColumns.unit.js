import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  HiddenColumns,
  NestedHeaders,
} from 'handsontable/plugins';

describe('HiddenColumns', () => {
  describe('showColumns', () => {
    it('should reset oversized column header markers after showing columns', () => {
      registerPlugin(HiddenColumns);
      registerPlugin(NestedHeaders);

      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: Array.from({ length: 20 }, (__, rowIndex) => {
          return Array.from({ length: 4 }, (___, columnIndex) => `r${rowIndex}c${columnIndex}`);
        }),
        rowHeaders: true,
        colHeaders: true,
        nestedHeaders: [
          ['A', 'A very very long nested header label', 'C', 'D'],
          ['A1', 'B1', 'C1', 'D1'],
        ],
        hiddenColumns: {
          columns: [1],
        },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.render();

      expect(hot.view._wt.wtViewport.hasOversizedColumnHeadersMarked.master).toBe(true);

      hot.getPlugin('hiddenColumns').showColumns([1]);

      expect(hot.view._wt.wtViewport.hasOversizedColumnHeadersMarked.master).toBeUndefined();

      hot.destroy();

      container.remove();
    });
  });
});
