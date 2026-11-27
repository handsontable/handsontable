/**
 * The direction of a one-place move: `-1` toward the lower visual indexes, `1` toward the higher ones.
 */
export type StepDirection = -1 | 1;

/**
 * What the step needs to know about the axis it moves along.
 */
export interface StepAxis {
  /**
   * The number of not trimmed indexes: the visual indexes a move may address.
   */
  length: number;
  /**
   * Tells whether the visual index is hidden (drawn with no size).
   */
  isHidden(visualIndex: number): boolean;
  /**
   * Returns the drop index right after the visible index `visualIndex`, the one a pointer drop at its far edge
   * gives. A column steps over the hidden columns after it, a row asks `getLowerHalfDropIndex()`.
   */
  dropIndexAfter(visualIndex: number): number;
}

/**
 * Finds the nearest visible index from `visualIndex` (included) in the direction, or `null` when none is left.
 *
 * @param {number} visualIndex The visual index to start from.
 * @param {StepDirection} direction The direction to walk in.
 * @param {StepAxis} axis The axis.
 * @returns {number | null}
 */
function findVisible(visualIndex: number, direction: StepDirection, axis: StepAxis): number | null {
  let index = visualIndex;

  while (index >= 0 && index < axis.length) {
    if (!axis.isHidden(index)) {
      return index;
    }

    index += direction;
  }

  return null;
}

/**
 * Gets the drop index that moves the block of visual indexes from `start` to `end` one visible place in the
 * direction: past the nearest visible index in front of it, so hidden indexes in between are stepped over the way a
 * pointer drop steps over them. Returns `null` when no visible index is left in that direction.
 *
 * The result is a drop index (where a pointer would release the block), for `dragColumns()` and `dragRows()`.
 *
 * @param {number} start The first visual index of the block.
 * @param {number} end The last visual index of the block.
 * @param {StepDirection} direction The direction of the move.
 * @param {StepAxis} axis The axis.
 * @returns {number | null}
 */
export function getStepDropIndex(start: number, end: number, direction: StepDirection, axis: StepAxis): number | null {
  if (start < 0 || end >= axis.length || start > end) {
    return null;
  }

  if (direction === -1) {
    return findVisible(start - 1, -1, axis);
  }

  const passed = findVisible(end + 1, 1, axis);

  return passed === null ? null : axis.dropIndexAfter(passed);
}

/**
 * Gets the drop index that puts a block of `count` indexes, now starting at `currentStart`, back at
 * `originalStart`.
 *
 * @param {number} currentStart The visual index the block starts at now.
 * @param {number} originalStart The visual index the block started at.
 * @param {number} count The number of indexes in the block.
 * @returns {number}
 */
export function getRestoreDropIndex(currentStart: number, originalStart: number, count: number): number {
  return originalStart < currentStart ? originalStart : originalStart + count;
}
