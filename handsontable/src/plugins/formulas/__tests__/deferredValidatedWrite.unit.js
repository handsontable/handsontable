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
});
