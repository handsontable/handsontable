import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { registerCellType, NumericCellType } from '../../../cellTypes';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * A change to a cell with a validator reaches the engine only when the Core applies it, once the
 * validator accepted it. While the validator works, the engine and every formula that reads the cell
 * keep the old value: a validator that answers after a server round trip used to leave values computed
 * from the typed (and possibly rejected) value on screen for the whole wait. A change to a cell without
 * a validator is written at once, as before.
 */
describe('Formulas writes a validated change when the Core applies it', () => {
  let container;
  let hot;
  let held;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(UndoRedo);
    registerCellType(NumericCellType);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    held = [];
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * A validator that answers only when the test releases it, rejecting negative numbers.
   *
   * @param {*} value The validated value.
   * @param {Function} callback The validator callback.
   */
  function heldValidator(value, callback) {
    const number = typeof value === 'string' && value !== '' ? Number(value) : value;

    held.push({ value, answer: () => callback(!(typeof number === 'number' && number < 0)) });
  }

  /**
   * Waits until the Core called the validators and applied what it could.
   *
   * @returns {Promise<void>}
   */
  function waitForValidation() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Answers every held validator, oldest first, and waits for the Core to apply the sets.
   *
   * @returns {Promise<void>}
   */
  async function releaseAll() {
    await waitForValidation();
    held.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();
  }

  /**
   * Builds a grid: A is validated (held, negatives rejected), B = A * 15, C is not validated and
   * D = C * 2.
   *
   * @param {object} [settings] Extra settings merged into the grid configuration.
   * @returns {{ engine: object, sheet: number }}
   */
  function buildGrid(settings = {}) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[2, '=A1*15', 1, '=C1*2'], [31, '=A2*15', 3, '=C2*2'], ['=A1+1', '=A3*15', 5, '=C3*2']],
      columns: [{ validator: heldValidator, allowInvalid: false }, {}, {}, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return { engine, sheet: hot.getPlugin('formulas').sheetId };
  }

  it('keeps the old value in the engine and its dependents while the validator works, and after a rejection', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, -7);
    await waitForValidation();

    expect(held).toHaveLength(1);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);
    expect(hot.getCell(1, 1).textContent).toBe('465');

    await releaseAll();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(31);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);
  });

  it('writes an accepted value once the validator accepts it', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, 10);
    await waitForValidation();

    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);

    await releaseAll();

    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(10);
    expect(hot.getDataAtCell(1, 1)).toBe(150);
    expect(hot.getCell(1, 1).textContent).toBe('150');
  });

  it('writes the unvalidated cells of a mixed set at once and the validated ones on apply', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell([[0, 0, 5], [0, 2, 7]]);
    await waitForValidation();

    expect(engine.getCellValue({ sheet, row: 0, col: 2 })).toBe(7);
    expect(hot.getDataAtCell(0, 3)).toBe(14);
    expect(engine.getCellValue({ sheet, row: 0, col: 0 })).toBe(2);
    expect(hot.getDataAtCell(0, 1)).toBe(30);

    await releaseAll();

    expect(engine.getCellValue({ sheet, row: 0, col: 0 })).toBe(5);
    expect(hot.getDataAtCell(0, 1)).toBe(75);
    expect(hot.getDataAtCell(0, 3)).toBe(14);
  });

  it('writes a value a sync validator accepted with the same end state', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[2, '=A1*15'], [31, '=A2*15']],
      columns: [{ type: 'numeric', allowInvalid: false }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(1, 0, 12);

    // The Core calls a sync validator in a microtask too, so nothing is written yet.
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);

    await waitForValidation();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(12);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(12);
    expect(hot.getDataAtCell(1, 1)).toBe(180);
  });

  it('still validates a formula by its result while the engine keeps the old content', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, '=A1*3');
    await waitForValidation();

    expect(held.map(({ value }) => value)).toEqual([6]);
    expect(engine.getCellFormula({ sheet, row: 1, col: 0 })).toBeUndefined();
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);

    await releaseAll();

    expect(engine.getCellFormula({ sheet, row: 1, col: 0 })).toBe('=A1*3');
    expect(hot.getDataAtCell(1, 1)).toBe(90);
  });

  it('validates a value written over a formula cell as the value, not as the old formula result', async() => {
    buildGrid();

    hot.setDataAtCell(2, 0, -7);
    await waitForValidation();

    expect(held.map(({ value }) => value)).toEqual([-7]);

    await releaseAll();

    expect(hot.getSourceDataAtCell(2, 0)).toBe('=A1+1');
    expect(hot.getDataAtCell(2, 1)).toBe(45);
  });

  it('validates a formula that reads another validated cell of the same set by the new values', async() => {
    buildGrid();

    hot.setDataAtCell([[0, 0, 4], [1, 0, '=A1*2']]);
    await waitForValidation();

    expect(held.map(({ value }) => value).sort()).toEqual([4, 8]);

    await releaseAll();

    expect(hot.getDataAtCell(1, 1)).toBe(120);
  });

  it('validates a formula that sums a range of the same set by the new values', async() => {
    buildGrid();

    hot.setDataAtCell([[0, 0, 3], [1, 0, 4], [2, 0, '=SUM(A1:A2)']]);
    await waitForValidation();

    expect(held.map(({ value }) => value).sort()).toEqual([3, 4, 7]);
  });

  it('writes only the formulas of a set, and the values they read, into the validation probe', () => {
    const { engine } = buildGrid();
    const writes = jest.spyOn(engine, 'setCellContents');

    hot.setDataAtCell([[0, 0, 5], [1, 0, 6], [2, 0, '=1+1']]);

    // The probe wrote the formula alone: nothing of the set reads the plain values.
    expect(writes.mock.calls.map(([address, value]) => [address.row, value])).toEqual([[2, '=1+1']]);
  });

  it('validates a formula that refers to itself through a dependent as a cycle', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, '=B2');
    await waitForValidation();

    expect(held.map(({ value }) => value)).toEqual(['#CYCLE!']);
    expect(engine.getCellValue({ sheet, row: 1, col: 1 })).toBe(465);
  });

  it('leaves no trace of the validation probe in the engine or the hooks', async() => {
    const afterFormulasValuesUpdate = jest.fn();
    const { engine, sheet } = buildGrid({ afterFormulasValuesUpdate });
    const contentBefore = engine.getSheetSerialized(sheet);

    // The load at construction reports its values.
    afterFormulasValuesUpdate.mockClear();
    hot.setDataAtCell(1, 0, '=A1*3');

    expect(afterFormulasValuesUpdate).not.toHaveBeenCalled();
    expect(engine.getSheetSerialized(sheet)).toEqual(contentBefore);
    expect(engine.isThereSomethingToRedo()).toBe(false);

    await releaseAll();

    expect(afterFormulasValuesUpdate).toHaveBeenCalled();
  });

  it('records one grid undo step for an accepted async edit and none for a rejected one', async() => {
    const { engine, sheet } = buildGrid({ undo: true });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setDataAtCell(1, 0, 10);
    await releaseAll();
    hot.setDataAtCell(1, 0, -7);
    await releaseAll();

    expect(undoRedo.doneActions).toHaveLength(1);

    undoRedo.undo();
    await releaseAll();

    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);
  });

  it('keeps the old value in another sheet\'s grid that reads the cell during the wait', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const container2 = document.createElement('div');

    document.body.appendChild(container2);

    hot = new Handsontable(container, {
      data: [[2], [31]],
      columns: [{ validator: heldValidator, allowInvalid: false }],
      formulas: { engine, sheetName: 'A' },
      licenseKey: TEST_LICENSE_KEY,
    });

    const reader = new Handsontable(container2, {
      data: [['=A!A2*2']],
      formulas: { engine, sheetName: 'B' },
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      hot.setDataAtCell(1, 0, 10);
      await waitForValidation();

      expect(reader.getCell(0, 0).textContent).toBe('62');

      await releaseAll();

      expect(reader.getDataAtCell(0, 0)).toBe(20);
      expect(reader.getCell(0, 0).textContent).toBe('20');
    } finally {
      reader.destroy();
      container2.remove();
    }
  });

  it('makes an accepted edit undoable as soon as it is applied, while a dependent is still validated', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[2, '=A1*15'], [31, '=A2*15']],
      columns: [
        { validator: heldValidator, allowInvalid: false },
        { validator: heldValidator, allowInvalid: false },
      ],
      formulas: { engine },
      undo: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setDataAtCell(1, 0, 10);
    await waitForValidation();

    expect(held.map(({ value }) => value)).toEqual([10]);

    held.shift().answer();
    await waitForValidation();

    // The apply wrote A2 and asked B2's validator, which still works.
    expect(hot.getDataAtCell(1, 1)).toBe(150);
    expect(held.map(({ value }) => value)).toEqual([150]);
    expect(undoRedo.isUndoAvailable()).toBe(true);

    undoRedo.undo();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(31);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);

    // The late answer marks the dependent and records nothing.
    held.shift().answer();
    await waitForValidation();

    expect(undoRedo.isRedoAvailable()).toBe(true);
    expect(undoRedo.doneActions).toHaveLength(0);
  });

  it('writes a change to a validated cell that accepts invalid values at once, as before', async() => {
    const afterFormulasValuesUpdate = jest.fn();
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[2, '=A1*15'], [31, '=A2*15']],
      // `allowInvalid` is `true` by default: the Core never rejects the change, so it is not deferred.
      columns: [{ validator: heldValidator }, {}],
      formulas: { engine },
      afterFormulasValuesUpdate,
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    afterFormulasValuesUpdate.mockClear();
    hot.setDataAtCell(1, 0, -7);

    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(-7);
    expect(hot.getDataAtCell(1, 1)).toBe(-105);
    expect(afterFormulasValuesUpdate).toHaveBeenCalledTimes(1);

    await releaseAll();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(-7);
    expect(hot.getCellMeta(1, 0).valid).toBe(false);
    expect(afterFormulasValuesUpdate).toHaveBeenCalledTimes(1);
  });

  it('writes a numeric column change at once', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      columns: [{ type: 'numeric' }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.setDataAtCell(0, 0, 5);

    expect(hot.getDataAtCell(0, 1)).toBe(10);
  });

  ['edit', undefined].forEach((source) => {
    it(`validates a deferred cell of a mixed set once, by its new value (source ${source})`, async() => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hot = new Handsontable(container, {
        data: [[1, '=A1*2']],
        columns: [{}, {
          validator: (value, callback) => held.push({ value, answer: () => callback(value < 10) }),
          allowInvalid: false,
        }],
        formulas: { engine },
        licenseKey: TEST_LICENSE_KEY,
      });

      hot.setDataAtCell([[0, 0, 4], [0, 1, '=A1*3']], source);
      await waitForValidation();

      // B1's old formula reads the new A1 (8), but B1 is a change of the set: only its own value counts.
      expect(held.map(({ value }) => value)).toEqual([12]);

      held.splice(0).forEach(({ answer }) => answer());
      await waitForValidation();

      expect(hot.getSourceDataAtCell(0, 1)).toBe('=A1*2');
      expect(hot.getDataAtCell(0, 1)).toBe(8);
      expect(hot.getCellMeta(0, 1).valid).not.toBe(false);
    });
  });

  it('undoes what a dependent\'s afterValidate writes with an edit written at once, as before', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      columns: [{}, { validator: (value, callback) => callback(value < 10) }],
      formulas: { engine },
      undo: true,
      afterValidate(isValid, value, row, prop) {
        if (prop === 1 && !isValid) {
          this.setCellMeta(row, 1, 'flagged', true);
        }
      },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.setDataAtCell(0, 0, 50);
    await waitForValidation();

    expect(hot.getDataAtCell(0, 1)).toBe(100);
    expect(hot.getCellMeta(0, 1).flagged).toBe(true);

    hot.getPlugin('undoRedo').undo();
    await waitForValidation();

    expect(hot.getDataAtCell(0, 0)).toBe(1);
    expect(hot.getCellMeta(0, 1).flagged).toBeUndefined();
  });

  /**
   * Builds a grid for a mixed set where an immediate formula reads a deferred cell: A is deferred (held
   * validator, `allowInvalid: false`, values of 10 and more rejected), B has a validator that accepts
   * invalid values (written at once), and D = B * 2.
   *
   * @param {object} [settings] Extra settings merged into the grid configuration.
   * @param {object} [engineConfig] Extra engine configuration.
   * @returns {{ engine: object, sheet: number, bValues: Array }}
   */
  function buildReaderOfDeferredGrid(settings = {}, engineConfig = {}) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', ...engineConfig });
    const bValues = [];

    hot = new Handsontable(container, {
      data: [['x', '=A1*3', 'c', '=B1*2']],
      columns: [
        {
          validator: (value, callback) => held.push({ value, answer: () => callback(value < 10) }),
          allowInvalid: false,
        },
        {
          validator: (value, callback) => {
            bValues.push(value);
            callback(typeof value === 'number');
          },
        },
        {},
        {},
      ],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return { engine, sheet: hot.getPlugin('formulas').sheetId, bValues };
  }

  it('validates an immediate formula that reads a deferred cell of its set once, by the new value', async() => {
    const { bValues } = buildReaderOfDeferredGrid();

    hot.setDataAtCell([[0, 0, 4], [0, 1, '=A1*5']]);
    await waitForValidation();

    // A1 still waits, and B1 was validated by the value it gets once A1 is written, not by #VALUE! from 'x'.
    expect(held.map(({ value }) => value)).toEqual([4]);
    expect(bValues).toEqual([20]);
    expect(hot.getCellMeta(0, 1).valid).toBe(true);

    held.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();

    expect(hot.getDataAtCell(0, 1)).toBe(20);
    expect(hot.getDataAtCell(0, 3)).toBe(40);
    expect(bValues).toEqual([20]);
    expect(hot.getCellMeta(0, 1).valid).toBe(true);
  });

  it('validates an immediate formula again by the old value when the deferred cell it reads is rejected', async() => {
    const { engine, sheet, bValues } = buildReaderOfDeferredGrid({
      data: [[1, '=A1*3', 'c', '=B1*2']],
    });

    hot.setDataAtCell([[0, 0, 50], [0, 1, '=A1*5']]);
    await waitForValidation();

    expect(bValues).toEqual([250]);

    held.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();

    // A1 kept 1, so B1 holds 5 and its dependent reads it; the mark describes the value B1 holds.
    expect(hot.getSourceDataAtCell(0, 0)).toBe(1);
    expect(engine.getCellValue({ sheet, row: 0, col: 0 })).toBe(1);
    expect(hot.getDataAtCell(0, 1)).toBe(5);
    expect(hot.getDataAtCell(0, 3)).toBe(10);
    expect(bValues).toEqual([250, 5]);
    expect(hot.getCellMeta(0, 1).valid).toBe(true);
  });

  it('keeps what the afterValidate of an immediate formula reading a deferred cell writes in the edit\'s undo step', async() => {
    buildReaderOfDeferredGrid({
      undo: true,
      afterValidate(isValid, value, row, prop) {
        // The undo validates B1 again, by #VALUE! from the restored 'x', which writes nothing.
        if (prop === 1 && typeof value === 'number') {
          this.setDataAtCell(row, 2, `seen ${value}`, 'afterValidateTest');
        }
      },
    });

    hot.setDataAtCell([[0, 0, 4], [0, 1, '=A1*5']]);
    await waitForValidation();
    held.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();

    expect(hot.getDataAtCell(0, 2)).toBe('seen 20');

    hot.getPlugin('undoRedo').undo();
    await waitForValidation();

    expect(hot.getDataAtCell(0, 0)).toBe('x');
    expect(hot.getDataAtCell(0, 2)).toBe('c');

    hot.getPlugin('undoRedo').redo();
    await waitForValidation();

    expect(hot.getDataAtCell(0, 1)).toBe(20);
    expect(hot.getDataAtCell(0, 2)).toBe('seen 20');
  });

  [0, 1].forEach((undoLimit) => {
    it(`validates an immediate formula that reads a deferred cell again at the apply without a probe (undoLimit ${undoLimit})`, async() => {
      const { bValues } = buildReaderOfDeferredGrid({}, { undoLimit });

      hot.setDataAtCell([[0, 0, 4], [0, 1, '=A1*5']]);
      await waitForValidation();
      held.splice(0).forEach(({ answer }) => answer());
      await waitForValidation();

      // No probe can read B1 with the new A1, so the Core validates it by the engine's value, and the apply
      // validates it again by the value it holds.
      expect(hot.getDataAtCell(0, 1)).toBe(20);
      expect(bValues).toEqual(['#VALUE!', 20]);
      expect(hot.getCellMeta(0, 1).valid).toBe(true);
    });
  });

  it('validates an immediate formula changed twice in its set again at the apply', async() => {
    const { bValues } = buildReaderOfDeferredGrid();

    hot.setDataAtCell([[0, 1, '=A1*2'], [0, 0, 4], [0, 1, '=A1*5']]);
    await waitForValidation();
    held.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();

    expect(hot.getDataAtCell(0, 1)).toBe(20);
    expect(bValues[bValues.length - 1]).toBe(20);
    expect(hot.getCellMeta(0, 1).valid).toBe(true);
  });

  it('keeps an edit undoable right after it is applied when an async validator of a reader of a rejected cell still works', async() => {
    const bHeld = [];

    buildReaderOfDeferredGrid({
      data: [[1, '=A1*3', 'c', '=B1*2']],
      undo: true,
      columns: [
        {
          validator: (value, callback) => held.push({ value, answer: () => callback(value < 10) }),
          allowInvalid: false,
        },
        { validator: (value, callback) => bHeld.push({ value, answer: () => callback(true) }) },
        {},
        {},
      ],
    });

    hot.setDataAtCell([[0, 0, 50], [0, 1, '=A1*5']]);
    await waitForValidation();
    bHeld.splice(0).forEach(({ answer }) => answer());
    held.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();

    // The apply validates B1 again by the value it holds (A1 kept 1); its validator still works.
    expect(hot.getDataAtCell(0, 1)).toBe(5);
    expect(bHeld.map(({ value }) => value)).toEqual([5]);
    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);

    hot.getPlugin('undoRedo').undo();

    expect(hot.getSourceDataAtCell(0, 1)).toBe('=A1*3');

    bHeld.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 1)).toBe('=A1*3');
    expect(hot.getDataAtCell(0, 1)).toBe(3);
  });

  it('keeps what the afterValidate of a reader of a rejected cell writes at the apply in the edit\'s undo step', async() => {
    buildReaderOfDeferredGrid({
      data: [[1, '=A1*3', 'c', '=B1*2']],
      undo: true,
      afterValidate(isValid, value, row, prop) {
        if (prop === 1 && value === 5) {
          this.setDataAtCell(row, 2, `seen ${value}`, 'afterValidateTest');
        }
      },
    });

    hot.setDataAtCell([[0, 0, 50], [0, 1, '=A1*5']]);
    await waitForValidation();
    held.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();

    expect(hot.getDataAtCell(0, 2)).toBe('seen 5');

    hot.getPlugin('undoRedo').undo();
    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 1)).toBe('=A1*3');
    expect(hot.getDataAtCell(0, 2)).toBe('c');
  });

  it('classes a reader by its own validation after a reader validation of the cell that never answered', async() => {
    let bCalls = 0;

    buildReaderOfDeferredGrid({
      data: [[1, '=A1*3', 'c', '=B1*2']],
      undo: true,
      columns: [
        { validator: (value, callback) => callback(value < 10), allowInvalid: false },
        {
          // The first call never answers; every later one answers in its call.
          validator: (value, callback) => {
            bCalls += 1;

            if (bCalls > 1) {
              callback(true);
            }
          },
        },
        {},
        {},
      ],
      afterValidate(isValid, value, row, prop) {
        if (prop === 1 && value === 5) {
          this.setDataAtCell(row, 2, `seen ${value}`, 'afterValidateTest');
        }
      },
    });

    hot.setDataAtCell([[0, 0, 4], [0, 1, '=A1*5']], 'first');
    await waitForValidation();
    hot.setDataAtCell([[0, 0, 50], [0, 1, '=A1*5']]);
    await waitForValidation();

    // The second set's A1 was rejected, and B1, validated again by 5, answered in its call: the write of
    // its afterValidate is in the second edit's step.
    expect(hot.getDataAtCell(0, 2)).toBe('seen 5');

    hot.getPlugin('undoRedo').undo();
    await waitForValidation();

    expect(hot.getDataAtCell(0, 2)).toBe('c');
  });

  it('builds no engine-bound value for the probe of a set without a formula', async() => {
    const metaReads = async(allowInvalid) => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hot = new Handsontable(container, {
        data: Array.from({ length: 20 }, (_, row) => [row, row]),
        columns: [{ validator: (value, callback) => callback(true), allowInvalid }, {}],
        formulas: { engine },
        licenseKey: TEST_LICENSE_KEY,
      });
      const metaSpy = jest.spyOn(hot, 'getCellMetaTransient');

      hot.setDataAtCell(Array.from({ length: 20 }, (_, row) => [row, 0, `v${row}`]));
      await waitForValidation();

      const reads = metaSpy.mock.calls.length;

      hot.destroy();
      hot = null;

      return reads;
    };

    // Deferred or written at once, the set's values are turned into engine values once, by the write (the
    // escape reads the cell meta).
    expect(await metaReads(false)).toBe(await metaReads(true));
  });

  it('reports and paints the new value of a volatile formula the probe of a rejected edit recalculated', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const reported = [];
    let draw = 0;

    jest.spyOn(Math, 'random').mockImplementation(() => {
      draw += 1;

      return draw / 100;
    });

    try {
      hot = new Handsontable(container, {
        data: [[1, '=RAND()', '=A1*2']],
        columns: [{ validator: (value, callback) => callback(false), allowInvalid: false }, {}, {}],
        formulas: { engine },
        afterFormulasValuesUpdate(changes) {
          reported.push(...changes.map(({ address, newValue }) => `${address.row}x${address.col}=${newValue}`));
        },
        licenseKey: TEST_LICENSE_KEY,
      });

      const sheet = hot.getPlugin('formulas').sheetId;

      reported.length = 0;
      hot.setDataAtCell(0, 0, '=5*2');
      await waitForValidation();

      const randValue = engine.getCellValue({ sheet, row: 0, col: 1 });

      // The probe's write and its undo each drew a new RAND() value; the grid hears the one the engine kept,
      // and nothing for the probe's own write or for C1, which the undo put back.
      expect(hot.getSourceDataAtCell(0, 0)).toBe(1);
      expect(reported).toEqual([`0x1=${randValue}`]);
      expect(hot.getDataAtCell(0, 1)).toBe(randValue);
      expect(hot.getCell(0, 1).textContent).toBe(String(randValue));
    } finally {
      Math.random.mockRestore();
    }
  });

  it('writes a plain value of the set a formula reads through a named expression into the probe', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const values = [];

    hot = new Handsontable(container, {
      data: [[1, 0]],
      columns: [
        { validator: (value, callback) => callback(true), allowInvalid: false },
        {
          validator: (value, callback) => {
            values.push(value);
            callback(true);
          },
          allowInvalid: false,
        },
      ],
      formulas: { engine, sheetName: 'S' },
      licenseKey: TEST_LICENSE_KEY,
    });

    engine.addNamedExpression('MyA', '=S!$A$1');
    hot.setDataAtCell([[0, 0, 5], [0, 1, '=MyA*2']]);
    await waitForValidation();

    expect(values).toEqual([10]);
    expect(hot.getDataAtCell(0, 1)).toBe(10);
  });

  it('validates a dependent of a deferred and an immediate cell of one set once, at the apply', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const dependentHeld = [];
    const heldDependent = (limit) => {
      return (value, callback) => dependentHeld.push({ value, answer: () => callback(value < limit) });
    };

    hot = new Handsontable(container, {
      data: [[1, 1, '=A1+B1', '=C1*2']],
      columns: [
        { validator: (value, callback) => callback(true), allowInvalid: false },
        {},
        { validator: heldDependent(10) },
        { validator: heldDependent(20) },
      ],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.setDataAtCell([[0, 0, 50], [0, 1, 2]]);
    await waitForValidation();

    // The early write of B recalculated C and D from A's old value; neither is validated by that.
    expect(dependentHeld.map(({ value }) => value)).toEqual([52, 104]);

    // Answered in the reverse order, the marks still describe the values the cells hold.
    dependentHeld.splice(0).reverse().forEach(({ answer }) => answer());
    await waitForValidation();

    expect(hot.getDataAtCell(0, 2)).toBe(52);
    expect(hot.getCellMeta(0, 2).valid).toBe(false);
    expect(hot.getCellMeta(0, 3).valid).toBe(false);
  });

  it('validates a shared dependent when the deferred cell is rejected and the immediate one applies', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const dependentValues = [];

    hot = new Handsontable(container, {
      data: [[1, 1, '=A1+B1']],
      columns: [
        { validator: (value, callback) => callback(value < 10), allowInvalid: false },
        {},
        {
          validator: (value, callback) => {
            dependentValues.push(value);
            callback(value < 10);
          },
        },
      ],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.setDataAtCell([[0, 0, 50], [0, 1, 20]]);
    await waitForValidation();
    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 0)).toBe(1);
    expect(hot.getDataAtCell(0, 2)).toBe(21);
    expect(dependentValues).toEqual([21]);
    expect(hot.getCellMeta(0, 2).valid).toBe(false);
  });

  it('undoes what a dependent\'s afterValidate writes with a write past the last row, as before', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[1, '=SUM(A1:A5)']],
      columns: [{}, { validator: (value, callback) => callback(value < 10) }],
      formulas: { engine },
      undo: true,
      afterValidate(isValid, value, row, prop) {
        if (prop === 1 && !isValid) {
          this.setCellMeta(row, 1, 'flagged', true);
        }
      },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.setDataAtCell(2, 0, 50);
    await waitForValidation();

    expect(hot.getDataAtCell(0, 1)).toBe(51);
    expect(hot.getCellMeta(0, 1).flagged).toBe(true);

    hot.getPlugin('undoRedo').undo();
    await waitForValidation();

    expect(hot.getDataAtCell(0, 1)).toBe(1);
    expect(hot.getCellMeta(0, 1).flagged).toBeUndefined();
  });

  it('does not throw or keep the probe in the engine when the engine keeps one undo entry', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', undoLimit: 1 });

    hot = new Handsontable(container, {
      data: [[2, 3]],
      columns: [
        { validator: (value, callback) => callback(false), allowInvalid: false },
        { validator: (value, callback) => callback(true), allowInvalid: false },
      ],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    // The formula reads B1, a plain value of the same set, so the probe would need two batches.
    expect(() => hot.setDataAtCell([[0, 0, '=B1*10'], [0, 1, 5]])).not.toThrow();

    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 0)).toBe(2);
    expect(engine.getCellFormula({ sheet, row: 0, col: 0 })).toBeUndefined();
    expect(hot.getDataAtCell(0, 0)).toBe(2);
    expect(hot.getDataAtCell(0, 1)).toBe(5);
  });

  it('fires no afterFormulasValuesUpdate in another grid on the engine for the probe of a rejected edit', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const container2 = document.createElement('div');
    const readerUpdates = jest.fn();

    document.body.appendChild(container2);

    hot = new Handsontable(container, {
      data: [[2], [31]],
      columns: [{ validator: heldValidator, allowInvalid: false }],
      formulas: { engine, sheetName: 'A' },
      licenseKey: TEST_LICENSE_KEY,
    });

    const reader = new Handsontable(container2, {
      data: [['=A!A2*2']],
      formulas: { engine, sheetName: 'B' },
      afterFormulasValuesUpdate: readerUpdates,
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      readerUpdates.mockClear();
      hot.setDataAtCell(1, 0, '=A1-100');

      expect(held.map(({ value }) => value)).toEqual([]);
      await waitForValidation();

      expect(held.map(({ value }) => value)).toEqual([-98]);
      expect(readerUpdates).not.toHaveBeenCalled();

      await releaseAll();

      expect(readerUpdates).not.toHaveBeenCalled();
      expect(reader.getDataAtCell(0, 0)).toBe(62);
    } finally {
      reader.destroy();
      container2.remove();
    }
  });

  it('validates each change of a set that writes one cell twice by its own value', async() => {
    buildGrid();

    hot.setDataAtCell([[1, 0, '=A1*3'], [1, 0, '=A1*4']]);
    await waitForValidation();

    expect(held.map(({ value }) => value).sort()).toEqual([6, 8]);
  });

  it('validates the same formula written to one cell by two sets, with a write between them, by each set\'s result', async() => {
    buildGrid();

    hot.setDataAtCell(1, 0, '=C1*10');
    hot.setDataAtCell(0, 2, 5);
    hot.setDataAtCell(1, 0, '=C1*10');
    await waitForValidation();

    expect(held.map(({ value }) => value)).toEqual([10, 50]);
  });

  it('validates the same formula written twice to one cell of a set by the probe\'s result', async() => {
    buildGrid();

    hot.setDataAtCell([[1, 0, '=ROW()*10'], [1, 0, '=ROW()*10']]);
    await waitForValidation();

    expect(held.map(({ value }) => value)).toEqual([20, 20]);
  });
});
