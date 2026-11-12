/**
 * Returns a copy of a `colWidths` array with empty slots inserted at the physical index where
 * columns were created, so every width stays with its column. An array shorter than the index
 * has no width after that point to move, so it comes back as it is.
 *
 * @param {Array<unknown>} colWidths The `colWidths` array, addressed by physical column index.
 * @param {number} physicalIndex The physical index of the first created column.
 * @param {number} amount The number of created columns.
 * @returns {Array<unknown>}
 */
export function insertColWidths(colWidths: unknown[], physicalIndex: number, amount: number): unknown[] {
  if (physicalIndex >= colWidths.length || amount <= 0) {
    return colWidths;
  }

  return colWidths.slice(0, physicalIndex).concat(new Array(amount).fill(undefined), colWidths.slice(physicalIndex));
}

/**
 * Returns a copy of a `colWidths` array without the widths of the removed columns, so every
 * remaining width stays with its column. A sparse array keeps its holes, and the given array comes
 * back as it is when no removed index names one of its widths.
 *
 * @param {Array<unknown>} colWidths The `colWidths` array, addressed by physical column index.
 * @param {number[]} physicalIndexes The physical indexes of the removed columns.
 * @returns {Array<unknown>}
 */
export function removeColWidths(colWidths: unknown[], physicalIndexes: number[]): unknown[] {
  const removed = new Set(physicalIndexes.filter(index => index >= 0 && index < colWidths.length));

  // Nothing to take out, so the array stays the same object.
  if (removed.size === 0) {
    return colWidths;
  }

  // Not `Array#filter`, which skips the holes of a sparse array and so moves every width after a hole
  // onto another column. Holes stay holes here.
  const result = new Array(colWidths.length - removed.size);
  let target = 0;

  for (let index = 0; index < colWidths.length; index++) {
    if (!removed.has(index)) {
      if (index in colWidths) {
        result[target] = colWidths[index];
      }

      target += 1;
    }
  }

  return result;
}
