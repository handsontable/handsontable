/**
 * Scroll strategy for multiple selections.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function multipleScrollStrategy(hot) {
  return (cellCoords) => {
    hot.scrollViewportTo(cellCoords.toObject());
  };
}
