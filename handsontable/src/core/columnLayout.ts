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
    before.props.every((prop, index) => prop === after.props[index]);
}
