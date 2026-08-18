import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { MoveCells } from '../moveCells';

/**
 * A move whose target equals the source top-left is a no-op and must be rejected before any hook
 * fires. Without the guard, a plain click on the move zone (mousedown and mouseup on the same
 * pixel) ran the whole commit pipeline — a HyperFormula mutation, a rewrite of the source region,
 * and an undo entry — for zero data change. On macOS the same path was reachable through
 * Ctrl+click, which passes the right-click guard and committed a no-op copy.
 */
describe('MoveCells no-op move guard', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(MoveCells);
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
   * Builds a 10x10 grid of predictable values with the moveCells plugin on.
   *
   * @param {object} [options] Setting overrides.
   * @returns {object} The Handsontable instance.
   */
  function build(options = {}) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 10 }, (_, row) => Array.from({ length: 10 }, (__, col) => `${row}-${col}`)),
      moveCells: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...options,
    });

    return hot;
  }

  /**
   * Calls `moveCellRange` over a rectangular source.
   *
   * @param {number[]} source `[fromRow, fromCol, toRow, toCol]`.
   * @param {number[]} target `[row, col]` top-left destination.
   * @param {boolean} [isCopy] Whether to keep the source values.
   * @returns {boolean} Whether the move completed.
   */
  function move([fromRow, fromCol, toRow, toCol], [targetRow, targetCol], isCopy = false) {
    const range = hot._createCellRange(
      hot._createCellCoords(fromRow, fromCol),
      hot._createCellCoords(fromRow, fromCol),
      hot._createCellCoords(toRow, toCol),
    );

    return hot.getPlugin('moveCells')
      .moveCellRange(range, hot._createCellCoords(targetRow, targetCol), isCopy);
  }

  it('rejects a move whose target equals the source top-left', () => {
    build();

    expect(move([1, 1, 2, 2], [1, 1])).toBe(false);
  });

  it('rejects a no-op single-cell move', () => {
    build();

    expect(move([3, 3, 3, 3], [3, 3])).toBe(false);
  });

  it('rejects a no-op copy', () => {
    // The macOS Ctrl+click path resolves to a copy onto the source itself.
    build();

    expect(move([1, 1, 2, 2], [1, 1], true)).toBe(false);
  });

  it('fires neither beforeMoveCells nor afterMoveCells for a no-op move', () => {
    // The bail must happen before any hook: UndoRedo snapshots both regions in `beforeMoveCells`
    // and pushes its action in `afterMoveCells`, and Formulas mutates HyperFormula in between.
    build();

    const beforeMoveCells = jest.fn();
    const afterMoveCells = jest.fn();

    hot.addHook('beforeMoveCells', beforeMoveCells);
    hot.addHook('afterMoveCells', afterMoveCells);

    move([1, 1, 2, 2], [1, 1]);

    expect(beforeMoveCells).not.toHaveBeenCalled();
    expect(afterMoveCells).not.toHaveBeenCalled();
  });

  it('leaves the data untouched after a no-op move', () => {
    build();

    move([1, 1, 2, 2], [1, 1]);

    expect(hot.getDataAtCell(1, 1)).toBe('1-1');
    expect(hot.getDataAtCell(2, 2)).toBe('2-2');
  });

  it('still allows a one-cell offset move', () => {
    build();

    expect(move([1, 1, 2, 2], [1, 2])).toBe(true);
    expect(hot.getDataAtCell(1, 2)).toBe('1-1');
  });
});
