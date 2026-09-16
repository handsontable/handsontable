import { getComparisonFunction } from '../../helpers/feature';
import { warnOnce } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';

const sortCompare = getComparisonFunction();

/**
 * Picks the rows pinned by `fixedRowsTop` and `fixedRowsBottom` out of a row order.
 *
 * The order it reads is the index SEQUENCE, not the visible rows: the sequence is untouched by
 * trimming, so the answer does not change as a filter trims rows away, and successive `filter()`
 * calls keep naming the same records. Physical indexes are returned, because everything the Filters
 * plugin trims and reads is addressed physically.
 *
 * @param {number[]} indexesSequence Physical row indexes in their current order.
 * @param {number} fixedRowsTop How many rows the top overlay pins.
 * @param {number} fixedRowsBottom How many rows the bottom overlay pins.
 * @returns {Set<number>} The pinned physical row indexes. Empty when nothing is pinned.
 */
export function getPinnedPhysicalRows(
  indexesSequence: number[], fixedRowsTop: number, fixedRowsBottom: number
): Set<number> {
  const top = Math.max(0, fixedRowsTop);
  const bottom = Math.max(0, fixedRowsBottom);

  if (top === 0 && bottom === 0) {
    return new Set();
  }

  // `slice(-0)` returns the WHOLE array, so the bottom slice cannot be written unguarded - that
  // would pin every row of the grid whenever only `fixedRowsTop` is set.
  const pinnedRows = indexesSequence.slice(0, top);

  if (bottom > 0) {
    pinnedRows.push(...indexesSequence.slice(-bottom));
  }

  // A Set, because on a dataset shorter than `fixedRowsTop + fixedRowsBottom` the two ends overlap.
  return new Set(pinnedRows);
}

/**
 * Warn that a per-column `filters` entry holds an object, which the plugin ignores.
 *
 * Only `false` is read at column level. The sub-options are resolved once, when the plugin is
 * enabled, so an object written inside `columns` is silently dropped - and a user who found the
 * per-column switch is likely to try configuring it there the same way.
 *
 * @param {object} scope The per-instance object the "warn once" state is bound to.
 * @param {string} pluginKey The plugin the option was written under.
 */
export function warnAboutPerColumnFilterSettings(scope: object, pluginKey: string) {
  warnOnce(scope, `${pluginKey}.perColumnFilterSettings`, toSingleLine`The \`${pluginKey}\` option was set\x20
    to an object inside \`columns\`, where only \`false\` has an effect (it turns the filter UI off\x20
    for that column). Move the plugin settings to the grid-level \`${pluginKey}\` option.`);
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
