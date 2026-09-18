import Handsontable from '../../../base';
import { registerAllCellTypes } from '../../../registry';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { HiddenRows } from '../../hiddenRows/hiddenRows';

// The sort gather loop reads its input through `Core#_getDataAtColumnForRows()`, which resolves the
// column coordinates once and then reads the source rows directly. That fast loop runs no user code,
// so everything that can transform a value on the way out of `getDataAtCell()` has to be probed
// first: a `valueGetter` (every one of `autocomplete`, `dropdown` and `multiSelect` ships one), a
// `columns[].data` accessor, a `dataDotNotation` path, and the `modifyRowData` / `modifyData` /
// `modifySourceData` hooks.
//
// A wrong guard does not throw - it hands the comparator a different value and the grid sorts into a
// different order, which a fixed benchmark cannot see. Each case below therefore asserts the bulk
// read against the per-cell read it replaces, and asserts the transformed value is the one that came
// out, so a case cannot pass by both paths being equally wrong.
registerAllCellTypes();

describe('the guarded bulk column read behind the sort gather loop', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(ColumnSorting);
    registerPlugin(HiddenRows);
  });

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
   * Builds a grid with the sorting plugin on.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function build(settings) {
    return new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columnSorting: true,
      ...settings,
    });
  }

  /**
   * Reads one column twice: once through the public per-cell API, once through the bulk accessor the
   * gather loop uses. Nothing here stores cell meta, so the two reads cannot contaminate each other.
   *
   * @param {number} column Visual column index.
   * @returns {{perCell: Array, bulk: Array}}
   */
  function readBothWays(column) {
    const perCell = [];
    const physicalRows = [];

    for (let row = 0; row < hot.countRows(); row++) {
      perCell.push(hot.getDataAtCell(row, column));
      physicalRows.push(hot.toPhysicalRow(row));
    }

    return { perCell, bulk: hot._getDataAtColumnForRows(column, physicalRows) };
  }

  it('should read a plain array-of-arrays column exactly as the per-cell path does', () => {
    hot = build({ data: [['C', 3], ['A', 1], ['B', 2]] });

    const { perCell, bulk } = readBothWays(0);

    expect(bulk).toEqual(['C', 'A', 'B']);
    expect(bulk).toEqual(perCell);
  });

  it('should keep the `valueGetter` a column-level cell type declares', () => {
    // The `dropdown` getter unwraps a `{ value }` entry. Skipping it hands the comparator the raw
    // object, so this is the value-identical-because-guarded case, not a formatting detail.
    //
    // This case does NOT discriminate the column-layer probe: jsdom renders every row, so every cell
    // here carries stored meta and the per-row fallback alone would answer correctly. The probe's own
    // coverage is `dataMap.unit.js` ("when the column layer declares a `valueGetter`", against a
    // context with no stored meta) and the real-browser legs in `tests/e2e/sort-value-getter-guard`.
    hot = build({
      data: [[{ value: 'C' }], [{ value: 'A' }], [{ value: 'B' }]],
      columns: [{ type: 'dropdown', source: ['A', 'B', 'C'] }],
    });

    const { perCell, bulk } = readBothWays(0);

    expect(bulk).toEqual(['C', 'A', 'B']);
    expect(bulk).toEqual(perCell);
  });

  it('should keep a `valueGetter` stored on a single cell far outside the viewport', () => {
    const data = [];

    for (let row = 0; row < 500; row++) {
      data.push([`v${row}`]);
    }

    data[400] = [{ value: 'M' }];

    hot = build({
      data,
      // A declarative `cell` entry stores meta for that one cell, which no column-layer probe sees.
      cell: [{ row: 400, col: 0, type: 'dropdown', source: ['M'] }],
    });

    const { perCell, bulk } = readBothWays(0);

    expect(bulk[400]).toBe('M');
    expect(bulk).toEqual(perCell);
  });

  it('should keep a `valueGetter` assigned imperatively with `setCellMeta()`', () => {
    hot = build({ data: [['C'], ['A'], ['B']] });

    hot.setCellMeta(1, 0, 'valueGetter', value => `${value}!`);

    const { perCell, bulk } = readBothWays(0);

    expect(bulk).toEqual(['C', 'A!', 'B']);
    expect(bulk).toEqual(perCell);
  });

  it('should keep a `columns[].data` accessor function on the read path', () => {
    const accessor = jest.fn(row => row.label);

    hot = build({
      data: [{ label: 'C' }, { label: 'A' }, { label: 'B' }],
      columns: [{ data: accessor }],
    });

    const { perCell, bulk } = readBothWays(0);

    expect(bulk).toEqual(['C', 'A', 'B']);
    expect(bulk).toEqual(perCell);
    expect(accessor).toHaveBeenCalled();
  });

  it('should keep a `dataDotNotation` property path on the read path', () => {
    hot = build({
      data: [{ nested: { label: 'C' } }, { nested: { label: 'A' } }, { nested: { label: 'B' } }],
      columns: [{ data: 'nested.label' }],
    });

    const { perCell, bulk } = readBothWays(0);

    expect(bulk).toEqual(['C', 'A', 'B']);
    expect(bulk).toEqual(perCell);
  });

  it('should read through the row a `modifyRowData` listener swaps in', () => {
    // The hook NestedRows registers. It is ungated on the per-cell path, so a grid that relies on it
    // must never reach the fast loop.
    hot = build({
      data: [['C'], ['A'], ['B']],
      modifyRowData: physicalRow => (physicalRow === 1 ? ['swapped'] : undefined),
    });

    const { perCell, bulk } = readBothWays(0);

    expect(bulk).toEqual(['C', 'swapped', 'B']);
    expect(bulk).toEqual(perCell);
  });

  it('should apply a `modifyData` listener', () => {
    // The hook Formulas registers to hand out calculated values.
    hot = build({
      data: [['C'], ['A'], ['B']],
      modifyData: (row, column, valueHolder, ioMode) => {
        if (ioMode === 'get') {
          valueHolder.value = `${valueHolder.value}*`;
        }
      },
    });

    const { perCell, bulk } = readBothWays(0);

    expect(bulk).toEqual(['C*', 'A*', 'B*']);
    expect(bulk).toEqual(perCell);
  });

  it('should re-read the hook probes on every call', () => {
    hot = build({ data: [['C'], ['A'], ['B']] });

    expect(hot._getDataAtColumnForRows(0, [0, 1, 2])).toEqual(['C', 'A', 'B']);

    // A host app can register a listener at any time, so a probe answer cached across calls would
    // keep the fast loop running against data that is no longer what the grid reads.
    hot.addHook('modifyRowData', physicalRow => (physicalRow === 1 ? ['swapped'] : undefined));

    expect(hot._getDataAtColumnForRows(0, [0, 1, 2])).toEqual(['C', 'swapped', 'B']);
  });

  it('should follow the physical row indexes it is given when rows are hidden', () => {
    hot = build({
      data: [['C'], ['A'], ['B'], ['D']],
      hiddenRows: { rows: [1], indicators: false },
    });

    const { perCell, bulk } = readBothWays(0);

    expect(bulk).toEqual(perCell);
    expect(bulk.length).toBe(hot.countRows());
  });

  it('should read a row that maps past the source data as empty', () => {
    hot = build({ data: [['C'], ['A']] });

    // The transient state an undo of a row removal goes through: the mapper is one index longer than
    // the source array.
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2]);

    const { perCell, bulk } = readBothWays(0);

    expect(bulk[2]).toBe(null);
    expect(bulk).toEqual(perCell);
  });

  it('should sort a `dropdown` column by the value its `valueGetter` returns', () => {
    hot = build({
      data: [[{ value: 'C' }], [{ value: 'A' }], [{ value: 'B' }]],
      columns: [{ type: 'dropdown', source: ['A', 'B', 'C'] }],
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    // Without the getter the comparator would see three objects, compare them as equal and leave the
    // stable order untouched - so this order is what proves the slow path ran.
    expect([hot.getDataAtCell(0, 0), hot.getDataAtCell(1, 0), hot.getDataAtCell(2, 0)])
      .toEqual(['A', 'B', 'C']);
  });

  it('should fall back to the per-cell path only for the rows that carry stored meta', () => {
    const valueGetter = jest.fn(value => value);

    hot = build({ data: [['C'], ['A'], ['B']] });

    hot.setCellMeta(1, 0, 'valueGetter', valueGetter);
    valueGetter.mockClear();

    // One stored row among three: the fast loop must cover the other two, and the probe must not be
    // cheap by being wrong. A render is not involved here, so the count is the accessor's alone.
    expect(hot._getDataAtColumnForRows(0, [0, 1, 2])).toEqual(['C', 'A', 'B']);
    expect(valueGetter).toHaveBeenCalledTimes(1);
  });
});
