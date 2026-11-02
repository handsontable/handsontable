import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ExportFile } from '../exportFile';
import { Formulas } from '../../formulas';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';

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
  });

  function createGrid(data) {
    hot = new Handsontable(container, {
      data,
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot.getPlugin('formulas');
  }

  /**
   * Tells whether the engine call in progress comes straight from the export data provider: the
   * nearest frame of the repository's sources is in `dataProvider.ts`. The grid's own hooks read the
   * engine too while the provider collects the displayed data, with the provider further up.
   *
   * @returns {boolean}
   */
  function isProviderRead() {
    const sourceFrame = new Error().stack.split('\n')
      .find(frame => frame.includes('/src/') && !frame.includes('__tests__'));

    return sourceFrame?.includes('exportFile/dataProvider') === true;
  }

  /**
   * Counts, per method and engine cell, the reads the export data provider makes itself.
   *
   * @param {object} engine The engine.
   * @returns {Map<string, number>}
   */
  function countProviderReads(engine) {
    const counts = new Map();

    ['getCellType', 'getCellValue'].forEach((method) => {
      const original = engine[method].bind(engine);

      jest.spyOn(engine, method).mockImplementation((address) => {
        if (isProviderRead()) {
          const key = `${method}:${address.row},${address.col}`;

          counts.set(key, (counts.get(key) ?? 0) + 1);
        }

        return original(address);
      });
    });

    return counts;
  }

  it.each([false, true])('should read each cell\'s type and value at most once (exportFormulas: %s)',
    async(exportFormulas) => {
      const { engine } = createGrid([['=SEQUENCE(2)', 1, '=1/0'], [null, 'x', '=A1+1']]);
      const counts = countProviderReads(engine);

      await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas });

      expect(counts.size).toBeGreaterThan(0);
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
      const asked = [];

      jest.spyOn(rowAxisSyncer, 'getHfIndexFromVisualIndex')
        .mockImplementation(row => (row === 1 ? -1 : toHfIndex(row)));
      ['getCellType', 'getCellValue'].forEach((method) => {
        const original = engine[method].bind(engine);

        jest.spyOn(engine, method).mockImplementation((address) => {
          if (isProviderRead()) {
            asked.push(address.row);
          }

          return original(address);
        });
      });

      await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true });

      expect(asked).not.toContain(-1);
    });
});
