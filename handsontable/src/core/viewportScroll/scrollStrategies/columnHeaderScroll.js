import { scrollWindowToCell, createScrollTargetCalculator } from '../utils';

/**
 * Scroll strategy for column header selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function columnHeaderScrollStrategy(hot) {
  return (cellCoords) => {
    const scrollColumnTarget = createScrollTargetCalculator(hot)
      .getComputedColumnTarget(cellCoords);

    hot.scrollViewportTo({ col: scrollColumnTarget }, () => {
      const hasColumnHeaders = !!hot.getSettings().colHeaders;

      scrollWindowToCell(hot.getCell(hasColumnHeaders ? -1 : 0, scrollColumnTarget, true));
    });
  };
}
