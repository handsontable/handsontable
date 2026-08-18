import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { MoveCells } from '../moveCells';

/**
 * The meta transfer of a move must be sparse: only cells that carry their own movable meta may
 * produce `setCellMeta`/`removeCellMeta` calls. The previous dense pass wrote (or remove-touched)
 * every cell of the target region, and `removeCellMeta` materialized a permanent meta object even
 * when there was nothing to remove — moving an unstyled block retained O(range area) memory the
 * viewport eviction cannot sweep.
 */
describe('MoveCells meta footprint', () => {
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
   * Builds a 20x10 grid of predictable values with the moveCells plugin on.
   *
   * @param {object} [options] Setting overrides.
   * @returns {object} The Handsontable instance.
   */
  function build(options = {}) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => Array.from({ length: 10 }, (__, col) => `${row}-${col}`)),
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

  it('materializes no cell meta when moving an unstyled block', () => {
    build();

    // `moveCellRange` selects the target range when it completes, and the render path materializes
    // the selection focus cell (it is deliberately exempt from viewport meta eviction). Select it
    // up front so the count below isolates the move's own meta writes — the dense pass this guards
    // against added one permanent meta object per target-region cell.
    hot.selectCell(10, 3);

    const materializedBefore = hot.getCellsMeta().length;

    expect(move([1, 1, 4, 4], [10, 3])).toBe(true);

    expect(hot.getCellsMeta().length).toBe(materializedBefore);
  });

  it('moves the className of a styled cell and clears it at the source', () => {
    build({ cell: [{ row: 1, col: 1, className: 'marked' }] });

    move([1, 1, 2, 2], [5, 5]);

    expect(hot.getCellMeta(5, 5).className).toBe('marked');
    expect(hot.getCellMeta(1, 1).className).toBeUndefined();
  });

  it('keeps the source className on a copy', () => {
    build({ cell: [{ row: 1, col: 1, className: 'marked' }] });

    move([1, 1, 2, 2], [5, 5], true);

    expect(hot.getCellMeta(5, 5).className).toBe('marked');
    expect(hot.getCellMeta(1, 1).className).toBe('marked');
  });

  it('clears stale movable meta the target region carried before the move', () => {
    // The incoming (unstyled) source must not leave the target's old formatting behind.
    build({ cell: [{ row: 5, col: 5, className: 'old' }] });

    move([1, 1, 2, 2], [5, 5]);

    expect(hot.getCellMeta(5, 5).className).toBeUndefined();
  });

  it('transfers meta correctly when the source and target regions overlap', () => {
    build({ cell: [{ row: 1, col: 1, className: 'marked' }] });

    // 2x2 block moved one cell down-right: source (1,1) maps onto (2,2), which is itself part of
    // the source region.
    move([1, 1, 2, 2], [2, 2]);

    expect(hot.getCellMeta(2, 2).className).toBe('marked');
    expect(hot.getCellMeta(1, 1).className).toBeUndefined();
  });
});
