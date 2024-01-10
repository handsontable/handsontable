/**
 * Scroll strategy for column header selection.
 *
 * @returns {function(): function(CellCoords): { col: number }}
 */
export function columnHeaderSelectionStrategy() {
  return ({ col }) => {
    return {
      col,
    };
  };
}
