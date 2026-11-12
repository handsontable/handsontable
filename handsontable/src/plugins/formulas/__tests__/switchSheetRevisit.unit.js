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

  /**
   * The grid leaves a sheet in an order the move plugins' array does not give (a drag after it), and the return
   * loads the sheet through the order it left it in, with the array applied again. The engine has to follow from the
   * left order to the array's, and both were reached by moves: one order between them kept each moved formula's
   * relative offsets, so a reference across the moved rows turned into `#REF!` or read an empty cell (`1000`).
   */
  describe('after a reorder made on the visit before', () => {
    /**
     * Row `i` holds an ID, a formula that reads the ID of another row, and the value the formula must show.
     *
     * @returns {Array[]}
     */
    function crossRowSheet() {
      return [1, 2, 3, 4, 5].map((id, index) => {
        const target = ((index + 2) % 5) + 1;

        return [id, `=A${target}+1000`, target + 1000];
      });
    }

    /**
     * Builds an engine with the cross-row sheet `A` and the plain sheet `B`.
     *
     * @returns {HyperFormula}
     */
    function buildCrossRowEngine() {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      engine.addSheet('A');
      engine.setSheetContent(engine.getSheetId('A'), crossRowSheet());
      engine.addSheet('B');
      engine.setSheetContent(engine.getSheetId('B'), copy(SHEET_B));

      return engine;
    }

    /**
     * Checks that every row shows what its formula has to read, and that the engine holds what the grid shows.
     */
    function expectEveryRowReadsItsRecord() {
      hot.getData().forEach(([, shown, expected]) => {
        expect(shown).toBe(expected);
      });
      expect(engineValues(hot)).toEqual(hot.getData());
    }

    /**
     * Spies on the engine's row order calls.
     *
     * @param {HyperFormula} engine The engine.
     * @returns {object}
     */
    function spyRowOrderCalls(engine) {
      return { moveRows: jest.spyOn(engine, 'moveRows'), setRowOrder: jest.spyOn(engine, 'setRowOrder') };
    }

    let staying;

    afterEach(() => {
      jest.restoreAllMocks();
      staying?.destroy();
      staying = null;
    });

    /**
     * Reads what each record (by its ID in column A) shows in the formula column.
     *
     * @param {Handsontable} [grid=hot] The grid.
     * @returns {Map}
     */
    function shownByRecord(grid = hot) {
      return new Map(grid.getData().map(([id, shown]) => [id, shown]));
    }

    /**
     * Builds a second grid on its own engine, from the same sheet, that runs `act` without leaving the sheet: what
     * the grid that returns has to show.
     *
     * @param {object} settings Extra settings.
     * @param {Function} act What the grid does.
     * @returns {Handsontable}
     */
    function buildStayingGrid(settings, act) {
      const stayingContainer = document.createElement('div');

      container.appendChild(stayingContainer);
      staying = new Handsontable(stayingContainer, {
        formulas: { engine: buildCrossRowEngine(), sheetName: 'A' },
        licenseKey: LICENSE_KEY,
        ...settings,
      });
      act(staying);

      return staying;
    }

    // A grid built from the sheet only: a grid built with `data` on an engine with another sheet gets its move array
    // at init as one order (the readers-outside-the-sheet fallback of a load), so its cross-row references are off
    // from the start, the documented limit of a load on a multi-sheet engine.
    it('keeps every reference on its record when a sheet-built grid returns to a sheet it dragged a row of', () => {
      const engine = buildCrossRowEngine();

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'A' },
        manualRowMove: [2, 0, 1, 4, 3],
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('manualRowMove').moveRows([4], 0);
      hot.render();

      expectEveryRowReadsItsRecord();

      hot.getPlugin('formulas').switchSheet('B');

      const calls = spyRowOrderCalls(engine);

      hot.getPlugin('formulas').switchSheet('A');

      // The load applies the array again, as any load does; the drag belonged to the visit before.
      expect(hot.getDataAtCol(0)).toEqual([3, 1, 2, 5, 4]);
      expectEveryRowReadsItsRecord();
      expect(calls.setRowOrder).not.toHaveBeenCalled();
      expect(calls.moveRows).toHaveBeenCalled();

      hot.updateSettings({});

      expect(hot.getDataAtCol(0)).toEqual([3, 1, 2, 5, 4]);
      expectEveryRowReadsItsRecord();
    });

    it('keeps every reference on its record when a sheet-built grid returns to a sheet it dragged a column of', () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      // Column `i` of the formula row reads the number of another column; the last row holds what it must show.
      const sheet = [
        [1, 2, 3, 4, 5],
        ['=C1+100', '=D1+100', '=E1+100', '=A1+100', '=B1+100'],
        [103, 104, 105, 101, 102],
      ];

      engine.addSheet('A');
      engine.setSheetContent(engine.getSheetId('A'), sheet);
      engine.addSheet('B');
      engine.setSheetContent(engine.getSheetId('B'), copy(SHEET_B));

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'A' },
        manualColumnMove: [2, 0, 1, 4, 3],
        licenseKey: LICENSE_KEY,
      });

      const expectEveryColumnReadsItsRecord = () => {
        expect(hot.getDataAtRow(1)).toEqual(hot.getDataAtRow(2));
        expect(engineValues(hot)).toEqual(hot.getData());
      };

      hot.getPlugin('manualColumnMove').moveColumns([4], 0);
      hot.render();

      expectEveryColumnReadsItsRecord();

      hot.getPlugin('formulas').switchSheet('B');

      const moveColumns = jest.spyOn(engine, 'moveColumns');
      const setColumnOrder = jest.spyOn(engine, 'setColumnOrder');

      hot.getPlugin('formulas').switchSheet('A');

      expect(hot.getDataAtRow(0)).toEqual([3, 1, 2, 5, 4]);
      expectEveryColumnReadsItsRecord();
      expect(setColumnOrder).not.toHaveBeenCalled();
      expect(moveColumns).toHaveBeenCalled();

      hot.updateSettings({});

      expectEveryColumnReadsItsRecord();
    });

    // The engine took a sort as one order, which shifted the cross-row references (the sort limit, DEV-917). The
    // return sends one order back, as the order reached the engine, so each record shows what it shows on a grid
    // that clears the sort without leaving the sheet.
    it('sends one order on the return to a sheet left sorted, as a cleared sort does', () => {
      const engine = buildCrossRowEngine();

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'A' },
        columnSorting: true,
        licenseKey: LICENSE_KEY,
      });

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      hot.getPlugin('formulas').switchSheet('B');

      const calls = spyRowOrderCalls(engine);

      hot.getPlugin('formulas').switchSheet('A');

      buildStayingGrid({ columnSorting: true }, (grid) => {
        grid.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
        grid.getPlugin('columnSorting').clearSort();
      });

      // The load clears the sort.
      expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
      expect(calls.setRowOrder).toHaveBeenCalledTimes(1);
      expect(calls.moveRows).not.toHaveBeenCalled();
      expect(shownByRecord()).toEqual(shownByRecord(staying));
      expect(engineValues(hot)).toEqual(hot.getData());

      hot.updateSettings({});

      expect(shownByRecord()).toEqual(shownByRecord(staying));
      expect(engineValues(hot)).toEqual(hot.getData());
    });

    it('sends one order on the return to a sheet left in an order set with setIndexesSequence(), as a reset does', () => {
      const engine = buildCrossRowEngine();

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'A' },
        licenseKey: LICENSE_KEY,
      });

      hot.rowIndexMapper.setIndexesSequence([4, 0, 1, 2, 3]);
      hot.getPlugin('formulas').switchSheet('B');

      const calls = spyRowOrderCalls(engine);

      hot.getPlugin('formulas').switchSheet('A');

      buildStayingGrid({}, (grid) => {
        grid.rowIndexMapper.setIndexesSequence([4, 0, 1, 2, 3]);
        grid.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
      });

      expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
      expect(shownByRecord()).toEqual(shownByRecord(staying));
      expect(engineValues(hot)).toEqual(hot.getData());
      expect(calls.setRowOrder).toHaveBeenCalledTimes(1);
      expect(calls.moveRows).not.toHaveBeenCalled();
    });

    it('sends one order on the return to a sheet left in a sequence set and then dragged, as a reset does', () => {
      const engine = buildCrossRowEngine();

      hot = new Handsontable(container, {
        formulas: { engine, sheetName: 'A' },
        manualRowMove: true,
        licenseKey: LICENSE_KEY,
      });

      hot.rowIndexMapper.setIndexesSequence([4, 0, 1, 2, 3]);
      hot.getPlugin('manualRowMove').moveRows([4], 0);
      hot.render();
      hot.getPlugin('formulas').switchSheet('B');

      const calls = spyRowOrderCalls(engine);

      hot.getPlugin('formulas').switchSheet('A');

      buildStayingGrid({ manualRowMove: true }, (grid) => {
        grid.rowIndexMapper.setIndexesSequence([4, 0, 1, 2, 3]);
        grid.getPlugin('manualRowMove').moveRows([4], 0);
        grid.render();
        grid.rowIndexMapper.setIndexesSequence([0, 1, 2, 3, 4]);
      });

      // The return order is not the one the sequence left the engine in, so the difference is a reset of the order,
      // which goes as one order, as on a grid that resets its sequence without leaving the sheet.
      expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
      expect(shownByRecord()).toEqual(shownByRecord(staying));
      expect(engineValues(hot)).toEqual(hot.getData());
      expect(calls.setRowOrder).toHaveBeenCalledTimes(1);
      expect(calls.moveRows).not.toHaveBeenCalled();
    });

    /**
     * A grid built with `data` on an engine with another sheet gets its move array at init as one order (a load's
     * readers-outside-the-sheet fallback, a documented limit), so its cross-row references are off from init. A drag
     * after it and the return to the sheet must not shift them further: the return order is the one that init order
     * left, so the difference is the drag undone, which goes as moves.
     */
    describe('a grid built with data on an engine with another sheet that reads it', () => {
      /**
       * Builds the engine: sheet `A` with the given content, sheet `B` reading two cells of `A`.
       *
       * @param {Array[]} content The content of sheet `A`.
       * @returns {HyperFormula}
       */
      function buildReadEngine(content) {
        const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

        engine.addSheet('A');
        engine.setSheetContent(engine.getSheetId('A'), content);
        engine.addSheet('B');
        engine.setSheetContent(engine.getSheetId('B'), [['=\'A\'!A1', '=\'A\'!B2']]);

        return engine;
      }

      /**
       * Reads the values and the formula text of sheet `B`.
       *
       * @param {HyperFormula} engine The engine.
       * @returns {object}
       */
      function readersOf(engine) {
        const sheetId = engine.getSheetId('B');

        return {
          values: engine.getSheetValues(sheetId)
            .map(row => row.map(value => (value !== null && typeof value === 'object' ? value.value : value))),
          formulas: engine.getSheetSerialized(sheetId),
        };
      }

      it('keeps what each record and the other sheet show when the grid returns to a sheet it dragged a row of', () => {
        const content = () => crossRowSheet().map(([id, formula]) => [id, formula]);
        const engine = buildReadEngine(content());

        hot = new Handsontable(container, {
          data: content(),
          formulas: { engine, sheetName: 'A' },
          manualRowMove: [2, 0, 1, 4, 3],
          licenseKey: LICENSE_KEY,
        });

        const shownAtInit = shownByRecord();
        const readersAtInit = readersOf(engine);

        hot.getPlugin('manualRowMove').moveRows([4], 0);
        hot.render();

        expect(shownByRecord()).toEqual(shownAtInit);

        hot.getPlugin('formulas').switchSheet('B');

        const calls = spyRowOrderCalls(engine);

        hot.getPlugin('formulas').switchSheet('A');

        expect(hot.getDataAtCol(0)).toEqual([3, 1, 2, 5, 4]);
        expect(hot.getDataAtCol(1)).not.toContain('#REF!');
        expect(shownByRecord()).toEqual(shownAtInit);
        expect(readersOf(engine)).toEqual(readersAtInit);
        expect(engineValues(hot)).toEqual(hot.getData());
        expect(calls.setRowOrder).not.toHaveBeenCalled();
        expect(calls.moveRows).toHaveBeenCalled();
      });

      it('keeps what each record and the other sheet show when the grid returns to a sheet it dragged a column of', () => {
        // Column `i` of the formula row reads the number of another column.
        const content = () => [
          [1, 2, 3, 4, 5],
          ['=C1+100', '=D1+100', '=E1+100', '=A1+100', '=B1+100'],
        ];
        const engine = buildReadEngine(content());

        hot = new Handsontable(container, {
          data: content(),
          formulas: { engine, sheetName: 'A' },
          manualColumnMove: [2, 0, 1, 4, 3],
          licenseKey: LICENSE_KEY,
        });

        const shownByColumn = () => new Map(
          hot.getDataAtRow(0).map((id, column) => [id, hot.getDataAtCell(1, column)]),
        );
        const shownAtInit = shownByColumn();
        const readersAtInit = readersOf(engine);

        hot.getPlugin('manualColumnMove').moveColumns([4], 0);
        hot.render();

        expect(shownByColumn()).toEqual(shownAtInit);

        hot.getPlugin('formulas').switchSheet('B');

        const moveColumns = jest.spyOn(engine, 'moveColumns');
        const setColumnOrder = jest.spyOn(engine, 'setColumnOrder');

        hot.getPlugin('formulas').switchSheet('A');

        expect(hot.getDataAtRow(0)).toEqual([3, 1, 2, 5, 4]);
        expect(hot.getDataAtRow(1)).not.toContain('#REF!');
        expect(shownByColumn()).toEqual(shownAtInit);
        expect(readersOf(engine)).toEqual(readersAtInit);
        expect(engineValues(hot)).toEqual(hot.getData());
        expect(setColumnOrder).not.toHaveBeenCalled();
        expect(moveColumns).toHaveBeenCalled();
      });
    });
  });
});
