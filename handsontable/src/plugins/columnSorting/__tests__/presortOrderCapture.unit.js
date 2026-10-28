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

      [
        {
          name: 'setSortConfig([])',
          dropSortStates: sorting => sorting.setSortConfig([]),
          tieColumn: 2,
        },
        {
          name: 'the removal of the sorted column',
          dropSortStates: () => hot.alter('remove_col', 1),
          tieColumn: 1,
        },
      ].forEach(({ name, dropSortStates, tieColumn }) => {
        describe(`when ${name} leaves the rows sorted with no sort states`, () => {
          it('puts the rows back in their pre-sort order on a later clear', () => {
            const sorting = buildGrid(pluginKey);

            sorting.sort({ column: 1, sortOrder: 'asc' });
            dropSortStates(sorting);
            sorting.clearSort();

            expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4]);
          });

          it('breaks ties of a later sort by the pre-sort order', () => {
            const sorting = buildGrid(pluginKey, {
              data: [[1, 'd', 'x'], [2, 'a', 'y'], [3, 'c', 'x'], [4, 'b', 'y']],
            });

            sorting.sort({ column: 1, sortOrder: 'asc' });
            dropSortStates(sorting);
            sorting.sort({ column: tieColumn, sortOrder: 'asc' });

            expect(hot.getDataAtCol(0)).toEqual([1, 3, 2, 4]);

            sorting.clearSort();

            expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4]);
          });
        });
      });

      [
        {
          name: 'a row insert',
          changeRows: () => hot.alter('insert_row_below', 0),
        },
        {
          name: 'a row removal',
          changeRows: () => hot.alter('remove_row', 0),
        },
      ].forEach(({ name, changeRows }) => {
        /**
         * Sorts the grid, changes its rows while sorted, runs the given steps and clears the sort.
         *
         * @param {Function} [steps] Called with the sorting plugin before the clear.
         * @returns {Array} The first column after the clear.
         */
        function clearAfter(steps = () => {}) {
          const sorting = buildGrid(pluginKey);

          sorting.sort({ column: 2, sortOrder: 'asc' });
          changeRows();
          steps(sorting);
          sorting.clearSort();

          const order = hot.getDataAtCol(0);

          hot.destroy();
          hot = null;

          return order;
        }

        [
          {
            stateDrop: 'setSortConfig([])',
            dropSortStates: sorting => sorting.setSortConfig([]),
          },
          {
            stateDrop: 'the removal of the sorted column',
            dropSortStates: () => hot.alter('remove_col', 2),
          },
        ].forEach(({ stateDrop, dropSortStates }) => {
          it(`clears to the pre-sort order after ${name} on sorted rows, ${stateDrop} and another sort`, () => {
            const directClear = clearAfter();
            const clearAfterAnotherSort = clearAfter((sorting) => {
              dropSortStates(sorting);
              sorting.sort({ column: 1, sortOrder: 'asc' });
            });

            expect(directClear.filter(value => value !== null)).not.toEqual([2, 4, 1, 3]);
            expect(clearAfterAnotherSort).toEqual(directClear);
          });
        });
      });

      it('puts the pre-sort order back after an undone clear, emptied states and another sort', () => {
        const sorting = buildGrid(pluginKey, { undo: true });

        sorting.sort({ column: 2, sortOrder: 'asc' });
        sorting.clearSort();
        hot.getPlugin('undoRedo').undo();

        expect(hot.getDataAtCol(0)).toEqual([2, 4, 1, 3]);

        sorting.setSortConfig([]);
        sorting.sort({ column: 1, sortOrder: 'asc' });
        sorting.clearSort();

        expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4]);
      });

      it('keeps a row moved after a clear when the unsorted grid is cleared again', () => {
        const sorting = buildGrid(pluginKey);

        sorting.sort({ column: 2, sortOrder: 'asc' });
        sorting.clearSort();
        hot.getPlugin('manualRowMove').moveRow(3, 0);
        hot.render();
        sorting.clearSort();

        expect(hot.getDataAtCol(0)).toEqual([4, 1, 2, 3]);
      });

      it('keeps a row moved after an undone sort when a later sort is cleared', () => {
        const sorting = buildGrid(pluginKey, { undo: true });

        sorting.sort({ column: 2, sortOrder: 'asc' });
        sorting.clearSort();
        hot.getPlugin('manualRowMove').moveRow(3, 0);
        hot.render();
        sorting.sort({ column: 2, sortOrder: 'desc' });
        hot.getPlugin('undoRedo').undo();

        expect(hot.getDataAtCol(0)).toEqual([4, 1, 2, 3]);

        sorting.sort({ column: 1, sortOrder: 'asc' });
        sorting.clearSort();

        expect(hot.getDataAtCol(0)).toEqual([4, 1, 2, 3]);
      });
    });
  });
});
