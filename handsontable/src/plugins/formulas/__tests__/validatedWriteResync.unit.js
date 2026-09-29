import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';

/**
 * A `setDataAtCell()` on a column with a validator applies its changes in a microtask (the Core
 * validates asynchronously), while the plugin writes them into the engine synchronously, from
 * `afterSetDataAtCell`. An `updateSettings()` in the same task rebuilds the sheet from the source
 * data in between, before the changes reach it, so the rebuild dropped them from the engine: the
 * cell kept its raw formula text and every formula depending on it read the previous value.
 */
describe('Formulas write validated in flight across a sheet resync', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(UndoRedo);
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
   * Builds a grid whose first column carries a validator, so every write to it is validated.
   *
   * @param {Array[]} data The grid data.
   * @param {object} [settings] Extra settings merged into the grid configuration.
   * @returns {object} The engine the plugin is bound to.
   */
  function buildGrid(data, settings = {}) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data,
      columns: [{ validator: (value, callback) => callback(true) }, {}],
      formulas: { engine },
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return engine;
  }

  /**
   * Waits until the Core applied the validated changes.
   *
   * @returns {Promise<void>}
   */
  function waitForValidation() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  it('keeps a formula written right before a settings update in the engine', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']]);
    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');
    hot.updateSettings({});

    await waitForValidation();

    expect(hot.getSourceDataAtCell(2, 0)).toBe('=SUM(A1:A2)');
    expect(engine.getCellFormula({ sheet, row: 2, col: 0 })).toBe('=SUM(A1:A2)');
    expect(hot.getDataAtCell(2, 0)).toBe(3);
    // Written back before the render that follows the apply, not after it.
    expect(hot.getCell(2, 0).textContent).toBe('3');
  });

  it('keeps a plain value written right before a settings update for the formulas reading it', async() => {
    buildGrid([[1, '=A3*2'], [2, null], [null, null]]);

    hot.setDataAtCell(2, 0, 5);
    hot.updateSettings({});

    await waitForValidation();

    expect(hot.getDataAtCell(2, 0)).toBe(5);
    expect(hot.getDataAtCell(0, 1)).toBe(10);
  });

  it('keeps a formula written with `setDataAtRowProp()` right before a settings update', async() => {
    buildGrid([[1, 'a'], [2, 'b'], [null, 'c']]);

    hot.setDataAtRowProp(2, 0, '=A1+A2');
    hot.updateSettings({ rowHeaders: true });

    await waitForValidation();

    expect(hot.getDataAtCell(2, 0)).toBe(3);
  });

  it('undoes a change written back after a settings update in both the grid and the engine', async() => {
    const engine = buildGrid([[1, '=A3*2'], [2, null], [null, null]], { undo: true });
    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(2, 0, 5);
    hot.updateSettings({});

    await waitForValidation();

    expect(hot.getDataAtCell(0, 1)).toBe(10);

    hot.getPlugin('undoRedo').undo();

    await waitForValidation();

    expect(hot.getSourceDataAtCell(2, 0)).toBe(null);
    expect(engine.getCellValue({ sheet, row: 2, col: 0 })).toBe(null);
    expect(hot.getDataAtCell(0, 1)).toBe(0);
  });

  it('does not write into the engine again when no resync ran while the change was validated', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']]);
    const writes = jest.spyOn(engine, 'setCellContents');

    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');

    await waitForValidation();

    expect(writes).toHaveBeenCalledTimes(1);
    expect(hot.getDataAtCell(2, 0)).toBe(3);
  });

  it('keeps the engine in step with the grid when the sheet switched while the change was validated', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']]);
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [null, 'z']]);

    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });
    // The switch alone does not rewrite the sheet; this update does, so the sheet write count moves.
    hot.updateSettings({});

    await waitForValidation();

    // The Core applies the change to the data the grid holds when validation ends - the switched-to
    // sheet's. The engine has to hold what the grid holds, or the cell shows the raw formula text.
    expect(hot.getPlugin('formulas').sheetId).toBe(other);
    expect(hot.getSourceDataAtCell(2, 0)).toBe('=SUM(A1:A2)');
    expect(engine.getCellFormula({ sheet: other, row: 2, col: 0 })).toBe('=SUM(A1:A2)');
    expect(hot.getDataAtCell(2, 0)).toBe(30);
  });

  it('does not write a change back into a sheet the engine refused to hold', async() => {
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });

    // Three rows against `maxRows: 2`: every full write is refused and empties the sheet instead.
    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [3, 'c']],
      columns: [{ validator: (value, callback) => callback(true) }, {}],
      formulas: { engine },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(0, 0, '=1+1');
    hot.updateSettings({});

    expect(warnings).toHaveBeenCalledWith(expect.stringContaining('maxRows'));

    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 0)).toBe('=1+1');
    expect(engine.getSheetSerialized(sheet)).toEqual([]);

    warnings.mockRestore();
  });

  it('does not write a change the validator rejected back into the engine', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']], {
      columns: [{ validator: (value, callback) => callback(value !== 'bad'), allowInvalid: false }, {}],
    });
    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell([[1, 0, 'bad'], [2, 0, '=SUM(A1:A2)']]);
    hot.updateSettings({});

    await waitForValidation();

    expect(hot.getSourceDataAtCell(1, 0)).toBe(2);
    expect(engine.getCellValue({ sheet, row: 1, col: 0 })).toBe(2);
    expect(engine.getCellFormula({ sheet, row: 2, col: 0 })).toBe('=SUM(A1:A2)');
    expect(hot.getDataAtCell(2, 0)).toBe(3);
  });

  it('writes a paste past the last row into the engine once, so one undo reverts it', async() => {
    const engine = buildGrid([[1, '=SUM(A1:A10)'], [2, null], [null, null]], { undo: true });
    const sheet = hot.getPlugin('formulas').sheetId;
    const initialSheet = engine.getSheetSerialized(sheet);

    // Rows 3 and 4 do not exist yet: the Core creates them when it applies the paste.
    hot.populateFromArray(2, 0, [[5], [6], [7]]);
    hot.updateSettings({});

    await waitForValidation();

    expect(hot.countRows()).toBe(5);
    expect(hot.getDataAtCol(0)).toEqual([1, 2, 5, 6, 7]);
    expect(hot.getDataAtCell(0, 1)).toBe(21);

    // A second write of rows 3 and 4 after the write-back would add a second engine undo entry for
    // the one grid action, and this undo would revert only that one.
    hot.getPlugin('undoRedo').undo();

    await waitForValidation();

    expect(hot.countRows()).toBe(3);
    expect(engine.getSheetSerialized(sheet)).toEqual(initialSheet);
    expect(engine.getCellValue({ sheet, row: 0, col: 1 })).toBe(3);
    expect(hot.getDataAtCell(0, 1)).toBe(3);
  });

  it('validates the formulas that a write-back recalculated', async() => {
    const dependentValidator = jest.fn((value, callback) => callback(value < 100));

    buildGrid([[1, '=A3*2'], [2, null], [5, null]], {
      columns: [{ validator: (value, callback) => callback(true) }, { validator: dependentValidator }],
    });

    hot.setDataAtCell(2, 0, 500);
    // The update swaps the dependent column's validator. The dependent is validated on the
    // `afterSetDataAtCell` write against the old one; the write-back recalculates it again, and
    // only a validation there applies the new one.
    hot.updateSettings({
      columns: [
        { validator: (value, callback) => callback(true) },
        { validator: (value, callback) => callback(value < 2000) },
      ],
    });

    await waitForValidation();

    expect(dependentValidator).toHaveBeenCalledWith(1000, expect.any(Function));
    expect(hot.getDataAtCell(0, 1)).toBe(1000);
    expect(hot.getCellMeta(0, 1).valid).toBe(true);
  });
});
