/**
 * Scroll strategy for row header selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function rowHeaderScrollStrategy(hot) {
  return ({ row }) => {
    hot.scrollViewportTo({ row });
  };
}
