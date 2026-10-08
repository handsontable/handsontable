import type { HotInstance } from '../../types';
import { scrollViewportThenWindow } from '../utils';

/**
 * Scroll strategy for changed the focus position of the selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function focusScrollStrategy(hot: HotInstance) {
  return (cellCoords: unknown) => {
    scrollViewportThenWindow(hot, (cellCoords as { toObject: () => Record<string, unknown> }).toObject(), () => {
      const activeRange = hot.getSelectedRangeActive();

      if (!activeRange) {
        return null;
      }

      const { row, col } = activeRange.highlight;

      return row !== null && col !== null ? hot.getCell(row, col, true) : null;
    });
  };
}
