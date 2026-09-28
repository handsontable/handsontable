import Handsontable from 'handsontable/base';
import { registerPlugin, UndoRedo } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);

describe('UndoRedo -> RemoveColumn action', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  describe('a removal that removes nothing (#280 / DEV-45)', () => {
    it('should not stack an undo action for a remove_col that took no columns', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [[5]],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_col'); // removes the only column
      hot.alter('remove_col'); // no-op: the grid has no columns left

      // The empty grid removal changed nothing, so only the first removal is on the stack.
      expect(plugin.doneActions.length).toBe(1);

      // A single undo restores the last real state - it is not spent on a dead no-op action.
      plugin.undo();

      expect(hot.getData()).toEqual([[5]]);
    });
  });

  describe('a partial removal (more columns requested than exist) (DEV-2936)', () => {
    it('should record the clamped count for indexes/headers/amount, not the raw requested amount', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['a', 'b', 'c']],
        colHeaders: ['H0', 'H1', 'H2'],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      // Requests 5 columns from index 1, but only 2 exist there, so only 2 are removed.
      hot.alter('remove_col', 1, 5);

      expect(hot.getData()).toEqual([['a']]);

      const action = plugin.doneActions[0];

      // Everything the action recorded is sized to the 2 columns actually removed - not to 5.
      expect(action.amount).toBe(2);
      expect(action.indexes.length).toBe(2);
      expect(action.headers.length).toBe(2);
      expect(action.data[0].length).toBe(2);

      // No out-of-range physical index leaked in from the raw amount.
      action.indexes.forEach((physicalColumn) => {
        expect(typeof physicalColumn).toBe('number');
        expect(physicalColumn).toBeGreaterThanOrEqual(0);
        expect(physicalColumn).toBeLessThan(3);
      });

      // Undo restores the exact pre-removal data and headers, with no `undefined` cells.
      plugin.undo();

      expect(hot.getData()).toEqual([['a', 'b', 'c']]);
      expect(hot.getColHeader()).toEqual(['H0', 'H1', 'H2']);
    });
  });
});
