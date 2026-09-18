import { isEmpty } from '../../../helpers/mixed';
import { DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND } from '../sortService';
import { localeLowerCase } from '../../../helpers/string';
import { markPreparedCompareFn } from '../sortService/preparedComparator';
import type { PreparedCompareFn } from '../sortService/preparedComparator';

/**
 * The comparison keys of one sorted column, stored column by column rather than as one record per
 * row. Three parallel arrays retain about half of what a per-row record shape costs, and the two
 * flag arrays plus the number array are dense typed arrays, so nothing here is a pointer except
 * the normalized values themselves.
 */
interface DefaultSortKeys {

  /**
   * The normalized value of every row: booleans as numbers, strings lowercased, everything else
   * untouched. Read for the identity short-circuit and for comparing two non-numeric values.
   */
  normalizedValues: unknown[];

  /**
   * `1` when the normalized value is `null`, `undefined` or an empty string.
   */
  emptyFlags: Uint8Array;

  /**
   * `1` when the normalized value does not coerce to a number. Meaningless for an empty row,
   * which never reaches the numeric branch.
   */
  notANumberFlags: Uint8Array;

  /**
   * `parseFloat(String(normalizedValue))`, filled only for a row that coerces to a number.
   */
  numbers: Float64Array;
}

/**
 * Normalizes a cell value for comparison by converting booleans to numbers and strings to lowercase.
 *
 * Lowercased strings are memoized in the provided cache. The compare function is created once per
 * sort run, so each distinct string pays the locale-aware lowercasing once instead of on every
 * comparison (~2*log(n) times per row in a sort).
 *
 * @param {unknown} value The value to normalize.
 * @param {string | undefined} locale The locale to use for string lowercasing.
 * @param {Map} lowerCaseCache Per-sort-run cache mapping original strings to lowercased ones.
 * @returns {unknown} The normalized value.
 */
function normalizeValue(value: unknown, locale: string | undefined, lowerCaseCache: Map<string, string>): unknown {
  if (typeof value === 'boolean') {
    return Number(value);
  }

  if (typeof value === 'string') {
    let lowerCasedValue = lowerCaseCache.get(value);

    if (lowerCasedValue === undefined) {
      lowerCasedValue = localeLowerCase(value, locale);
      lowerCaseCache.set(value, lowerCasedValue);
    }

    return lowerCasedValue;
  }

  return value;
}

/**
 * Compares two non-empty values, handling NaN and numeric coercion.
 *
 * @param {unknown} value The first value.
 * @param {unknown} nextValue The second value.
 * @param {string} sortOrder The sort order (`asc` or `desc`).
 * @returns {number} The comparison result.
 */
function compareNonEmptyValues(value: unknown, nextValue: unknown, sortOrder: string): number {
  const valueIsNaN = isNaN(value as number);
  const nextValueIsNaN = isNaN(nextValue as number);

  if (valueIsNaN && !nextValueIsNaN) {
    return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
  }

  if (!valueIsNaN && nextValueIsNaN) {
    return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
  }

  let comparableValue = value;
  let comparableNextValue = nextValue;

  if (!valueIsNaN && !nextValueIsNaN) {
    comparableValue = parseFloat(String(value));
    comparableNextValue = parseFloat(String(nextValue));
  }

  const a = comparableValue as string | number;
  const b = comparableNextValue as string | number;

  if (a < b) {
    return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
  }

  if (a > b) {
    return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
  }

  return DO_NOT_SWAP;
}

/**
 * Default sorting compare function factory. Method get as parameters `sortOrder` and `columnMeta` and return compare function.
 *
 * The returned compare function is callable with two raw cell values, exactly as before. It also
 * carries the `prepare`/`compare` seam, so the sort engine can extract every row's comparison key
 * once instead of re-normalizing both operands of every comparison.
 *
 * @param {string} sortOrder Sort order (`asc` for ascending, `desc` for descending).
 * @param {object} columnMeta Column meta object.
 * @param {object} columnPluginSettings Plugin settings for the column.
 * @returns {Function} The compare function.
 */
