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

    it('should reset oversized markers and request header sync when showing hidden columns with row headers', () => {
      registerPlugin(HiddenColumns);

      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: Array.from({ length: 5 }, (__, rowIndex) => {
          return Array.from({ length: 5 }, (___, columnIndex) => `r${rowIndex}c${columnIndex}`);
        }),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
        licenseKey: 'non-commercial-and-evaluation',
      });
      const viewport = hot.view._wt.wtViewport;

      hot.render();

      viewport.hasOversizedColumnHeadersMarked.master = true;
      viewport.shouldSynchronizeColumnHeaders = false;

      hot.getPlugin('hiddenColumns').showColumns([0]);

      expect(viewport.hasOversizedColumnHeadersMarked.master).toBeUndefined();
      expect(viewport.shouldSynchronizeColumnHeaders).toBe(true);

      hot.destroy();
      container.remove();
    });

    it('should not reset markers or request sync for no-op/invalid showColumns calls', () => {
      registerPlugin(HiddenColumns);

      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: Array.from({ length: 5 }, (__, rowIndex) => {
          return Array.from({ length: 5 }, (___, columnIndex) => `r${rowIndex}c${columnIndex}`);
        }),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
        licenseKey: 'non-commercial-and-evaluation',
      });
      const viewport = hot.view._wt.wtViewport;

      hot.render();

      viewport.hasOversizedColumnHeadersMarked.master = true;
      viewport.shouldSynchronizeColumnHeaders = false;

      hot.getPlugin('hiddenColumns').showColumns([]);
      hot.getPlugin('hiddenColumns').showColumns([99]);

      expect(viewport.hasOversizedColumnHeadersMarked.master).toBe(true);
      expect(viewport.shouldSynchronizeColumnHeaders).toBe(false);

      hot.destroy();
      container.remove();
    });

    it('should not request header sync when row headers are disabled', () => {
      registerPlugin(HiddenColumns);

      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        data: Array.from({ length: 5 }, (__, rowIndex) => {
          return Array.from({ length: 5 }, (___, columnIndex) => `r${rowIndex}c${columnIndex}`);
        }),
        rowHeaders: false,
        colHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
        licenseKey: 'non-commercial-and-evaluation',
      });
      const viewport = hot.view._wt.wtViewport;

      hot.render();

      viewport.hasOversizedColumnHeadersMarked.master = true;
      viewport.shouldSynchronizeColumnHeaders = false;

      hot.getPlugin('hiddenColumns').showColumns([0]);

      expect(viewport.hasOversizedColumnHeadersMarked.master).toBeUndefined();
      expect(viewport.shouldSynchronizeColumnHeaders).toBe(false);

      hot.destroy();
      container.remove();
    });
  });
});
