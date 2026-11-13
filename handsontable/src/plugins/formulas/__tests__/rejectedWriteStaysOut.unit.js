import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { registerCellType, NumericCellType } from '../../../cellTypes';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * A change the validator rejects under `allowInvalid: false` never reaches the grid's data, so the
 * engine must not hold it either: when the plugin wrote every change into the engine before validation,
 * a formula reading the cell showed a result computed from the rejected value until the next full
 * resync. The plugin now writes a change to a cell with a validator only when the Core applies it, so
 * these cases check that every edit path ends with the engine and the grid agreeing.
 */
describe('Formulas keeps a change a validator rejects out of the engine', () => {
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
   * A validator that answers only when the test releases it, rejecting negative numbers, typed or not.
   *
   * @param {*} value The validated value.
   * @param {Function} callback The validator callback.
   */
  function heldValidator(value, callback) {
    // An editor hands the validator the typed text.
    const number = typeof value === 'string' && value !== '' ? Number(value) : value;

    held.push({ value, answer: () => callback(!(typeof number === 'number' && number < 0)) });
  }

  /**
   * Answers every held validator, oldest first, and waits for the Core to apply the sets. The Core
   * calls a validator in a microtask, so the wait comes first.
   *
   * @returns {Promise<void>}
   */
  async function releaseAll() {
    await waitForValidation();
    held.splice(0).forEach(({ answer }) => answer());
    await waitForValidation();
  }

  /**
   * Waits until the Core applied the validated changes.
   *
   * @returns {Promise<void>}
   */
  function waitForValidation() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Builds a grid whose column A rejects negative numbers and whose column B reads A times 15.
   *
   * @param {object} [settings] Extra settings merged into the grid configuration.
   * @returns {{ engine: object, sheet: number }}
   */
  function buildGrid(settings = {}) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[2, '=A1*15'], [31, '=A2*15'], [4, '=A3*15']],
      columns: [{ validator: heldValidator, allowInvalid: false }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return { engine, sheet: hot.getPlugin('formulas').sheetId };
  }

  it('keeps the old value in the engine when an async validator rejects a single change', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, -7);

    // The change waits for its validator outside the engine.
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);

    await releaseAll();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(31);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);
  });

  it('keeps the old value when a sync validator rejects the change', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[2, '=A1*15'], [31, '=A2*15']],
      columns: [{ type: 'numeric', allowInvalid: false }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(1, 0, 'abc');
    await waitForValidation();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(31);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);
  });

  it('keeps the rejected cells out and writes the accepted ones of a multi-cell write', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell([[0, 0, 5], [1, 0, -7], [2, 0, 6]]);
    await releaseAll();

    expect(hot.getDataAtCol(0)).toEqual([5, 31, 6]);
    expect(engine.getSheetValues(sheet).map(row => row[0])).toEqual([5, 31, 6]);
    expect(hot.getDataAtCol(1)).toEqual([75, 465, 90]);
  });

  it('keeps the rejected cells of a paste out of the engine', async() => {
    const { engine, sheet } = buildGrid();

    hot.populateFromArray(0, 0, [[5], [-7], [-8]], undefined, undefined, 'CopyPaste.paste');
    await releaseAll();

    expect(hot.getDataAtCol(0)).toEqual([5, 31, 4]);
    expect(engine.getSheetValues(sheet).map(row => row[0])).toEqual([5, 31, 4]);
    expect(hot.getDataAtCol(1)).toEqual([75, 465, 60]);
  });

  it('keeps the rejected cells of an autofill out of the engine', async() => {
    const { engine, sheet } = buildGrid();

    // The fill handle writes through `populateFromArray()` with this source.
    hot.populateFromArray(1, 0, [[-7]], 2, 0, 'Autofill.fill');
    await releaseAll();

    expect(hot.getDataAtCol(0)).toEqual([2, 31, 4]);
    expect(engine.getSheetValues(sheet).map(row => row[0])).toEqual([2, 31, 4]);
  });

  it('keeps every cell of a rejected Ctrl+Enter fill out of the engine', async() => {
    const { engine, sheet } = buildGrid();

    hot.selectCell(0, 0, 2, 0);

    const editor = hot.getActiveEditor();

    editor.beginEditing();
    editor.setValue('-7');
    editor.finishEditing(false, true);
    await releaseAll();

    expect(hot.getDataAtCol(0)).toEqual([2, 31, 4]);
    expect(engine.getSheetValues(sheet).map(row => row[0])).toEqual([2, 31, 4]);
    expect(hot.getDataAtCol(1)).toEqual([30, 465, 60]);
  });

  it('keeps the change out of the engine when an afterValidate listener rejects it', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[2, '=A1*15'], [31, '=A2*15']],
      columns: [{ validator: (value, callback) => callback(true), allowInvalid: false }, {}],
      formulas: { engine },
      afterValidate: (isValid, value) => isValid && value !== 99,
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(1, 0, 99);
    await waitForValidation();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(31);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
    expect(hot.getDataAtCell(1, 1)).toBe(465);
  });

  it('does not write a rejected change past the last row into the engine', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell([[2, 0, 5], [3, 0, -7]]);

    // The row the rejected change needed is never created, so its deferred write would address
    // a row the engine has no index for, and warn.
    const sync = jest.spyOn(hot.getPlugin('formulas'), 'syncChangeWithEngine');

    await releaseAll();

    // Only the accepted change of row 2 is written, when the set is applied.
    expect(sync.mock.calls.map(([row]) => row)).toEqual([2]);
    expect(hot.countRows()).toBe(3);
    expect(hot.getDataAtCol(0)).toEqual([2, 31, 5]);
    expect(engine.getSheetValues(sheet).map(row => row[0])).toEqual([2, 31, 5]);
  });

  it('leaves the dependency graph alone when the rejected value was a formula', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[2, '=A1*15'], [31, '=A2*15']],
      columns: [{
        // The plugin validates a formula by its result, so `=A1` reads 2 here.
        validator: (value, callback) => callback(value !== 2),
        allowInvalid: false,
      }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(1, 0, '=A1');
    await waitForValidation();

    expect(engine.getCellFormula({ sheet, row: 1, col: 0 })).toBeUndefined();
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);

    // With the rejected `=A1` left in the engine, A2 followed A1 and B2 changed with it.
    hot.setDataAtCell(0, 0, 3);
    await waitForValidation();

    expect(hot.getDataAtCell(1, 1)).toBe(465);
  });

  it('keeps a newer accepted write of the cell when an older write is rejected after it', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, -7);
    hot.setDataAtCell(1, 0, 5);

    await waitForValidation();
    // The newer write answers first.
    held[1].answer();
    await waitForValidation();
    held[0].answer();
    await waitForValidation();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(5);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(5);
    expect(hot.getDataAtCell(1, 1)).toBe(75);
  });

  it('ends with an older write still waiting when a newer write is rejected first', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, 5);
    hot.setDataAtCell(1, 0, -7);
    await waitForValidation();

    held[1].answer();
    await waitForValidation();
    held[0].answer();
    await waitForValidation();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(5);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(5);
    expect(hot.getDataAtCell(1, 1)).toBe(75);
  });

  it('keeps the value an older write applied when a newer write is rejected', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, 5);
    hot.setDataAtCell(1, 0, -7);
    await releaseAll();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(5);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(5);
    expect(hot.getDataAtCell(1, 1)).toBe(75);
  });

  it('keeps the grid value when two overlapping writes are both rejected', async() => {
    const { engine, sheet } = buildGrid();

    hot.setDataAtCell(1, 0, -7);
    hot.setDataAtCell(1, 0, -8);
    await waitForValidation();

    held[0].answer();
    await waitForValidation();
    held[1].answer();
    await waitForValidation();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(31);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(31);
  });

  it('keeps another sheet\'s grid that reads the cell on the old value', async() => {
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
      hot.setDataAtCell(1, 0, -7);

      expect(reader.getCell(0, 0).textContent).toBe('62');

      await releaseAll();

      expect(reader.getDataAtCell(0, 0)).toBe(62);
      expect(reader.getCell(0, 0).textContent).toBe('62');
    } finally {
      reader.destroy();
      container2.remove();
    }
  });

  it('never validates a dependent against a rejected value, and validates it after an accepted one', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const dependentValidator = jest.fn((value, callback) => callback(value >= 0));

    hot = new Handsontable(container, {
      data: [[2, '=A1*15'], [31, '=A2*15']],
      columns: [
        { validator: heldValidator, allowInvalid: false },
        { validator: dependentValidator },
      ],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.setDataAtCell(1, 0, -7);
    await waitForValidation();

    // Nothing recalculated B2 from the waiting -7, so its validator never saw -105.
    expect(hot.getCellMeta(1, 1).valid).not.toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(465);

    await releaseAll();

    expect(hot.getDataAtCell(1, 1)).toBe(465);
    expect(hot.getCellMeta(1, 1).valid).not.toBe(false);
    expect(dependentValidator).not.toHaveBeenCalledWith(-105, expect.any(Function));

    hot.setDataAtCell(1, 0, 4);
    await releaseAll();

    expect(dependentValidator).toHaveBeenCalledWith(60, expect.any(Function));
    expect(hot.getCellMeta(1, 1).valid).toBe(true);
  });

  it('adds no grid undo step for a rejected change and undoes the previous one in both', async() => {
    const { engine, sheet } = buildGrid({ undo: true });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setDataAtCell(0, 0, 3);
    await releaseAll();
    hot.setDataAtCell(1, 0, -7);
    await releaseAll();

    expect(undoRedo.doneActions).toHaveLength(1);

    undoRedo.undo();
    await releaseAll();

    expect(hot.getDataAtCol(0)).toEqual([2, 31, 4]);
    expect(engine.getSheetValues(sheet).map(row => row[0])).toEqual([2, 31, 4]);
    expect(hot.getDataAtCol(1)).toEqual([30, 465, 60]);

    undoRedo.redo();
    await releaseAll();

    expect(hot.getDataAtCol(0)).toEqual([3, 31, 4]);
    expect(engine.getSheetValues(sheet).map(row => row[0])).toEqual([3, 31, 4]);
  });

  it('records no undo step for a fully rejected change', async() => {
    buildGrid({ undo: true });

    hot.setDataAtCell(1, 0, -7);
    await releaseAll();

    expect(hot.getPlugin('undoRedo').doneActions).toEqual([]);
  });

  it('records only the step made while a rejected change waited for its validator', async() => {
    buildGrid({ undo: true });

    hot.setDataAtCell(1, 0, -7);
    // Recorded while the change waits: its state already holds the version the change's write drew.
    hot.setCellMeta(0, 0, 'className', 'x');
    await releaseAll();

    expect(hot.getPlugin('undoRedo').doneActions.map(action => action.actionType)).toEqual(['set_cell_meta']);
  });
});
