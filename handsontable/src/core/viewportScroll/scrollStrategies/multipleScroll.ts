import type { HotInstance, CellCoords } from '../../../common';
import { scrollWindowToCell, createScrollTargetCalculator } from '../utils';

/**
 * Scroll strategy for multiple selections.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function multipleScrollStrategy(hot: HotInstance) {
  return (cellCoords: CellCoords) => {
    const scrollTargetCalc = createScrollTargetCalculator(hot);
    const targetScroll = {
      row: scrollTargetCalc.getComputedRowTarget(cellCoords),
      col: scrollTargetCalc.getComputedColumnTarget(cellCoords),
    };

    hot.scrollViewportTo(targetScroll, () => {
      const { row, col } = targetScroll;

      scrollWindowToCell(hot.getCell(row, col, true));
    });
  };
}
