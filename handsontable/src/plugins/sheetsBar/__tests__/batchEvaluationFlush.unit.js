import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * DEV-202: with `formulas.batchEvaluation: true` a write made while the grid's execution is suspended keeps the
 * HyperFormula engine suspended, and the engine refuses value reads ("Computations are suspended") until it
 * recalculates. The sheets bar reads the engine in two places that run inside such a hold, and each goes through
 * `Formulas#flushEngineEvaluation()` first: the formula text it reads back into an inactive sheet whose engine order
 * is not physical (`getFillRangeData()`), and the workbook it plans from an engine (`getSheetSerialized()`).
 */
describe('SheetsBar with formulas.batchEvaluation', () => {
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
    jest.restoreAllMocks();
  });

  /**
   * @returns {HyperFormula} A fresh engine.
   */
  function buildEngine() {
    return HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
  }

  /**
   * @param {HyperFormula} engine The engine.
   * @param {string} name The sheet name.
   * @param {Array} data The sheet's data.
   * @param {object} [settings] More settings of the sheet.
   * @returns {object} A sheet entry bound to `engine` under `name`, holding its writes.
   */
  function boundSheet(engine, name, data, settings = {}) {
    return { name, data, settings: { ...settings, formulas: { engine, sheetName: name, batchEvaluation: true } } };
  }

  describe('the formula text read back into an inactive sheet whose rows were sorted', () => {
    /**
     * Builds a workbook whose `Report` sheet reads `Main`, sorts `Report` (so its engine order is not physical and
     * the read takes the `getFillRangeData()` branch), and makes `Main` the active sheet again.
     *
     * @returns {{ engine: HyperFormula, reportId: number }}
     */
    function buildSortedReport() {
      const engine = buildEngine();

      hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [
            boundSheet(engine, 'Main', [[1, '=A1*2'], [2, '=A2*2'], [3, '=A3*2']]),
            boundSheet(engine, 'Report', [[3, '=Main!B1'], [1, '=Main!B2'], [2, '=Main!B3']], { columnSorting: true }),
          ],
        },
        licenseKey: TEST_LICENSE_KEY,
        renderAllRows: true,
        renderAllColumns: true,
      });

      const sheetsBar = hot.getPlugin('sheetsBar');
      const reportId = sheetsBar.getSheets().find(sheet => sheet.name === 'Report').id;

      sheetsBar.setActiveSheet(reportId);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      sheetsBar.setActiveSheet(sheetsBar.getSheets().find(sheet => sheet.name === 'Main').id);

      return { engine, reportId };
    }

    it('rewrites the sorted sheet\'s formulas after a write and an insert in one batch()', () => {
      const { engine, reportId } = buildSortedReport();
      const sheetsBar = hot.getPlugin('sheetsBar');
      let suspendedAfterWrite = false;

      // `Report` is sorted, so the bar reads its formulas through `getFillRangeData()`. Its data stays physical.
      expect(sheetsBar.getSheetData(reportId).map(row => row[0])).toEqual([3, 1, 2]);

      expect(() => hot.batch(() => {
        hot.setDataAtCell(0, 0, 5);
        suspendedAfterWrite = engine.isEvaluationSuspended();
        hot.alter('insert_row_above', 0);
      })).not.toThrow();

      expect(suspendedAfterWrite).toBe(true);
      expect(hot.getDataAtCol(1)).toEqual([null, 10, 4, 6]);
      expect(sheetsBar.getSheetData(reportId).map(row => row[1])).toEqual(['=Main!B2', '=Main!B3', '=Main!B4']);
    });
  });

  describe('the workbook planned from the grid-level engine', () => {
    it('reads the engine sheets for the tabs when the bar is turned on after a write that holds the engine', () => {
      const engine = HyperFormula.buildFromSheets({
        Main: [[1, '=A1*2']],
        Other: [[5]],
      }, { licenseKey: 'internal-use-in-handsontable' });

      hot = new Handsontable(container, {
        data: [[1, '=A1*2']],
        formulas: { engine, sheetName: 'Main', batchEvaluation: true },
        licenseKey: TEST_LICENSE_KEY,
        renderAllRows: true,
        renderAllColumns: true,
      });

      let suspendedAfterWrite = false;

      expect(() => hot.batch(() => {
        hot.setDataAtCell(0, 0, 7);
        suspendedAfterWrite = engine.isEvaluationSuspended();
        hot.updateSettings({ sheetsBar: true });
      })).not.toThrow();

      expect(suspendedAfterWrite).toBe(true);
      expect(hot.getPlugin('sheetsBar').getSheets().map(sheet => sheet.name)).toEqual(['Main', 'Other']);
      expect(hot.getDataAtRow(0)).toEqual([7, 14]);
    });
  });

  describe('a sheet added or duplicated in the same batch() as a cell write', () => {
    const acceptAll = (value, callback) => callback(true);

    /**
     * Writes a cell and adds a sheet inside one `batch()`, and records the cells the validators answered for. A
     * formula of the opening sheet names the sheet the operation creates, so the operation changes its value.
     *
     * @param {boolean} batchEvaluation The setting of the sheet.
     * @param {Function} operation What to do after the write, with the sheets bar plugin.
     * @returns {Promise<string[]>} The validated cells, `row:prop=value`.
     */
    async function validatedCells(batchEvaluation, operation) {
      const host = document.createElement('div');

      document.body.appendChild(host);

      const engine = buildEngine();
      const grid = new Handsontable(host, {
        sheetsBar: {
          sheets: [{
            name: 'Main',
            data: [[1, '=A1*2'], [0, '=\'Main (2)\'!A1'], [0, '=Extra!A1']],
            settings: {
              columns: [{}, { validator: acceptAll }],
              formulas: { engine, sheetName: 'Main', batchEvaluation },
            },
          }],
        },
        licenseKey: TEST_LICENSE_KEY,
        renderAllRows: true,
        renderAllColumns: true,
      });
      const validated = [];

      grid.addHook('afterValidate', (isValid, value, row, prop) => {
        validated.push(`${row}:${prop}=${value}`);
      });

      grid.batch(() => {
        grid.setDataAtCell(0, 0, 5);
        operation(grid.getPlugin('sheetsBar'));
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      grid.destroy();
      host.remove();

      return validated.sort();
    }

    it.each([
      ['added', sheetsBar => sheetsBar.addSheet('Extra', [[42]])],
      ['duplicated', sheetsBar => sheetsBar.duplicateSheet(sheetsBar.getSheets()[0].id)],
    ])('validates the cells it validates without the setting when a sheet is %s', async(_, operation) => {
      const withoutOption = await validatedCells(false, operation);
      const withOption = await validatedCells(true, operation);

      // Only the written cell's dependent: the cell the new sheet turns from #REF! into a value is not validated.
      expect(withoutOption).toEqual(['0:1=10']);
      expect(withOption).toEqual(withoutOption);
    });
  });
});
