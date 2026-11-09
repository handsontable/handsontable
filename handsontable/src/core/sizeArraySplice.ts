/**
 * Keeps a size array – a `colWidths`, `rowHeights`, or `minRowHeights` array, addressed by the physical
 * index – aligned with its columns or rows when they are inserted, removed, or moved in the data.
 */

/**
 * Returns a copy of a size array with empty slots inserted at the physical index where columns or rows
 * were created, so every size stays with its column or row. An array shorter than the index has no size
 * after that point to move, so it comes back as it is.
 *
 * @param {Array<unknown>} sizes The size array, addressed by physical index.
 * @param {number} physicalIndex The physical index of the first created column or row.
 * @param {number} amount The number of created columns or rows.
 * @returns {Array<unknown>}
 */
export function insertSizeSlots(sizes: unknown[], physicalIndex: number, amount: number): unknown[] {
  if (physicalIndex >= sizes.length || amount <= 0) {
    return sizes;
  }

  return sizes.slice(0, physicalIndex).concat(new Array(amount).fill(undefined), sizes.slice(physicalIndex));
}

/**
 * Returns a copy of a size array without the sizes of the removed columns or rows, so every remaining
 * size stays with its column or row. A sparse array keeps its holes, and the given array comes back
 * as it is when no removed index names one of its sizes.
 *
 * @param {Array<unknown>} sizes The size array, addressed by physical index.
 * @param {number[]} physicalIndexes The physical indexes of the removed columns or rows.
 * @returns {Array<unknown>}
 */
export function removeSizeSlots(sizes: unknown[], physicalIndexes: number[]): unknown[] {
  const removed = new Set(physicalIndexes.filter(index => index >= 0 && index < sizes.length));

  // Nothing to take out, so the array stays the same object: UndoRedo reads an unchanged reference
  // as a setting the step did not change.
  if (removed.size === 0) {
    return sizes;
  }

  // Not `Array#filter`, which skips the holes of a sparse array and so moves every size after a
  // hole onto another column or row. Holes stay holes here.
  const result = new Array(sizes.length - removed.size);
  let target = 0;

  for (let index = 0; index < sizes.length; index++) {
    if (!removed.has(index)) {
      if (index in sizes) {
        result[target] = sizes[index];
      }

      target += 1;
    }
  }

  return result;
}

/**
 * Returns a copy of a size array with a block of sizes moved to another physical index, so the sizes
 * stay with rows that change their place in the data. The arguments are the ones the block's cell meta
 * moves with: the block is removed at `fromIndex`, then inserted at `toIndex`, counted after the removal.
 *
 * @param {Array<unknown>} sizes The size array, addressed by physical index.
 * @param {number} fromIndex The physical index of the first moved row.
 * @param {number} toIndex The physical index the block starts at after the move.
 * @param {number} amount The number of moved rows.
 * @returns {Array<unknown>}
 */
export function moveSizeSlots(sizes: unknown[], fromIndex: number, toIndex: number, amount: number): unknown[] {
  if (fromIndex === toIndex || amount <= 0) {
    return sizes;
  }

  const block = Array.from({ length: amount }, (_, offset) => sizes[fromIndex + offset]);
  const rest = sizes.slice(0, fromIndex).concat(sizes.slice(fromIndex + amount));

  // The block can land past the last size the array names, so the gap before it reads as no size.
  while (rest.length < toIndex) {
    rest.push(undefined);
  }

  return rest.slice(0, toIndex).concat(block, rest.slice(toIndex));
}
