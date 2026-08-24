import {
  createColumnArrangementAdapter,
  createIdentityColumnArrangement,
} from 'handsontable/plugins/nestedHeaders/stateManager/columnArrangement';
import type { HotInstance } from 'handsontable/core/types';

describe('nestedHeaders ColumnArrangement', () => {
  describe('createIdentityColumnArrangement', () => {
    it('should map every visual column to the same physical column', () => {
      const arrangement = createIdentityColumnArrangement();

      expect(arrangement.getPhysicalFromVisual(0)).toBe(0);
      expect(arrangement.getPhysicalFromVisual(3)).toBe(3);
      expect(arrangement.getPhysicalFromVisual(4)).toBe(4);
    });
  });

  describe('createColumnArrangementAdapter', () => {
    /**
     * Builds a minimal Handsontable stub exposing only the column index mapper method the adapter
     * reads.
     *
     * @param {Function} getPhysicalFromVisualIndex The fake visual-to-physical translation.
     * @returns {HotInstance} A Handsontable-typed stub.
     */
    function hotWith(getPhysicalFromVisualIndex: (visualIndex: number) => number | null): HotInstance {
      return { columnIndexMapper: { getPhysicalFromVisualIndex } } as unknown as HotInstance;
    }

    it('should report the live visual-to-physical mapping from the column index mapper', () => {
      // visual order [2, 0, 1] -> physical
      const order = [2, 0, 1];
      const arrangement = createColumnArrangementAdapter(hotWith(visualIndex => order[visualIndex] ?? null));

      expect(arrangement.getPhysicalFromVisual(0)).toBe(2);
      expect(arrangement.getPhysicalFromVisual(1)).toBe(0);
      expect(arrangement.getPhysicalFromVisual(2)).toBe(1);
    });

    it('should fall back to the identity mapping when the mapper returns null (out of range)', () => {
      const arrangement = createColumnArrangementAdapter(hotWith(() => null));

      expect(arrangement.getPhysicalFromVisual(7)).toBe(7);
    });
  });
});
