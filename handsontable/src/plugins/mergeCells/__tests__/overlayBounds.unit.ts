import type { HotInstance } from '../../../core/types';
import {
  getFirstRenderedColumnOfOverlay,
  getFirstRowOfActiveBottomOverlay,
  getFirstRenderedRowOfOverlay,
  getLastRenderedColumnOfOverlay,
  isEndColumnOverlay,
} from '../utils';

/**
 * Builds a minimal instance: the main table renders from row 4 and column 3, the inline-end clone renders
 * from the given renderable column, and the visual order is the renderable order shifted by the hidden columns.
 */
function createHot({ endClone = 9, endCloneLast = 11, hiddenColumns = [] as number[] } = {}) {
  const visibleColumns = Array.from({ length: 12 }, (_, column) => column).filter(c => !hiddenColumns.includes(c));

  return {
    getFirstRenderedVisibleRow: () => 4,
    getFirstRenderedVisibleColumn: () => 3,
    getLastRenderedVisibleColumn: () => 8,
    columnIndexMapper: {
      getVisualFromRenderableIndex: (renderable: number) => visibleColumns[renderable] ?? null,
      getNearestNotHiddenIndex: (visual: number, direction: number) => {
        let column = visual;

        while (hiddenColumns.includes(column) && column >= 0 && column < 12) {
          column += direction;
        }

        return column < 0 || column > 11 ? null : column;
      },
    },
    view: {
      _wt: {
        wtOverlays: {
          inlineEndOverlay: {
            clone: { wtTable: { getFirstRenderedColumn: () => endClone, getLastRenderedColumn: () => endCloneLast } },
          },
        },
      },
    },
  } as unknown as HotInstance;
}

/**
 * Builds a minimal instance that is drawing the given overlay: every bottom overlay renders from the given
 * renderable row, and the visual order is the renderable order shifted by the hidden rows.
 */
function createHotDrawing(activeOverlay: string, { firstRenderedRow = 8, hiddenRows = [] as number[] } = {}) {
  const visibleRows = Array.from({ length: 10 }, (_, row) => row).filter(r => !hiddenRows.includes(r));
  const overlay = { clone: { wtTable: { getFirstRenderedRow: () => firstRenderedRow } } };

  return {
    rowIndexMapper: {
      getVisualFromRenderableIndex: (renderable: number) => visibleRows[renderable] ?? null,
    },
    view: {
      getActiveOverlayName: () => activeOverlay,
      getOverlayByName: () => overlay,
    },
  } as unknown as HotInstance;
}

