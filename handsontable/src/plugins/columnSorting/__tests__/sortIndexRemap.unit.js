import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
import { registerCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { AutoColumnSize } from 'handsontable/plugins/autoColumnSize';
import { DropdownMenu } from 'handsontable/plugins/dropdownMenu';
import { Filters } from 'handsontable/plugins/filters';
import { TrimRows } from 'handsontable/plugins/trimRows';
import { HiddenRows } from 'handsontable/plugins/hiddenRows';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import { MultiColumnSorting } from 'handsontable/plugins/multiColumnSorting';
import { rootComparator } from 'handsontable/plugins/columnSorting/rootComparator';
import { registerRootComparator } from 'handsontable/plugins/columnSorting/sortService';

// `Filters` refuses to start without `DropdownMenu` and the `checkbox` cell type.
registerCellType(CheckboxCellType);
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(TrimRows);
registerPlugin(HiddenRows);
registerPlugin(ColumnSorting);
registerPlugin(MultiColumnSorting);
registerPlugin(Filters);

/**
 * The sort rewrites the whole indexes sequence through a physical-to-physical remap table. The table
 * has to be sized by the SEQUENCE length - the number of physical rows - and never by `countRows()`,
 * which is `getNotTrimmedIndexesLength()` clamped by `maxRows`. Whenever anything trims rows away or
 * `maxRows` caps the view, physical indexes reach past `countRows()`; a table sized by it silently
 * drops those writes and reads back nothing for them, so the rows keep their pre-sort place and the
 * sequence ends up with duplicated physical indexes.
 *
 * Every case below therefore asserts two things: the sequence is still a permutation of all physical
 * indexes (no duplicates, nothing lost), and the visible column really is in sorted order.
 */
describe('ColumnSorting -> physical index remap sizing', () => {
  const ROW_COUNT = 40;

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
    // The comparator registry is module-global - put the built-in comparator back, or every later
    // sort in this process takes the tuple path.
    registerRootComparator('columnSorting', rootComparator);
  });

  /**
   * Registers a custom root comparator that does nothing but forward to the built-in one. A wrapper
   * is not the built-in function, so the identity guard in `sortByPresetSortStates()` sends the run
   * down the tuple path - the path a custom root comparator is documented to receive, and the one
   * that sizes the remap table from the `[physicalRow, ...values]` tuples it sorts.
   */
  function useCustomRootComparator() {
    registerRootComparator('columnSorting', (...args) => rootComparator(...args));
  }

  /**
   * Builds the seed data. The sort key in column 1 is a scrambled permutation of `0..ROW_COUNT - 1`,
   * so no subset of the rows is already in ascending order and a remap that silently skipped a row
   * cannot pass by accident.
   *
   * @returns {Array[]} Rows of `[label, sortKey, parity]`.
   */
  function buildData() {
    return Array.from({ length: ROW_COUNT }, (_, physicalRow) => [
      `R${physicalRow}`,
      (physicalRow * 17) % ROW_COUNT,
      physicalRow % 2 === 0 ? 'even' : 'odd',
    ]);
  }

  /**
   * Builds a grid over the seed data.
   *
   * @param {object} [overrides] Settings merged over the defaults.
   * @returns {object} The Handsontable instance.
   */
  function buildGrid(overrides = {}) {
    hot = new Handsontable(container, {
      data: buildData(),
      colHeaders: ['Label', 'Key', 'Parity'],
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

  /**
   * Asserts that the indexes sequence still holds every physical index exactly once.
   */
  function expectSequenceIsAPermutation() {
    const sequence = hot.rowIndexMapper.getIndexesSequence();

    // `minSpareRows` can append a physical row, so the expected count comes from the mapper rather
    // than the seed. A remap that dropped a row shows up as a duplicate, which this still catches.
    expect(sequence.length).toBeGreaterThanOrEqual(ROW_COUNT);
    expect([...sequence].sort((a, b) => a - b)).toEqual(
      Array.from({ length: sequence.length }, (_, index) => index)
    );
  }

  it('sorts a grid that has both `trimRows` and `filters` trimming rows away', () => {
    // Trimming the first eight rows pulls `countRows()` down to 32 while physical rows 32..39 are
    // still on screen - the exact shape that a `countRows()`-sized table drops.
    buildGrid({
      trimRows: [0, 1, 2, 3, 4, 5, 6, 7],
      filters: true,
      columnSorting: true,
    });

    const filters = hot.getPlugin('filters');

    filters.addCondition(2, 'eq', ['even']);
    filters.filter();

    const visibleBefore = visibleColumn(0);

    expect(visibleBefore).toEqual([
      'R8', 'R10', 'R12', 'R14', 'R16', 'R18', 'R20', 'R22',
      'R24', 'R26', 'R28', 'R30', 'R32', 'R34', 'R36', 'R38',
    ]);

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const keys = visibleColumn(1);

    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expectSequenceIsAPermutation();
  });

  it('sorts a grid whose view is capped by `maxRows` alone, with nothing trimmed', () => {
    // Nothing is trimmed here: `countRows()` is 20 purely because of `maxRows`, while the sequence
    // still carries all 40 physical indexes. The sequence is reordered first - under the identity
    // sequence the top 20 visual rows happen to be physical 0..19, so the undersized table would
    // hold them all and the case would pass either way.
    buildGrid({ maxRows: 20, columnSorting: true });

    expect(hot.countRows()).toBe(20);
    expect(hot.rowIndexMapper.getIndexesSequence()).toHaveLength(ROW_COUNT);

    const tail = Array.from({ length: 20 }, (_, index) => index + 20);
    const head = Array.from({ length: 20 }, (_, index) => index);

    hot.rowIndexMapper.setIndexesSequence([...tail, ...head]);

    // Visual rows 0..19 are now physical 20..39, every one of them past `countRows()`.
    expect(hot.toPhysicalRow(0)).toBe(20);
    expect(hot.toPhysicalRow(19)).toBe(39);

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const keys = visibleColumn(1);

    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expectSequenceIsAPermutation();
  });

  it('keeps the rows outside the sortable band in place while trimming is on', () => {
    // `fixedRowsTop` / `fixedRowsBottom` / `minSpareRows` shrink the sorted band, so only part of the
    // sequence is remapped and the fall-through-to-itself branch has to carry the rest.
    buildGrid({
      trimRows: [0, 1, 2, 3, 4, 5, 6, 7],
      columnSorting: true,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
      minSpareRows: 1,
    });

    const pinnedTop = visibleColumn(0).slice(0, 2);
    const allRows = visibleColumn(0);
    // `fixedRowsBottom` and the spare row overlap, so the excluded bottom band is
    // `Math.max(minSpareRows, fixedRowsBottom)` - two rows, not three.
    const pinnedBottom = allRows.slice(allRows.length - 2);

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const afterRows = visibleColumn(0);

    expect(afterRows.slice(0, 2)).toEqual(pinnedTop);
    expect(afterRows.slice(afterRows.length - 2)).toEqual(pinnedBottom);

    const sortedBandKeys = visibleColumn(1).slice(2, afterRows.length - 2);

    expect(sortedBandKeys).toEqual([...sortedBandKeys].sort((a, b) => a - b));
    expectSequenceIsAPermutation();
  });

  it('sorts a trimmed grid through `multiColumnSorting` as well', () => {
    // `MultiColumnSorting` inherits `sortByPresetSortStates()` untouched, so the remap has to hold
    // for a multi-column preset too.
    buildGrid({
      trimRows: [0, 1, 2, 3, 4, 5, 6, 7],
      multiColumnSorting: true,
    });

    hot.getPlugin('multiColumnSorting').sort([
      { column: 2, sortOrder: 'asc' },
      { column: 1, sortOrder: 'desc' },
    ]);

    const parities = visibleColumn(2);
    const keys = visibleColumn(1);

    expect(parities).toEqual([...parities].sort());

    parities.forEach((parity, row) => {
      if (row > 0 && parities[row - 1] === parity) {
        expect(keys[row - 1]).toBeGreaterThan(keys[row]);
      }
    });

    expectSequenceIsAPermutation();
  });

  it('keeps the sequence a permutation when it carries an index above the physical row count', () => {
    // `setIndexesSequence()` is public - the persist-row-order recipe teaches users to call it - and
    // it accepts an index above the number of physical rows. Such an index still enters the sorted
    // band, so a remap table sized by the sequence LENGTH alone would drop its write and hand two
    // sequence slots the same physical index.
    //
    // `sortEmptyCells: true` is what makes the case able to fail. The out-of-range row has no data,
    // so under the default the compare function parks it last in both orders - exactly where it
    // already sits - and it would map to itself whether or not the table held it.
    buildGrid({ columnSorting: { sortEmptyCells: true } });

    const sequence = [...hot.rowIndexMapper.getIndexesSequence(), ROW_COUNT + 5];

    hot.rowIndexMapper.setIndexesSequence(sequence);
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const sortedSequence = hot.rowIndexMapper.getIndexesSequence();

    expect(sortedSequence.some(index => Number.isNaN(index))).toBe(false);
    // The same multiset the sequence went in with - nothing duplicated, nothing lost.
    expect([...sortedSequence].sort((a, b) => a - b)).toEqual([...sequence].sort((a, b) => a - b));
  });

  it('sorts a trimmed grid that a custom root comparator sends down the tuple path', () => {
    // The remap table is shared by both sort paths, but only the positions path is covered above.
    // A custom root comparator takes the tuple path, where the band's physical indexes come off the
    // tuples rather than out of the gather loop - and trimming is what makes them reach past
    // `countRows()`.
    useCustomRootComparator();

    buildGrid({ trimRows: [0, 1, 2, 3, 4, 5, 6, 7], columnSorting: true });

    // The premise: `countRows()` is 32 while physical rows 32..39 are still inside the sorted band.
    expect(hot.countRows()).toBe(32);
    expect(hot.toPhysicalRow(hot.countRows() - 1)).toBe(ROW_COUNT - 1);

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const keys = visibleColumn(1);

    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expectSequenceIsAPermutation();
  });

  it('sorts a grid with hidden rows that a custom root comparator sends down the tuple path', () => {
    // Hiding leaves the rows in the visual index space, so the whole band is sorted and read back.
    // This is the tuple path's correctness case next to the sizing cases - descending, so an
    // untouched sequence cannot pass for a sorted one.
    useCustomRootComparator();

    buildGrid({ hiddenRows: { rows: [2, 5, 11], indicators: false }, columnSorting: true });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

    const keys = visibleColumn(1);

    expect(keys).toEqual([...keys].sort((a, b) => b - a));
    expectSequenceIsAPermutation();
  });

  it('puts a trimmed grid in the same order on the tuple path as on the positions path', () => {
    buildGrid({ trimRows: [0, 1, 2, 3, 4, 5, 6, 7], columnSorting: true });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    const positionsPathOrder = visibleColumn(0);
    const positionsPathSequence = [...hot.rowIndexMapper.getIndexesSequence()];

    expectSequenceIsAPermutation();

    // A second grid rather than a second sort of the first one: sorting an already sorted band
    // would hand the tuple path an input the identity order already satisfies.
    hot.destroy();
    hot = null;
    container.remove();
    container = document.createElement('div');
    document.body.appendChild(container);

    useCustomRootComparator();

    buildGrid({ trimRows: [0, 1, 2, 3, 4, 5, 6, 7], columnSorting: true });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(visibleColumn(0)).toEqual(positionsPathOrder);
    expect([...hot.rowIndexMapper.getIndexesSequence()]).toEqual(positionsPathSequence);
    expectSequenceIsAPermutation();
  });
});
