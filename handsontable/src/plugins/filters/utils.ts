import { getComparisonFunction } from '../../helpers/feature';
import { warnOnce } from '../../helpers/console';
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
 * Warn that a per-column `filters` object holds settings the plugin ignores there.
 *
 * At column level, `false` turns the filter UI off, and an object is read for `availableConditions`
 * only. The other sub-options are resolved once, for the whole grid, so they are silently dropped
 * from `columns` - and a user who found the per-column settings is likely to try them there too.
 */
export function warnAboutPerColumnFilterSettings(scope: object, pluginKey: string) {
  warnOnce(scope, `perColumn.${pluginKey}`, toSingleLine`The \`${pluginKey}\` option set inside\x20
    \`columns\` holds settings that have no effect there. Only \`false\` and the\x20
    \`availableConditions\` setting are read there. The other plugin settings are resolved once for\x20
    the whole grid, so move them to the grid-level \`${pluginKey}\` option.`);
}

/**
 * Warn that a per-column `availableConditions` value is not valid, so the column uses the
 * grid-level value instead.
 */
export function warnAboutInvalidColumnAvailableConditions(scope: object, pluginKey: string) {
  warnOnce(scope, `${pluginKey}.availableConditions.invalidColumnValue`, toSingleLine`The\x20
    \`${pluginKey}.availableConditions\` option set inside \`columns\` is not valid and it will be\x20
    ignored. Use an array of condition names, \`{ exclude: [...] }\`, or an object keyed by data type.`);
}

/**
 * Warn that an `availableConditions` allow-list names a condition the column's list does not offer,
 * so the condition is left out of the list.
 */
export function warnAboutUnavailableCondition(
  scope: object, conditionName: string, columnType: string, listType: string
) {
  const typeDescription = columnType === listType ?
    `"${columnType}" columns` : `"${columnType}" columns, which use the "${listType}" list`;

  warnOnce(scope, `filters.availableConditions.${columnType}.${conditionName}`, toSingleLine`The\x20
    "${conditionName}" condition is not available for ${typeDescription}, so the\x20
    \`filters.availableConditions\` option leaves it out of the "Filter by condition" list.`);
}

/**
 * Warn that an `availableConditions` setting names a condition that no data type offers.
 */
export function warnAboutUnknownCondition(scope: object, conditionName: string) {
  warnOnce(scope, `filters.availableConditions.unknown.${conditionName}`, toSingleLine`The\x20
    \`filters.availableConditions\` option names the "${conditionName}" condition, which does not\x20
    exist, so it has no effect. Check the name against the ones \`addCondition()\` takes.`);
}

/**
 * Warn that an `availableConditions` per-type map has a key that no condition list exists for.
 */
export function warnAboutUnknownConditionsDataType(scope: object, dataType: string, dataTypes: string[]) {
  const keys = dataTypes.map(type => `"${type}"`).join(', ');

  warnOnce(scope, `filters.availableConditions.dataType.${dataType}`, toSingleLine`The\x20
    \`filters.availableConditions\` option has a "${dataType}" key, which no condition list exists for,\x20
    so that entry is ignored. The keys are ${keys}. Any other column type uses the "text" list.`);
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
