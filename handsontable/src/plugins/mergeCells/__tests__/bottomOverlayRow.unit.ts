import type { HotInstance } from '../../../core/types';
import { getFirstRowOfActiveBottomOverlay } from '../utils';

describe('MergeCells', () => {
  describe('getFirstRowOfActiveBottomOverlay', () => {
    /**
     * Builds a minimal instance whose bottom overlay renders from the given renderable row.
     *
     * @param {string} activeOverlay The overlay being drawn.
     * @param {number} firstRenderedRow The first row the bottom overlay renders (renderable index).
     * @returns {HotInstance}
     */
    function createHot(activeOverlay: string, firstRenderedRow: number) {
      const overlay = { clone: { wtTable: { getFirstRenderedRow: () => firstRenderedRow } } };

      return {
        view: {
          getActiveOverlayName: () => activeOverlay,
          getOverlayByName: (name: string) => (name === 'bottom' || name === 'bottom_inline_start_corner' ?
            overlay : null),
        },
        // One row is hidden above the frozen rows, so a renderable index is one less than a visual one.
        rowIndexMapper: { getVisualFromRenderableIndex: (index: number) => index + 1 },
      } as unknown as HotInstance;
    }

    it('should return the visual index of the first row of the bottom overlay', () => {
      expect(getFirstRowOfActiveBottomOverlay(createHot('bottom', 8))).toBe(9);
    });

    it('should do the same for the bottom corner overlay', () => {
      expect(getFirstRowOfActiveBottomOverlay(createHot('bottom_inline_start_corner', 8))).toBe(9);
    });

    it('should return `null` while another overlay is drawn', () => {
      expect(getFirstRowOfActiveBottomOverlay(createHot('master', 8))).toBeNull();
      expect(getFirstRowOfActiveBottomOverlay(createHot('top', 8))).toBeNull();
      expect(getFirstRowOfActiveBottomOverlay(createHot('inline_start', 8))).toBeNull();
    });

    it('should return `null` when the bottom overlay renders no row', () => {
      expect(getFirstRowOfActiveBottomOverlay(createHot('bottom', -1))).toBeNull();
    });
  });
});
