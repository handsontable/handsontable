import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';
import { TrimRows } from '../../trimRows';
import { injectRealCoreStyles, removeRealCoreStyles } from '../../../../test/helpers/realCoreStyles';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * A `setDataAtCell()` on a column with a validator applies its changes in a microtask (the Core
 * validates asynchronously). The plugin writes a change the Core cannot reject (here column A, whose
 * `allowInvalid` is the default `true`, and column B, which has no validator) into the engine
 * synchronously, from `afterSetDataAtCell`, and a change it can reject (`REJECTING_COLUMNS`, A with
 * `allowInvalid: false`) only when the Core applies it. An `updateSettings()` in the same task rebuilds
 * the sheet from the source data in between, before the early-written changes reach it, so the rebuild
 * dropped them from the engine: the cell kept its raw formula text and every formula depending on it read
 * the previous value. A sheet switch in between drops the set, and the early-written changes are taken
 * out of the sheet they reached.
 */
describe('Formulas write validated in flight across a sheet resync', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(UndoRedo);
    registerPlugin(TrimRows);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    removeRealCoreStyles();
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
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return engine;
  }

  /**
   * Column A with a validator and `allowInvalid: false`, which the Core can reject, so its change is
   * written into the engine only when the set is applied; column B without one.
   */
  const REJECTING_COLUMNS = [{ validator: (value, callback) => callback(true), allowInvalid: false }, {}];

  /**
   * Waits until the Core applied the validated changes.
   *
   * @returns {Promise<void>}
   */
  function waitForValidation() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  it('keeps a formula written right before a settings update in the engine', async() => {
    // Without the real stylesheet jsdom renders two rows only, so row 3 has no cell to read.
    injectRealCoreStyles();

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

  it('writes a change to a cell without a validator once, before the validated one of its set', async() => {
    // `allowInvalid: false`: the Core can reject A's change, so it waits for the apply.
    const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']], { columns: REJECTING_COLUMNS });
    const sheet = hot.getPlugin('formulas').sheetId;
    const writes = jest.spyOn(engine, 'setCellContents');

    hot.setDataAtCell([[2, 1, 'early'], [2, 0, 5]]);

    expect(engine.getCellValue({ sheet, row: 2, col: 1 })).toBe('early');
    expect(engine.getCellValue({ sheet, row: 2, col: 0 })).toBeNull();

    await waitForValidation();

    expect(engine.getCellValue({ sheet, row: 2, col: 0 })).toBe(5);
    expect(writes.mock.calls.map(([{ col }]) => col)).toEqual([1, 0]);
  });

  it('writes an early-written change back after a settings update in its validation window', async() => {
    const engine = buildGrid([[1, '=A1'], [2, 'b'], [null, 'c']], { columns: REJECTING_COLUMNS });
    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell([[2, 1, '=SUM(A1:A2)'], [2, 0, 4]]);
    hot.updateSettings({});

    await waitForValidation();

    expect(engine.getCellFormula({ sheet, row: 2, col: 1 })).toBe('=SUM(A1:A2)');
    expect(hot.getDataAtCell(2, 1)).toBe(3);
    expect(hot.getDataAtCell(2, 0)).toBe(4);
  });

  it('drops the change from both sheets when the sheet switched while the change was validated', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']]);
    const first = hot.getPlugin('formulas').sheetId;
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [null, 'z']]);

    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });
    hot.updateSettings({});

    await waitForValidation();

    expect(hot.getPlugin('formulas').sheetId).toBe(other);
    expect(hot.getSourceDataAtCell(2, 0)).toBeNull();
    expect(engine.getCellFormula({ sheet: other, row: 2, col: 0 })).toBeUndefined();
    expect(hot.getDataAtCell(2, 0)).toBeNull();
    expect(engine.getCellFormula({ sheet: first, row: 2, col: 0 })).toBeUndefined();
    expect(engine.getCellValue({ sheet: first, row: 2, col: 0 })).toBeNull();
  });

  it('drops the change from both sheets when the switch alone ran while the change was validated', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']]);
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [null, 'z']]);

    const first = hot.getPlugin('formulas').sheetId;
    const changes = [];

    hot.addHook('afterChange', (changeSet, source) => {
      if (source === 'edit') {
        changes.push(changeSet);
      }
    });

    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');

    expect(engine.getCellFormula({ sheet: first, row: 2, col: 0 })).toBe('=SUM(A1:A2)');

    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

    await waitForValidation();

    expect(hot.getPlugin('formulas').sheetId).toBe(other);
    expect(changes).toEqual([]);
    expect(hot.getSourceDataAtCell(2, 0)).toBeNull();
    expect(engine.getCellFormula({ sheet: other, row: 2, col: 0 })).toBeUndefined();
    expect(engine.getCellFormula({ sheet: first, row: 2, col: 0 })).toBeUndefined();
    expect(engine.getCellValue({ sheet: first, row: 2, col: 0 })).toBeNull();
  });

  it('keeps the loaded values when loadData() on the same sheet drops the change', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [7, 'c']]);
    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');
    hot.loadData([[5, 'x'], [6, 'y'], [9, 'z']]);

    await waitForValidation();

    expect(hot.getPlugin('formulas').sheetId).toBe(sheet);
    expect(hot.getSourceDataAtCell(2, 0)).toBe(9);
    expect(engine.getCellFormula({ sheet, row: 2, col: 0 })).toBeUndefined();
    expect(engine.getCellValue({ sheet, row: 2, col: 0 })).toBe(9);
  });

  it('puts the switched-away sheet back when a slower validator answers after the switch', async() => {
    // The validator answers only when the test says so, after the switch: the window is not one
    // task wide, it lasts as long as an async validator takes.
    let answer;

    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [7, 'c']],
      columns: [{ validator: (value, callback) => { answer = () => callback(true); } }, {}],
      formulas: { engine: HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' }) },
      licenseKey: TEST_LICENSE_KEY,
    });

    const { engine } = hot.getPlugin('formulas');
    const first = hot.getPlugin('formulas').sheetId;
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [null, 'z']]);
    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');
    await waitForValidation();
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });
    answer();
    await waitForValidation();

    expect(engine.getCellFormula({ sheet: other, row: 2, col: 0 })).toBeUndefined();
    expect(engine.getCellValue({ sheet: other, row: 2, col: 0 })).toBeNull();
    expect(engine.getCellValue({ sheet: first, row: 2, col: 0 })).toBe(7);
  });

  it('puts a preserved text value back as text in the switched-away sheet', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], ['007', 'c']], {
      columns: [{ type: 'text', preserveTextValue: true, validator: (value, callback) => callback(true) }, {}],
    });
    const first = hot.getPlugin('formulas').sheetId;
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [30, 'z']]);
    hot.setDataAtCell(2, 0, 'changed');
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

    await waitForValidation();

    // Written back raw, the engine would parse the old text into the number 7.
    expect(engine.getCellValue({ sheet: first, row: 2, col: 0 })).toBe('007');
  });

  it('leaves a switched-away sheet alone when it was removed from the engine before the change was dropped', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [7, 'c']]);
    const first = hot.getPlugin('formulas').sheetId;
    const firstName = engine.getSheetName(first);
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [null, 'z']]);
    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });
    engine.removeSheet(first);

    await waitForValidation();

    expect(engine.getSheetId(firstName)).toBeUndefined();
    expect(engine.getCellFormula({ sheet: other, row: 2, col: 0 })).toBeUndefined();
    expect(hot.getDataAtCell(2, 0)).toBeNull();
  });

  it('does not put back a cell the engine refused the first write of', async() => {
    // `writtenCells` records a cell even when the engine refused the first write (here past
    // `maxRows`), so on a live switched-away sheet only the per-cell `isItPossibleToSetCellContents`
    // guard keeps the restore from throwing `SheetSizeLimitExceededError`.
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });

    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [3, 'c']],
      columns: [{ validator: (value, callback) => callback(true) }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const first = hot.getPlugin('formulas').sheetId;
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[10, 'x'], [20, 'y']]);
    hot.setDataAtCell(2, 0, '=1+1');
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });
    await waitForValidation();

    expect(engine.getSheetSerialized(first)).toEqual([]);
    warnings.mockRestore();
  });

  it('restores the cell the first write reached, even when the switched-to sheet has fewer rows', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [7, 'c']]);
    const first = hot.getPlugin('formulas').sheetId;
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[10, 'x'], [20, 'y']]);
    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

    await waitForValidation();

    expect(engine.getCellFormula({ sheet: first, row: 2, col: 0 })).toBeUndefined();
    expect(engine.getCellValue({ sheet: first, row: 2, col: 0 })).toBe(7);
    expect(engine.getCellFormula({ sheet: other, row: 2, col: 0 })).toBeUndefined();
    expect(hot.countRows()).toBe(2);
  });

  it('restores the recorded cell when a trim the switch cleared moved the rows', async() => {
    // With row 0 trimmed, visual row 0 is sheet row 1 when the change is written. The switch's
    // `loadData` clears the trim, so mapping the change again after it named sheet row 0 and wrote the
    // old value there: sheet A ended as `[[2, 'a'], ['NEW', 'b'], ...]`.
    const engine = buildGrid([[1, 'a'], [2, 'b'], [7, 'c'], [8, 'd']], { trimRows: true });
    const first = hot.getPlugin('formulas').sheetId;
    const other = engine.getSheetId(engine.addSheet('Other'));

    hot.getPlugin('trimRows').trimRow(0);
    engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [30, 'z'], [40, 'w']]);
    hot.setDataAtCell(0, 0, 'NEW');
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

    await waitForValidation();

    expect(engine.getSheetSerialized(first)).toEqual([[1, 'a'], [2, 'b'], [7, 'c'], [8, 'd']]);
  });

  it('repaints another sheet\'s grid that reads a cell the restore put back', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const container2 = document.createElement('div');

    document.body.appendChild(container2);

    hot = new Handsontable(container, {
      data: [[1], [2], [7]],
      columns: [{ validator: (value, callback) => callback(true) }],
      formulas: { engine, sheetName: 'A' },
      licenseKey: TEST_LICENSE_KEY,
    });

    const reader = new Handsontable(container2, {
      data: [['=A!A3*2']],
      formulas: { engine, sheetName: 'B' },
      licenseKey: TEST_LICENSE_KEY,
    });
    const other = engine.getSheetId(engine.addSheet('Other'));

    try {
      engine.setSheetContent(other, [[10], [20], [null]]);
      hot.setDataAtCell(2, 0, 100);
      hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

      await waitForValidation();

      // `A!A3` is back to 7, and the reading grid shows it: the restore's dependents are rendered.
      expect(reader.getDataAtCell(0, 0)).toBe(14);
      expect(reader.getCell(0, 0).textContent).toBe('14');
    } finally {
      reader.destroy();
      container2.remove();
    }
  });

  it('repaints this grid when the restore changes a cell its current sheet reads', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [3, 'c']]);
    const firstName = hot.getPlugin('formulas').sheetName;
    const other = engine.getSheetId(engine.addSheet('Other'));

    engine.setSheetContent(other, [[`=${firstName}!A3`, 'x'], [null, 'y']]);
    hot.setDataAtCell(2, 0, 50);
    hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

    await waitForValidation();

    expect(hot.getDataAtCell(0, 0)).toBe(3);
    expect(hot.getCell(0, 0).textContent).toBe('3');
  });

  it('takes the dropped change out of the grid data when the grid switched away and back', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']]);
    const plugin = hot.getPlugin('formulas');
    const first = plugin.sheetId;
    const firstName = plugin.sheetName;
    const changes = [];

    engine.setSheetContent(engine.getSheetId(engine.addSheet('Other')), [[10, 'x'], [20, 'y'], [null, 'z']]);
    hot.addHook('afterChange', (changeSet, source) => {
      if (source === 'edit') {
        changes.push(changeSet);
      }
    });

    hot.setDataAtCell(2, 0, '=SUM(A1:A2)');
    plugin.switchSheet('Other');
    plugin.switchSheet(firstName);

    await waitForValidation();

    expect(plugin.sheetId).toBe(first);
    expect(changes).toEqual([]);
    expect(hot.getSourceDataAtCell(2, 0)).toBeNull();
    expect(engine.getCellFormula({ sheet: first, row: 2, col: 0 })).toBeUndefined();
    expect(engine.getCellValue({ sheet: first, row: 2, col: 0 })).toBeNull();
  });

  it('keeps the loaded data when the engine refused the load that dropped the change', async() => {
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 3 });

    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [3, 'c']],
      columns: [{ validator: (value, callback) => callback(true) }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(0, 0, '=1+1');
    hot.loadData([[5, 'w'], [6, 'x'], [7, 'y'], [8, 'z']]);

    expect(warnings).toHaveBeenCalledWith(expect.stringContaining('maxRows'));

    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 0)).toBe(5);
    expect(engine.getSheetSerialized(sheet)).toEqual([]);

    warnings.mockRestore();
  });

  it('keeps a newer edit of the cell when a change dropped after a switch away and back answers', async() => {
    let answerHeld = null;
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [null, 'c']],
      columns: [{
        validator(value, callback) {
          if (value === 'held') {
            answerHeld = () => callback(true);
          } else {
            callback(true);
          }
        },
      }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const plugin = hot.getPlugin('formulas');
    const first = plugin.sheetId;
    const firstName = plugin.sheetName;

    engine.setSheetContent(engine.getSheetId(engine.addSheet('Other')), [[10, 'x'], [20, 'y'], [null, 'z']]);

    hot.setDataAtCell(0, 0, 'held');
    plugin.switchSheet('Other');
    plugin.switchSheet(firstName);
    hot.setDataAtCell(0, 0, 'newer');

    await waitForValidation();

    answerHeld();

    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 0)).toBe('newer');
    expect(engine.getCellValue({ sheet: first, row: 0, col: 0 })).toBe('newer');
  });

  it('puts every cell of a dropped set back in one source write', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [3, 'c']]);
    const plugin = hot.getPlugin('formulas');
    const firstName = plugin.sheetName;
    const sourceWrites = [];

    engine.setSheetContent(engine.getSheetId(engine.addSheet('Other')), [[10, 'x']]);

    hot.setDataAtCell([[0, 0, 7], [1, 0, 8], [2, 0, 9]]);
    plugin.switchSheet('Other');
    plugin.switchSheet(firstName);
    hot.addHook('afterSetSourceDataAtCell', (changes, source) => sourceWrites.push([changes.length, source]));

    await waitForValidation();

    expect(hot.getSourceDataAtCol(0)).toEqual([1, 2, 3]);
    expect(sourceWrites).toEqual([[3, 'Formulas.restoreDroppedChange']]);
  });

  it('does not write a dropped change past the last row into the loaded data', async() => {
    const engine = buildGrid([[1, 'a'], [2, 'b'], [3, 'c']]);
    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(3, 0, 77);
    hot.loadData([[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']]);

    await waitForValidation();

    expect(hot.getDataAtCell(3, 0)).toBe(4);
    expect(engine.getCellValue({ sheet, row: 3, col: 0 })).toBe(4);
  });

  it('stops listening for dropped sets when the plugin is turned off', () => {
    buildGrid([[1, 'a']]);

    const removed = jest.spyOn(hot, '_removeDroppedChangesListener');

    hot.updateSettings({ formulas: false });

    expect(removed).toHaveBeenCalledTimes(1);
  });

  it('does not write a change back into a sheet the engine refused to hold', async() => {
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });

    // Three rows against `maxRows: 2`: every full write is refused and empties the sheet instead.
    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [3, 'c']],
      columns: [{ validator: (value, callback) => callback(true) }, {}],
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
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

  it('does not write a deferred change into a sheet the engine refused to hold in its window', async() => {
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });

    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [3, 'c']],
      columns: REJECTING_COLUMNS,
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(0, 0, '=1+1');
    hot.updateSettings({});

    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 0)).toBe('=1+1');
    expect(engine.getSheetSerialized(sheet)).toEqual([]);

    warnings.mockRestore();
  });

  it('writes a deferred change into a sheet refused before the change, as an immediate write would', async() => {
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });

    // Three rows against `maxRows: 2`: the sheet is refused, and emptied, at construction.
    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [3, 'c']],
      columns: REJECTING_COLUMNS,
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell([[0, 0, '=1+1'], [0, 1, 'x']]);

    await waitForValidation();

    // Only a refusal in the change's own window leaves it out; B was written at once anyway.
    expect(engine.getSheetSerialized(sheet)).toEqual([['=1+1', 'x']]);

    warnings.mockRestore();
  });

  it('writes a deferred change when a full write filled the sheet again after a refused one', async() => {
    const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });

    hot = new Handsontable(container, {
      data: [[1, 'a'], [2, 'b'], [3, 'c']],
      columns: REJECTING_COLUMNS,
      formulas: { engine },
      licenseKey: TEST_LICENSE_KEY,
    });

    const sheet = hot.getPlugin('formulas').sheetId;

    hot.setDataAtCell(0, 0, '=1+1');
    hot.updateSettings({});
    // Two rows fit, so this full write is accepted after the refused one.
    hot.updateSettings({ data: [[1, 'a'], [2, 'b']] });

    await waitForValidation();

    expect(hot.getSourceDataAtCell(0, 0)).toBe('=1+1');
    expect(engine.getCellFormula({ sheet, row: 0, col: 0 })).toBe('=1+1');
    expect(hot.getDataAtCell(0, 0)).toBe(2);

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

  it('undoes a paste past the last row in the grid and the engine', async() => {
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

    // A grid undo restores the engine from its own recorded state and never calls `engine.undo()`,
    // so a second write could not split this undo; it is pinned by the write count below.
    hot.getPlugin('undoRedo').undo();

    await waitForValidation();

    expect(hot.countRows()).toBe(3);
    expect(engine.getSheetSerialized(sheet)).toEqual(initialSheet);
    expect(engine.getCellValue({ sheet, row: 0, col: 1 })).toBe(3);
    expect(hot.getDataAtCell(0, 1)).toBe(3);
  });

  it('writes the out-of-bounds rows of a paste into the engine once, not again from afterChange', async() => {
    // The rows past the last one are written once, with the rest of the set, when the Core applies it.
    // A second write would be redundant and an extra entry on the engine's own undo stack, which only
    // an app calling `engine.undo()` directly would see.
    const engine = buildGrid([[1, '=SUM(A1:A10)'], [2, null], [null, null]]);
    const writes = jest.spyOn(engine, 'setCellContents');

    hot.populateFromArray(2, 0, [[5], [6], [7]]);
    hot.updateSettings({});

    await waitForValidation();

    expect(writes.mock.calls.filter(([{ row }]) => row === 3 || row === 4)).toHaveLength(2);
  });

  it('repaints another sheet\'s grid that reads the written-back cell', async() => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const container2 = document.createElement('div');

    document.body.appendChild(container2);

    hot = new Handsontable(container, {
      data: [[1], [2], [null]],
      columns: [{ validator: (value, callback) => callback(true) }],
      formulas: { engine, sheetName: 'A' },
      licenseKey: TEST_LICENSE_KEY,
    });

    const reader = new Handsontable(container2, {
      data: [['=A!A3*2']],
      formulas: { engine, sheetName: 'B' },
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      hot.setDataAtCell(2, 0, 5);
      hot.updateSettings({});

      await waitForValidation();

      expect(reader.getDataAtCell(0, 0)).toBe(10);
      // The plugin write scope repaints the reading grid; without it the cell kept painting 0.
      expect(reader.getCell(0, 0).textContent).toBe('10');
    } finally {
      reader.destroy();
      container2.remove();
    }
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
  describe('the early-written cells of a mixed set', () => {
    it('does not put back a cell the engine refused the first write of', async() => {
      const warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxRows: 2 });

      hot = new Handsontable(container, {
        data: [[1, 'a'], [2, 'b'], [3, 'c']],
        columns: REJECTING_COLUMNS,
        formulas: { engine },
        licenseKey: TEST_LICENSE_KEY,
      });

      const first = hot.getPlugin('formulas').sheetId;
      const other = engine.getSheetId(engine.addSheet('Other'));

      engine.setSheetContent(other, [[10, 'x'], [20, 'y']]);
      hot.setDataAtCell([[2, 1, '=1+1'], [0, 0, 5]]);
      hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });
      await waitForValidation();

      expect(engine.getSheetSerialized(first)).toEqual([]);
      warnings.mockRestore();
    });

    it('leaves a switched-away sheet alone when it was removed before the set was dropped', async() => {
      const engine = buildGrid([[1, 'a'], [2, 'b'], [7, 'c']], { columns: REJECTING_COLUMNS });
      const first = hot.getPlugin('formulas').sheetId;
      const other = engine.getSheetId(engine.addSheet('Other'));

      engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [null, 'z']]);
      hot.setDataAtCell([[2, 1, 'early'], [2, 0, 5]]);
      hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });
      engine.removeSheet(first);

      await waitForValidation();

      expect(engine.getSheetSerialized(other)).toEqual([[10, 'x'], [20, 'y'], [null, 'z']]);
    });

    it('restores the recorded cell when a trim the switch cleared moved the rows', async() => {
      const engine = buildGrid([[1, 'a'], [2, 'b'], [7, 'c'], [8, 'd']], {
        trimRows: true,
        columns: REJECTING_COLUMNS,
      });
      const first = hot.getPlugin('formulas').sheetId;
      const other = engine.getSheetId(engine.addSheet('Other'));

      hot.getPlugin('trimRows').trimRow(0);
      engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [30, 'z'], [40, 'w']]);
      hot.setDataAtCell([[0, 1, 'NEW'], [0, 0, 9]]);

      expect(engine.getCellValue({ sheet: first, row: 1, col: 1 })).toBe('NEW');

      hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

      await waitForValidation();

      expect(engine.getSheetSerialized(first)).toEqual([[1, 'a'], [2, 'b'], [7, 'c'], [8, 'd']]);
    });

    it('puts a preserved text value back as text in the switched-away sheet', async() => {
      const engine = buildGrid([[1, 'a'], [2, 'b'], [3, '007']], {
        columns: [REJECTING_COLUMNS[0], { type: 'text', preserveTextValue: true }],
      });
      const first = hot.getPlugin('formulas').sheetId;
      const other = engine.getSheetId(engine.addSheet('Other'));

      engine.setSheetContent(other, [[10, 'x'], [20, 'y'], [30, 'z']]);
      hot.setDataAtCell([[2, 1, 'changed'], [2, 0, 4]]);
      hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

      await waitForValidation();

      expect(engine.getCellValue({ sheet: first, row: 2, col: 1 })).toBe('007');
    });

    it('takes the dropped change out of the grid data when the grid switched away and back', async() => {
      const engine = buildGrid([[1, 'a'], [2, 'b'], [null, 'c']], { columns: REJECTING_COLUMNS });
      const plugin = hot.getPlugin('formulas');
      const first = plugin.sheetId;
      const firstName = plugin.sheetName;

      engine.setSheetContent(engine.getSheetId(engine.addSheet('Other')), [[10, 'x'], [20, 'y'], [null, 'z']]);

      hot.setDataAtCell([[2, 1, '=A1*10'], [2, 0, 5]]);
      plugin.switchSheet('Other');
      plugin.switchSheet(firstName);

      await waitForValidation();

      expect(plugin.sheetId).toBe(first);
      expect(hot.getSourceDataAtCell(2, 1)).toBe('c');
      expect(engine.getCellFormula({ sheet: first, row: 2, col: 1 })).toBeUndefined();
      expect(engine.getCellValue({ sheet: first, row: 2, col: 1 })).toBe('c');
      expect(hot.getSourceDataAtCell(2, 0)).toBeNull();
    });

    it('keeps a newer edit of the cell when a set dropped after a switch away and back answers', async() => {
      let answerHeld = null;
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hot = new Handsontable(container, {
        data: [[1, 'a'], [2, 'b'], [null, 'c']],
        columns: [{
          validator(value, callback) {
            if (value === 'held') {
              answerHeld = () => callback(true);
            } else {
              callback(true);
            }
          },
        }, {}],
        formulas: { engine },
        licenseKey: TEST_LICENSE_KEY,
      });

      const plugin = hot.getPlugin('formulas');
      const first = plugin.sheetId;
      const firstName = plugin.sheetName;

      engine.setSheetContent(engine.getSheetId(engine.addSheet('Other')), [[10, 'x'], [20, 'y'], [null, 'z']]);

      hot.setDataAtCell([[0, 1, 'early'], [0, 0, 'held']]);
      plugin.switchSheet('Other');
      plugin.switchSheet(firstName);
      hot.setDataAtCell(0, 1, 'newer');

      await waitForValidation();

      answerHeld();

      await waitForValidation();

      expect(hot.getSourceDataAtCell(0, 1)).toBe('newer');
      expect(engine.getCellValue({ sheet: first, row: 0, col: 1 })).toBe('newer');
    });

    it('repaints this grid when the restore changes a cell its current sheet reads', async() => {
      const engine = buildGrid([[1, 'a'], [2, 'b'], [3, 4]], { columns: REJECTING_COLUMNS });
      const firstName = hot.getPlugin('formulas').sheetName;
      const other = engine.getSheetId(engine.addSheet('Other'));

      engine.setSheetContent(other, [[`=${firstName}!B3`, 'x'], [null, 'y'], [null, 'z']]);
      hot.setDataAtCell([[2, 1, 50], [2, 0, 6]]);
      hot.updateSettings({ formulas: { engine, sheetName: 'Other' } });

      await waitForValidation();

      expect(hot.getDataAtCell(0, 0)).toBe(4);
      expect(hot.getCell(0, 0).textContent).toBe('4');
    });
  });
});
