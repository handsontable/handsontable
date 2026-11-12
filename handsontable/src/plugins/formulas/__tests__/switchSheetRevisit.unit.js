import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;
const SHEET_A = [['a1', 1, '=B1*2'], ['a2', 2, '=B2*2'], ['a3', 3, '=B3*2']];
const SHEET_B = [['b1', 10, '=B1*2'], ['b2', 20, '=B2*2'], ['b3', 30, '=B3*2']];

/**
 * Copies a sheet, so no test writes into the arrays another test loads.
 *
 * @param {Array[]} rows The rows.
 * @returns {Array[]}
 */
function copy(rows) {
  return rows.map(row => row.slice());
}

/**
 * Builds an engine holding the `A` and `B` sheets.
 *
 * @returns {HyperFormula}
 */
function buildEngine() {
  const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

  engine.addSheet('A');
  engine.setSheetContent(engine.getSheetId('A'), copy(SHEET_A));
  engine.addSheet('B');
  engine.setSheetContent(engine.getSheetId('B'), copy(SHEET_B));

  return engine;
}

/**
 * Reads the values of the sheet the grid is bound to, in the engine's own order.
 *
 * @param {Handsontable} hot The grid.
 * @returns {Array[]}
 */
function engineValues(hot) {
  const { engine, sheetId } = hot.getPlugin('formulas');

  return engine.getSheetValues(sheetId)
    .map(row => row.map(value => (value !== null && typeof value === 'object' ? value.value : value)));
}

/**
 * `switchSheet()` back to a sheet the grid already showed. The first visit of a sheet moves its lines in the
 * engine by the configured `manualRowMove` / `manualColumnMove` array; the next visit loaded the sheet in that
 * moved order, and `afterLoadData` applied the array once more, so the sheet rotated on every visit (A, B, A, B
 * with `[2, 0, 1]`). Develop rotated the sheet left and showed the arriving one with the results of other rows.
 */
describe('Formulas switchSheet() back to a visited sheet', () => {
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
  });

  /**
   * Switches A, B, A, B and returns what the grid and the engine showed on each visit.
   *
   * @returns {object}
   */
  function visitSheets() {
    const visits = { A: [], B: [] };

    visits.A.push({ grid: hot.getData(), engine: engineValues(hot) });
    ['B', 'A', 'B', 'A', 'B'].forEach((sheetName) => {
      hot.getPlugin('formulas').switchSheet(sheetName);
      visits[sheetName].push({ grid: hot.getData(), engine: engineValues(hot) });
    });

    return visits;
  }

  it.each([
    ['built with data', true],
    ['built from the sheet', false],
  ])('shows the same row order on every visit of a grid %s with a manualRowMove array', (_, withData) => {
    hot = new Handsontable(container, {
      ...(withData ? { data: copy(SHEET_A) } : {}),
      formulas: { engine: buildEngine(), sheetName: 'A' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    const visits = visitSheets();

    visits.A.forEach(({ grid, engine }) => {
      expect(grid).toEqual([['a3', 3, 6], ['a1', 1, 2], ['a2', 2, 4]]);
      expect(engine).toEqual(grid);
    });
    visits.B.forEach(({ grid, engine }) => {
      expect(grid).toEqual([['b3', 30, 60], ['b1', 10, 20], ['b2', 20, 40]]);
      expect(engine).toEqual(grid);
    });
  });

  it('shows the same column order on every visit of a sheet-built grid with a manualColumnMove array', () => {
    hot = new Handsontable(container, {
      formulas: { engine: buildEngine(), sheetName: 'A' },
      manualColumnMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    const visits = visitSheets();

    visits.A.forEach(({ grid, engine }) => {
      expect(grid).toEqual([[2, 'a1', 1], [4, 'a2', 2], [6, 'a3', 3]]);
      expect(engine).toEqual(grid);
    });
    visits.B.forEach(({ grid, engine }) => {
      expect(grid).toEqual([[20, 'b1', 10], [40, 'b2', 20], [60, 'b3', 30]]);
      expect(engine).toEqual(grid);
    });
  });

  it('sends no order to the engine on a revisit that finds the sheet in the order it left', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'A' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('formulas').switchSheet('B');
    hot.getPlugin('formulas').switchSheet('A');

    const orderCalls = ['moveRows', 'setRowOrder'].map(name => jest.spyOn(engine, name));

    hot.getPlugin('formulas').switchSheet('B');

    expect(orderCalls.reduce((count, spy) => count + spy.mock.calls.length, 0)).toBe(0);
  });

  it('loads a visited sheet as the engine holds it when the host changed its dimensions meanwhile', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'A' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('formulas').switchSheet('B');
    hot.getPlugin('formulas').switchSheet('A');
    engine.addRows(engine.getSheetId('B'), [3, 1]);
    engine.setCellContents({ sheet: engine.getSheetId('B'), row: 3, col: 0 }, [['b4', 40, '=B4*2']]);
    hot.getPlugin('formulas').switchSheet('B');

    // The recorded order no longer describes the sheet: it loads as the engine holds it, and the array moves it.
    expect(hot.getDataAtCol(0)).toEqual(['b2', 'b3', 'b1', 'b4']);
    expect(engineValues(hot)).toEqual(hot.getData());
    expect(hot.getData().every(([, number, result]) => result === number * 2)).toBe(true);
  });

  it('shows a sheet sorted on its last visit in its own order again, with the engine following', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'A' },
      columnSorting: true,
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('formulas').switchSheet('B');
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
    hot.getPlugin('formulas').switchSheet('A');
    hot.getPlugin('formulas').switchSheet('B');

    // The load clears the sort, so the sheet shows in its own order, and the engine is brought back to it.
    expect(hot.getData()).toEqual([['b1', 10, 20], ['b2', 20, 40], ['b3', 30, 60]]);
    expect(engineValues(hot)).toEqual(hot.getData());
  });

  it('keeps no copy of the sheet on a grid built with data after switchSheet()', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      data: copy(SHEET_A),
      formulas: { engine, sheetName: 'A' },
      licenseKey: LICENSE_KEY,
    });

    const loads = [];

    hot.addHook('afterLoadData', () => loads.push('loadData'));
    hot.addHook('afterUpdateData', () => loads.push('updateData'));
    hot.getPlugin('formulas').switchSheet('B');
    // A reload snapshot of a grid built with data is never kept in step with its writes, so the switch records none
    // (a full copy of the sheet for the grid's lifetime, stale after the first edit). With nothing to compare
    // against, a switch to the same sheet takes `loadData()`, with no write since and after one.
    hot.getPlugin('formulas').switchSheet('B');
    hot.setDataAtCell(0, 1, 11);
    hot.getPlugin('formulas').switchSheet('B');

    expect(loads).toEqual(['loadData', 'loadData', 'loadData']);
    expect(hot.getData()).toEqual([['b1', 11, 22], ['b2', 20, 40], ['b3', 30, 60]]);
    expect(engineValues(hot)).toEqual(hot.getData());
  });
});
