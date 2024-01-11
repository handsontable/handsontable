/**
 * Scroll strategy for corner header selection.
 *
 * @returns {function(): function(CellCoords): void}
 */
export function cornerHeaderScrollStrategy() {
  return () => {
    // do not scroll the viewport when the corner is clicked
  };
}
