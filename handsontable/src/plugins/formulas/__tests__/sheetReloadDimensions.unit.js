import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';

/**
 * A grid built without `data` reloads itself from the engine sheet on every `updateSettings()`. The
 * engine's `getSheetSerialized()` trims trailing empty cells per row, so a sheet whose first row ends
 * in an empty cell came back jagged, and the core derived the column count from that first row. The
 * reload then dropped the last column although the engine still held its data (DEV-1143).
 */
describe('Formulas sheet reload dimensions', () => {
  const COLUMNS = 15;
  const ROWS = 5;
  let container;
  let hot;
  let engine;

  beforeAll(() => {
    registerPlugin(Formulas);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    engine = null;
    container.remove();
  });

  /**
   * Builds a grid with no `data`, then fills the engine sheet the way the reporter's app does.
   *
   * @returns {object} The settings the grid was built with, to resend on a re-render.
   */
  function buildAndFillSheetThroughEngine() {
    const settings = {
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    };

    hot = new Handsontable(container, settings);

    const sheetId = engine.getSheetId('Sheet1');

    engine.setSheetContent(
      sheetId,
      Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLUMNS }, (__, col) => `R${row}C${col}`))
    );
    hot.updateSettings({ ...settings });

    return settings;
  }

  it('should keep the last column after its first-row cell is emptied and the grid re-renders', () => {
    const settings = buildAndFillSheetThroughEngine();

    expect(hot.countCols()).toBe(COLUMNS);

    hot.setDataAtCell(0, COLUMNS - 1, null);
    hot.updateSettings({ ...settings });

    expect(hot.countCols()).toBe(COLUMNS);
    expect(hot.getDataAtCell(1, COLUMNS - 1)).toBe(`R1C${COLUMNS - 1}`);
    expect(hot.getDataAtCell(0, COLUMNS - 1)).toBeNull();
  });

  it('should keep the width of the widest row when the last two first-row cells are emptied', () => {
    const settings = buildAndFillSheetThroughEngine();

    hot.setDataAtCell(0, COLUMNS - 1, null);
    hot.setDataAtCell(0, COLUMNS - 2, null);
    hot.updateSettings({ ...settings });

    expect(hot.countCols()).toBe(COLUMNS);
    expect(hot.getDataAtCell(0, COLUMNS - 3)).toBe(`R0C${COLUMNS - 3}`);
    expect(hot.getDataAtCell(1, COLUMNS - 2)).toBe(`R1C${COLUMNS - 2}`);
  });

  it('should keep the first-row width when the grid is reloaded without any edit', () => {
    const settings = buildAndFillSheetThroughEngine();

    hot.updateSettings({ ...settings });

    expect(hot.countRows()).toBe(ROWS);
    expect(hot.countCols()).toBe(COLUMNS);
  });

  it('should not narrow the engine sheet when switching to a jagged sheet on a grid with a `columns` array', () => {
    const jagged = [['a', 'b'], ['c', 'd', 'e', 'f', 'g']];

    hot = new Handsontable(container, {
      data: [[1, 2, 3], [4, 5, 6]],
      columns: [{}, {}, {}],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    engine.addSheet('Other');
    engine.setSheetContent(engine.getSheetId('Other'), jagged);
    hot.getPlugin('formulas').switchSheet('Other');
    hot.updateSettings({});

    expect(engine.getSheetSerialized(engine.getSheetId('Other'))).toEqual(jagged);
  });

  it('should keep the last column on a grid with a `columns` function when its first-row cell is emptied', () => {
    const settings = {
      formulas: { engine, sheetName: 'Sheet1' },
      columns: () => ({}),
      licenseKey: 'non-commercial-and-evaluation',
    };

    hot = new Handsontable(container, settings);

    engine.setSheetContent(
      engine.getSheetId('Sheet1'),
      Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLUMNS }, (__, col) => `R${row}C${col}`))
    );
    hot.updateSettings({ ...settings });

    expect(hot.countCols()).toBe(COLUMNS);

    hot.setDataAtCell(0, COLUMNS - 1, null);
    hot.updateSettings({ ...settings });

    expect(hot.countCols()).toBe(COLUMNS);
    expect(hot.getDataAtCell(1, COLUMNS - 1)).toBe(`R1C${COLUMNS - 1}`);
  });

  it('should not narrow the engine sheet when a `columns` function hides some columns of a jagged sheet', () => {
    const jagged = [['a', 'b'], ['c', 'd', 'e', 'f', 'g']];

    hot = new Handsontable(container, {
      data: [[1, 2, 3], [4, 5, 6]],
      columns: index => (index < 3 ? {} : null),
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    engine.addSheet('Other');
    engine.setSheetContent(engine.getSheetId('Other'), jagged);
    hot.getPlugin('formulas').switchSheet('Other');
    hot.updateSettings({});

    expect(engine.getSheetSerialized(engine.getSheetId('Other'))).toEqual(jagged);
  });

  it('should not narrow the engine sheet when switching to a jagged sheet on a grid with a `dataSchema`', () => {
    const jagged = [['a', 'b'], ['c', 'd', 'e', 'f', 'g']];

    hot = new Handsontable(container, {
      data: [[1, 2, 3], [4, 5, 6]],
      dataSchema: [null, null, null],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    engine.addSheet('Other');
    engine.setSheetContent(engine.getSheetId('Other'), jagged);
    hot.getPlugin('formulas').switchSheet('Other');
    hot.updateSettings({});

    expect(engine.getSheetSerialized(engine.getSheetId('Other'))).toEqual(jagged);
  });

  it('should not narrow the engine sheet when `maxCols` caps the columns of a jagged sheet', () => {
    const jagged = [['a', 'b'], ['c', 'd', 'e', 'f', 'g']];

    hot = new Handsontable(container, {
      data: [[1, 2, 3], [4, 5, 6]],
      maxCols: 3,
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    engine.addSheet('Other');
    engine.setSheetContent(engine.getSheetId('Other'), jagged);
    hot.getPlugin('formulas').switchSheet('Other');
    hot.updateSettings({});
    hot.setDataAtCell(0, 0, 'X');

    expect(engine.getSheetSerialized(engine.getSheetId('Other')))
      .toEqual([['X', 'b'], ['c', 'd', 'e', 'f', 'g']]);
  });

  it('should load the widest row of a jagged sheet on a switch to it', () => {
    hot = new Handsontable(container, {
      data: [[1], [2]],
      formulas: { engine, sheetName: 'Sheet1' },
      licenseKey: 'non-commercial-and-evaluation',
    });

    engine.addSheet('Other');
    engine.setSheetContent(engine.getSheetId('Other'), [['a'], ['b', 'c', 'd']]);
    hot.getPlugin('formulas').switchSheet('Other');

    expect(hot.countCols()).toBe(3);
    expect(hot.getDataAtRow(0)).toEqual(['a', null, null]);
  });

  it('should serialize a shorter sheet but keep the full dimensions after a whole trailing column is emptied', () => {
    buildAndFillSheetThroughEngine();

    for (let row = 0; row < ROWS; row++) {
      hot.setDataAtCell(row, COLUMNS - 1, null);
    }

    const sheetId = engine.getSheetId('Sheet1');

    // Probe, not a requirement: records what the engine does so the AGENTS.md note stays honest.
    expect({
      dimensions: engine.getSheetDimensions(sheetId),
      serializedRowLengths: engine.getSheetSerialized(sheetId).map(row => row.length),
    }).toEqual({
      dimensions: { width: COLUMNS, height: ROWS },
      serializedRowLengths: Array(ROWS).fill(COLUMNS - 1),
    });
  });

  it('should still shrink the grid when the engine sheet itself is replaced by a smaller one', () => {
    const settings = buildAndFillSheetThroughEngine();

    engine.setSheetContent(
      engine.getSheetId('Sheet1'),
      Array.from({ length: 2 }, (_, row) => Array.from({ length: 3 }, (__, col) => `R${row}C${col}`))
    );
    hot.updateSettings({ ...settings });

    expect(hot.countRows()).toBe(2);
    expect(hot.countCols()).toBe(3);
  });
});
