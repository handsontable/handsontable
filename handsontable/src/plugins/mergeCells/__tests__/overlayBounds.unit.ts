import type { HotInstance } from '../../../core/types';
import {
  getFirstRenderedColumnOfOverlay,
  getFirstRenderedRowOfOverlay,
  isEndColumnOverlay,
} from '../utils';

/**
 * Builds a minimal instance: the main table renders from row 4 and column 3, the inline-end clone renders
 * from the given renderable column, and the visual order is the renderable order shifted by the hidden columns.
 */
function createHot({ endClone = 9, hiddenColumns = [] as number[] } = {}) {
  const visibleColumns = Array.from({ length: 12 }, (_, column) => column).filter(c => !hiddenColumns.includes(c));

  return {
    getFirstRenderedVisibleRow: () => 4,
    getFirstRenderedVisibleColumn: () => 3,
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
          inlineEndOverlay: { clone: { wtTable: { getFirstRenderedColumn: () => endClone } } },
        },
      },
    },
  } as unknown as HotInstance;
}

describe('MergeCells overlay bounds', () => {
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
});
