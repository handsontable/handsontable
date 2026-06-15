import type { HotInstance } from '../../../core/types';

/**
 * A port that reports the visibility of a visual column index, abstracting the
 * Handsontable column index mapper away from the visibility-sync logic.
 */
export interface ColumnVisibility {
  /**
   * Returns true if the visual column index is visible (not hidden by any source).
   */
  isVisible(visualColumnIndex: number): boolean;
}

/**
 * Creates a ColumnVisibility port adapter backed by the Handsontable column index mapper.
 * The adapter converts visual column indices to physical before querying the merged hiding state,
 * so it correctly handles column moves.
 */
export function createColumnVisibilityAdapter(hot: HotInstance): ColumnVisibility {
  return {
    isVisible(visualColumnIndex: number) {
      const physicalIndex = hot.columnIndexMapper.getPhysicalFromVisualIndex(visualColumnIndex);

      if (physicalIndex === null) {
        return false;
      }

      return !hot.columnIndexMapper.isHidden(physicalIndex);
    }
  };
}
