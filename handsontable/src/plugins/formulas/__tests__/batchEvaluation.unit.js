import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { registerCellType } from '../../../cellTypes/registry';
import { CheckboxCellType } from '../../../cellTypes/checkboxType';
import { NumericCellType } from '../../../cellTypes/numericType';
import { AutoColumnSize } from '../../autoColumnSize';
import { DropdownMenu } from '../../dropdownMenu';
import { Filters } from '../../filters';
import { HiddenRows } from '../../hiddenRows';
import { MoveCells } from '../../moveCells';
import { SheetsBar } from '../../sheetsBar';
import { UndoRedo } from '../../undoRedo';
import { ColumnSorting } from '../../columnSorting';
import { ManualRowMove } from '../../manualRowMove';
import { ManualColumnMove } from '../../manualColumnMove';
import ExportDataProvider from '../../exportFile/dataProvider';
import { textRenderer } from '../../../renderers/textRenderer';
import { Formulas } from '../formulas';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * DEV-202: with `formulas.batchEvaluation: true`, the engine writes a grid makes while its execution is
 * suspended (`batch()`, `batchExecution()`, `suspendExecution()`) are recalculated by HyperFormula once,
 * when the grid resumes, instead of once per write. The fixture is the one the baseline was measured on:
 * an 11x3 sheet, `C = A + B` on rows 1-10, `C11 = SUM(C1:C10)`, and ten `setDataAtCell()` calls on A1-A10.
 *
 * Every case checks what already holds without the option first, and what the option adds last, so a run
 * without the feature fails on the missing behavior, not on the fixture.
 */
const ROWS = 10;
const SUM_ROW = ROWS;

/**
 * @returns {Array[]} A1-A10 hold 1-10, B1-B10 hold 10-100, C = A + B, and C11 sums C1-C10.
 */
function createSheetData() {
  const rows = Array.from({ length: ROWS }, (_, row) => [row + 1, (row + 1) * 10, `=A${row + 1}+B${row + 1}`]);

  rows.push([null, null, `=SUM(C1:C${ROWS})`]);

  return rows;
}

/**
 * Writes `100 + row` into column A of each row, one `setDataAtCell()` call per row. After all ten,
 * C1 is 110 and C11 is 1595.
 *
 * @param {Handsontable} hot The grid.
 * @param {number} from The first row.
 * @param {number} to The row after the last one.
 */
function writeColumnA(hot, from = 0, to = ROWS) {
  for (let row = from; row < to; row++) {
    hot.setDataAtCell(row, 0, 100 + row);
  }
}

/**
 * @returns {Promise<void>} Resolves once the validators queued so far have answered.
 */
function waitForValidation() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * @returns {HTMLElement} A container attached to the document.
 */
function createContainer() {
  const container = document.createElement('div');

  document.body.appendChild(container);

  return container;
}

/**
 * Counts what one recalculation of the engine produces, from the moment it is called.
 *
 * @param {HyperFormula} engine The engine.
 * @param {Handsontable} hot The grid whose `afterFormulasValuesUpdate` is counted.
 * @returns {object} The live counters and the engine spies.
 */
function watchEngine(engine, hot) {
  const counts = {
    valuesUpdated: 0,
    afterFormulasValuesUpdate: 0,
    partialRun: jest.spyOn(engine.evaluator, 'partialRun'),
    batch: jest.spyOn(engine, 'batch'),
    suspendEvaluation: jest.spyOn(engine, 'suspendEvaluation'),
  };

  engine.on('valuesUpdated', () => {
    counts.valuesUpdated += 1;
  });
  hot.addHook('afterFormulasValuesUpdate', () => {
    counts.afterFormulasValuesUpdate += 1;
  });

  return counts;
}

/**
 * Records every `afterValidate` call of a grid as `row:prop`.
 *
 * @param {Handsontable} hot The grid.
 * @returns {string[]} The live list.
 */
function recordValidations(hot) {
  const validated = [];

  hot.addHook('afterValidate', (isValid, value, row, prop) => {
    validated.push(`${row}:${prop}`);
  });

  return validated;
}

/**
 * @param {string[]} list A list of `row:prop` entries.
 * @returns {object} How many times each entry appears.
 */
function countEach(list) {
  return list.reduce((result, entry) => {
    result[entry] = (result[entry] ?? 0) + 1;

    return result;
  }, {});
}

/**
 * The `row:prop` key of every formula cell in column C, rows 1-11.
 */
const COLUMN_C_CELLS = Array.from({ length: ROWS + 1 }, (_, row) => `${row}:2`);

/**
 * A validator that accepts every value, so `afterValidate` reports every cell it ran for.
 *
 * @param {*} value The value.
 * @param {Function} callback The validator callback.
 */
function acceptAll(value, callback) {
  callback(true);
}

