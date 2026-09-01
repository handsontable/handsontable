import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { MoveCells } from '../moveCells';

/**
 * A read-only cell must veto the move from either end of the operation.
 *
 * The target case was always handled. The source case was not: `populateFromArray` skips read-only
 * cells (only `'UndoRedo.undo'` is exempt), so the source values survived and a move silently
 * degraded into a copy — duplicating the data. With the Formulas plugin active the same gap desyncs
 * HyperFormula from the data source, because the engine has already relocated the cell by then.
 */
describe('MoveCells read-only veto', () => {
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

  it('vetoes a move whose source contains a read-only cell', () => {
    build({ cell: [{ row: 1, col: 1, readOnly: true }] });

    expect(move([1, 1, 2, 2], [5, 5])).toBe(false);
  });

  it('leaves both source and target untouched when the source veto fires', () => {
    build({ cell: [{ row: 1, col: 1, readOnly: true }] });

    move([1, 1, 2, 2], [5, 5]);

    // Source retained — the veto means nothing moved, not that the data was half-written.
    expect(hot.getDataAtCell(1, 1)).toBe('1-1');
    expect(hot.getDataAtCell(2, 2)).toBe('2-2');
    // Target untouched — this is what fails without the veto: the data ends up duplicated.
    expect(hot.getDataAtCell(5, 5)).toBe('5-5');
    expect(hot.getDataAtCell(6, 6)).toBe('6-6');
  });

  it('does not move the className when the source veto fires', () => {
    build({ cell: [{ row: 1, col: 1, readOnly: true, className: 'marked' }] });

    move([1, 1, 2, 2], [5, 5]);

    // Formatting must not travel when the value cannot: `className` is a movable meta key, and it
    // was stripped from the source and written to the target independently of the data write.
    expect(hot.getCellMeta(5, 5).className).not.toBe('marked');
    expect(hot.getCellMeta(1, 1).className).toBe('marked');
  });

  it('still vetoes a move whose target contains a read-only cell', () => {
    build({ cell: [{ row: 5, col: 5, readOnly: true }] });

    expect(move([1, 1, 2, 2], [5, 5])).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe('1-1');
  });

  it('allows a COPY whose source contains a read-only cell', () => {
    // A copy never clears the source, so a read-only source cell is harmless — vetoing it would
    // needlessly block a valid operation.
    build({ cell: [{ row: 1, col: 1, readOnly: true }] });

    expect(move([1, 1, 2, 2], [5, 5], true)).toBe(true);
    expect(hot.getDataAtCell(1, 1)).toBe('1-1');
    expect(hot.getDataAtCell(5, 5)).toBe('1-1');
  });

  it('allows a move when neither range contains a read-only cell', () => {
    build();

    expect(move([1, 1, 2, 2], [5, 5])).toBe(true);
    expect(hot.getDataAtCell(5, 5)).toBe('1-1');
    expect(hot.getDataAtCell(1, 1)).toBe(null);
  });
});
