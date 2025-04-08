import { scrollWindowToCell, createScrollTargetCalculator } from '../utils';

/**
 * Scroll strategy for multiple selections.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function multipleScrollStrategy(hot) {
  return (cellCoords) => {
    const scrollTargetCalc = createScrollTargetCalculator(hot);

    hot.scrollViewportTo({
      row: scrollTargetCalc.getComputedRowTarget(cellCoords),
      col: scrollTargetCalc.getComputedColumnTarget(cellCoords),
    }, () => {
      const { row, col } = cellCoords;

      scrollWindowToCell(hot.getCell(row, col, true));
    });
  };
}
