import type { CellProperties } from '../../settings';

/**
 * One entry of a column read, in the shape `Filters#getDataMapAtColumn()` publishes and a filter
 * condition receives.
 */
export type ColumnDataEntry = {
  row: number;
  meta: CellProperties;
  value: unknown;
};

/**
 * Resolves the cell meta of one entry of a {@link ColumnDataMap}.
 *
 * The object belongs to that entry alone - the cell's stored meta when it has one, otherwise a
 * fresh transient - so a caller may keep it.
 */
type MetaResolver = (index: number) => CellProperties;

/**
 * A columnar read of one column: the physical row indexes and the cell values in two parallel
 * arrays, plus an accessor that resolves each entry's cell meta on demand.
 *
 * The shape exists because the filter scan reads the value of every row and the meta of almost
 * none, while an array of `{ row, meta, value }` objects pays for both on every row. It is
 * internal: `Filters#getDataMapAtColumn()` materializes it back into that array.
 *
 * @private
 * @class ColumnDataMap
 */
export class ColumnDataMap {
  /**
   * The physical row index of each entry, in read order. Adopted, not copied - never mutate it.
   *
   * @type {number[]}
   */
  readonly rows: number[];
  /**
   * The value of each entry, in the same order as {@link ColumnDataMap#rows}. Blank cells are
   * normalized to an empty string. Adopted, not copied - never mutate it.
   *
   * @type {Array}
   */
  readonly values: unknown[];
  /**
   * Resolves an entry's cell meta on demand.
   *
   * @type {Function}
   */
  #resolveMeta: MetaResolver;

  /**
   * Builds a column data map over two parallel arrays and a meta resolver.
   */
  constructor(rows: number[], values: unknown[], resolveMeta: MetaResolver) {
    this.rows = rows;
    this.values = values;
    this.#resolveMeta = resolveMeta;
  }

  /**
   * Builds a read with no entries, for the callers that have no column to read.
   *
   * @returns {ColumnDataMap}
   */
  static empty(): ColumnDataMap {
    // An empty read resolves to `undefined`, which is what `entries[0]?.meta` yielded when this
    // read was an array. Throwing here would turn a harmless guard-less probe into an error.
    return new ColumnDataMap([], [], () => undefined as unknown as CellProperties);
  }

  /**
   * The number of entries the read produced.
   *
   * @returns {number}
   */
  get length(): number {
    return this.rows.length;
  }

  /**
   * Gets the physical row index of the entry at the given position.
   *
   * @param {number} index The entry position.
   * @returns {number}
   */
  getRow(index: number): number {
    return this.rows[index];
  }

  /**
   * Gets the value of the entry at the given position.
   *
   * @param {number} index The entry position.
   * @returns {*}
   */
  getValue(index: number): unknown {
    return this.values[index];
  }

  /**
   * Gets the cell meta of the entry at the given position. The object belongs to that entry alone,
   * so it is safe to keep.
   *
   * @param {number} index The entry position.
   * @returns {object}
   */
  getMeta(index: number): CellProperties {
    return this.#resolveMeta(index);
  }

  /**
   * Returns a read over the same entries whose cell meta is resolved at most once per entry.
   *
   * Only for a read that is itself memoized. The cache holds one object per entry for as long as
   * the returned instance lives, which is exactly the allocation the columnar shape exists to keep
   * off a filter scan - but it is also what a memoized read owes its several passes, which would
   * otherwise re-resolve the whole column each time.
   *
   * @returns {ColumnDataMap}
   */
  withMemoizedMeta(): ColumnDataMap {
    const resolveMeta = this.#resolveMeta;
    const cache = new Map<number, CellProperties>();

    return new ColumnDataMap(this.rows, this.values, (index: number) => {
      let cellMeta = cache.get(index);

      if (cellMeta === undefined) {
        cellMeta = resolveMeta(index);
        cache.set(index, cellMeta);
      }

      return cellMeta;
    });
  }

  /**
   * Materializes the read as the array of `{ row, meta, value }` objects the column read produced
   * before it went columnar. One cell meta per entry, so the result is safe to keep - and that is
   * also what makes it the slow path the columnar shape exists to avoid, so never call it inside
   * the filter scan.
   *
   * @returns {Array<{row: number, meta: object, value: *}>}
   */
  toArray(): ColumnDataEntry[] {
    const entries: ColumnDataEntry[] = [];

    for (let index = 0; index < this.rows.length; index++) {
      entries.push({
        row: this.rows[index],
        meta: this.#resolveMeta(index),
        value: this.values[index],
      });
    }

    return entries;
  }
}
