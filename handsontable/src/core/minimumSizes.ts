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
   * The new `minRows` or `minCols` value.
   */
  minimum: number;
  /**
   * The new `minSpareRows` or `minSpareCols` value.
   */
  spare: number;
}

/**
 * Normalizes a minimum size option to a count. The value is coerced the way the grid applies it - it compares
 * and subtracts the raw option, so a numeric string such as `'5'` really does size the grid - and anything that
 * does not resolve to a positive number adds nothing.
 *
 * `Infinity` is a positive number here too, and stays one: paired with `maxRows`/`maxCols` it is a working
 * value that fills the grid up to the cap, so it has to compare as larger than any finite size.
 *
 * @param {*} value The option value.
 * @returns {number}
 */
function toSize(value: unknown): number {
  const size = Number(value);

  return size > 0 ? size : 0;
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
 * Counts the rows or columns at the end of an axis that its minimum sizes no longer require.
 *
 * An axis sized by a minimum and a spare count holds `max(minimum, filled + spare)` items, where `filled` is
 * everything up to the last item that is not empty. Anything past that is surplus.
 *
 * The result never reaches into the filled part, because the requirement is never below `filled`, so it can
 * never exceed `trailingEmpty`. It does not know which of those empty items the options added - the caller
 * narrows it to those.
 *
 * @param {SurplusTrailingItemsInput} input The axis state and its minimum sizes.
 * @returns {number} The number of items to remove from the end of the axis, `0` when there is nothing to remove.
 */
export function countSurplusTrailingItems({
  count,
  trailingEmpty,
  minimum,
  spare,
}: SurplusTrailingItemsInput): number {
  const filled = count - trailingEmpty;
  const required = Math.max(toSize(minimum), filled + toSize(spare));

  return Math.max(0, count - required);
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
