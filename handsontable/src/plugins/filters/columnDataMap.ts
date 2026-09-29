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
 * The object belongs to that entry alone – the cell's stored meta when it has one, otherwise a
 * fresh transient – so a caller may keep it. It does not need to carry coordinate stamps:
 * {@link ColumnDataMap#getMeta} writes them.
 */
type MetaResolver = (index: number) => CellProperties;

/**
 * Writes the coordinate stamps a filter condition and a `valueGetter` read off cell meta.
 *
 * Both pairs get the PHYSICAL indexes. That is a historical quirk of the filter's column read, kept
 * on purpose: consumers correlate rows through the entry's own `row`, never through these stamps.
 *
 * @param {object} cellMeta The cell meta to stamp.
 * @param {number} physicalRow The physical row index.
 * @param {number} physicalColumn The physical column index.
 */
export function stampPhysicalCoordinates(cellMeta: CellProperties, physicalRow: number, physicalColumn: number) {
  cellMeta.visualRow = physicalRow;
  cellMeta.visualCol = physicalColumn;
  cellMeta.row = physicalRow;
  cellMeta.col = physicalColumn;
}

/**
 * A columnar read of one column: the physical row indexes and the cell values in two parallel
 * arrays, plus an accessor that resolves each entry's cell meta on demand.
 *
 * The filter scan builds each row's `{ row, meta, value }` object inside its own loop and drops it
 * once the row's condition call returns, so the scan never holds a whole column of those objects
 * alive at once – an array of them keeps every one past the young-generation collections for the
 * length of the scan. A row that stores no meta of its own gets a fresh one there too, unless the
 * read already resolved it for a `valueGetter`. It is internal: `Filters#getDataMapAtColumn()`
 * materializes it back into that array.
 *
 * @private
 * @class ColumnDataMap
 */
export class ColumnDataMap {
  /**
   * The physical row index of each entry, in read order. Adopted, not copied – never mutate it.
   *
   * @type {number[]}
   */
  readonly rows: number[];
  /**
   * The value of each entry, in the same order as {@link ColumnDataMap#rows}. Blank cells are
   * normalized to an empty string. Adopted, not copied – never mutate it.
   *
   * @type {Array}
   */
  readonly values: unknown[];
  /**
   * The physical index of the column the entries were read from.
   *
   * @type {number}
   */
  readonly column: number;
  /**
   * Resolves an entry's cell meta on demand.
   *
   * @type {Function}
   */
  #resolveMeta: MetaResolver;

  /**
   * Builds a column data map over two parallel arrays and a meta resolver.
   */
  constructor(rows: number[], values: unknown[], column: number, resolveMeta: MetaResolver) {
    this.rows = rows;
    this.values = values;
    this.column = column;
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
    return new ColumnDataMap([], [], -1, () => undefined as unknown as CellProperties);
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
   * Gets the cell meta of the entry at the given position, stamped with the entry's coordinates on
   * every call. The object belongs to that entry alone, so it is safe to keep.
   *
   * @param {number} index The entry position.
   * @returns {object}
   */
  getMeta(index: number): CellProperties {
    const cellMeta = this.#resolveMeta(index);

    if (cellMeta !== undefined) {
      stampPhysicalCoordinates(cellMeta, this.rows[index], this.column);
    }

    return cellMeta;
  }

  /**
   * Returns a read over the same entries whose cell meta is resolved at most once per entry.
   *
   * Only for a read that is itself memoized, which owes its several passes the same meta object
   * per row. The cache holds one object per entry for as long as the returned instance lives. The
   * coordinate stamps are still rewritten on every {@link ColumnDataMap#getMeta} call.
   *
   * @returns {ColumnDataMap}
   */
  withMemoizedMeta(): ColumnDataMap {
    const resolveMeta = this.#resolveMeta;
    const cache = new Array<CellProperties | undefined>(this.rows.length);

    return new ColumnDataMap(this.rows, this.values, this.column, (index: number) => {
      let cellMeta = cache[index];

      if (cellMeta === undefined) {
        cellMeta = resolveMeta(index);
        cache[index] = cellMeta;
      }

      return cellMeta;
    });
  }

  /**
   * Materializes the read as the array of `{ row, meta, value }` objects the column read produced
   * before it went columnar. One cell meta per entry, so the result is safe to keep – and every
   * entry stays alive for as long as the array does, which is why the filter scan never calls it.
   *
   * @returns {Array<{row: number, meta: object, value: *}>}
   */
  toArray(): ColumnDataEntry[] {
    const entries: ColumnDataEntry[] = [];

    for (let index = 0; index < this.rows.length; index++) {
      entries.push({
        row: this.rows[index],
        meta: this.getMeta(index),
        value: this.values[index],
      });
    }

    return entries;
  }
}
