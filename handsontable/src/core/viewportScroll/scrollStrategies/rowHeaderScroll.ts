import type { HotInstance, CellCoords } from '../../../common';
import { scrollWindowToCell, createScrollTargetCalculator } from '../utils';

/**
 * Scroll strategy for row header selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function rowHeaderScrollStrategy(hot: HotInstance) {
  return (cellCoords: CellCoords) => {
    const scrollRowTarget = createScrollTargetCalculator(hot)
      .getComputedRowTarget(cellCoords);

    hot.scrollViewportTo({ row: scrollRowTarget }, () => {
      const hasRowHeaders = !!hot.getSettings().rowHeaders;

      scrollWindowToCell(hot.getCell(scrollRowTarget, hasRowHeaders ? -1 : 0, true));
    });
  };
}
