/**
 * Scroll strategy for changed the focus position of the selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function focusScrollStrategy(hot) {
  return (cellCoords) => {
    hot.scrollViewportTo(cellCoords.toObject());
  };
}
