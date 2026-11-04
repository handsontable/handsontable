import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ExportFile } from '../exportFile';
import { Formulas } from '../../formulas';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import ExportDataProvider from '../dataProvider';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * DEV-3648: the xlsx export reads what the Formulas engine holds for a cell (its error code, its
 * computed value and, with `exportFormulas`, the size of the array it spills) in ONE pass over the
 * export range. Three passes read every cell's type and value up to three times, on every export
 * with the plugin on, `exportFormulas` or not.
 */
describe('Xlsx export: the engine facts of a cell', () => {
  let container;
  let hot;
  let writeSpy;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(ExportFile);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    writeSpy.mockRestore();
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  function createGrid(data) {
    hot = new Handsontable(container, {
      data,
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      exportFile: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    return hot.getPlugin('formulas');
  }

  /**
   * Records the engine reads made while `ExportDataProvider#getEngineCellFacts` runs, and nothing
   * else: the grid's own hooks read the engine too while the provider collects the displayed data,
   * outside that window. Each read is logged as `[method, row, col]`.
   *
   * @param {object} engine The engine.
   * @returns {{ reads: Array[], factsCalls: jest.SpyInstance }}
   */
  function recordFactsReads(engine) {
    const reads = [];
    const original = ExportDataProvider.prototype.getEngineCellFacts;
    let active = false;

    const factsCalls = jest.spyOn(ExportDataProvider.prototype, 'getEngineCellFacts')
      .mockImplementation(function(...args) {
        active = true;

        try {
          return original.apply(this, args);
        } finally {
          active = false;
        }
      });

    ['getCellType', 'getCellValue'].forEach((method) => {
      const read = engine[method].bind(engine);

      jest.spyOn(engine, method).mockImplementation((address) => {
        if (active) {
          reads.push([method, address.row, address.col]);
        }

        return read(address);
      });
    });

    return { reads, factsCalls };
  }

  it.each([false, true])('should read each cell\'s type and value at most once (exportFormulas: %s)',
    async(exportFormulas) => {
      // `SEQUENCE(2)`'s size comes from HyperFormula's array mapping, so the walk fallback
      // (`walkArraySize`), which reads the cells next to a master, never runs on this grid: every read
      // counted here is the main loop's.
      const { engine } = createGrid([['=SEQUENCE(2)', 1, '=1/0'], [null, 'x', '=A1+1']]);
      const { reads, factsCalls } = recordFactsReads(engine);

      await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas });

      expect(factsCalls).toHaveBeenCalledTimes(1);
      expect(reads.length).toBeGreaterThan(0);

      const counts = new Map();

      reads.forEach((read) => {
        const key = read.join(':');

        counts.set(key, (counts.get(key) ?? 0) + 1);
      });

      expect([...counts].filter(([, count]) => count > 1)).toEqual([]);

      const [snapshot] = writeSpy.mock.calls[0];
      const { rows } = snapshot.sheets[0];

      // The facts the single pass collects still reach the file.
      expect(rows[1][0].value).toBe(2);

      if (exportFormulas) {
        expect(rows[1][2].formula).toEqual(expect.objectContaining({ text: 'A1+1', result: 2 }));
        expect(rows[0][0].formula).toEqual(expect.objectContaining({ array: { ref: 'A1:A2', dynamic: true } }));
        expect(rows[0][2].formula).toEqual(expect.objectContaining({ text: '1/0', result: '#DIV/0!' }));
      } else {
        expect(rows[1][2].value).toBe(2);
        expect(rows[0][2]).toEqual(expect.objectContaining({ value: '#DIV/0!', valueIsError: true }));
      }
    });

  it('should skip a cell the engine has no row for, instead of asking the engine for a negative index',
    async() => {
      const formulas = createGrid([['=1/0', 2], ['=1+1', 3]]);
      const { engine, rowAxisSyncer } = formulas;
      const toHfIndex = rowAxisSyncer.getHfIndexFromVisualIndex.bind(rowAxisSyncer);

      jest.spyOn(rowAxisSyncer, 'getHfIndexFromVisualIndex')
        .mockImplementation(row => (row === 1 ? -1 : toHfIndex(row)));

      const { reads } = recordFactsReads(engine);

      await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true });

      const askedRows = reads.map(([, row]) => row);

      expect(askedRows).not.toContain(-1);
      // The skip is per cell: row 0 is still read, and its facts still reach the file.
      expect(askedRows).toContain(0);

      const [snapshot] = writeSpy.mock.calls[0];
      const { rows } = snapshot.sheets[0];

      expect(rows[0][0].formula).toEqual(expect.objectContaining({ text: '1/0', result: '#DIV/0!' }));
    });

  it('should build no matrix without the Formulas plugin, and still export the values', async() => {
    // Every export without the plugin used to build a matrix of `null`s, one callback per cell.
    hot = new Handsontable(container, {
      data: [[1, '#N/A'], [2, 'b']],
      exportFile: true,
      licenseKey: TEST_LICENSE_KEY,
    });
    const facts = jest.spyOn(ExportDataProvider.prototype, 'getEngineCellFacts');

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx');

    expect(facts).toHaveBeenCalledTimes(1);
    expect(facts.mock.results[0].value).toBeNull();

    const [snapshot] = writeSpy.mock.calls[0];

    expect(snapshot.sheets[0].rows[0][1].value).toBe('#N/A');
    expect(snapshot.sheets[0].rows[1][1].value).toBe('b');
  });
});
