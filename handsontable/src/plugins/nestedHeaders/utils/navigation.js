/**
 * Resolves the preferred header row to restore horizontal navigation context
 * after moving through a rowspanned header.
 *
 * @param {number} currentHeaderRow A negative row index that points to a column header level.
 * @param {number} targetColumn A visual column index.
 * @param {number} topMostHeaderRow The top-most header row index.
 * @param {Function} getHeaderSettings A getter that returns header settings for row/column coords.
 * @returns {number}
 */
export function resolveRowspanNavigationContextRow(
  currentHeaderRow,
  targetColumn,
  topMostHeaderRow,
  getHeaderSettings,
) {
  if (currentHeaderRow <= topMostHeaderRow) {
    return currentHeaderRow;
  }

  for (let row = currentHeaderRow + 1; row <= -1; row++) {
    const headerSettings = getHeaderSettings(row, targetColumn);

    if (!headerSettings) {
      continue;
    }

    const {
      isPlaceholder,
      isRowspanPlaceholder,
      isHidden,
    } = headerSettings;

    if (!isPlaceholder && !isRowspanPlaceholder && !isHidden) {
      return row;
    }
  }

  return currentHeaderRow;
}
