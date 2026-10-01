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

  it('should keep the width of the widest row when an inner first-row cell is emptied', () => {
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
