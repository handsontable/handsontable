/**
 * Finds which column the mouse is over within a given column range.
 *
 * @param {Walkontable} wotInstance The Walkontable instance.
 * @param {number} row Row to use for measuring cell widths.
 * @param {number} startColumn First column in the range.
 * @param {number} endColumn Last column in the range (inclusive).
 * @param {number} relativeX Mouse X position relative to the first cell's left edge (or right edge in RTL).
 * @returns {number | null} Column index, or null if the mouse is outside the range.
 */
export function findColumnAtX(wotInstance, row, startColumn, endColumn, relativeX) {
  let accumulatedX = 0;

  for (let column = startColumn; column <= endColumn; column++) {
    const cellElement = wotInstance.getCell({ row, col: column }, true);

    if (!(cellElement instanceof HTMLElement)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const width = cellElement.offsetWidth;

    if (relativeX < accumulatedX + width) {
      return column;
    }

    accumulatedX += width;
  }

  return null;
}

/**
 * Finds which row the mouse is over within a given row range.
 *
 * @param {Walkontable} wotInstance The Walkontable instance.
 * @param {number} column Column to use for measuring cell heights.
 * @param {number} startRow First row in the range.
 * @param {number} endRow Last row in the range (inclusive).
 * @param {number} relativeY Mouse Y position relative to the first cell's top edge.
 * @returns {number | null} Row index, or null if the mouse is outside the range.
 */
export function findRowAtY(wotInstance, column, startRow, endRow, relativeY) {
  let accumulatedY = 0;

  for (let row = startRow; row <= endRow; row++) {
    const cellElement = wotInstance.getCell({ row, col: column }, true);

    if (!(cellElement instanceof HTMLElement)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const height = cellElement.offsetHeight;

    if (relativeY < accumulatedY + height) {
      return row;
    }

    accumulatedY += height;
  }

  return null;
}
