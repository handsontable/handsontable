/**
 * The four options that make the grid add empty rows and columns at its end.
 */
export interface MinimumSizes {
  minRows: number;
  minSpareRows: number;
  minCols: number;
  minSpareCols: number;
}

/**
 * The state of one axis, and the minimum sizes that axis is sized by before and after a settings update.
 */
export interface SurplusTrailingItemsInput {
  /**
   * The number of rows or columns on the axis.
   */
  count: number;
  /**
   * The number of empty rows or columns at the end of the axis.
   */
  trailingEmpty: number;
  /**
   * The previous `minRows` or `minCols` value.
   */
  previousMinimum: number;
  /**
   * The previous `minSpareRows` or `minSpareCols` value.
   */
  previousSpare: number;
  /**
   * The new `minRows` or `minCols` value.
   */
  minimum: number;
  /**
   * The new `minSpareRows` or `minSpareCols` value.
   */
  spare: number;
}

/**
 * Normalizes a minimum size option to a count: anything but a positive number adds nothing.
 *
 * @param {*} value The option value.
 * @returns {number}
 */
function toSize(value: unknown): number {
  return typeof value === 'number' && value > 0 ? value : 0;
}

/**
 * Checks whether a settings update lowered a minimum size option, reading both values the way the grid applies
 * them.
 *
 * @param {*} previous The option value before the update.
 * @param {*} current The option value after the update.
 * @returns {boolean}
 */
export function isSizeLowered(previous: unknown, current: unknown): boolean {
  return toSize(previous) > toSize(current);
}

/**
 * Counts the empty rows or columns at the end of an axis that lowered minimum sizes no longer require.
 *
 * An axis sized by a minimum and a spare count holds `max(minimum, filled + spare)` items, where `filled` is
 * everything up to the last item that is not empty. The surplus is what the previous sizes required beyond the
 * new ones, capped by what the axis actually holds beyond the new requirement, so lowering a value by some
 * amount removes at most that many items, the way raising it adds at most that many.
 *
 * The result never reaches into the filled part, because the new requirement is never below `filled`. It does
 * not know which of the empty items the options added - the caller narrows it to those.
 *
 * @param {SurplusTrailingItemsInput} input The axis state and its previous and new minimum sizes.
 * @returns {number} The number of items to remove from the end of the axis, `0` when there is nothing to remove.
 */
export function countSurplusTrailingItems({
  count,
  trailingEmpty,
  previousMinimum,
  previousSpare,
  minimum,
  spare,
}: SurplusTrailingItemsInput): number {
  const filled = count - trailingEmpty;
  const previousRequired = Math.max(toSize(previousMinimum), filled + toSize(previousSpare));
  const required = Math.max(toSize(minimum), filled + toSize(spare));

  return Math.max(0, Math.min(count - required, previousRequired - required));
}

/**
 * Counts how many of the last items of an axis pass a check, walking back from the end, stopping at the first
 * item that fails it or once the limit is reached.
 *
 * @param {number} count The number of items on the axis.
 * @param {number} limit The most items to count.
 * @param {Function} isIncluded Called with an item's visual index, returns whether the item counts.
 * @returns {number}
 */
export function countTrailingItems(count: number, limit: number, isIncluded: (index: number) => boolean): number {
  let included = 0;

  while (included < limit && included < count && isIncluded(count - 1 - included)) {
    included += 1;
  }

  return included;
}