describe('Formulas batchEvaluation', () => {
  let containers;
  let grids;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerCellType(CheckboxCellType);
    registerCellType(NumericCellType);
    registerPlugin(AutoColumnSize);
    registerPlugin(DropdownMenu);
    registerPlugin(Filters);
    registerPlugin(HiddenRows);
    registerPlugin(MoveCells);
    registerPlugin(SheetsBar);
    registerPlugin(UndoRedo);
    registerPlugin(ColumnSorting);
    registerPlugin(ManualRowMove);
    registerPlugin(ManualColumnMove);
  });

  beforeEach(() => {
    containers = [];
    grids = [];
  });

  afterEach(() => {
    grids.forEach(grid => grid?.destroy());
    containers.forEach(container => container.remove());
    jest.restoreAllMocks();
  });

  /**
   * Builds a grid bound to `engine` under `sheetName`.
   *
   * @param {HyperFormula} engine The engine.
   * @param {object} [options] The options.
   * @param {string} [options.sheetName] The sheet the grid owns.
   * @param {Array[]} [options.data] The grid data.
   * @param {object} [options.formulas] Extra keys of the `formulas` setting (`batchEvaluation`).
   * @param {object} [options.settings] Extra grid settings.
   * @returns {Handsontable} The grid.
   */
  function mountGrid(engine, {
    sheetName = 'Sheet1', data = createSheetData(), formulas = {}, settings = {},
  } = {}) {
    const container = createContainer();
    const hot = new Handsontable(container, {
      data,
      formulas: { engine, sheetName, ...formulas },
      licenseKey: TEST_LICENSE_KEY,
      renderAllRows: true,
      renderAllColumns: true,
      ...settings,
    });

    containers.push(container);
    grids.push(hot);

    return hot;
  }

  /**
   * @returns {HyperFormula} A fresh engine.
   */
  function buildEngine() {
    return HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
  }

  /**
   * Builds the baseline fixture with `batchEvaluation: true` and starts counting.
   *
   * @param {object} [settings] Extra grid settings.
   * @returns {{ hot: Handsontable, engine: HyperFormula, counts: object }}
   */
  function buildOptedIn(settings = {}) {
    const engine = buildEngine();
    const hot = mountGrid(engine, { formulas: { batchEvaluation: true }, settings });
    const counts = watchEngine(engine, hot);

    return { hot, engine, counts };
  }

  /**
   * @param {Handsontable} hot The grid.
   */
  function expectWrittenValues(hot) {
    expect(hot.getDataAtCell(0, 2)).toBe(110);
    expect(hot.getDataAtCell(SUM_ROW, 2)).toBe(1595);
    expect(hot.getCell(0, 2).textContent).toBe('110');
    expect(hot.getCell(SUM_ROW, 2).textContent).toBe('1595');
  }

  describe('ten writes in one batch', () => {
    it('recalculates once for ten writes inside batch()', () => {
      const { hot, engine, counts } = buildOptedIn();
      let suspendedAfterFirstWrite;

      hot.batch(() => {
        writeColumnA(hot, 0, 1);
        suspendedAfterFirstWrite = engine.isEvaluationSuspended();
        writeColumnA(hot, 1, ROWS);
      });

      expectWrittenValues(hot);
      expect(engine.isEvaluationSuspended()).toBe(false);

      expect(counts.valuesUpdated).toBe(1);
      expect(counts.partialRun).toHaveBeenCalledTimes(1);
      expect(counts.afterFormulasValuesUpdate).toBe(1);
      expect(counts.batch).not.toHaveBeenCalled();
      expect(counts.suspendEvaluation).toHaveBeenCalledTimes(1);
      expect(suspendedAfterFirstWrite).toBe(true);
    });

    // `batchExecution()` and a bare suspend/resume pair keep rendering, and each render reads the formula
    // cells, which ends the hold. They cannot reach one recalculation: measured, they recalculate once per
    // write, as without the option (so these pins hold without the feature too), and stay correct.
    it('stays correct and recalculates once per write inside batchExecution()', () => {
      const { hot, engine, counts } = buildOptedIn();

      hot.batchExecution(() => writeColumnA(hot));

      expectWrittenValues(hot);
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(counts.valuesUpdated).toBe(ROWS);
      expect(counts.partialRun).toHaveBeenCalledTimes(ROWS);
      expect(counts.afterFormulasValuesUpdate).toBe(ROWS);
    });

    it('stays correct and recalculates once per write inside suspendExecution()/resumeExecution()', () => {
      const { hot, engine, counts } = buildOptedIn();

      hot.suspendExecution();
      writeColumnA(hot);
      hot.resumeExecution();

      expectWrittenValues(hot);
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(counts.valuesUpdated).toBe(ROWS);
      expect(counts.partialRun).toHaveBeenCalledTimes(ROWS);
      expect(counts.afterFormulasValuesUpdate).toBe(ROWS);
    });
  });

  describe('without the option', () => {
    it.each([
      ['absent', {}],
      ['false', { batchEvaluation: false }],
    ])('recalculates once per write inside batch() when batchEvaluation is %s', (_, formulas) => {
      const engine = buildEngine();
      const hot = mountGrid(engine, { formulas });
      const counts = watchEngine(engine, hot);

      hot.batch(() => writeColumnA(hot));

      expectWrittenValues(hot);
      expect(counts.valuesUpdated).toBe(ROWS);
      expect(counts.partialRun).toHaveBeenCalledTimes(ROWS);
      expect(counts.afterFormulasValuesUpdate).toBe(ROWS);
      expect(counts.batch).toHaveBeenCalledTimes(ROWS);
    });
  });

  describe('validated cells and formula writes', () => {
    it('recalculates once for ten writes into a validated column inside batch()', async() => {
      const { hot, engine, counts } = buildOptedIn({ columns: [{ type: 'numeric' }, {}, {}] });
      const validated = recordValidations(hot);
      let suspendedAtBatchEnd;

      hot.batch(() => {
        writeColumnA(hot);
        // `beforeValidate` ran for every write by now. A plain value needs no engine read.
        suspendedAtBatchEnd = engine.isEvaluationSuspended();
      });

      const updatesAfterBatch = counts.valuesUpdated;

      await waitForValidation();

      expect(validated).toEqual(Array.from({ length: ROWS }, (_, row) => `${row}:0`));
      expect(hot.getSourceDataAtCell(0, 0)).toBe(100);
      expectWrittenValues(hot);
      expect(engine.isEvaluationSuspended()).toBe(false);

      expect(updatesAfterBatch).toBe(1);
      expect(counts.valuesUpdated).toBe(1);
      expect(counts.partialRun).toHaveBeenCalledTimes(1);
      expect(suspendedAtBatchEnd).toBe(true);
    });

    it('recalculates once for formulas written into plain cells inside batch()', () => {
      const { hot, engine, counts } = buildOptedIn();

      hot.batch(() => {
        for (let row = 0; row < ROWS; row++) {
          hot.setDataAtCell(row, 0, `=${100 + row}`);
        }
      });

      expect(hot.getSourceDataAtCell(0, 0)).toBe('=100');
      expect(hot.getDataAtCell(0, 0)).toBe(100);
      expectWrittenValues(hot);
      expect(engine.isEvaluationSuspended()).toBe(false);

      expect(counts.valuesUpdated).toBe(1);
      expect(counts.partialRun).toHaveBeenCalledTimes(1);
      expect(counts.batch).not.toHaveBeenCalled();
    });

    it('recalculates once per formula written into a validated column inside batch(), and stays correct', async() => {
      const { hot, engine, counts } = buildOptedIn({ columns: [{ type: 'numeric' }, {}, {}] });

      hot.batch(() => {
        for (let row = 0; row < ROWS; row++) {
          hot.setDataAtCell(row, 0, `=${100 + row}`);
        }
      });
      await waitForValidation();

      expectWrittenValues(hot);
      expect(engine.isEvaluationSuspended()).toBe(false);

      // A known limit: the validator gets the formula's value, which `beforeValidate` reads from the engine
      // right after the write, so each write recalculates the ones held before it, as without the option.
      expect(counts.valuesUpdated).toBe(ROWS);
      expect(counts.batch).not.toHaveBeenCalled();
    });

    it('recalculates once for ten writes that overwrite formula cells inside batch()', () => {
      const { hot, engine, counts } = buildOptedIn();

      hot.batch(() => {
        for (let row = 0; row < ROWS; row++) {
          hot.setDataAtCell(row, 2, `=A${row + 1}+B${row + 1}+1`);
        }
      });

      // C = 11 * row + 1, so C1 is 12 and C11 is 11 * 55 + 10.
      expect(hot.getSourceDataAtCell(0, 2)).toBe('=A1+B1+1');
      expect(hot.getDataAtCell(0, 2)).toBe(12);
      expect(hot.getDataAtCell(SUM_ROW, 2)).toBe(615);
      expect(hot.getCell(SUM_ROW, 2).textContent).toBe('615');
      expect(engine.isEvaluationSuspended()).toBe(false);

      // A write reads the cell's old value first (`modifySourceData`). For a formula cell that is its text,
      // which needs no recalculation, so the writes are recalculated together at the release.
      expect(counts.valuesUpdated).toBe(1);
      expect(counts.batch).not.toHaveBeenCalled();
    });

    it('validates the dependents of a cell written at once, when a formula of the set goes into a cell ' +
      'the Core can reject', async() => {
      const engine = buildEngine();
      const hot = mountGrid(engine, {
        data: [[1, 1, '=A1*2']],
        formulas: { batchEvaluation: true },
        settings: {
          columns: [
            {},
            { validator: acceptAll, allowInvalid: false },
            { validator: (value, callback) => callback(value < 100) },
          ],
        },
      });
      const validated = recordValidations(hot);

      // The formula for B1 makes the validation probe end the hold before the write of A1 is recorded.
      hot.batch(() => {
        hot.setDataAtCell([[0, 0, 60], [0, 1, '=1+1']]);
      });
      await waitForValidation();

      expect(hot.getDataAtCell(0, 2)).toBe(120);
      expect(hot.getDataAtCell(0, 1)).toBe(2);
      expect(countEach(validated)['0:2']).toBe(1);
      expect(hot.getCellMeta(0, 2).valid).toBe(false);
    });

    it('validates the dependents of a cell written at once, when a formula of the set reads a cell ' +
      'the Core can reject', async() => {
      const engine = buildEngine();
      const hot = mountGrid(engine, {
        data: [[1, 1, '=A1*2', null]],
        formulas: { batchEvaluation: true },
        settings: {
          columns: [
            {},
            { validator: acceptAll, allowInvalid: false },
            { validator: (value, callback) => callback(value < 100) },
            { validator: acceptAll },
          ],
        },
      });
      const validated = recordValidations(hot);

      hot.batch(() => {
        hot.setDataAtCell([[0, 0, 60], [0, 1, 7], [0, 3, '=B1*1']]);
      });
      await waitForValidation();

      expect(hot.getDataAtCell(0, 2)).toBe(120);
      expect(hot.getDataAtCell(0, 3)).toBe(7);
      expect(countEach(validated)['0:2']).toBe(1);
      expect(hot.getCellMeta(0, 2).valid).toBe(false);
    });

    it('validates the dependents of a cell written at once, when the set also holds a plain value for a ' +
      'cell the Core can reject', async() => {
      const engine = buildEngine();
      const hot = mountGrid(engine, {
        data: [[1, 1, '=A1*2']],
        formulas: { batchEvaluation: true },
        settings: {
          columns: [
            {},
            { validator: acceptAll, allowInvalid: false },
            { validator: (value, callback) => callback(value < 100) },
          ],
        },
      });
      const validated = recordValidations(hot);

      hot.batch(() => {
        hot.setDataAtCell([[0, 0, 60], [0, 1, 5]]);
      });
      await waitForValidation();

      expect(hot.getDataAtCell(0, 2)).toBe(120);
      expect(countEach(validated)['0:2']).toBe(1);
      expect(hot.getCellMeta(0, 2).valid).toBe(false);
    });
  });

  describe('reads inside the batch', () => {
    // After A1-A5 hold 100-104: C1 is 110 and C11 is (510 + 40) + 550.
    const C11_AFTER_FIRST_HALF = 1100;

    /**
     * Writes A1-A5, reads, then writes A6-A10, all in one `batch()`.
     *
     * @param {Handsontable} hot The grid.
     * @param {HyperFormula} engine The engine.
     * @param {Function} read The read made between the two halves.
     * @returns {{ seen: *, suspendedBeforeRead: boolean }}
     */
    function readBetweenWrites(hot, engine, read) {
      const result = {};

      hot.batch(() => {
        writeColumnA(hot, 0, 5);
        result.suspendedBeforeRead = engine.isEvaluationSuspended();
        result.seen = read();
        writeColumnA(hot, 5, ROWS);
      });

      return result;
    }

    it('reads a fresh formula value with getDataAtCell()', () => {
      const { hot, engine, counts } = buildOptedIn();
      const { seen, suspendedBeforeRead } = readBetweenWrites(hot, engine, () => [
        hot.getDataAtCell(0, 2),
        hot.getDataAtCell(SUM_ROW, 2),
      ]);

      expect(seen).toEqual([110, C11_AFTER_FIRST_HALF]);
      expectWrittenValues(hot);

      // The read ends the hold once, the release once more.
      expect(counts.valuesUpdated).toBe(2);
      expect(suspendedBeforeRead).toBe(true);
    });

    it('reads formula text with getSourceDataAtCell(), a formula written in the same batch included', () => {
      const { hot, engine, counts } = buildOptedIn();
      const { seen, suspendedBeforeRead } = readBetweenWrites(hot, engine, () => {
        hot.setDataAtCell(SUM_ROW, 1, '=SUM(A1:A5)');

        return [hot.getSourceDataAtCell(0, 2), hot.getSourceDataAtCell(SUM_ROW, 1)];
      });

      expect(seen).toEqual(['=A1+B1', '=SUM(A1:A5)']);
      expect(hot.getDataAtCell(SUM_ROW, 1)).toBe(510);
      expectWrittenValues(hot);

      // Formula text needs no recalculation, so the read keeps the hold: only the release recalculates.
      expect(counts.valuesUpdated).toBe(1);
      expect(suspendedBeforeRead).toBe(true);
    });

    it('reads fresh values with getData()', () => {
      const { hot, engine, counts } = buildOptedIn();
      const { seen, suspendedBeforeRead } = readBetweenWrites(hot, engine, () => hot.getData());

      expect(seen.map(row => row[2])).toEqual([110, 121, 132, 143, 154, 66, 77, 88, 99, 110, C11_AFTER_FIRST_HALF]);
      expect(seen[0]).toEqual([100, 10, 110]);
      expectWrittenValues(hot);

      expect(counts.valuesUpdated).toBe(2);
      expect(suspendedBeforeRead).toBe(true);
    });
  });

  describe('two grids on one engine', () => {
    it('recalculates once for writes of both grids inside one grid\'s batch()', () => {
      const engine = buildEngine();
      const data = createSheetData();

      data[SUM_ROW][1] = '=SUM(Sheet2!A1:A5)';

      const hotA = mountGrid(engine, { data, formulas: { batchEvaluation: true } });
      // No formula cell here: its own write renders it, and a painted formula cell would end the hold.
      const hotB = mountGrid(engine, { sheetName: 'Sheet2', data: [[1], [2], [3], [4], [5]] });
      const counts = watchEngine(engine, hotA);
      let updatesOfB = 0;

      hotB.addHook('afterFormulasValuesUpdate', () => {
        updatesOfB += 1;
      });

      hotA.batch(() => {
        writeColumnA(hotA, 0, 5);

        for (let row = 0; row < 5; row++) {
          hotB.setDataAtCell(row, 0, (row + 1) * 1000);
        }

        writeColumnA(hotA, 5, ROWS);
      });

      expectWrittenValues(hotA);
      expect(hotA.getDataAtCell(SUM_ROW, 1)).toBe(15000);
      expect(hotA.getCell(SUM_ROW, 1).textContent).toBe('15000');
      expect(hotB.getDataAtCell(4, 0)).toBe(5000);
      expect(engine.isEvaluationSuspended()).toBe(false);

      expect(counts.valuesUpdated).toBe(1);
      expect(counts.afterFormulasValuesUpdate).toBe(1);
      expect(updatesOfB).toBe(1);
      expect(counts.batch).not.toHaveBeenCalled();
    });

    it.each([
      ['does not', {}],
      ['does', { batchEvaluation: true }],
    ])('serves a fresh cross-sheet value to a second grid that %s opt in, during the first grid\'s batch()', (
      _, formulas
    ) => {
      const engine = buildEngine();
      const hotA = mountGrid(engine, { formulas: { batchEvaluation: true } });
      const hotB = mountGrid(engine, { sheetName: 'Sheet2', data: [['=Sheet1!C11']], formulas });
      const counts = watchEngine(engine, hotA);
      let seen;
      let suspendedBeforeRead;

      hotA.batch(() => {
        writeColumnA(hotA, 0, 5);
        suspendedBeforeRead = engine.isEvaluationSuspended();
        seen = hotB.getDataAtCell(0, 0);
        writeColumnA(hotA, 5, ROWS);
      });

      expect(seen).toBe(1100);
      expect(hotB.getDataAtCell(0, 0)).toBe(1595);
      expect(hotB.getCell(0, 0).textContent).toBe('1595');
      expectWrittenValues(hotA);

      expect(counts.valuesUpdated).toBe(2);
      expect(suspendedBeforeRead).toBe(true);
    });
  });

  describe('nesting', () => {
    it.each([
      ['a nested batch()', hot => hot.batch(() => writeColumnA(hot, 5, 8))],
      ['a nested suspendExecution()/resumeExecution() pair', (hot) => {
        hot.suspendExecution();
        writeColumnA(hot, 5, 8);
        hot.resumeExecution();
      }],
      ['a nested forced resumeExecution(true)', (hot) => {
        hot.suspendExecution();
        writeColumnA(hot, 5, 8);
        hot.resumeExecution(true);
      }],
    ])('recalculates once, at the outermost resume, around %s', (_, nested) => {
      const { hot, engine, counts } = buildOptedIn();
      let updatesAfterNested;

      hot.batch(() => {
        writeColumnA(hot, 0, 5);
        nested(hot);
        updatesAfterNested = counts.valuesUpdated;
        writeColumnA(hot, 8, ROWS);
      });

      expectWrittenValues(hot);
      expect(engine.isEvaluationSuspended()).toBe(false);

      expect(counts.valuesUpdated).toBe(1);
      expect(updatesAfterNested).toBe(0);
    });
  });

  describe('a batch callback that throws', () => {
    it('resumes the engine, computes the writes made before the throw, and leaves the grid usable', () => {
      const { hot, engine, counts } = buildOptedIn();
      let suspendedAfterFirstWrite;

      expect(() => hot.batch(() => {
        writeColumnA(hot, 0, 1);
        suspendedAfterFirstWrite = engine.isEvaluationSuspended();
        writeColumnA(hot, 1, 3);
        throw new Error('batch failed');
      })).toThrow('batch failed');

      const updatesAfterBatch = counts.valuesUpdated;

      // A1-A3 hold 100-102: C3 is 132 and C11 is (303 + 49) + 550.
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(hot.isExecutionSuspended()).toBe(false);
      expect(hot.getDataAtCell(2, 2)).toBe(132);
      expect(hot.getDataAtCell(SUM_ROW, 2)).toBe(902);
      expect(hot.getCell(SUM_ROW, 2).textContent).toBe('902');

      hot.setDataAtCell(3, 0, 103);

      expect(hot.getDataAtCell(3, 2)).toBe(143);
      expect(hot.getCell(SUM_ROW, 2).textContent).toBe('1001');

      expect(updatesAfterBatch).toBe(1);
      expect(suspendedAfterFirstWrite).toBe(true);
    });
  });

  describe('a suspension the host owns', () => {
    it('is never resumed by the release, and the changes the host\'s own resume computed are validated', async() => {
      const { hot, engine } = buildOptedIn({ columns: [{}, {}, { validator: acceptAll }] });
      const validated = recordValidations(hot);
      let suspendedAfterWrite;
      let suspendedAfterRelease;

      // Nothing may read the engine while the host holds it, the batch's own paint included, so the
      // paint waits until the host resumes.
      hot.suspendRender();

      try {
        hot.batch(() => {
          hot.setDataAtCell(0, 0, 100);
          suspendedAfterWrite = engine.isEvaluationSuspended();
          // The host ends the suspension the grid's write started, and opens one of its own.
          engine.resumeEvaluation();
          engine.suspendEvaluation();
        });

        suspendedAfterRelease = engine.isEvaluationSuspended();
      } finally {
        if (engine.isEvaluationSuspended()) {
          engine.resumeEvaluation();
        }

        hot.resumeRender();
      }

      await waitForValidation();

      // A1 holds 100: C1 is 110 and C11 is (100 + 54) + 550.
      expect(hot.getDataAtCell(0, 2)).toBe(110);
      expect(hot.getCell(0, 2).textContent).toBe('110');
      expect(hot.getCell(SUM_ROW, 2).textContent).toBe('704');
      expect(countEach(validated)).toEqual({ '0:2': 1, '10:2': 1 });
      expect(suspendedAfterRelease).toBe(true);

      expect(suspendedAfterWrite).toBe(true);
    });

    it('validates a write made in a later hold, when the grid holds the engine again before the host resumes it',
      async() => {
        const { hot, engine } = buildOptedIn({ columns: [{}, {}, { validator: acceptAll }] });
        const validated = recordValidations(hot);
        let suspendedAfterRelease;
        let heldSecondWrite;

        hot.suspendRender();

        try {
          // The release finds the engine suspended by the host, so the hold ends when the host resumes it.
          hot.batch(() => {
            hot.setDataAtCell(0, 0, 100);
            engine.resumeEvaluation();
            engine.suspendEvaluation();
          });

          suspendedAfterRelease = engine.isEvaluationSuspended();

          // The grid holds the engine again before the host resumes it, and writes once the host did.
          hot.suspendExecution();
          engine.resumeEvaluation();
          hot.setDataAtCell(1, 0, 101);
          heldSecondWrite = engine.isEvaluationSuspended();
          hot.resumeExecution();
        } finally {
          if (engine.isEvaluationSuspended()) {
            engine.resumeEvaluation();
          }

          hot.resumeRender();
        }

        await waitForValidation();

        // A1 and A2 hold 100 and 101: C2 is 121 and C11 is (201 + 52) + 550.
        expect(hot.getDataAtCell(1, 2)).toBe(121);
        expect(hot.getCell(SUM_ROW, 2).textContent).toBe('803');
        expect(engine.isEvaluationSuspended()).toBe(false);
        expect(countEach(validated)).toEqual({ '0:2': 1, '1:2': 1, '10:2': 1 });

        expect(suspendedAfterRelease).toBe(true);
        expect(heldSecondWrite).toBe(true);
      });
  });

  describe('batches that change index maps only', () => {
    it('never suspend the engine for filtering, hiding, and column autosizing', () => {
      const { hot, engine, counts } = buildOptedIn({
        filters: true,
        hiddenRows: true,
        autoColumnSize: true,
      });

      hot.batch(() => {
        const filters = hot.getPlugin('filters');

        filters.addCondition(0, 'gt', [3]);
        filters.filter();
        hot.getPlugin('hiddenRows').hideRows([1]);
        hot.getPlugin('autoColumnSize').recalculateAllColumnsWidth();
      });

      expect(hot.countRows()).toBe(7);
      expect(hot.getDataAtCell(0, 2)).toBe(44);
      expect(counts.suspendEvaluation).not.toHaveBeenCalled();
      expect(engine.isEvaluationSuspended()).toBe(false);

      // Control: a write in a batch suspends the engine itself, which the spy sees.
      hot.batch(() => hot.setDataAtCell(0, 0, 40));

      expect(hot.getDataAtCell(0, 2)).toBe(80);
      expect(counts.batch).not.toHaveBeenCalled();
      expect(counts.suspendEvaluation).toHaveBeenCalledTimes(1);
    });
  });

  describe('undo and redo', () => {
    it('reverts only the last change of an array write on a direct engine.undo()', () => {
      /**
       * @param {boolean} batchEvaluation The setting.
       * @returns {number[]} A1 and A2 of the engine after one `engine.undo()` of an array write in `batch()`.
       */
      function undoneColumnA(batchEvaluation) {
        const engine = buildEngine();
        const hot = mountGrid(engine, { formulas: { batchEvaluation } });

        hot.batch(() => hot.setDataAtCell([[0, 0, 500], [1, 0, 600]]));
        engine.undo();

        return [0, 1].map(row => engine.getCellValue({ sheet: 0, row, col: 0 }));
      }

      // Without the option the array is one engine batch, so one undo reverts both cells. With it the changes are
      // separate engine writes, and the host's `engine.undo()` takes back the last one (documented in the guide).
      expect(undoneColumnA(false)).toEqual([1, 2]);
      expect(undoneColumnA(true)).toEqual([500, 2]);
    });

    it('restores the values and the engine for a batch of writes, and validates each dependent once', async() => {
      const { hot, engine, counts } = buildOptedIn({
        undo: true,
        columns: [{}, {}, { validator: acceptAll }],
      });
      const validated = recordValidations(hot);
      const sheet = engine.getSheetId('Sheet1');

      hot.batch(() => writeColumnA(hot));
      await waitForValidation();

      const updatesAfterBatch = counts.valuesUpdated;

      validated.length = 0;
      hot.getPlugin('undoRedo').undo();
      await waitForValidation();

      const validatedOnUndo = countEach(validated);
      const updatesOnUndo = counts.valuesUpdated - updatesAfterBatch;

      // Undone: A1-A10 hold 1-10 again, so C1 is 11 and C11 is 55 + 550.
      expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null]);
      expect(hot.getDataAtCell(0, 2)).toBe(11);
      expect(engine.getCellValue({ sheet, row: SUM_ROW, col: 2 })).toBe(605);
      expect(hot.getCell(SUM_ROW, 2).textContent).toBe('605');

      const updatesBeforeRedo = counts.valuesUpdated;

      validated.length = 0;
      hot.getPlugin('undoRedo').redo();
      await waitForValidation();

      const validatedOnRedo = countEach(validated);
      const updatesOnRedo = counts.valuesUpdated - updatesBeforeRedo;

      expect(engine.getCellValue({ sheet, row: SUM_ROW, col: 2 })).toBe(1595);
      expectWrittenValues(hot);

      const oncePerDependent = Object.fromEntries(COLUMN_C_CELLS.map(cell => [cell, 1]));

      expect(validatedOnUndo).toEqual(oncePerDependent);
      expect(validatedOnRedo).toEqual(oncePerDependent);
      expect(updatesOnUndo).toBe(1);
      expect(updatesOnRedo).toBe(1);
      expect(updatesAfterBatch).toBe(1);
    });
  });

  describe('dependent validation', () => {
    it('is deferred to the release and runs once per dependent, against the final values', async() => {
      const { hot } = buildOptedIn({ columns: [{}, {}, { validator: (value, callback) => callback(value < 1000) }] });
      const started = [];
      const answered = [];

      hot.addHook('beforeValidate', (value, row, prop) => {
        started.push(`${row}:${prop}`);
      });
      hot.addHook('afterValidate', (isValid, value, row, prop) => {
        answered.push(`${row}:${prop}=${value}`);
      });

      let startedInsideBatch;

      hot.batch(() => {
        writeColumnA(hot);
        startedInsideBatch = started.length;
      });
      await waitForValidation();

      expectWrittenValues(hot);
      expect(hot.getCellMeta(0, 2).valid).toBe(true);
      expect(hot.getCellMeta(SUM_ROW, 2).valid).toBe(false);

      expect(countEach(started)).toEqual(Object.fromEntries(COLUMN_C_CELLS.map(cell => [cell, 1])));
      expect(answered).toContain('0:2=110');
      expect(answered).toContain('10:2=1595');
      expect(startedInsideBatch).toBe(0);
    });
  });

  describe('a grid that leaves the hold before it ends', () => {
    it.each([
      ['is destroyed', (hot) => {
        // `batch()` cannot wrap a `destroy()`: its own resume reads the destroyed instance. A suspended
        // pair keeps the hold open across the destroy instead.
        hot.suspendRender();
        hot.suspendExecution();
        writeColumnA(hot, 0, 5);
        const suspended = hot.getPlugin('formulas').engine.isEvaluationSuspended();

        hot.destroy();

        return suspended;
      }],
      ['disables the plugin', hot => hot.batch(() => {
        writeColumnA(hot, 0, 5);
        const suspended = hot.getPlugin('formulas').engine.isEvaluationSuspended();

        hot.getPlugin('formulas').disablePlugin();

        return suspended;
      })],
      ['turns formulas off through updateSettings()', hot => hot.batch(() => {
        writeColumnA(hot, 0, 5);
        const suspended = hot.getPlugin('formulas').engine.isEvaluationSuspended();

        hot.updateSettings({ formulas: false });

        return suspended;
      })],
    ])('leaves the shared engine resumed and the other grid readable when the grid %s mid-hold', (_, leave) => {
      const engine = buildEngine();
      const hotA = mountGrid(engine, { formulas: { batchEvaluation: true } });
      const hotB = mountGrid(engine, {
        sheetName: 'Sheet2', data: [['=Sheet1!C11']], formulas: { batchEvaluation: true },
      });
      const counts = watchEngine(engine, hotA);

      const suspendedMidHold = leave(hotA);

      if (hotA.isDestroyed) {
        grids[0] = null;
      }

      // A1-A5 hold 100-104: C11 is 1100.
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(engine.getCellValue({ sheet: engine.getSheetId('Sheet1'), row: SUM_ROW, col: 2 })).toBe(1100);
      expect(hotB.getDataAtCell(0, 0)).toBe(1100);
      expect(hotB.getCell(0, 0).textContent).toBe('1100');

      hotB.setDataAtCell(0, 0, '=Sheet1!C1');

      expect(hotB.getDataAtCell(0, 0)).toBe(110);

      expect(counts.valuesUpdated).toBe(2);
      expect(suspendedMidHold).toBe(true);
    });
  });

  describe('with the sheets bar and MoveCells', () => {
    let warn;
    let error;

    beforeEach(() => {
      warn = jest.spyOn(console, 'warn');
      error = jest.spyOn(console, 'error');
    });

    /**
     * Builds a two-sheet workbook whose inactive sheet reads the active one, so a structure change makes
     * the sheets bar read the engine's formula text back into the inactive sheet's data.
     *
     * @returns {{ hot: Handsontable, engine: HyperFormula, reportId: number }}
     */
    function buildWorkbook() {
      const engine = buildEngine();
      const container = createContainer();
      const formulas = sheetName => ({ formulas: { engine, sheetName, batchEvaluation: true } });
      const hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [
            { name: 'Main', data: [[1, '=A1*2', null, null], [2, '=A2*2', null, null]], settings: formulas('Main') },
            { name: 'Report', data: [['=Main!B2']], settings: formulas('Report') },
          ],
        },
        moveCells: true,
        licenseKey: TEST_LICENSE_KEY,
        renderAllRows: true,
        renderAllColumns: true,
      });

      containers.push(container);
      grids.push(hot);

      const reportId = hot.getPlugin('sheetsBar').getSheets().find(sheet => sheet.name === 'Report').id;

      return { hot, engine, reportId };
    }

    it('inserts a row inside batch() after a write, and rewrites the inactive sheet that reads the moved row', () => {
      const { hot, engine, reportId } = buildWorkbook();
      let suspendedAfterWrite;

      expect(() => hot.batch(() => {
        hot.setDataAtCell(0, 0, 5);
        suspendedAfterWrite = engine.isEvaluationSuspended();
        hot.alter('insert_row_above', 0);
      })).not.toThrow();

      expect(hot.getDataAtCol(1)).toEqual([null, 10, 4]);
      expect(hot.getPlugin('sheetsBar').getSheetData(reportId)).toEqual([['=Main!B3']]);
      expect(engine.getCellValue({ sheet: engine.getSheetId('Report'), row: 0, col: 0 })).toBe(4);
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      expect(suspendedAfterWrite).toBe(true);
    });

    it('copies cells with MoveCells inside batch() after a write', () => {
      const { hot, engine } = buildWorkbook();
      let suspendedAfterWrite;
      let copied;

      expect(() => hot.batch(() => {
        hot.setDataAtCell(0, 0, 5);
        suspendedAfterWrite = engine.isEvaluationSuspended();

        const source = hot._createCellRange(
          hot._createCellCoords(0, 0),
          hot._createCellCoords(0, 0),
          hot._createCellCoords(1, 1),
        );

        copied = hot.getPlugin('moveCells').moveCellRange(source, hot._createCellCoords(0, 2), true);
      })).not.toThrow();

      expect(copied).toBe(true);
      expect(hot.getSourceDataAtCell(0, 3)).toBe('=C1*2');
      expect(hot.getDataAtRow(0)).toEqual([5, 10, 5, 10]);
      expect(hot.getDataAtRow(1)).toEqual([2, 4, 2, 4]);
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();

      expect(suspendedAfterWrite).toBe(true);
    });
  });

  describe('a listener of the release recalculation that writes', () => {
    it.each([
      [
        'setDataAtCell()',
        hot => hot.setDataAtCell(0, 1, 20),
        // The listener's own write is not held: its dependents are validated at once, and again by the release.
        { '0:2': 2, '10:2': 2 },
      ],
      [
        'setDataAtCell() inside batch()',
        hot => hot.batch(() => hot.setDataAtCell(0, 1, 20)),
        // The listener's batch is held too, and the release validates both recalculations, each cell once.
        {},
      ],
    ])('validates the dependents of the held writes when it writes with %s', async(_, write, repeated) => {
      const { hot, engine } = buildOptedIn({ columns: [{}, {}, { validator: acceptAll }] });
      const validated = recordValidations(hot);
      let wrote = false;

      hot.addHook('afterFormulasValuesUpdate', () => {
        if (!wrote) {
          wrote = true;
          write(hot);
        }
      });

      hot.batch(() => writeColumnA(hot));
      await waitForValidation();

      // A1-A10 hold 100-109 and B1 holds 20: C1 is 120 and C11 is 1045 + 560.
      expect(hot.getDataAtCell(0, 2)).toBe(120);
      expect(hot.getDataAtCell(SUM_ROW, 2)).toBe(1605);
      expect(hot.getCell(SUM_ROW, 2).textContent).toBe('1605');
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(wrote).toBe(true);

      expect(countEach(validated)).toEqual({
        ...Object.fromEntries(COLUMN_C_CELLS.map(cell => [cell, 1])),
        ...repeated,
      });
    });
  });

  describe('an afterResumeExecution listener that throws before the release', () => {
    it('releases the hold at the next draw, validates the held writes, and holds no later write', async() => {
      // No autosizing: its own suspension cycle on every render would release the grid on its next draw anyway.
      const { hot, engine, counts } = buildOptedIn({
        columns: [{}, {}, { validator: acceptAll }],
        autoColumnSize: false,
      });
      const hotB = mountGrid(engine, { sheetName: 'Sheet2', data: [[1]] });
      const validated = recordValidations(hot);
      let thrown = false;
      // A global listener runs before every grid's own, so the plugin's release is skipped.
      const throwOnce = () => {
        if (!thrown) {
          thrown = true;
          throw new Error('listener failed');
        }
      };

      Handsontable.hooks.add('afterResumeExecution', throwOnce);

      try {
        expect(() => hot.batch(() => writeColumnA(hot))).toThrow('listener failed');
      } finally {
        Handsontable.hooks.remove('afterResumeExecution', throwOnce);
      }

      await waitForValidation();

      expectWrittenValues(hot);
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(countEach(validated)).toEqual(Object.fromEntries(COLUMN_C_CELLS.map(cell => [cell, 1])));

      expect(counts.batch).not.toHaveBeenCalled();

      // Not held for the grid that left: the write is one `engine.batch()`, as without a hold.
      hotB.setDataAtCell(0, 0, 2);

      expect(hotB.getDataAtCell(0, 0)).toBe(2);
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(counts.batch).toHaveBeenCalledTimes(1);
    });
  });

  describe('a draw that recalculates the held writes', () => {
    it('repaints after a draw that does not repaint every cell, when the recalculation changed this grid', () => {
      const engine = buildEngine();
      const data = createSheetData();

      data[SUM_ROW][1] = '=Sheet2!A1*2';

      const hotA = mountGrid(engine, { data, formulas: { batchEvaluation: true } });
      const hotB = mountGrid(engine, { sheetName: 'Sheet2', data: [[1]] });
      let paintedInsideHold;

      expect(hotA.getCell(SUM_ROW, 1).textContent).toBe('2');

      hotA.suspendExecution();

      try {
        // Held: grid A holds the engine.
        hotB.setDataAtCell(0, 0, 7);
        // A selection draws without repainting the cells, and the draw starts with a flush.
        hotA.selectCell(0, 0);
        paintedInsideHold = hotA.getCell(SUM_ROW, 1).textContent;
      } finally {
        hotA.resumeExecution();
      }

      expect(hotA.getDataAtCell(SUM_ROW, 1)).toBe(14);
      expect(hotA.getCell(SUM_ROW, 1).textContent).toBe('14');
      expect(paintedInsideHold).toBe('14');
    });

    it('repaints a grid whose draw threw while the engine was held, once the task ends', async() => {
      const engine = buildEngine();
      const hotA = mountGrid(engine, { formulas: { batchEvaluation: true } });
      let throwOnce = false;
      const hotB = mountGrid(engine, {
        sheetName: 'Sheet2',
        data: [['=Sheet1!C11']],
        settings: {
          // Nothing reads the cells before the draw, so the draw starts while the engine is held.
          autoColumnSize: false,
          // Throws after the cell's value was read (which recalculates), before the cell is painted.
          renderer(...args) {
            if (throwOnce) {
              throwOnce = false;
              throw new Error('renderer failed');
            }

            textRenderer(...args);
          },
        },
      });
      let suspendedBeforeDraw;

      hotA.batch(() => {
        writeColumnA(hotA);
        throwOnce = true;
        suspendedBeforeDraw = engine.isEvaluationSuspended();

        expect(() => hotB.render()).toThrow('renderer failed');
      });

      const paintedAfterBatch = hotB.getCell(0, 0).textContent;

      await waitForValidation();

      expect(hotB.getDataAtCell(0, 0)).toBe(1595);
      expect(hotB.getCell(0, 0).textContent).toBe('1595');

      // The failed draw left the old value painted.
      expect(paintedAfterBatch).toBe('605');
      expect(suspendedBeforeDraw).toBe(true);
    });
  });

  describe('a structure change in the same hold as cell writes', () => {
    /**
     * Runs `operations` in one `batch()`, or in a `suspendRender()` and `suspendExecution()` pair (a load
     * inside `batch()` is its own case), and records what `afterValidate` reported, after the validators
     * answered.
     *
     * @param {boolean} batchEvaluation The setting.
     * @param {Function} operations The callback.
     * @param {boolean} pair Whether to suspend with the pair.
     * @param {boolean} [validatesEveryColumn=false] Whether every column has the validator (no `columns`).
     * @returns {Promise<{ validated: string[], values: Array }>}
     */
    async function runValidatedBatch(batchEvaluation, operations, pair, validatesEveryColumn = false) {
      const engine = buildEngine();
      const data = createSheetData();

      data[SUM_ROW][1] = '=A1*2';

      const hot = mountGrid(engine, {
        data,
        formulas: { batchEvaluation },
        settings: {
          // A column cannot be removed while `columns` is set.
          ...(validatesEveryColumn
            ? { validator: acceptAll }
            : { columns: [{}, { validator: acceptAll }, { validator: acceptAll }] }),
          columnSorting: true,
          manualRowMove: true,
          manualColumnMove: true,
        },
      });
      const validated = [];

      hot.addHook('afterValidate', (isValid, value, row, prop) => {
        validated.push(`${row}:${prop}=${value}`);
      });

      if (pair) {
        hot.suspendRender();
        hot.suspendExecution();

        try {
          operations(hot);
        } finally {
          hot.resumeExecution();
          hot.resumeRender();
        }
      } else {
        hot.batch(() => operations(hot));
      }

      await waitForValidation();

      return { validated: validated.sort(), values: hot.getData() };
    }

    it.each([
      ['a formula write and a row insert above it', (hot) => {
        hot.setDataAtCell(1, 2, '=A2+B2+1');
        hot.alter('insert_row_above', 0);
      }],
      ['a formula write and a row removal above it', (hot) => {
        hot.setDataAtCell(1, 2, '=A2+B2+1');
        hot.alter('remove_row', 0);
      }],
      ['a write and a row removal that breaks a reference, in that order', (hot) => {
        hot.setDataAtCell(4, 0, 50);
        hot.alter('remove_row', 0);
      }],
      ['a row removal that breaks a reference and a write, in that order', (hot) => {
        hot.alter('remove_row', 0);
        hot.setDataAtCell(3, 0, 50);
      }],
      ['a formula write and a row move above it', (hot) => {
        hot.setDataAtCell(1, 2, '=A2+B2+1');
        hot.getPlugin('manualRowMove').moveRow(5, 0);
      }],
      ['a write and a column move', (hot) => {
        hot.setDataAtCell(1, 0, 50);
        hot.getPlugin('manualColumnMove').moveColumn(2, 0);
      }],
      ['a formula write and a sort', (hot) => {
        hot.setDataAtCell(1, 2, '=A2+B2+1');
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      }],
      // The sort reports every value cell it moves. It must not join the write's recalculation, or the release
      // validates those cells (and the written one twice), which nothing does without the option.
      ['a write and a sort', (hot) => {
        hot.setDataAtCell(4, 0, 50);
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      }],
      ['a write and a settings update that rebuilds the sheet', (hot) => {
        hot.setDataAtCell(4, 0, 50);
        hot.updateSettings({ columns: [{}, { validator: acceptAll }, { validator: acceptAll }] });
      }],
      ['a write and a sheet switch inside batch()', (hot) => {
        const { engine } = hot.getPlugin('formulas');

        engine.addSheet('Sheet2');
        engine.setSheetContent(engine.getSheetId('Sheet2'), [[1, 2, '=Sheet1!C5*2']]);
        hot.setDataAtCell(4, 0, 50);
        hot.getPlugin('formulas').switchSheet('Sheet2');
        hot.setDataAtCell(0, 0, 60);
      }],
      ['a write and a resync the next read makes', (hot) => {
        hot.setDataAtCell(4, 0, 50);
        hot.updateSettings({ columns: [{}, { validator: acceptAll }, { validator: acceptAll }] });
        hot.getDataAtCell(SUM_ROW, 2);
      }, true],
    ])('validates the cells it validates without the option, for %s', async(_, operations, pair = false) => {
      const withoutOption = await runValidatedBatch(false, operations, pair);
      const withOption = await runValidatedBatch(true, operations, pair);

      expect(withOption.values).toEqual(withoutOption.values);
      expect(withOption.validated).toEqual(withoutOption.validated);
    });

    it('validates the row that holds the write after a sort inside the batch', async() => {
      // The sort takes effect when the batch resumes, so the write lands on the row the unsorted order names, and
      // that row is visual row 5 once the sort is applied. Without the option the dependents are validated at the
      // write, against the mapping that is not sorted yet, and report the untouched visual row 4.
      const withOption = await runValidatedBatch(true, (hot) => {
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
        hot.setDataAtCell(4, 0, 50);
      }, false);

      expect(withOption.validated).toEqual(['10:2=650', '5:2=100']);
      expect(withOption.values[5]).toEqual([50, 50, 100]);
    });

    it('validates the cells it validates without the option, for a column removal that breaks a reference and a '
      + 'write, in that order', async() => {
      const operations = (hot) => {
        hot.alter('remove_col', 0);
        hot.setDataAtCell(3, 0, 50);
      };
      const withoutOption = await runValidatedBatch(false, operations, false, true);
      const withOption = await runValidatedBatch(true, operations, false, true);

      expect(withOption.values).toEqual(withoutOption.values);
      expect(withOption.validated).toEqual(withoutOption.validated);
    });

    it.each([
      ['an update of the columns', hot => hot.updateSettings({ columns: [{}, { validator: acceptAll }] })],
      ['an update of the data', hot => hot.updateData([[5, 7], [2, 8], [3, 9]])],
    ])('validates what it validates without the option for a write to a sheet with no formula and %s', async(
      _, rewrite
    ) => {
      /**
       * @param {boolean} batchEvaluation The setting.
       * @returns {Promise<string[]>} The validations of both grids.
       */
      async function run(batchEvaluation) {
        const engine = buildEngine();
        // No validator on the written column: a validated write reaches the source data only once the validator
        // answered, and a rewrite of the sheet in between drops it from the engine until then. The rewrite sets
        // the validated column B too, which no write here names.
        const hotA = mountGrid(engine, {
          data: [[1, 7], [2, 8], [3, 9]],
          formulas: { batchEvaluation },
          settings: { columns: [{}, { validator: acceptAll }] },
        });
        const hotB = mountGrid(engine, {
          sheetName: 'Sheet2',
          data: [['=Sheet1!A1*2'], ['=SUM(Sheet1!A1:A3)']],
          settings: { columns: [{ validator: acceptAll }] },
        });
        const validated = [];

        [hotA, hotB].forEach((hot, index) => {
          hot.addHook('afterValidate', (isValid, value, row, prop) => {
            validated.push(`${index}:${row}:${prop}=${value}`);
          });
        });

        hotA.suspendRender();
        hotA.suspendExecution();

        try {
          hotA.setDataAtCell(0, 0, 5);
          rewrite(hotA);
        } finally {
          hotA.resumeExecution();
          hotA.resumeRender();
        }

        await waitForValidation();

        return { validated: validated.sort(), values: hotB.getData() };
      }

      const withoutOption = await run(false);
      const withOption = await run(true);

      expect(withOption.values).toEqual([[10], [10]]);
      expect(withOption.values).toEqual(withoutOption.values);
      expect(withOption.validated).toEqual(withoutOption.validated);
    });

    it.each([
      ['a data load', hot => hot.loadData(createSheetData()), true],
      ['a data load inside batch()', hot => hot.loadData(createSheetData()), false],
      ['a data update inside batch()', hot => hot.updateData(createSheetData()), false],
    ])('never validates the loaded data at the addresses of a write %s replaced', async(_, load, pair) => {
      const operations = (hot) => {
        hot.setDataAtCell(4, 0, 50);
        load(hot);
        hot.setDataAtCell(5, 0, 60);
      };
      const withoutOption = await runValidatedBatch(false, operations, pair);
      const withOption = await runValidatedBatch(true, operations, pair);
      // Without the option, the first write's dependents (C5 and C11) are validated against the data the load
      // replaces. The core drops the data map before the load's hooks, so with the option they cannot be read:
      // the load replaced them, and only the dependents of the write after it are validated.
      const replaced = ['10:2=650', '4:2=100'];

      expect(withoutOption.validated.filter(entry => replaced.includes(entry))).toEqual(replaced);
      expect(withOption.values).toEqual(withoutOption.values);
      expect(withOption.validated).toEqual(withoutOption.validated.filter(entry => !replaced.includes(entry)));
    });
  });

  describe('a data load inside a hold whose recalculation listener throws', () => {
    it('loads the data and reports the error, so the grid keeps a data map', () => {
      const { hot, engine } = buildOptedIn();
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let throwOnce = false;

      hot.addHook('afterFormulasValuesUpdate', () => {
        if (throwOnce) {
          throwOnce = false;
          throw new Error('listener failed');
        }
      });

      hot.suspendRender();
      hot.suspendExecution();

      try {
        hot.setDataAtCell(0, 0, 100);
        throwOnce = true;

        expect(() => hot.loadData(createSheetData())).not.toThrow();
      } finally {
        hot.resumeExecution();
        hot.resumeRender();
      }

      expect(hot.countRows()).toBe(ROWS + 1);
      expect(hot.getDataAtCell(0, 0)).toBe(1);
      expect(hot.getDataAtCell(SUM_ROW, 2)).toBe(605);
      expect(hot.getCell(SUM_ROW, 2).textContent).toBe('605');
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('listener failed'));
    });
  });

  describe('a sheet added inside a hold', () => {
    it('refreshes SHEETS() and leaves nothing on the engine\'s undo stack', () => {
      const container = createContainer();
      const hot = new Handsontable(container, {
        data: [[1, '=SHEETS()']],
        formulas: { engine: HyperFormula, batchEvaluation: true },
        licenseKey: TEST_LICENSE_KEY,
        renderAllRows: true,
        renderAllColumns: true,
      });

      containers.push(container);
      grids.push(hot);

      const { engine } = hot.getPlugin('formulas');
      let suspendedAfterWrite;

      hot.batch(() => {
        hot.setDataAtCell(0, 0, 2);
        suspendedAfterWrite = engine.isEvaluationSuspended();
        engine.addSheet('Extra');
      });

      expect(hot.getDataAtCell(0, 1)).toBe(2);
      expect(hot.getCell(0, 1).textContent).toBe('2');
      // The refresh cleared the stack as it does outside a hold, so an `engine.undo()` cannot undo it.
      expect(engine.isThereSomethingToUndo()).toBe(false);
      expect(engine.isEvaluationSuspended()).toBe(false);

      expect(suspendedAfterWrite).toBe(true);
    });
  });

  describe('a draw of another grid during the hold', () => {
    it('never nests a render inside it when a read before the draw recalculates', () => {
      const engine = buildEngine();
      const hotA = mountGrid(engine, { formulas: { batchEvaluation: true } });
      // AutoColumnSize samples the formula cell before the plugin's own `beforeRender` listener runs.
      const hotB = mountGrid(engine, {
        sheetName: 'Sheet2', data: [['=Sheet1!C11']], settings: { autoColumnSize: true },
      });
      let depth = 0;
      let deepest = 0;
      let suspendedBeforeDraw;

      hotB.addHook('beforeRender', () => {
        depth += 1;
        deepest = Math.max(deepest, depth);
      }, -2);
      hotB.addHook('afterRender', () => {
        depth -= 1;
      });

      hotA.batch(() => {
        writeColumnA(hotA);
        suspendedBeforeDraw = engine.isEvaluationSuspended();
        hotB.render();
      });

      expect(hotB.getCell(0, 0).textContent).toBe('1595');
      expect(depth).toBe(0);
      expect(deepest).toBe(1);
      expect(suspendedBeforeDraw).toBe(true);
    });
  });

  describe('reads through the engine inside a hold', () => {
    /**
     * Writes A1 while an opted-in grid's execution is suspended, then runs `read` while the engine still
     * holds the write. The suspension is a `batch()`, or, for a read that loads data (a load inside
     * `batch()` is its own case), a `suspendRender()` and `suspendExecution()` pair.
     *
     * @param {Handsontable} hot The grid.
     * @param {HyperFormula} engine The engine.
     * @param {Function} read The read.
     * @param {boolean} [pair=false] Whether to suspend with the pair.
     * @returns {{ seen: *, suspendedBeforeRead: boolean }}
     */
    function readInsideHold(hot, engine, read, pair = false) {
      const result = {};
      const operations = () => {
        hot.setDataAtCell(0, 0, 100);
        result.suspendedBeforeRead = engine.isEvaluationSuspended();
        result.seen = read();
      };

      if (!pair) {
        hot.batch(operations);

        return result;
      }

      hot.suspendRender();
      hot.suspendExecution();

      try {
        operations();
      } finally {
        hot.resumeExecution();
        hot.resumeRender();
      }

      return result;
    }

    it('switches the sheet with switchSheet()', () => {
      const { hot, engine } = buildOptedIn();

      engine.addSheet('Sheet2');
      engine.setSheetContent(engine.getSheetId('Sheet2'), [['=Sheet1!C1*2']]);

      const { seen, suspendedBeforeRead } = readInsideHold(hot, engine, () => {
        hot.getPlugin('formulas').switchSheet('Sheet2');

        return hot.getSourceDataAtCell(0, 0);
      }, true);

      expect(seen).toBe('=Sheet1!C1*2');
      expect(hot.getDataAtCell(0, 0)).toBe(220);
      expect(suspendedBeforeRead).toBe(true);
    });

    it('copies formula text while formulas are shown', () => {
      const { hot, engine } = buildOptedIn();

      hot.getPlugin('formulas').showFormulas();

      const { seen, suspendedBeforeRead } = readInsideHold(hot, engine, () => {
        const data = [[110]];

        hot.runHooks('beforeCopy', data, [{ startRow: 0, startCol: 2, endRow: 0, endCol: 2 }], {
          columnHeadersCount: 0,
        });

        return data;
      });

      expect(seen).toEqual([['=A1+B1']]);
      expect(suspendedBeforeRead).toBe(true);
    });

    it('fills a formula down with the autofill hook', () => {
      const { hot, engine } = buildOptedIn();

      const { seen, suspendedBeforeRead } = readInsideHold(hot, engine, () => {
        const range = (from, to) => hot._createCellRange(
          hot._createCellCoords(from, 2), hot._createCellCoords(from, 2), hot._createCellCoords(to, 2),
        );

        return hot.runHooks('beforeAutofill', [[null]], range(0, 0), range(1, 1), 'down');
      });

      expect(seen).toEqual([['=A2+B2']]);
      expect(suspendedBeforeRead).toBe(true);
    });

    it.each([
      ['the engine cell facts', provider => provider.getEngineCellFacts(false)[0][2].computedValue, 110],
      ['the named expressions', provider => provider.getNamedExpressions(), [
        { name: 'RATE', formula: '5', scope: null },
      ]],
    ])('reads %s for an export', (_, read, expected) => {
      const { hot, engine } = buildOptedIn();

      engine.addNamedExpression('RATE', 5);

      const { seen, suspendedBeforeRead } = readInsideHold(hot, engine, () => {
        const provider = new ExportDataProvider(hot);

        provider.setOptions({ range: [] });

        return read(provider);
      });

      expect(seen).toEqual(expected);
      expect(suspendedBeforeRead).toBe(true);
    });

    it('duplicates a sheet with the sheets bar', () => {
      const engine = buildEngine();
      const container = createContainer();
      const hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [{
            name: 'Main',
            data: [[1, '=A1*2']],
            settings: { formulas: { engine, sheetName: 'Main', batchEvaluation: true } },
          }],
        },
        licenseKey: TEST_LICENSE_KEY,
        renderAllRows: true,
        renderAllColumns: true,
      });

      containers.push(container);
      grids.push(hot);

      const sheetsBar = hot.getPlugin('sheetsBar');

      // A name the sheet scopes with a constant is read as a value when the copy is fed.
      engine.addNamedExpression('RATE', 5, engine.getSheetId('Main'));

      const { seen, suspendedBeforeRead } = readInsideHold(hot, engine, () => (
        sheetsBar.duplicateSheet(sheetsBar.getSheets()[0].id)
      ));

      const copyId = engine.getSheetId(seen.name);

      expect(engine.listNamedExpressions(copyId)).toEqual(['RATE']);
      expect(engine.getNamedExpressionValue('RATE', copyId)).toBe(5);
      expect(suspendedBeforeRead).toBe(true);
    });

    it('records the engine sheet of a sorted grid for an undo step made while held', () => {
      const { hot, counts } = buildOptedIn({ undo: true, columnSorting: true });

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      const batchesAfterSort = counts.batch.mock.calls.length;

      // Its own operation: the undo step is recorded right after it, while the engine holds the write.
      readInsideHold(hot, hot.getPlugin('formulas').engine, () => null, true);

      // A10 holds 100 now: C10 is 200, and C11 is 55 + 90 + 550.
      expect(hot.getDataAtCell(0, 2)).toBe(200);
      expect(hot.getDataAtCell(SUM_ROW, 2)).toBe(695);

      hot.getPlugin('undoRedo').undo();

      expect(hot.getDataAtCell(0, 0)).toBe(10);
      expect(hot.getDataAtCell(0, 2)).toBe(110);
      expect(hot.getDataAtCell(SUM_ROW, 2)).toBe(605);

      // The write was held, not one `engine.batch()`.
      expect(counts.batch.mock.calls.length - batchesAfterSort).toBe(0);
    });
  });

  describe('a value an array formula spilled', () => {
    /**
     * @returns {Array[]} A1 holds 1 and B1 holds 10, and C1 spills A1:B1 into C1:C2.
     */
    function createSpillData() {
      return [[1, 10, '=TRANSPOSE(A1:B1)'], [null, null, null]];
    }

    it.each([
      ['off', {}],
      ['on', { batchEvaluation: true }],
    ])('reads it with getSourceDataAtCell() after a write inside batch(), with the option %s', (_, formulas) => {
      const engine = buildEngine();
      const hot = mountGrid(engine, { data: createSpillData(), formulas });
      let seen;
      let suspendedBeforeRead;

      hot.batch(() => {
        hot.setDataAtCell(0, 1, 20);
        suspendedBeforeRead = engine.isEvaluationSuspended();
        seen = hot.getSourceDataAtCell(1, 2);
      });

      expect(seen).toBe(20);
      expect(hot.getDataAtCell(1, 2)).toBe(20);
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(suspendedBeforeRead).toBe(formulas.batchEvaluation === true);
    });

    it.each([
      ['setDataAtCell()', hot => hot.setDataAtCell(1, 2, 'x')],
      ['setSourceDataAtCell()', hot => hot.setSourceDataAtCell(1, 2, 'x')],
    ])('ends a write over it with %s inside batch() as the same write ends without the option', (_, overwrite) => {
      const run = (formulas) => {
        const engine = buildEngine();
        const hot = mountGrid(engine, { data: createSpillData(), formulas });
        let suspendedBeforeOverwrite;

        hot.batch(() => {
          hot.setDataAtCell(0, 1, 20);
          suspendedBeforeOverwrite = engine.isEvaluationSuspended();
          overwrite(hot);
        });

        return {
          data: hot.getData(),
          sourceData: hot.getSourceData(),
          engineSheet: engine.getSheetSerialized(engine.getSheetId('Sheet1')),
          suspended: engine.isEvaluationSuspended(),
          suspendedBeforeOverwrite,
        };
      };
      const withoutOption = run({});
      const withOption = run({ batchEvaluation: true });

      expect(withOption).toEqual({ ...withoutOption, suspendedBeforeOverwrite: true });
      expect(withoutOption.suspendedBeforeOverwrite).toBe(false);
    });
  });

  describe('held writes another grid on the engine validates', () => {
    it.each([
      ['off', {}],
      ['on', { batchEvaluation: true }],
    ])('validates every dependent of a taller grid when a shorter grid inserts a row, with the option %s', async(
      _, formulas
    ) => {
      const engine = buildEngine();
      const hotA = mountGrid(engine, { formulas, settings: { columns: [{}, {}, { validator: acceptAll }] } });
      const hotB = mountGrid(engine, { sheetName: 'Sheet2', data: [[1]] });
      const validated = recordValidations(hotA);

      hotA.batch(() => {
        hotA.setDataAtCell(5, 0, 50);
        hotB.alter('insert_row_above', 0);
      });

      await waitForValidation();

      // A6 holds 50: C6 is 110 and C11 is (99 + 550).
      expect(hotA.getDataAtCell(5, 2)).toBe(110);
      expect(hotA.getDataAtCell(SUM_ROW, 2)).toBe(649);
      expect(hotB.countRows()).toBe(2);
      expect(countEach(validated)).toEqual({ '5:2': 1, '10:2': 1 });
    });

    it.each([
      ['off', {}],
      ['on', { batchEvaluation: true }],
    ])('validates every dependent once, and reports nothing, when a grid is built on the engine inside the batch, '
      + 'with the option %s', async(_, formulas) => {
      const engine = buildEngine();
      const hotA = mountGrid(engine, { formulas, settings: { columns: [{}, {}, { validator: acceptAll }] } });
      const validated = recordValidations(hotA);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let hotC;

      hotA.batch(() => {
        hotA.setDataAtCell(5, 0, 50);
        hotC = mountGrid(engine, { sheetName: 'Sheet2', data: [['=Sheet1!C11']] });
      });

      await waitForValidation();

      expect(hotA.getDataAtCell(SUM_ROW, 2)).toBe(649);
      expect(hotC.getDataAtCell(0, 0)).toBe(649);
      expect(hotC.getCell(0, 0).textContent).toBe('649');
      expect(countEach(validated)).toEqual({ '5:2': 1, '10:2': 1 });
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('a grid that leaves the hold while another grid on the engine is still suspended', () => {
    /**
     * Writes a cell of grid A in its own `batch()` while grid B, bound to another sheet of the engine, keeps its
     * execution suspended, and records what grid A's validators answered before B resumes.
     *
     * @param {boolean} batchEvaluation The setting of both grids.
     * @returns {Promise<{ beforeBResumes: string[], afterBResumes: string[] }>}
     */
    async function runWithSuspendedPeer(batchEvaluation) {
      const engine = buildEngine();
      const hotA = mountGrid(engine, {
        formulas: { batchEvaluation },
        settings: { columns: [{}, {}, { validator: acceptAll }] },
      });
      const hotB = mountGrid(engine, { sheetName: 'Sheet2', data: [[1]], formulas: { batchEvaluation } });
      const validated = [];

      hotA.addHook('afterValidate', (isValid, value, row, prop) => {
        validated.push(`${row}:${prop}=${value}`);
      });

      hotB.suspendExecution();

      let beforeBResumes;

      try {
        hotA.batch(() => hotA.setDataAtCell(0, 0, 500));
        await waitForValidation();
        beforeBResumes = validated.slice().sort();
      } finally {
        hotB.resumeExecution();
      }

      await waitForValidation();

      return { beforeBResumes, afterBResumes: validated.slice().sort() };
    }

    it('validates the dependents of its writes when it leaves, as without the setting', async() => {
      const withoutOption = await runWithSuspendedPeer(false);
      const withOption = await runWithSuspendedPeer(true);

      // Without the setting the write validates its dependents at once.
      expect(withoutOption.beforeBResumes.length).toBeGreaterThan(0);
      expect(withOption.beforeBResumes).toEqual(withoutOption.beforeBResumes);
      expect(withOption.afterBResumes).toEqual(withoutOption.afterBResumes);
    });
  });

  describe('a plugin turned off and on again inside a draw that started with the engine held', () => {
    it.each([
      // Between the plugin's two `beforeRender` listeners: the draw is being prepared.
      ['while the draw is prepared', -1],
      // After both: the draw of a held engine has started.
      ['once the draw started', 1],
    ])('paints the next engine change at once, when turned off %s', (_, orderIndex) => {
      const engine = buildEngine();
      const hotA = mountGrid(engine, { formulas: { batchEvaluation: true } });
      // No autosizing: its sampling reads the formula cell before the draw, which would recalculate first.
      const hotB = mountGrid(engine, {
        sheetName: 'Sheet2', data: [[1, '=A1*2']], settings: { autoColumnSize: false },
      });
      const pluginB = hotB.getPlugin('formulas');
      let disableInDraw = false;
      let suspendedInDraw;

      hotB.addHook('beforeRender', () => {
        if (disableInDraw) {
          disableInDraw = false;
          suspendedInDraw = engine.isEvaluationSuspended();
          pluginB.disablePlugin();
        }
      }, orderIndex);

      hotA.batch(() => {
        hotA.setDataAtCell(0, 0, 100);
        disableInDraw = true;
        hotB.render();
      });

      pluginB.enablePlugin();

      // The read brings the sheet in line with the grid data (the enable owes it a resync), without a draw.
      expect(hotB.getDataAtCell(0, 1)).toBe(2);

      engine.setCellContents({ sheet: engine.getSheetId('Sheet2'), row: 0, col: 0 }, 5);

      expect(hotB.getDataAtCell(0, 1)).toBe(10);
      expect(hotB.getCell(0, 1).textContent).toBe('10');
      expect(suspendedInDraw).toBe(true);
    });
  });
});
