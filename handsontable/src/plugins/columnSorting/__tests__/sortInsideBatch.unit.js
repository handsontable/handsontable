import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import { MultiColumnSorting } from 'handsontable/plugins/multiColumnSorting';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { ViewState } from 'handsontable/plugins/viewState';

registerPlugin(ColumnSorting);
registerPlugin(MultiColumnSorting);
registerPlugin(TrimRows);
registerPlugin(ViewState);

/**
 * `IndexMapper#updateCache()` does not rebuild `notTrimmedIndexesCache` while the mapper is batched.
 * The sort resets the row order to the pre-sort one and then gathers its band, so a band read through
 * that cache holds the PREVIOUS sort's order and the remap lands on the freshly reset sequence. It only
 * shows on a grid that is already sorted: an unsorted grid has the identity order in both.
 */
describe('ColumnSorting -> sort inside a batch on an already sorted grid', () => {
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
   * Builds a grid over three rows, sorted by column 1 descending.
   *
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function buildGrid(overrides = {}) {
    hot = new Handsontable(container, {
      data: [[3, 'c', 'Z'], [1, 'a', 'Y'], [2, 'b', 'X']],
      columnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...overrides,
    });

    return hot;
  }

  /**
   * Reads one column top to bottom, as the grid currently shows it.
   *
   * @param {number} column Visual column index.
   * @returns {Array} The visible values.
   */
  function visibleColumn(column) {
    return Array.from({ length: hot.countRows() }, (_, row) => hot.getDataAtCell(row, column));
  }

  ['columnSorting', 'multiColumnSorting'].forEach((pluginKey) => {
    describe(pluginKey, () => {
      it('should order the rows by the requested column inside `batch()`', () => {
        buildGrid({ columnSorting: false, [pluginKey]: true });

        const plugin = hot.getPlugin(pluginKey);

        plugin.sort(pluginKey === 'columnSorting' ?
          { column: 1, sortOrder: 'desc' } : [{ column: 1, sortOrder: 'desc' }]);

        expect(visibleColumn(1)).toEqual(['c', 'b', 'a']);

        hot.batch(() => {
          plugin.sort(pluginKey === 'columnSorting' ?
            { column: 2, sortOrder: 'asc' } : [{ column: 2, sortOrder: 'asc' }]);
        });

        expect(visibleColumn(2)).toEqual(['X', 'Y', 'Z']);
        expect(plugin.getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
      });

      it('should order the rows when the same column flips direction inside `batch()`', () => {
        buildGrid({ columnSorting: false, [pluginKey]: true });

        const plugin = hot.getPlugin(pluginKey);
        const config = order => (pluginKey === 'columnSorting' ?
          { column: 1, sortOrder: order } : [{ column: 1, sortOrder: order }]);

        plugin.sort(config('desc'));
        hot.batch(() => {
          plugin.sort(config('asc'));
        });

        expect(visibleColumn(1)).toEqual(['a', 'b', 'c']);
      });

      it('should order the rows between `suspendExecution()` and `resumeExecution()`', () => {
        buildGrid({ columnSorting: false, [pluginKey]: true });

        const plugin = hot.getPlugin(pluginKey);

        plugin.sort(pluginKey === 'columnSorting' ?
          { column: 1, sortOrder: 'desc' } : [{ column: 1, sortOrder: 'desc' }]);

        hot.suspendExecution();
        plugin.sort(pluginKey === 'columnSorting' ?
          { column: 2, sortOrder: 'asc' } : [{ column: 2, sortOrder: 'asc' }]);
        hot.resumeExecution();

        expect(visibleColumn(2)).toEqual(['X', 'Y', 'Z']);
      });

      it('should match the order of the same sort made outside a batch', () => {
        buildGrid({ columnSorting: false, [pluginKey]: true });

        const plugin = hot.getPlugin(pluginKey);
        const config = (column, order) => (pluginKey === 'columnSorting' ?
          { column, sortOrder: order } : [{ column, sortOrder: order }]);

        plugin.sort(config(1, 'desc'));
        plugin.sort(config(2, 'asc'));

        const outside = visibleColumn(0);

        plugin.sort(config(1, 'desc'));
        hot.batch(() => {
          plugin.sort(config(2, 'asc'));
        });

        expect(visibleColumn(0)).toEqual(outside);
      });
    });
  });

  it('should keep the sort inside `batch()` correct under a trimmed row', () => {
    buildGrid({ trimRows: [0] });

    const plugin = hot.getPlugin('columnSorting');

    plugin.sort({ column: 1, sortOrder: 'desc' });

    hot.batch(() => {
      plugin.sort({ column: 2, sortOrder: 'asc' });
    });

    expect(visibleColumn(2)).toEqual(['X', 'Y']);
  });

  it('should restore a sort without a `rowOrder` through `setViewState()` on a sorted grid', () => {
    buildGrid({ viewState: true });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

    const result = hot.getPlugin('viewState').setViewState({
      version: 1,
      sort: { columns: [{ column: 2, sortOrder: 'asc' }] },
    });

    expect(result.skipped).toEqual([]);
    expect(visibleColumn(2)).toEqual(['X', 'Y', 'Z']);
  });
});
