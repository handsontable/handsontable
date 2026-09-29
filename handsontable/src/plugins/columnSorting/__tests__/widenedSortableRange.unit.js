import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { rootComparator } from '../rootComparator';
import { registerRootComparator } from '../sortService';

// A subclass may widen the sortable band past `countRows()`, and `toPhysicalRow()` then answers `null`
// for every visual row past the end. Both sort paths gather those rows into a plain array - never an
// `Int32Array`, where `null` would read back as the real physical row 0 - and the remap table refuses
// the pair rather than writing that `null` into it.
//
// The subclass is registered under its parent's own key, the way a modular build swaps in a customized
// plugin. `registerPlugin()` is a no-op once the key is taken, so this file must not register the
// built-in plugin first, which is why it lives apart from `sortPathSelection.unit.js`.
class WidenedColumnSorting extends ColumnSorting {
  getNumberOfRowsToSort(numberOfRows) {
    return numberOfRows + 3;
  }
}

describe('a subclass that widens `getNumberOfRowsToSort()`', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(WidenedColumnSorting);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    registerRootComparator('columnSorting', rootComparator);
  });

  /**
   * Builds a three-row grid sorted by the widened subclass.
   *
   * @param {object} columnSorting The plugin settings.
   * @returns {Handsontable} The grid.
   */
  function build(columnSorting) {
    return new Handsontable(container, {
      data: [['a', 30], ['b', 10], ['c', 20]],
      columnSorting,
      licenseKey: 'non-commercial-and-evaluation',
    });
  }

  /**
   * Replaces the grid, so the second leg of a case starts from an unsorted one.
   *
   * @param {object} columnSorting The plugin settings.
   * @returns {Handsontable} The grid.
   */
  function rebuild(columnSorting) {
    hot.destroy();
    container.remove();
    container = document.createElement('div');
    document.body.appendChild(container);

    return build(columnSorting);
  }

  it('should widen the band it gathers, so the rows past the end really are in it', () => {
    hot = build(true);

    const gathered = [];

    hot.addHook('beforeColumnSort', () => {
      gathered.push(hot.getPlugin('columnSorting').getNumberOfRowsToSort(hot.countRows()));
    });
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(gathered).toEqual([6]);
    expect(hot.countRows()).toBe(3);
  });

  it('should sort the real rows, and identically on both paths', () => {
    hot = build(true);
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual(['b', 'c', 'a']);
    expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([1, 2, 0]);

    // A wrapper is not the built-in function, so this run takes the tuple path.
    registerRootComparator('columnSorting', (...args) => rootComparator(...args));

    hot = rebuild(true);
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual(['b', 'c', 'a']);
    expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([1, 2, 0]);
  });

  it('should not remap a real row onto physical row 0 when the rows past the end sort first', () => {
    // The rows past the end read as empty, so `sortEmptyCells` puts them ahead of every real row and
    // the remap is asked to send real physical indexes to the `null` those rows carry. A typed array
    // coerces that `null` to `0`, which would point all three real rows at physical row 0 - one row
    // repeated three times, with no error. The `Map` this replaced fell through to each row's own
    // index instead, leaving the sequence untouched, which is what both paths still do.
    hot = build({ sortEmptyCells: true });
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const sequence = hot.rowIndexMapper.getIndexesSequence();

    expect(sequence).toEqual([0, 1, 2]);
    expect(new Set(sequence).size).toBe(sequence.length);
    expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c']);

    registerRootComparator('columnSorting', (...args) => rootComparator(...args));

    hot = rebuild({ sortEmptyCells: true });
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([0, 1, 2]);
    expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c']);
  });
});
