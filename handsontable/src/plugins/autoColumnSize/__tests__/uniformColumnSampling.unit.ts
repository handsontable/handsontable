import Handsontable from 'handsontable/base';
import { registerPlugin, AutoColumnSize } from 'handsontable/plugins';
import { registerRenderer } from 'handsontable/renderers/registry';
import { checkboxRenderer } from 'handsontable/renderers/checkboxRenderer';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(AutoColumnSize);
// Registers the built-in global `modifyAutoColumnSizeSeed` listener, as every full build does.
registerRenderer(checkboxRenderer);

const ROWS = 2000;

/**
 * Builds a two-column grid of `ROWS` rows with AutoColumnSize on.
 *
 * @param {object} settings Settings merged over the defaults.
 * @returns {object} The Handsontable instance.
 */
function buildGrid(settings: Record<string, unknown> = {}) {
  const data = Array.from({ length: ROWS }, (_, row) => [`a${row % 97}`, `b${row % 13}`]);

  return new Handsontable(document.createElement('div'), {
    data,
    autoColumnSize: true,
    licenseKey: TEST_LICENSE_KEY,
    ...settings,
  });
}

/**
 * Walks every row of the first column, from scratch, and counts the meta and value reads it made.
 *
 * @param {object} hot The Handsontable instance.
 * @returns {object} The number of `getCellMetaTransient()` and `getDataAtCell()` calls.
 */
function walkFirstColumn(hot: Handsontable) {
  const plugin = hot.getPlugin('autoColumnSize');
  const metaReads = jest.spyOn(hot, 'getCellMetaTransient');
  const valueReads = jest.spyOn(hot, 'getDataAtCell');

  plugin.clearCache();
  plugin.calculateColumnsWidth(0, undefined, true);

  const counts = { metaReads: metaReads.mock.calls.length, valueReads: valueReads.mock.calls.length };

  metaReads.mockRestore();
  valueReads.mockRestore();

  return counts;
}

