import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { MoveCells } from '../moveCells';
import { UndoRedo } from '../../undoRedo';
import { Formulas } from '../../formulas';

/**
 * `Hooks.run` threads any non-`undefined` listener return value into the next listener's first
 * argument, and the global bucket runs before the local one. A global `beforeMoveCells` listener
 * returning a truthy non-CellRange therefore replaces `sourceRange` for the internal listeners
 * (UndoRedo's snapshotter, Formulas' engine prep) — which used to crash with
 * `TypeError: getTopStartCorner is not a function`. The internal listeners now shape-guard the
 * argument and veto the operation instead.
 */
describe('MoveCells hook argument safety', () => {
  let container;
  let hot;
  let globalListener;

  beforeAll(() => {
    registerPlugin(MoveCells);
    registerPlugin(UndoRedo);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (globalListener) {
      Handsontable.hooks.remove('beforeMoveCells', globalListener);
      globalListener = null;
    }

    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a 10x10 grid with the moveCells and undoRedo plugins on.
   *
   * @returns {object} The Handsontable instance.
   */
  function build() {
    hot = new Handsontable(container, {
      data: Array.from({ length: 10 }, (_, row) => Array.from({ length: 10 }, (__, col) => `${row}-${col}`)),
      moveCells: true,
      undoRedo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot;
  }

  /**
   * Registers a listener on the GLOBAL hook bucket — global listeners run before the internal
   * (locally registered) ones, so their return value reaches the internal listeners as `sourceRange`.
   *
   * @param {Function} listener The `beforeMoveCells` listener.
   */
  function addGlobalListener(listener) {
    globalListener = listener;
    Handsontable.hooks.add('beforeMoveCells', listener);
  }

  /**
   * Calls `moveCellRange` over a rectangular source.
   *
   * @param {number[]} source `[fromRow, fromCol, toRow, toCol]`.
   * @param {number[]} target `[row, col]` top-left destination.
   * @returns {boolean} Whether the move completed.
   */
  function move([fromRow, fromCol, toRow, toCol], [targetRow, targetCol]) {
    const range = hot._createCellRange(
      hot._createCellCoords(fromRow, fromCol),
      hot._createCellCoords(fromRow, fromCol),
      hot._createCellCoords(toRow, toCol),
    );

    return hot.getPlugin('moveCells')
      .moveCellRange(range, hot._createCellCoords(targetRow, targetCol), false);
  }

  it('vetoes the move without crashing when a global listener returns a truthy non-range', () => {
    addGlobalListener(() => 'garbage');
    build();

    expect(() => move([1, 1, 2, 2], [5, 5])).not.toThrow();
    expect(move([1, 1, 2, 2], [5, 5])).toBe(false);
    // Nothing moved and no undo entry was recorded.
    expect(hot.getDataAtCell(1, 1)).toBe('1-1');
    expect(hot.getDataAtCell(5, 5)).toBe('5-5');
    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
  });

  it('vetoes the move when a global listener returns `true`', () => {
    // `true` is not a documented return value either — only `false` (veto) and `undefined` are.
    addGlobalListener(() => true);
    build();

    expect(move([1, 1, 2, 2], [5, 5])).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe('1-1');
  });

  it('leaves the move working when a global listener returns undefined', () => {
    addGlobalListener(() => undefined);
    build();

    expect(move([1, 1, 2, 2], [5, 5])).toBe(true);
    expect(hot.getDataAtCell(5, 5)).toBe('1-1');
    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);
  });
});

/**
 * The same argument threading applies to `afterMoveCells`, but a veto is no longer possible there:
 * `moveCellRange` commits HyperFormula before the hook runs, and with Formulas active the plugin's
 * `afterMoveCells` listener is the ONLY thing that writes the moved values into the data source
 * (`moveCellRange` skips its own `populateFromArray` in that case). A listener that bailed out on a
 * replaced first argument therefore left HyperFormula holding the moved cells while the data source
 * still held the pre-move ones — with `moveCellRange` reporting success and UndoRedo recording the
 * move. The listener must not read the range off the hook argument at all.
 */
describe('MoveCells hook argument safety with Formulas', () => {
  let container;
  let hot;
  let globalListener;

  beforeAll(() => {
    // jsdom has no layout, so the post-move `selectCells` call cannot scroll.
    Element.prototype.scrollIntoView = () => {};
    registerPlugin(MoveCells);
    registerPlugin(UndoRedo);
    registerPlugin(Formulas);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (globalListener) {
      Handsontable.hooks.remove('afterMoveCells', globalListener);
      globalListener = null;
    }

    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with the formulas, moveCells and undoRedo plugins on.
   *
   * @returns {object} The Handsontable instance.
   */
  function build() {
    hot = new Handsontable(container, {
      data: [
        ['a', '=A1'],
        ['c', 'd'],
        [null, null],
        [null, null],
      ],
      formulas: {
        engine: HyperFormula,
      },
      moveCells: true,
      undoRedo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot;
  }

  /**
   * Registers a listener on the GLOBAL `afterMoveCells` bucket, which runs before the internal ones.
   *
   * @param {Function} listener The `afterMoveCells` listener.
   */
  function addGlobalListener(listener) {
    globalListener = listener;
    Handsontable.hooks.add('afterMoveCells', listener);
  }

  /**
   * Calls `moveCellRange` over a rectangular source.
   *
   * @param {number[]} source `[fromRow, fromCol, toRow, toCol]`.
   * @param {number[]} target `[row, col]` top-left destination.
   * @returns {boolean} Whether the move completed.
   */
  function move([fromRow, fromCol, toRow, toCol], [targetRow, targetCol]) {
    const range = hot._createCellRange(
      hot._createCellCoords(fromRow, fromCol),
      hot._createCellCoords(fromRow, fromCol),
      hot._createCellCoords(toRow, toCol),
    );

    return hot.getPlugin('moveCells')
      .moveCellRange(range, hot._createCellCoords(targetRow, targetCol), false);
  }

  it('moves the data when a global afterMoveCells listener returns a truthy non-range', () => {
    addGlobalListener(() => 'garbage');
    build();

    expect(move([0, 0, 0, 0], [2, 0])).toBe(true);

    expect(hot.getDataAtCell(2, 0)).toBe('a');
    expect(hot.getDataAtCell(0, 0)).toBe(null);
  });

  it('keeps the data source in sync with the engine when a global listener returns a truthy non-range', () => {
    addGlobalListener(() => 'garbage');
    build();

    move([0, 0, 0, 0], [2, 0]);

    const formulas = hot.getPlugin('formulas');

    // HyperFormula holds the move regardless of the hook argument, so the data source has to agree.
    expect(formulas.engine.getSheetSerialized(formulas.sheetId)).toEqual([
      [null, '=A3'],
      ['c', 'd'],
      ['a'],
    ]);
    expect(hot.getSourceData()).toEqual([
      [null, '=A3'],
      ['c', 'd'],
      ['a', null],
      [null, null],
    ]);
  });

  it('does not leak the committed-move state into a later afterMoveCells run', () => {
    addGlobalListener(() => 'garbage');
    build();

    move([0, 0, 0, 0], [2, 0]);

    Handsontable.hooks.remove('afterMoveCells', globalListener);
    globalListener = null;

    // A bare hook run with no move behind it must not re-run the sync off stale state.
    hot.runHooks(
      'afterMoveCells',
      hot._createCellRange(
        hot._createCellCoords(0, 0),
        hot._createCellCoords(0, 0),
        hot._createCellCoords(0, 0),
      ),
      hot._createCellRange(
        hot._createCellCoords(3, 1),
        hot._createCellCoords(3, 1),
        hot._createCellCoords(3, 1),
      ),
      false,
    );

    expect(hot.getSourceData()).toEqual([
      [null, '=A3'],
      ['c', 'd'],
      ['a', null],
      [null, null],
    ]);
  });
});
