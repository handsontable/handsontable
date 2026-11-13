import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;
const SHEET_CONTENT = [['b', 2, '=B1*2'], ['a', 1, '=B2*2'], ['c', 3, '=B3*2']];
// Each formula reads the number of the next record (the last one the first), so a mis-mapping that swaps
// whole rows shows: the results per letter are b 10, a 40, d 30, c 20.
const CROSS_ROW_CONTENT = [['b', 2, '=B2*10'], ['a', 1, '=B3*10'], ['d', 4, '=B4*10'], ['c', 3, '=B1*10']];
const CROSS_ROW_RESULTS = { b: 10, a: 40, d: 30, c: 20 };

/**
 * Builds an engine with the `S1` sheet holding `SHEET_CONTENT`. Every test builds its own engine, so no
 * sheet order or spy leaks from one test into another.
 *
 * @returns {HyperFormula}
 */
function buildEngine() {
  const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

  engine.addSheet('S1');
  engine.setSheetContent(engine.getSheetId('S1'), SHEET_CONTENT);

  return engine;
}

/**
 * A grid built from an engine sheet without `data` binds the sheet through the plugin's own load. The axis
 * syncers read the engine they send orders to from the sync endpoint, so a grid built that way has to
 * get one as well, or the first order change throws in `AxisSyncer#syncOrderWithEngine`. The other two
 * tests pin that the endpoint is set up once: an order reaches the engine one time, not twice.
 */