describe('MergeCells overlay bounds', () => {
  describe('getFirstRowOfActiveBottomOverlay', () => {
    it('should answer for the bottom overlay and for both of its corners', () => {
      ['bottom', 'bottom_inline_start_corner', 'bottom_inline_end_corner'].forEach((name) => {
        expect(getFirstRowOfActiveBottomOverlay(createHotDrawing(name))).toBe(8);
      });
    });

    it('should translate the first rendered row of the overlay from the renderable to the visual index', () => {
      // Rows 1 and 3 are hidden, so renderable row 6 is visual row 8.
      const hot = createHotDrawing('bottom_inline_end_corner', { firstRenderedRow: 6, hiddenRows: [1, 3] });

      expect(getFirstRowOfActiveBottomOverlay(hot)).toBe(8);
    });

    it('should answer null while any other overlay is drawn', () => {
      ['master', 'top', 'inline_start', 'inline_end', 'top_inline_start_corner', 'top_inline_end_corner']
        .forEach((name) => {
          expect(getFirstRowOfActiveBottomOverlay(createHotDrawing(name))).toBeNull();
        });
    });

    it('should answer null when the bottom overlay renders no row', () => {
      expect(getFirstRowOfActiveBottomOverlay(createHotDrawing('bottom_inline_end_corner', { firstRenderedRow: -1 })))
        .toBeNull();
    });
  });

  describe('isEndColumnOverlay', () => {
    it('should recognize the inline-end clone and its corners only', () => {
      expect(isEndColumnOverlay('inline_end')).toBe(true);
      expect(isEndColumnOverlay('top_inline_end_corner')).toBe(true);
      expect(isEndColumnOverlay('bottom_inline_end_corner')).toBe(true);
      expect(isEndColumnOverlay('inline_start')).toBe(false);
      expect(isEndColumnOverlay('top')).toBe(false);
      expect(isEndColumnOverlay('master')).toBe(false);
    });
  });

  describe('getFirstRenderedRowOfOverlay', () => {
    it('should start the top overlays at the first row and the others at the main table\'s first row', () => {
      const hot = createHot();

      ['top', 'top_inline_start_corner', 'top_inline_end_corner'].forEach((name) => {
        expect(getFirstRenderedRowOfOverlay(hot, name)).toBe(0);
      });
      ['master', 'inline_start', 'inline_end', 'bottom', 'bottom_inline_end_corner'].forEach((name) => {
        expect(getFirstRenderedRowOfOverlay(hot, name)).toBe(4);
      });
    });
  });

  describe('getFirstRenderedColumnOfOverlay', () => {
    it('should start the inline-start overlays at the first column', () => {
      const hot = createHot();

      ['inline_start', 'top_inline_start_corner', 'bottom_inline_start_corner'].forEach((name) => {
        expect(getFirstRenderedColumnOfOverlay(hot, name)).toBe(0);
      });
    });

    it('should start the inline-end overlays at the first column of the end band', () => {
      const hot = createHot({ endClone: 9 });

      ['inline_end', 'top_inline_end_corner', 'bottom_inline_end_corner'].forEach((name) => {
        expect(getFirstRenderedColumnOfOverlay(hot, name)).toBe(9);
      });
    });

    it('should translate the first column of the end band from the renderable to the visual index', () => {
      // Columns 2 and 5 are hidden, so renderable column 7 is visual column 9.
      const hot = createHot({ endClone: 7, hiddenColumns: [2, 5] });

      expect(getFirstRenderedColumnOfOverlay(hot, 'inline_end')).toBe(9);
    });

    it('should start the other overlays where the main table starts', () => {
      const hot = createHot();

      ['master', 'top', 'bottom'].forEach((name) => {
        expect(getFirstRenderedColumnOfOverlay(hot, name)).toBe(3);
      });
    });

    it('should fall back to the main table when the end clone renders nothing', () => {
      expect(getFirstRenderedColumnOfOverlay(createHot({ endClone: -1 }), 'inline_end')).toBe(3);
    });
  });

  describe('getLastRenderedColumnOfOverlay', () => {
    it('should end the inline-end overlays at the last column of the end band, not at the main table\'s last', () => {
      // The main table is scrolled to the start: it renders up to column 8, the band is 9..11.
      const hot = createHot();

      ['inline_end', 'top_inline_end_corner', 'bottom_inline_end_corner'].forEach((name) => {
        expect(getLastRenderedColumnOfOverlay(hot, name)).toBe(11);
      });
    });

    it('should translate the last column of the end band from the renderable to the visual index', () => {
      // Columns 2 and 5 are hidden, so renderable column 9 is visual column 11.
      const hot = createHot({ endClone: 7, endCloneLast: 9, hiddenColumns: [2, 5] });

      expect(getLastRenderedColumnOfOverlay(hot, 'inline_end')).toBe(11);
    });

    it('should end the other overlays where the main table ends', () => {
      const hot = createHot();

      ['master', 'top', 'bottom', 'inline_start', 'top_inline_start_corner'].forEach((name) => {
        expect(getLastRenderedColumnOfOverlay(hot, name)).toBe(8);
      });
    });

    it('should fall back to the main table when the end clone renders nothing', () => {
      expect(getLastRenderedColumnOfOverlay(createHot({ endCloneLast: -1 }), 'inline_end')).toBe(8);
    });
  });
});
