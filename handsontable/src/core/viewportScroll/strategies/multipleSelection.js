/**
 * Scroll strategy for multiple selections.
 *
 * @returns {function(): function(CellCoords): { row: number, col: number }}
 */
export function multipleSelectionStrategy() {
  return (cellCoords) => {
    return cellCoords.toObject();
  };
}
