import { getComparisonFunction } from '../../helpers/feature';
import { warnAboutGridLevelOptionInColumns } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';

const sortCompare = getComparisonFunction();

/**
 * Picks the rows pinned by `fixedRowsTop` and `fixedRowsBottom` out of a row order.
 *
 * The order it reads must be the rows the grid actually SHOWS, in visual order - the two overlays
 * freeze the first and last visible rows, so a row another plugin trimmed away is not pinned even
 * though it still sits at the head of the raw index sequence. Physical indexes come back, because
 * everything the Filters plugin trims and reads is addressed physically.
 *
 * Both counts are trusted as already clamped to non-negative integers; the caller owns that.
 */
export function getPinnedPhysicalRows(
  visibleRows: number[], fixedRowsTop: number, fixedRowsBottom: number
): Set<number> {
  const pinnedRows = new Set<number>();
  const rowCount = visibleRows.length;
  const topEnd = Math.min(fixedRowsTop, rowCount);
  // Never `slice(-bottom)`: `slice(-0)` returns the WHOLE array, so a grid with only `fixedRowsTop`
  // set would pin every row and no filter would ever hide anything. An index is also what keeps
  // this from spreading a large array into `push`, which overflows the stack past ~10k elements.
  const bottomStart = Math.max(rowCount - fixedRowsBottom, 0);

  for (let rowIndex = 0; rowIndex < topEnd; rowIndex++) {
    pinnedRows.add(visibleRows[rowIndex]);
  }

  // A Set, and a second loop rather than one merged range, because on a dataset shorter than
  // `fixedRowsTop + fixedRowsBottom` the two ends overlap.
  for (let rowIndex = bottomStart; rowIndex < rowCount; rowIndex++) {
    pinnedRows.add(visibleRows[rowIndex]);
  }

  return pinnedRows;
}

/**
 * Warn that a per-column `filters` entry holds an object, which the plugin ignores.
 *
 * Only `false` is read at column level. The sub-options are resolved once, for the whole grid, so
 * an object written inside `columns` is silently dropped - and a user who found the per-column
 * switch is likely to try configuring it there the same way.
 */
export function warnAboutPerColumnFilterSettings(scope: object, pluginKey: string) {
  warnAboutGridLevelOptionInColumns(scope, `${pluginKey}`, toSingleLine`Only \`false\` is read there,\x20
    and it turns the filter UI off for that column. The plugin settings are resolved once for the\x20
    whole grid, so move them to the grid-level \`${pluginKey}\` option.`);
}

/**
 * Comparison function for sorting purposes.
 *
 * @param {*} a The first value to compare.
 * @param {*} b The second value to compare.
 * @returns {number} Returns number from -1 to 1.
 */
export function sortComparison(a: unknown, b: unknown) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return sortCompare(a as string, b as string);
}

/**
 * Convert raw value into visual value.
 *
 * @param {*} value The value to convert.
 * @param {string} defaultEmptyValue Default value for empty cells.
 * @returns {*}
 */
export function toVisualValue(value: unknown, defaultEmptyValue: string) {
  let visualValue = value;

  if (visualValue === '') {
    visualValue = `(${defaultEmptyValue})`;
  }

  return visualValue;
}

/**
 * Whether a Filter-by-value list item is the empty-cell bucket.
 *
 * After `unifyColumnValues`, blanks are always `''` (`null`/`undefined` already
 * collapsed by `toEmptyString`). `toVisualValue` then swaps that `''` for the
 * translated `(Blank cells)` label before `modifyFiltersMultiSelectValue` runs.
 * Password hashing and date/time formatters must not run on that label.
 *
 * @param {*} value The list item's source `value` (not `visualValue`).
 * @returns {boolean}
 */
export function isBlankFilterListValue(value: unknown): value is '' {
  return value === '';
}

/**
 * Create an array assertion to compare if an element exists in that array (in a more efficient way than .indexOf).
 *
 * @param {Array} initialData Values to compare.
 * @returns {Function}
 */
export function createArrayAssertion(initialData: unknown[]) {
  const dataset = new Set(initialData);

  return function(value: unknown) {
    return dataset.has(value);
  };
}

export function toEmptyString(value: null | undefined): '';
export function toEmptyString<T>(value: T): T;
/**
 * Convert empty-ish values like null and undefined to an empty string.
 *
 * @param {*} value Value to check.
 * @returns {*}
 */
export function toEmptyString(value: unknown): unknown {
  return value === null || value === undefined ? '' : value;
}

/**
 * Unify column values (remove duplicated values and sort them).
 *
 * @param {Array} values An array of values.
 * @param {Function} [comparator] Optional sort comparator. When omitted, numbers sort numerically
 *   and all other values sort lexicographically.
 * @returns {Array}
 */
export function unifyColumnValues(values: unknown[], comparator?: (a: unknown, b: unknown) => number): unknown[] {
  const defaultComparator = (a: unknown, b: unknown): number => {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    if (a === b) {
      return 0;
    }

    return (a as string | number) > (b as string | number) ? 1 : -1;
  };

  return Array.from(new Set(values))
    .map(value => toEmptyString(value))
    .sort(comparator ?? defaultComparator);
}

/**
 * Intersect 'base' values with 'selected' values and return an array of object.
 *
 * @param {Array} base An array of base values.
 * @param {Array} selected An array of selected values.
 * @param {string} defaultEmptyValue Default value for empty cells.
 * @param {Function} [callback] A callback function which is invoked for every item in an array.
 * @returns {Array}
 */
export function intersectValues(base: unknown[], selected: unknown[], defaultEmptyValue: string, callback?: Function) {
  const result: Record<string, unknown>[] = [];
  const same = base === selected;
  let selectedItemsAssertion: Function | undefined;

  if (!same) {
    selectedItemsAssertion = createArrayAssertion(selected);
  }

  base.forEach((value: unknown) => {
    let checked = false;

    if (same || selectedItemsAssertion!(value)) {
      checked = true;
    }

    const item = {
      checked,
      value,
      visualValue: toVisualValue(value, defaultEmptyValue),
    };

    if (callback) {
      callback(item);
    }

    result.push(item);
  });

  return result;
}