describe('AutoColumnSize sampling of a uniform column', () => {
  it('should read the meta of a uniform column once and its values in bulk, not once per row', () => {
    const hot = buildGrid();
    const { metaReads, valueReads } = walkFirstColumn(hot);

    // GhostTable still reads the meta of each sample it renders, so the count is not 1.
    expect(metaReads).toBeLessThan(ROWS / 10);
    expect(valueReads).toBeLessThan(ROWS / 10);

    hot.destroy();
  });

  it.each([
    ['a `beforeGetCellMeta` listener', { beforeGetCellMeta() {} }],
    ['an `afterGetCellMeta` listener', { afterGetCellMeta() {} }],
    ['a grid-level `cells` function', { cells: () => ({}) }],
    ['a column-level `cells` function', { columns: [{ cells: () => ({}) }, {}] }],
  ])('should read every row of the column when the grid has %s', (_, settings) => {
    const hot = buildGrid(settings);
    const { metaReads } = walkFirstColumn(hot);

    expect(metaReads).toBeGreaterThanOrEqual(ROWS);

    hot.destroy();
  });

  it('should read every row of the column when a global `afterGetCellMeta` listener exists', () => {
    const listener = () => {};

    Handsontable.hooks.add('afterGetCellMeta', listener);

    try {
      const hot = buildGrid();
      const { metaReads } = walkFirstColumn(hot);

      expect(metaReads).toBeGreaterThanOrEqual(ROWS);

      hot.destroy();
    } finally {
      Handsontable.hooks.remove('afterGetCellMeta', listener);
    }
  });

  it('should read the meta of a cell that stores meta of its own', () => {
    const hot = buildGrid();
    const valueFormatter = jest.fn((value: unknown) => `${String(value)} with a long suffix`);

    hot.setCellMeta(1500, 0, 'valueFormatter', valueFormatter);
    walkFirstColumn(hot);

    expect(valueFormatter).toHaveBeenCalledTimes(1);
    expect(valueFormatter.mock.calls[0][1]).toEqual(expect.objectContaining({ row: 1500, col: 0 }));

    hot.destroy();
  });

  it('should read the values of only the rows the grid shows', () => {
    const readRows = new Set<number>();
    const hot = buildGrid({
      modifyData(row: number, column: number, _valueHolder: unknown, ioMode: string) {
        if (column === 0 && ioMode === 'get') {
          readRows.add(row);
        }
      },
    });
    const hidingMap = hot.rowIndexMapper.createAndRegisterIndexMap('uniformColumnTest', 'hiding', false);

    hidingMap.setValueAtIndex(5, true);
    hidingMap.setValueAtIndex(1999, true);
    readRows.clear();
    walkFirstColumn(hot);

    expect(readRows.has(5)).toBe(false);
    expect(readRows.has(1999)).toBe(false);
    expect(readRows.has(4)).toBe(true);
    expect(readRows.has(1998)).toBe(true);

    hot.destroy();
  });

  it('should hand a column `valueFormatter` a meta object of its own for each row', () => {
    const seen = new Set<object>();
    const hot = buildGrid({
      columns: [{ valueFormatter: (value: unknown, cellMeta: object) => {
        seen.add(cellMeta);

        return value;
      } }, {}],
    });

    seen.clear();
    walkFirstColumn(hot);

    expect(seen.size).toBeGreaterThanOrEqual(ROWS);

    hot.destroy();
  });

  it('should hand a renderer `valueFormatter` static a meta object of its own for each row', () => {
    const seen = new Set<object>();
    const renderer = Object.assign(() => {}, {
      valueFormatter(value: unknown, cellMeta: object) {
        seen.add(cellMeta);

        return value;
      },
    });
    const hot = buildGrid({ columns: [{ renderer }, {}] });

    seen.clear();
    walkFirstColumn(hot);

    expect(seen.size).toBeGreaterThanOrEqual(ROWS);

    hot.destroy();
  });

  it('should read a cell whose meta a formatter stored during the walk with that meta', () => {
    const storedFormatter = jest.fn((value: unknown) => value);
    // Armed for the measured walk only, so row 1500 has no stored meta when the walk starts.
    let armed = false;
    const hot = buildGrid({
      columns: [{
        valueFormatter(value: unknown, cellMeta: { visualRow: number }) {
          if (armed && cellMeta.visualRow === 10) {
            armed = false;
            hot.setCellMeta(1500, 0, 'valueFormatter', storedFormatter);
          }

          return value;
        },
      }, {}],
    });

    expect(hot._getMetaManager().getCellMetaIfExists(1500, 0)).toBeUndefined();

    armed = true;
    walkFirstColumn(hot);

    expect(storedFormatter).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ row: 1500 }));

    hot.destroy();
  });

  it('should read a column shorter than the reader pays for one cell at a time', () => {
    const hot = new Handsontable(document.createElement('div'), {
      data: Array.from({ length: 10 }, (_, row) => [`a${row}`]),
      autoColumnSize: true,
      licenseKey: TEST_LICENSE_KEY,
    });
    const { valueReads } = walkFirstColumn(hot);

    expect(valueReads).toBe(10);

    hot.destroy();
  });

  it('should hand a `modifyAutoColumnSizeSeed` listener a meta object of its own for each row', () => {
    const seen = new Set<object>();
    const hot = buildGrid({
      modifyAutoColumnSizeSeed(seed: string, cellMeta: { col: number }) {
        if (cellMeta.col === 0) {
          seen.add(cellMeta);
        }

        return seed;
      },
    });

    seen.clear();
    walkFirstColumn(hot);

    expect(seen.size).toBeGreaterThanOrEqual(ROWS);

    hot.destroy();
  });

  it('should reuse one meta object for a column while only the built-in checkbox seed listener exists', () => {
    const hot = buildGrid();
    const metaManager = hot._getMetaManager();
    const transientMetas = jest.spyOn(metaManager, 'createTransientColumnMeta');

    expect(hot.hasHook('modifyAutoColumnSizeSeed')).toBe(true);

    walkFirstColumn(hot);

    expect(transientMetas.mock.calls.length).toBeLessThan(ROWS / 10);

    transientMetas.mockRestore();
    hot.destroy();
  });

  it('should stamp the row of each cell on the meta a seed listener reads', () => {
    const rows: number[] = [];
    const hot = buildGrid({
      modifyAutoColumnSizeSeed(seed: string, cellMeta: { row: number, visualRow: number, col: number }) {
        if (cellMeta.col === 0) {
          rows.push(cellMeta.visualRow);
        }

        return seed;
      },
    });

    rows.length = 0;
    walkFirstColumn(hot);

    expect(rows).toEqual(Array.from({ length: ROWS }, (_, row) => row));

    hot.destroy();
  });
});
