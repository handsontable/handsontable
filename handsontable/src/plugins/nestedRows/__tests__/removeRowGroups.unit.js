import Handsontable from 'handsontable/base';
import { registerPlugin, NestedRows, ColumnSorting, UndoRedo } from 'handsontable/plugins';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(NestedRows);
registerPlugin(ColumnSorting);
registerPlugin(UndoRedo);

/**
 * `alter('remove_row', [[index, amount], ...])` removes several groups in one call. NestedRows widens a
 * removed parent to its whole subtree and expands the collapsed parents while it removes, so the later
 * groups are followed by their rows, not by an index offset counted from the amounts the groups name.
 */
describe('NestedRows removal of several row groups in one call', () => {
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
   * Builds a grid of three parents with two children each. Physical rows:
   * A (0), A1 (1), A2 (2), B (3), B1 (4), B2 (5), C (6), C1 (7), C2 (8).
   *
   * @param {object} [settings] Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings = {}) {
    hot = new Handsontable(container, {
      data: ['A', 'B', 'C'].map(name => ({
        name,
        __children: [{ name: `${name}1` }, { name: `${name}2` }],
      })),
      columns: [{ data: 'name' }],
      rowHeaders: true,
      nestedRows: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads the names of the visible rows, top to bottom.
   *
   * @returns {string[]}
   */
  function visibleNames() {
    return Array.from({ length: hot.countRows() }, (_, row) => hot.getDataAtCell(row, 0));
  }

  /**
   * Waits for the re-collapse a removal runs a tick later.
   *
   * @returns {Promise}
   */
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));

  it('removes the rows every group names when an earlier group is a parent', () => {
    buildGrid();

    hot.alter('remove_row', [[visibleNames().indexOf('B'), 1], [visibleNames().indexOf('C2'), 1]]);

    expect(visibleNames()).toEqual(['A', 'A1', 'A2', 'C', 'C1']);
  });

  it('removes nothing more when a later group sits inside an earlier group\'s subtree', () => {
    buildGrid();

    // B1 goes with B. Counting by amounts aimed the second group at C1, which nobody named.
    hot.alter('remove_row', [[visibleNames().indexOf('B'), 1], [visibleNames().indexOf('B2'), 1]]);

    expect(visibleNames()).toEqual(['A', 'A1', 'A2', 'C', 'C1', 'C2']);
  });

  it('removes the rows every group names while a parent above them is collapsed', async() => {
    buildGrid();
    hot.getPlugin('nestedRows').collapseParent(0);

    expect(visibleNames()).toEqual(['A', 'B', 'B1', 'B2', 'C', 'C1', 'C2']);

    // The indexes name the collapsed view, and the first removal expands A on its way.
    hot.alter('remove_row', [[visibleNames().indexOf('B1'), 1], [visibleNames().indexOf('C1'), 1]]);
    await settle();

    expect(visibleNames()).toEqual(['A', 'B', 'B2', 'C', 'C2']);
  });

  it('undoes a removal of several groups in one step', async() => {
    buildGrid();

    hot.alter('remove_row', [[visibleNames().indexOf('B'), 1], [visibleNames().indexOf('C2'), 1]]);
    await settle();
    hot.getPlugin('undoRedo').undo();

    expect(visibleNames()).toEqual(['A', 'A1', 'A2', 'B', 'B1', 'B2', 'C', 'C1', 'C2']);
  });

  it('keeps a cell layer on its row when a parent above it and the last row go in one call', async() => {
    buildGrid();
    // A whole column (layer 0) and C1 (layer 1). The whole column ends on C2, the last row.
    hot.selectColumns(0);
    hot.selection.setRangeStart(hot._createCellCoords(visibleNames().indexOf('C1'), 0), true);

    hot.alter('remove_row', [[visibleNames().indexOf('B'), 1], [visibleNames().indexOf('C2'), 1]]);
    await settle();

    expect(visibleNames()).toEqual(['A', 'A1', 'A2', 'C', 'C1']);

    const [, cellLayer] = hot.getSelected();

    expect(hot.getDataAtCell(cellLayer[0], 0)).toBe('C1');
    expect(cellLayer[0]).toBe(cellLayer[2]);
  });
});

describe('Core removal of several row groups in one call', () => {
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
   * Reads the first column of every visible row.
   *
   * @returns {string[]}
   */
  function visibleValues() {
    return hot.getDataAtCol(0);
  }

  it('removes the same rows as before on a grid where a removal takes what it names', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 10 }, (_, row) => [`r${row}`]),
      licenseKey: TEST_LICENSE_KEY,
    });

    // Unsorted, overlapping and past the end: the groups are normalized and clipped first.
    hot.alter('remove_row', [[7, 1], [1, 2], [2, 2], [9, 5], [-3, 4]]);

    expect(visibleValues()).toEqual(['r4', 'r5', 'r6', 'r8']);
  });

  it('removes the visual rows the groups name on a sorted grid', () => {
    hot = new Handsontable(container, {
      data: [['d'], ['a'], ['c'], ['e'], ['b']],
      columnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } },
      licenseKey: TEST_LICENSE_KEY,
    });

    expect(visibleValues()).toEqual(['a', 'b', 'c', 'd', 'e']);

    hot.alter('remove_row', [[0, 1], [2, 1], [4, 1]]);

    expect(visibleValues()).toEqual(['b', 'd']);
  });

  it('keeps removing the later groups when a beforeRemoveRow listener vetoes one', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => [`r${row}`]),
      licenseKey: TEST_LICENSE_KEY,
      beforeRemoveRow: index => index !== 1,
    });

    hot.alter('remove_row', [[1, 1], [3, 1]]);

    expect(visibleValues()).toEqual(['r0', 'r1', 'r2', 'r4', 'r5']);
  });
});
