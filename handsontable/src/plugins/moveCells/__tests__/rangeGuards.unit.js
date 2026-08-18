import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { MoveCells, CELLS_LIMIT } from '../moveCells';

/**
 * `moveCellRange` is documented public API, so it must fail cleanly for caller-built ranges the
 * drag path can never produce: a source range past the grid edge used to read `undefined` off the
 * end of the data source and write it into the target, and an unbounded range froze the tab with
 * roughly six full passes over both regions before anything changed.
 */
describe('MoveCells range guards', () => {
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

  describe('source bounds', () => {
    it('vetoes a source range that extends past the last row', () => {
      build();

      expect(move([8, 0, 12, 1], [0, 5])).toBe(false);
      // Nothing was written: without the guard the overhang reads `undefined` off the data source
      // and the in-bounds part of the target gets clobbered with it.
      expect(hot.getDataAtCell(0, 5)).toBe('0-5');
      expect(hot.getDataAtCell(8, 0)).toBe('8-0');
    });

    it('vetoes a source range that extends past the last column', () => {
      build();

      expect(move([0, 8, 1, 12], [5, 0])).toBe(false);
      expect(hot.getDataAtCell(5, 0)).toBe('5-0');
    });

    it('still allows a move that touches the grid edges exactly', () => {
      build();

      expect(move([8, 8, 9, 9], [0, 0])).toBe(true);
      expect(hot.getDataAtCell(0, 0)).toBe('8-8');
      expect(hot.getDataAtCell(1, 1)).toBe('9-9');
    });
  });

  describe('cells limit', () => {
    it('vetoes a range spanning more cells than CELLS_LIMIT and warns', () => {
      build();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // 400x300 = 120 000 cells > CELLS_LIMIT. The size guard runs before the bounds scan, so the
      // veto fires without a single per-cell pass — that ordering is what this test pins down.
      const result = move([0, 0, 399, 299], [0, 1]);

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(`${CELLS_LIMIT}`));

      warnSpy.mockRestore();
    });

    it('fires no hook for a vetoed oversized range', () => {
      // The bail must happen before any hook: UndoRedo snapshots both regions in `beforeMoveCells`
      // — which for an oversized range is exactly the freeze the ceiling exists to prevent.
      build();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const beforeMoveCells = jest.fn();

      hot.addHook('beforeMoveCells', beforeMoveCells);
      move([0, 0, 399, 299], [0, 1]);

      expect(beforeMoveCells).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
