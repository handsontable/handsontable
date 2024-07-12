/**
 * Scroll strategy for column header selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function columnHeaderScrollStrategy(hot) {
  return ({ col }) => {
    hot.scrollViewportTo({ col });
  };
}
