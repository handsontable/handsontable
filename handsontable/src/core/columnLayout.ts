/**
 * What decides the columns of a grid whose `columns` option is not set: how many there are, and the property each
 * one reads.
 */
export interface ColumnLayout {
  /**
   * The number of columns the data schema or the data resolves to.
   */
  count: number;
  /**
   * The property each column reads, by physical column index.
   */
  props: unknown[];
}

/**
 * Checks whether two layouts name the same property at every index below `length`. The properties are compared by
 * index and by identity, so a hole matches only a hole. An `every()` call would skip the holes and read a column
 * that gained a property as unchanged.
 *
 * @param {ColumnLayout} before The layout before a settings update.
 * @param {ColumnLayout} after The layout after it.
 * @param {number} length The number of indexes to compare.
 * @param {boolean} [functionsMatch] `true` when two accessor functions at one index count as the same property.
 * @returns {boolean}
 */
function hasSameProps(before: ColumnLayout, after: ColumnLayout, length: number, functionsMatch = false): boolean {
  for (let index = 0; index < length; index += 1) {
    const prop = before.props[index];
    const nextProp = after.props[index];

    if (prop !== nextProp && !(functionsMatch && typeof prop === 'function' && typeof nextProp === 'function')) {
      return false;
    }
  }

  return true;
}

/**
 * Checks whether two column layouts describe the same columns.
 *
 * The properties are compared by position and by identity, so a reordered schema is a different layout.
 *
 * @param {ColumnLayout} before The layout before a settings update.
 * @param {ColumnLayout} after The layout after it.
 * @returns {boolean}
 */
export function isSameColumnLayout(before: ColumnLayout, after: ColumnLayout): boolean {
  return before.count === after.count &&
    before.props.length === after.props.length &&
    hasSameProps(before, after, before.props.length);
}

/**
 * Checks whether the second layout only adds columns after the ones of the first, or changes nothing. The first
 * layout's columns then keep their place, so state kept by physical index still describes them.
 *
 * Two accessor functions at one index count as the same property. A `columns` array written inline holds a new
 * function on every render, and telling a changed accessor from a new copy of the same one is not possible, so
 * the state is kept, as it was before layouts were compared.
 *
 * @param {ColumnLayout} before The layout before a settings update.
 * @param {ColumnLayout} after The layout after it.
 * @returns {boolean}
 */
export function isColumnLayoutAppend(before: ColumnLayout, after: ColumnLayout): boolean {
  return after.count >= before.count &&
    hasSameProps(before, after, Math.max(before.count, before.props.length), true);
}

/**
 * Checks whether the second layout only drops columns from the end of the first. The columns that remain keep their
 * place, so state kept by physical index still describes them, and the dropped columns take their own state along.
 * Accessor functions compare as in `isColumnLayoutAppend()`.
 *
 * @param {ColumnLayout} before The layout before a settings update.
 * @param {ColumnLayout} after The layout after it.
 * @returns {boolean}
 */
export function isColumnLayoutTruncation(before: ColumnLayout, after: ColumnLayout): boolean {
  return after.count <= before.count && hasSameProps(before, after, after.count, true);
}

/**
 * Checks whether every column that the first layout and the second share keeps its place: the second layout only
 * adds columns to the end, drops them from the end, or changes nothing.
 *
 * @param {ColumnLayout} before The layout before a settings update.
 * @param {ColumnLayout} after The layout after it.
 * @returns {boolean}
 */
export function isColumnLayoutKept(before: ColumnLayout, after: ColumnLayout): boolean {
  return isColumnLayoutAppend(before, after) || isColumnLayoutTruncation(before, after);
}
