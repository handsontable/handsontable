import { scrollWindowToCell } from '../utils';

/**
 * Scroll strategy for changed the focus position of the selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function focusScrollStrategy(hot) {
  return (cellCoords) => {
    hot.scrollViewportTo(cellCoords.toObject(), () => {
      const { row, col } = hot.getSelectedRangeLast().highlight;

      scrollWindowToCell(hot.getCell(row, col, true));
    });
  };
}
