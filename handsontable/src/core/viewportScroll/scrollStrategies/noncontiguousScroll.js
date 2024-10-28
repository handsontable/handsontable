/**
 * Scroll strategy for non-contiguous selections.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function noncontiguousScrollStrategy(hot) {
  return (cellCoords) => {
    hot.scrollViewportTo(cellCoords.toObject());
  };
}
