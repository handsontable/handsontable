import type { DataAccessorFn } from '../dataMap/dataSource';

/**
 * A grid instance, narrowed to the two translators this helper needs.
 */
interface ColumnResolver {
  colToProp(column: number): string | number | DataAccessorFn | null;
  toPhysicalColumn(column: number): number | null;
}

/**
 * Resolves a visual column index to the property to read or write through, falling back to the
 * index when the index names no column.
 *
 * `colToProp()` answers `null` in two situations that must not be conflated:
 *
 * - the index names no column that exists and is visible – past the last one, or trimmed;
 * - the column exists but declares no source binding (`{ data: null }`, as the sparkline recipe
 *   uses), so `null` *is* its property.
 *
 * Only the first falls back to the index. Substituting the index for an unbound column would bind
 * it to whatever source field sits at that position – a field a neighbouring column may already
 * own, which reads its value and overwrites it on the next edit.
 *
 * @param {object} hotInstance The Handsontable instance.
 * @param {number} column Visual column index.
 * @returns {string|number|Function|null} The column property, `null` for a column that exists but
 *   is unbound, or the passed index when it names no column.
 */
export function colToPropOrIndex(
  hotInstance: ColumnResolver,
  column: number
): string | number | DataAccessorFn | null {
  const prop = hotInstance.colToProp(column);

  if (prop === null && hotInstance.toPhysicalColumn(column) === null) {
    return column;
  }

  return prop;
}
