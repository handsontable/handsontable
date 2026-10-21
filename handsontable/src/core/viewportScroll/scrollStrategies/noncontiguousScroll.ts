import type { HotInstance } from '../../types';
import type { default as CellCoords } from '../../../3rdparty/walkontable/src/cell/coords';
import { scrollViewportThenWindow, createScrollTargetCalculator } from '../utils';

/**
 * Scroll strategy for non-contiguous selections.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function noncontiguousScrollStrategy(hot: HotInstance) {
  return (cellCoords: CellCoords) => {
    const scrollTargetCalc = createScrollTargetCalculator(hot);
    const targetScroll = {
      row: scrollTargetCalc.getComputedRowTarget(cellCoords),
      col: scrollTargetCalc.getComputedColumnTarget(cellCoords),
    };

    scrollViewportThenWindow(hot, targetScroll, () => {
      const { row, col } = targetScroll;

      return hot.getCell(row, col, true);
    });
  };
}
