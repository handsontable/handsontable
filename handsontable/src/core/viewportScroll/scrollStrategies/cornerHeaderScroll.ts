/**
 * Scroll strategy for corner header selection.
 *
 * @returns {function(): function(CellCoords): void}
 */
export function cornerHeaderScrollStrategy(_hot?: unknown) {
  return () => {
    // do not scroll the viewport when the corner is clicked
  };
}