export function compareFunctionFactory(
  sortOrder: string, columnMeta: Record<string, unknown>, columnPluginSettings: Record<string, unknown>
) {
  const locale = columnMeta.locale as string | undefined;
  const lowerCaseCache = new Map<string, string>();

  const compareFunction = function(value: unknown, nextValue: unknown) {
    const { sortEmptyCells } = columnPluginSettings;

    const normalizedValue = normalizeValue(value, locale, lowerCaseCache);
    const normalizedNextValue = normalizeValue(nextValue, locale, lowerCaseCache);

    if (normalizedValue === normalizedNextValue) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(normalizedValue)) {
      if (isEmpty(normalizedNextValue)) {
        return DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(normalizedNextValue)) {
      // Just second value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    return compareNonEmptyValues(normalizedValue, normalizedNextValue, sortOrder);
  } as PreparedCompareFn<DefaultSortKeys>;

  /**
   * Extracts every row's comparison key in one pass over the sorted column.
   *
   * The per-run lowercase cache the pairwise path needs is deliberately not used here: this loop
   * lowercases each row exactly once, so a memo would only add a `Map` lookup per row plus a
   * row-sized `Map` held alive for the whole sort.
   *
   * @param {Array} rows The rows being sorted, each one a `[rowIndex, ...values]` array.
   * @param {number} valueIndex The slot this column's value sits at inside a row array.
   * @returns {object} The columnar key store.
   */
  compareFunction.prepare = function(rows: unknown[][], valueIndex: number): DefaultSortKeys {
    const rowCount = rows.length;
    // The tuple path hands over rows, so the column is read out first and the one extraction loop
    // below serves both paths. One value-sized array next to the tuples the caller already built.
    const values = new Array(rowCount);

    for (let row = 0; row < rowCount; row++) {
      values[row] = rows[row][valueIndex];
    }

    return compareFunction.prepareValues(values);
  };

  /**
   * Extracts every row's comparison key in one pass over the column's values.
   *
   * @param {Array} values The column's cell values, indexed by position.
   * @returns {object} The columnar key store.
   */
  compareFunction.prepareValues = function(values: unknown[]): DefaultSortKeys {
    const rowCount = values.length;
    const normalizedValues = new Array(rowCount);
    const emptyFlags = new Uint8Array(rowCount);
    const notANumberFlags = new Uint8Array(rowCount);
    const numbers = new Float64Array(rowCount);

    for (let row = 0; row < rowCount; row++) {
      const value = values[row];
      let normalizedValue = value;

      if (typeof value === 'boolean') {
        normalizedValue = Number(value);

      } else if (typeof value === 'string') {
        normalizedValue = localeLowerCase(value, locale);
      }

      normalizedValues[row] = normalizedValue;

      // An empty value never reaches the numeric branch, so its number and NaN flag are never
      // read — and skipping them keeps `isNaN` off values the pairwise path never coerces either.
      if (isEmpty(normalizedValue)) {
        emptyFlags[row] = 1;

      } else if (isNaN(normalizedValue as number)) {
        notANumberFlags[row] = 1;

      } else {
        numbers[row] = parseFloat(String(normalizedValue));
      }
    }

    return { normalizedValues, emptyFlags, notANumberFlags, numbers };
  };

  /**
   * Compares two rows by their extracted keys. Every branch mirrors the pairwise path above, so
   * the sort order is identical.
   *
   * @param {object} keys The key store returned by `prepare()`.
   * @param {number} index The first row's position in the prepared rows.
   * @param {number} nextIndex The second row's position in the prepared rows.
   * @returns {number} The comparison result.
   */
  compareFunction.compare = function(keys: DefaultSortKeys, index: number, nextIndex: number): number {
    const { normalizedValues, emptyFlags, notANumberFlags, numbers } = keys;
    const normalizedValue = normalizedValues[index];
    const normalizedNextValue = normalizedValues[nextIndex];

    if (normalizedValue === normalizedNextValue) {
      return DO_NOT_SWAP;
    }

    // Read per comparison, not hoisted: `sortEmptyCells` is an inherited column property and the
    // pairwise path above reads it the same way.
    const { sortEmptyCells } = columnPluginSettings;

    if (emptyFlags[index] === 1) {
      if (emptyFlags[nextIndex] === 1) {
        return DO_NOT_SWAP;
      }

      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (emptyFlags[nextIndex] === 1) {
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    const valueIsNaN = notANumberFlags[index] === 1;
    const nextValueIsNaN = notANumberFlags[nextIndex] === 1;

    if (valueIsNaN && !nextValueIsNaN) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    if (!valueIsNaN && nextValueIsNaN) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    // Both operands took the same branch, so either both coerce to a number or neither does —
    // exactly the pair-dependent decision `compareNonEmptyValues()` makes.
    const a = (valueIsNaN ? normalizedValue : numbers[index]) as string | number;
    const b = (valueIsNaN ? normalizedNextValue : numbers[nextIndex]) as string | number;

    if (a < b) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (a > b) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };

  return markPreparedCompareFn(compareFunction);
}

export const COLUMN_DATA_TYPE = 'default';
