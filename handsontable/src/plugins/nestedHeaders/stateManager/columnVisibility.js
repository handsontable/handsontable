/**
 * @typedef {object} ColumnVisibility
 * @property {function(number): boolean} isVisible Returns true if the visual column index is visible
 *                                                 (not hidden by any source).
 */

/**
 * Creates a ColumnVisibility port adapter backed by the Handsontable column index mapper.
 * The adapter converts visual column indices to physical before querying the merged hiding state,
 * so it correctly handles column moves.
 *
 * @param {Core} hot A Handsontable instance.
 * @returns {ColumnVisibility}
 */
export function createColumnVisibilityAdapter(hot) {
  return {
    isVisible(visualColumnIndex) {
      const physicalIndex = hot.columnIndexMapper.getPhysicalFromVisualIndex(visualColumnIndex);

      if (physicalIndex === null) {
        return false;
      }

      return !hot.columnIndexMapper.isHidden(physicalIndex);
    }
  };
}
