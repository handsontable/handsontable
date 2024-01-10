/**
 * Scroll strategy for row header selection.
 *
 * @returns {function(): function(CellCoords): { row: number }}
 */
export function rowHeaderSelectionStrategy() {
  return ({ row }) => {
    return {
      row,
    };
  };
}
