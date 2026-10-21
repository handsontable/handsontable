import { findEndColumnAtX } from '../../../src/utils/pointerToCoords';
import type { WalkontableInstance } from '../../../src/types';

/**
 * `findEndColumnAtX` maps a pointer to one of the frozen end columns. The end band lies past the
 * scrollable columns: a pointer that is not before its first column belongs to it, and past its last one
 * it maps to the last column. A pointer before the band is left to the scrollable columns.
 *
 * Built over a stub engine - no DOM layout: three end columns (7, 8, 9) of 40px each, the first one
 * starting at x = 300 (LTR) or ending at x = 300 (RTL).
 */

const FIRST_END_COLUMN = 7;
const LAST_END_COLUMN = 9;
const COLUMN_WIDTH = 40;
const BAND_EDGE = 300;

/**
 * Builds a stub of the Walkontable instance.
 *
 * @param {boolean} isRtl Whether the grid is right-to-left.
 * @param {boolean} [renderEndCells=true] Whether the end cells are in the DOM.
 * @returns {WalkontableInstance}
 */
function createWot(isRtl: boolean, renderEndCells = true) {
  const cells = new Map<number, HTMLElement>();

  for (let column = FIRST_END_COLUMN; column <= LAST_END_COLUMN; column++) {
    cells.set(column, document.createElement('td'));
  }

  const firstCell = cells.get(FIRST_END_COLUMN)!;
  const geometryReader = {
    offsetWidth: () => COLUMN_WIDTH,
    getBoundingClientRect: (element: HTMLElement) => {
      if (element !== firstCell) {
        throw new Error('Only the first end cell is measured for its place.');
      }

      return isRtl ?
        { left: BAND_EDGE - COLUMN_WIDTH, right: BAND_EDGE } :
        { left: BAND_EDGE, right: BAND_EDGE + COLUMN_WIDTH };
    },
  };

  return {
    getCell: ({ col }: { col: number }) => (renderEndCells ? cells.get(col) : undefined),
    domBindings: { geometryReader },
  } as unknown as WalkontableInstance;
}

describe('findEndColumnAtX', () => {
  describe('in LTR', () => {
    it.each([
      [300, 7],
      [339, 7],
      [340, 8],
      [379, 8],
      [380, 9],
      [419, 9],
    ])('should map the pointer at x = %i to column %i', (mouseX, column) => {
      expect(findEndColumnAtX(createWot(false), 0, FIRST_END_COLUMN, LAST_END_COLUMN, mouseX, false)).toBe(column);
    });

    it('should map a pointer past the last end column to the last one', () => {
      expect(findEndColumnAtX(createWot(false), 0, FIRST_END_COLUMN, LAST_END_COLUMN, 900, false))
        .toBe(LAST_END_COLUMN);
    });

    it('should leave a pointer before the band to the scrollable columns', () => {
      expect(findEndColumnAtX(createWot(false), 0, FIRST_END_COLUMN, LAST_END_COLUMN, 299, false)).toBeNull();
    });
  });

  describe('in RTL, where the end band lies on the left and its first column is the rightmost one', () => {
    it.each([
      [300, 7],
      [261, 7],
      [260, 8],
      [221, 8],
      [220, 9],
      [181, 9],
    ])('should map the pointer at x = %i to column %i', (mouseX, column) => {
      expect(findEndColumnAtX(createWot(true), 0, FIRST_END_COLUMN, LAST_END_COLUMN, mouseX, true)).toBe(column);
    });

    it('should map a pointer past the last end column (further left) to the last one', () => {
      expect(findEndColumnAtX(createWot(true), 0, FIRST_END_COLUMN, LAST_END_COLUMN, -50, true))
        .toBe(LAST_END_COLUMN);
    });

    it('should leave a pointer before the band (further right) to the scrollable columns', () => {
      expect(findEndColumnAtX(createWot(true), 0, FIRST_END_COLUMN, LAST_END_COLUMN, 301, true)).toBeNull();
    });
  });

  it('should answer null while the end cells are not rendered', () => {
    expect(findEndColumnAtX(createWot(false, false), 0, FIRST_END_COLUMN, LAST_END_COLUMN, 350, false)).toBeNull();
  });
});
