import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import { MultiColumnSorting } from 'handsontable/plugins/multiColumnSorting';
import { ManualRowMove } from 'handsontable/plugins/manualRowMove';
import { UndoRedo } from 'handsontable/plugins/undoRedo';

registerPlugin(ColumnSorting);
registerPlugin(MultiColumnSorting);
registerPlugin(ManualRowMove);
registerPlugin(UndoRedo);

/**
 * The sorting plugin sorts from the row order the grid had before the sort, and clearing the sort puts that
 * order back. The order is taken when a sort starts from an unsorted grid, so a row moved or a data load made
 * while nothing was sorted is part of the order the next clear restores.
 */
describe('ColumnSorting -> the pre-sort row order', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Returns four rows whose third column sorts them in another order than the first one.
   *
   * @returns {Array[]}
   */
  function createData() {
    return [[1, 'd', 30], [2, 'a', 10], [3, 'c', 40], [4, 'b', 20]];
  }

  /**
   * Builds a grid with row moving and the given sorting plugin.
   *
   * @param {string} pluginKey The sorting plugin's settings key.
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The sorting plugin.
   */
  function buildGrid(pluginKey, overrides = {}) {
    hot = new Handsontable(container, {
      data: createData(),
      manualRowMove: true,
      [pluginKey]: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...overrides,
    });

    return hot.getPlugin(pluginKey);
  }

  ['columnSorting', 'multiColumnSorting'].forEach((pluginKey) => {
    describe(pluginKey, () => {
      it('keeps a row moved between two sorts when the second sort is cleared', () => {
        const sorting = buildGrid(pluginKey);

        sorting.sort({ column: 2, sortOrder: 'asc' });
        sorting.clearSort();
        hot.getPlugin('manualRowMove').moveRow(3, 0);
        hot.render();

        const unsorted = hot.getDataAtCol(0);

        sorting.sort({ column: 2, sortOrder: 'asc' });
        sorting.clearSort();

        expect(unsorted).toEqual([4, 1, 2, 3]);
        expect(hot.getDataAtCol(0)).toEqual(unsorted);
      });

      it('restores the order of newly loaded data when a sort made after the load is cleared', () => {
        const sorting = buildGrid(pluginKey);

        sorting.sort({ column: 2, sortOrder: 'asc' });
        hot.loadData(createData());
        hot.getPlugin('manualRowMove').moveRow(3, 0);
        hot.render();
        sorting.sort({ column: 2, sortOrder: 'desc' });
        sorting.clearSort();

        expect(hot.getDataAtCol(0)).toEqual([4, 1, 2, 3]);
      });

      it('takes the pre-sort order when sort states are written onto an unsorted grid', () => {
        const sorting = buildGrid(pluginKey);

        sorting.sort({ column: 2, sortOrder: 'asc' });
        sorting.clearSort();
        hot.getPlugin('manualRowMove').moveRow(3, 0);
        hot.render();
        sorting.setSortConfig([{ column: 2, sortOrder: 'asc' }]);
        sorting.clearSort();

        expect(hot.getDataAtCol(0)).toEqual([4, 1, 2, 3]);
      });

      it('undoes a sort clear and a sort made after a row move', () => {
        const sorting = buildGrid(pluginKey, { undo: true });

        sorting.sort({ column: 2, sortOrder: 'asc' });
        sorting.clearSort();
        hot.getPlugin('manualRowMove').moveRow(3, 0);
        hot.render();
        sorting.sort({ column: 2, sortOrder: 'desc' });
        sorting.clearSort();

        hot.getPlugin('undoRedo').undo();

        expect(hot.getDataAtCol(0)).toEqual([3, 1, 4, 2]);

        hot.getPlugin('undoRedo').undo();

        expect(hot.getDataAtCol(0)).toEqual([4, 1, 2, 3]);
      });
    });
  });
});