describe('Formulas sync endpoint of a grid built from an engine sheet', () => {
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

  it('sorts a grid built from an engine sheet without data', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      columnSorting: true,
      licenseKey: LICENSE_KEY,
    });

    expect(() => hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' })).not.toThrow();
    expect(hot.getDataAtCol(0)).toEqual(['a', 'b', 'c']);
    // The formulas follow the sort: the `a` row holds `=B*2` of its own `1`.
    expect(hot.getDataAtCell(0, 2)).toBe(2);
  });

  it('follows a setIndexesSequence() on a sheet-built grid', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      licenseKey: LICENSE_KEY,
    });

    expect(() => hot.rowIndexMapper.setIndexesSequence([2, 0, 1])).not.toThrow();
    expect(hot.getDataAtCol(0)).toEqual(['c', 'b', 'a']);
  });

  it('sends no order on switchSheet() of a grid built with data after a sort', () => {
    const engine = buildEngine();

    engine.addSheet('S2');
    engine.setSheetContent(engine.getSheetId('S2'), [['y', 20, '=B1*2'], ['x', 10, '=B2*2'], ['z', 30, '=B3*2']]);

    hot = new Handsontable(container, {
      data: SHEET_CONTENT.map(row => [...row]),
      formulas: { engine, sheetName: 'S1' },
      columnSorting: true,
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

    const setRowOrder = jest.spyOn(engine, 'setRowOrder');

    hot.getPlugin('formulas').switchSheet('S2');

    // The count develop makes today, measured before the fix and pinned so that giving the sheet-built path
    // its sync endpoint cannot add a second order on a switch. It is 0: the switch's `loadData()` clears the
    // sort, so the grid's sequence is the identity when the endpoint is set up and no order is sent.
    expect(setRowOrder).toHaveBeenCalledTimes(0);
    expect(hot.getData()).toEqual([['y', 20, 40], ['x', 10, 20], ['z', 30, 60]]);
  });

  it('sends the order once on switchSheet() of a grid built with data and a manual row move', () => {
    const engine = buildEngine();

    engine.addSheet('S2');
    engine.setSheetContent(engine.getSheetId('S2'), [['y', 20, '=B1*2'], ['x', 10, '=B2*2'], ['z', 30, '=B3*2']]);

    hot = new Handsontable(container, {
      data: SHEET_CONTENT.map(row => [...row]),
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    const s1Id = engine.getSheetId('S1');
    const s2Id = engine.getSheetId('S2');
    const s1Before = engine.getSheetSerialized(s1Id);
    const moveRows = jest.spyOn(engine, 'moveRows');
    const setRowOrder = jest.spyOn(engine, 'setRowOrder');

    hot.getPlugin('formulas').switchSheet('S2');

    // The move survives the switch's `loadData()` (ManualRowMove re-applies its array), so the order has to
    // reach S2 exactly once. Develop makes one engine call, but it is `moveRows(0, 2, 1, 0)` on S1, the sheet
    // the grid left: the sync endpoint still names S1, so S1 is rotated a second time and S2 is never
    // reordered. The count of 1 is develop's, pinned so the fix cannot add a second order; the sheet id, the
    // untouched S1 and the values are what develop gets wrong.
    const orderCalls = [...moveRows.mock.calls, ...setRowOrder.mock.calls];

    expect(orderCalls.length).toBe(1);
    expect(orderCalls[0][0]).toBe(s2Id);
    expect(engine.getSheetSerialized(s1Id)).toEqual(s1Before);
    expect(hot.getDataAtCol(0)).toEqual(['z', 'y', 'x']);
    // Each formula doubles its own row's number, so a double transform or a `#REF!` shows here.
    expect(hot.getDataAtCol(2)).toEqual([60, 40, 20]);
  });

  it('applies an initial manual move once on a sheet-built grid', () => {
    const engine = buildEngine();
    const moveRows = jest.spyOn(engine, 'moveRows');
    const setRowOrder = jest.spyOn(engine, 'setRowOrder');

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    expect(moveRows.mock.calls.length + setRowOrder.mock.calls.length).toBe(1);
    // Each formula doubles its own row's number, so the results follow the moved rows.
    expect(hot.getDataAtCol(0)).toEqual(['c', 'b', 'a']);
    expect(hot.getDataAtCol(2)).toEqual([6, 4, 2]);
  });

});

/**
 * A grid built from an engine sheet without `data` reloads that sheet on every `updateSettings()`. The engine
 * already holds the sheet in the order the grid shows, so the reload keeps the grid's order: a move array that
 * ManualRowMove/ManualColumnMove re-apply in the load's `afterLoadData` is not applied, and not sent, a second
 * time. Before, the order rotated once per update (`c, b, a` -> `a, c, b` -> `b, a, c`), and the engine with it.
 */
describe('Formulas reload of a moved sheet-built grid', () => {
  let container;
  let hot;
  let dataBuilt;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    dataBuilt?.destroy();
    dataBuilt = null;
    container.remove();
  });

  /**
   * Builds a grid from `data` with the same settings, as the oracle of what a sheet-built grid should show.
   *
   * @param {Array} data The sheet content.
   * @param {object} settings The other settings.
   * @returns {Handsontable}
   */
  function buildDataBuiltGrid(data, settings) {
    const element = document.createElement('div');

    container.appendChild(element);

    return new Handsontable(element, {
      data: data.map(row => [...row]),
      formulas: { engine: HyperFormula },
      licenseKey: LICENSE_KEY,
      ...settings,
    });
  }

  /**
   * Counts the order calls the engine gets from now on.
   *
   * @param {HyperFormula} engine The engine.
   * @returns {Function} Returns the number of calls made since.
   */
  function countOrderCalls(engine) {
    const spies = ['moveRows', 'setRowOrder', 'moveColumns', 'setColumnOrder'].map(name => jest.spyOn(engine, name));

    return () => spies.reduce((count, spy) => count + spy.mock.calls.length, 0);
  }

  /**
   * Reads, for each visual cell, the value the engine holds at the cell the grid translates it to, an error
   * as its text.
   *
   * @returns {Array<Array<*>>}
   */
  function readEngineThroughGrid() {
    const formulas = hot.getPlugin('formulas');

    return hot.getData().map((row, visualRow) => row.map((_, visualColumn) => {
      const value = formulas.engine.getCellValue({
        sheet: formulas.sheetId,
        row: formulas.rowAxisSyncer.getHfIndexFromVisualIndex(visualRow),
        col: formulas.columnAxisSyncer.getHfIndexFromVisualIndex(visualColumn),
      });

      // An error reads as its text in the grid.
      return value !== null && typeof value === 'object' ? value.value : value;
    }));
  }

  it('keeps the row order of an array manualRowMove across updateSettings() calls', () => {
    const engine = buildEngine();
    const sheetId = engine.getSheetId('S1');

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    const sheetAfterInit = engine.getSheetSerialized(sheetId);
    const orderCalls = countOrderCalls(engine);

    expect(hot.getData()).toEqual([['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]);

    // Checked after every update: a rotation of three rows comes back after three.
    for (let update = 0; update < 3; update += 1) {
      hot.updateSettings({});

      expect(hot.getData()).toEqual([['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]);
      expect(engine.getSheetSerialized(sheetId)).toEqual(sheetAfterInit);
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    }

    expect(orderCalls()).toBe(0);
  });

  it('keeps the row order of an array manualRowMove across updates of an unrelated option', () => {
    const engine = buildEngine();
    const sheetId = engine.getSheetId('S1');

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    const sheetAfterInit = engine.getSheetSerialized(sheetId);
    const orderCalls = countOrderCalls(engine);

    hot.updateSettings({ rowHeaders: true });
    hot.updateSettings({ colHeaders: true });
    hot.updateSettings({ rowHeaders: false });

    expect(hot.getData()).toEqual([['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]);
    expect(engine.getSheetSerialized(sheetId)).toEqual(sheetAfterInit);
    expect(orderCalls()).toBe(0);
  });

  it('applies a new manualRowMove array once, as a grid built with the same data does', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });
    dataBuilt = buildDataBuiltGrid(SHEET_CONTENT, { manualRowMove: [2, 0, 1] });

    hot.updateSettings({ manualRowMove: [1, 0, 2] });
    dataBuilt.updateSettings({ manualRowMove: [1, 0, 2] });

    expect(hot.getData()).toEqual(dataBuilt.getData());

    const sheetAfterChange = engine.getSheetSerialized(engine.getSheetId('S1'));

    hot.updateSettings({});
    hot.updateSettings({});
    hot.updateSettings({});
    dataBuilt.updateSettings({});

    expect(hot.getData()).toEqual(dataBuilt.getData());
    expect(engine.getSheetSerialized(engine.getSheetId('S1'))).toEqual(sheetAfterChange);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  it('keeps the column order of an array manualColumnMove across updateSettings() calls', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('S1');
    engine.setSheetContent(engine.getSheetId('S1'), [[1, 2, '=A1+10'], [3, 4, '=A2+10']]);

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualColumnMove: [1, 0],
      licenseKey: LICENSE_KEY,
    });

    const sheetAfterInit = engine.getSheetSerialized(engine.getSheetId('S1'));
    const orderCalls = countOrderCalls(engine);

    expect(hot.getData()).toEqual([[2, 1, 11], [4, 3, 13]]);

    hot.updateSettings({});
    hot.updateSettings({ rowHeaders: true });
    hot.updateSettings({});

    expect(hot.getData()).toEqual([[2, 1, 11], [4, 3, 13]]);
    expect(engine.getSheetSerialized(engine.getSheetId('S1'))).toEqual(sheetAfterInit);
    expect(orderCalls()).toBe(0);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  it('keeps both orders of an array manualRowMove and manualColumnMove across updateSettings() calls', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      manualColumnMove: [2, 0],
      licenseKey: LICENSE_KEY,
    });
    // Column C (the formulas) moved to the front, each formula doubling its own row's number. A grid built
    // with `data` and these two moves shows `#REF!` there (the engine gets both orders at init), so it is not
    // used as the oracle here.
    const expected = [[6, 'c', 3], [4, 'b', 2], [2, 'a', 1]];
    const sheetAfterInit = engine.getSheetSerialized(engine.getSheetId('S1'));
    const orderCalls = countOrderCalls(engine);

    expect(hot.getData()).toEqual(expected);

    hot.updateSettings({});
    hot.updateSettings({});
    hot.updateSettings({});

    expect(hot.getData()).toEqual(expected);
    expect(engine.getSheetSerialized(engine.getSheetId('S1'))).toEqual(sheetAfterInit);
    expect(orderCalls()).toBe(0);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  it.each([
    ['true', true],
    ['an array', [2, 0, 1]],
  ])('keeps the order a user drag made, with manualRowMove set to %s, across updateSettings()', (_, setting) => {
    const engine = buildEngine();
    const sheetId = engine.getSheetId('S1');

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: setting,
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('manualRowMove').dragRows([2], 0);
    hot.getPlugin('manualRowMove').moveRow(2, 1);

    const dragged = hot.getData();

    // Checked after every update: a rotation of three rows comes back after three.
    for (let update = 0; update < 3; update += 1) {
      hot.updateSettings({});

      expect(hot.getData()).toEqual(dragged);
      expect(JSON.stringify(engine.getSheetSerialized(sheetId))).not.toContain('#REF!');
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    }

    // Each formula doubles its own row's number.
    hot.getData().forEach(([, number, result]) => expect(result).toBe(number * 2));
    // The source data holds the same row for each visual row as the grid shows.
    hot.getData().forEach(([letter], visualRow) => {
      expect(hot.getSourceDataAtCell(hot.toPhysicalRow(visualRow), 0)).toBe(letter);
    });
  });

  it('keeps a blank row the move put last, and a blank column the move put last, across updateSettings()', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const sheetId = engine.addSheet('S1') && engine.getSheetId('S1');

    engine.setSheetContent(sheetId, [['a', null, '=A3&"!"'], [null, null, null], ['c', null, 'z']]);

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0],
      manualColumnMove: [2, 0],
      licenseKey: LICENSE_KEY,
    });

    const initial = hot.getData();

    expect(initial).toEqual([['z', 'c', null], ['c!', 'a', null], [null, null, null]]);

    hot.updateSettings({});
    hot.updateSettings({});
    hot.updateSettings({});

    expect(hot.getData()).toEqual(initial);
    expect(hot.countRows()).toBe(3);
    expect(hot.countCols()).toBe(3);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  it('keeps a trailing blank row and column of the sheet out of the grid across updateSettings()', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const sheetId = engine.addSheet('S1') && engine.getSheetId('S1');

    engine.setSheetContent(sheetId, [['b', 2, '=B1*2', null], ['a', 1, '=B2*2', null], [null, null, null, null]]);

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [1, 0],
      licenseKey: LICENSE_KEY,
    });

    const initial = hot.getData();

    hot.updateSettings({});
    hot.updateSettings({});
    hot.updateSettings({});

    expect(hot.getData()).toEqual(initial);
    expect(initial).toEqual([['a', 1, 2], ['b', 2, 4]]);
  });

  it('sorts a moved sheet-built grid before and after updateSettings()', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      columnSorting: true,
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(hot.getData()).toEqual([['a', 1, 2], ['b', 2, 4], ['c', 3, 6]]);

    hot.updateSettings({});
    hot.updateSettings({});

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

    expect(hot.getData()).toEqual([['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());

    hot.updateSettings({});

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(hot.getData()).toEqual([['a', 1, 2], ['b', 2, 4], ['c', 3, 6]]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  it('undoes and redoes a user move made after updateSettings() on a moved sheet-built grid', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      undo: true,
      licenseKey: LICENSE_KEY,
    });

    hot.updateSettings({});
    hot.getPlugin('manualRowMove').moveRow(0, 2);
    hot.render();

    expect(hot.getData()).toEqual([['b', 2, 4], ['a', 1, 2], ['c', 3, 6]]);

    hot.getPlugin('undoRedo').undo();

    expect(hot.getData()).toEqual([['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());

    hot.getPlugin('undoRedo').redo();

    expect(hot.getData()).toEqual([['b', 2, 4], ['a', 1, 2], ['c', 3, 6]]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());

    hot.updateSettings({});

    expect(hot.getData()).toEqual([['b', 2, 4], ['a', 1, 2], ['c', 3, 6]]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  it('undoes an insert made after the reloaded rows were moved back to physical order', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      undo: true,
      licenseKey: LICENSE_KEY,
    });

    // The reload loads the engine's formula text, which names the rows in the engine's order, into rows kept
    // in physical order.
    hot.updateSettings({});
    hot.getPlugin('manualRowMove').moveRows([1, 2, 0], 0);

    expect(hot.getData()).toEqual([['b', 2, 4], ['a', 1, 2], ['c', 3, 6]]);

    hot.alter('insert_row_above', 0);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getData()).toEqual([['b', 2, 4], ['a', 1, 2], ['c', 3, 6]]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  /**
   * Reads the sheet's values as the grid shows them: an error as its text.
   *
   * @param {HyperFormula} engine The engine.
   * @param {number} sheetId The sheet id.
   * @returns {Array<Array<*>>}
   */
  function engineValues(engine, sheetId) {
    return engine.getSheetValues(sheetId)
      .map(row => row.map(value => (value !== null && typeof value === 'object' ? value.value : value)));
  }

  /**
   * Builds an engine with the `S1` sheet holding `CROSS_ROW_CONTENT`.
   *
   * @returns {HyperFormula}
   */
  function buildCrossRowEngine() {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('S1');
    engine.setSheetContent(engine.getSheetId('S1'), CROSS_ROW_CONTENT);

    return engine;
  }

  /**
   * Asserts that every visual row shows the result its record's formula has, read off the letter.
   */
  function expectCrossRowResults() {
    hot.getData().forEach(([letter, , result]) => expect(result).toBe(CROSS_ROW_RESULTS[letter]));
  }

  it('keeps the row order and the cross-row results of an array manualRowMove across updates', () => {
    const engine = buildCrossRowEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [3, 1, 0, 2],
      licenseKey: LICENSE_KEY,
    });

    expect(hot.getDataAtCol(0)).toEqual(['c', 'a', 'b', 'd']);
    expectCrossRowResults();

    for (let update = 0; update < 3; update += 1) {
      hot.updateSettings({});

      expect(hot.getDataAtCol(0)).toEqual(['c', 'a', 'b', 'd']);
      expectCrossRowResults();
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    }
  });

  it('keeps the order and the cross-row results of a user drag across updates', () => {
    const engine = buildCrossRowEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [3, 1, 0, 2],
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('manualRowMove').dragRows([3], 0);

    const dragged = hot.getDataAtCol(0);

    expect(dragged).toEqual(['d', 'c', 'a', 'b']);

    for (let update = 0; update < 3; update += 1) {
      hot.updateSettings({});

      expect(hot.getDataAtCol(0)).toEqual(dragged);
      expectCrossRowResults();
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    }
  });

  it.each([
    ['removeRows', engine => engine.removeRows(engine.getSheetId('S1'), [0, 1])],
    ['a smaller setSheetContent', engine => engine.setSheetContent(engine.getSheetId('S1'), [
      ['n1', 1, '=B2*10'], ['n2', 2, '=B1*10'],
    ])],
  ])('shrinks a moved grid when the host shrinks the engine sheet with %s', (_, shrink) => {
    const engine = buildCrossRowEngine();
    const sheetId = engine.getSheetId('S1');

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [3, 1, 0, 2],
      licenseKey: LICENSE_KEY,
    });

    shrink(engine);

    const orderCalls = countOrderCalls(engine);

    for (let update = 0; update < 3; update += 1) {
      hot.updateSettings({});

      // The grid shows what the engine holds, in the engine's order, and nothing more.
      expect(hot.countRows()).toBe(engine.getSheetValues(sheetId).length);
      expect(hot.getData()).toEqual(engineValues(engine, sheetId));
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    }

    expect(orderCalls()).toBe(0);
  });

  it('shrinks a moved grid when the host removes engine columns', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const sheetId = engine.addSheet('S1') && engine.getSheetId('S1');

    engine.setSheetContent(sheetId, [[1, 2, 3, '=A1+B1'], [4, 5, 6, '=C2*10']]);

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualColumnMove: [3, 0],
      licenseKey: LICENSE_KEY,
    });

    expect(hot.getData()).toEqual([[3, 1, 2, 3], [60, 4, 5, 6]]);

    engine.removeColumns(sheetId, [0, 1]);

    for (let update = 0; update < 3; update += 1) {
      hot.updateSettings({});

      expect(hot.countCols()).toBe(3);
      expect(hot.getData()).toEqual(engineValues(engine, sheetId));
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    }
  });

  it.each([
    ['at the end', 4],
    ['in the middle', 1],
  ])('shows the rows the host adds to a moved engine sheet %s', (_, row) => {
    const engine = buildCrossRowEngine();
    const sheetId = engine.getSheetId('S1');

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [3, 1, 0, 2],
      licenseKey: LICENSE_KEY,
    });

    engine.addRows(sheetId, [row, 1]);
    engine.setCellContents({ sheet: sheetId, row, col: 0 }, [['e', 5, '=B1*10']]);

    for (let update = 0; update < 3; update += 1) {
      hot.updateSettings({});

      expect(hot.countRows()).toBe(5);
      expect(hot.getData()).toEqual(engineValues(engine, sheetId));
      expect(readEngineThroughGrid()).toEqual(hot.getData());
    }
  });

  // A reload keeps ColumnSorting's state, as a grid built with `data` does: the sort config, and the manual order
  // `clearSort()` goes back to (see "A reload of the sheet the syncers are synced with keeps the grid's order" in
  // `../AGENTS.md`). It used to drop the config and keep the rows sorted.
  it('keeps the sort state of a moved sheet-built grid on a reload, and clears back to the manual order', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      columnSorting: true,
      licenseKey: LICENSE_KEY,
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
    hot.updateSettings({});

    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
    expect(hot.getData()).toEqual([['a', 1, 2], ['b', 2, 4], ['c', 3, 6]]);

    hot.getPlugin('columnSorting').clearSort();

    expect(hot.getData()).toEqual([['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]);
    expect(readEngineThroughGrid()).toEqual(hot.getData());
  });

  it.each([
    ['a grid without a move', {}],
    ['a moved grid whose engine sheet covers it', { manualRowMove: [3, 1, 0, 2], manualColumnMove: [2, 0] }],
  ])('does not read the grid\'s source rows on a reload of %s', (_, settings) => {
    const engine = buildCrossRowEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      licenseKey: LICENSE_KEY,
      ...settings,
    });

    const before = hot.getData();
    const getSourceDataAtRow = jest.spyOn(hot, 'getSourceDataAtRow');

    hot.updateSettings({});

    // The rows are read only to tell a sheet the host shrank from a blank line the move put last, which needs
    // an axis out of physical order with lines the engine left out, on a sheet someone else changed.
    expect(getSourceDataAtRow).not.toHaveBeenCalled();
    expect(hot.getData()).toEqual(before);
  });
});
