import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;
const SHEET_CONTENT = [['b', 2, '=B1*2'], ['a', 1, '=B2*2'], ['c', 3, '=B3*2']];

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

  // TODO: known limit "A sheet-built grid with an array manual move rotates on `updateSettings()`" in
  // `../AGENTS.md`. The order should stay `[c, b, a]` across the updates; this pins the current rotation, so
  // a fix flips it.
  it('rotates the manual row order of a sheet-built grid on every updateSettings() (known limit)', () => {
    const engine = buildEngine();

    hot = new Handsontable(container, {
      formulas: { engine, sheetName: 'S1' },
      manualRowMove: [2, 0, 1],
      licenseKey: LICENSE_KEY,
    });

    expect(hot.getData()).toEqual([['c', 3, 6], ['b', 2, 4], ['a', 1, 2]]);

    hot.updateSettings({});

    expect(hot.getData()).toEqual([['a', 1, 2], ['c', 3, 6], ['b', 2, 4]]);

    hot.updateSettings({});

    expect(hot.getData()).toEqual([['b', 2, 4], ['a', 1, 2], ['c', 3, 6]]);
  });
});
