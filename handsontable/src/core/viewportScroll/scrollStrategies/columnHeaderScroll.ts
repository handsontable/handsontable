import type { HotInstance } from '../../types';
import type { default as CellCoords } from '../../../3rdparty/walkontable/src/cell/coords';
import { scrollWindowToCell, createScrollTargetCalculator } from '../utils';

/**
 * Scroll strategy for column header selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function columnHeaderScrollStrategy(hot: HotInstance) {
  return (cellCoords: CellCoords) => {
    const scrollColumnTarget = createScrollTargetCalculator(hot)
      .getComputedColumnTarget(cellCoords);

    hot.scrollViewportTo({ col: scrollColumnTarget }, () => {
      const hasColumnHeaders = !!hot.getSettings().colHeaders;

      scrollWindowToCell(hot.getCell(hasColumnHeaders ? -1 : 0, scrollColumnTarget, true));
    });
  };
}
