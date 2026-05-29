import type { HotInstance } from '../../types';
import { scrollWindowToCell } from '../utils';

/**
 * Scroll strategy for changed the focus position of the selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function focusScrollStrategy(hot: HotInstance) {
  return (cellCoords: unknown) => {
    hot.scrollViewportTo((cellCoords as { toObject: () => Record<string, unknown> }).toObject(), () => {
      const activeRange = hot.getSelectedRangeActive();

      if (!activeRange) {
        return;
      }

      const { row, col } = activeRange.highlight;

      if (row !== null && col !== null) {
        scrollWindowToCell(hot.getCell(row, col, true));
      }
    });
  };
}
