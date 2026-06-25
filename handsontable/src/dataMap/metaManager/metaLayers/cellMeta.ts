import { extendByMetaType, assert } from '../utils';
import LazyFactoryMap from '../lazyFactoryMap';
import { extend, hasOwnProperty } from '../../../helpers/object';
import { isDefined } from '../../../helpers/mixed';
import { isUnsignedNumber } from '../../../helpers/number';
import type ColumnMeta from './columnMeta';

/**
 * @class CellMeta
 *
 * The cell meta object is a root of all settings defined for the specific cell rendered by the
 * Handsontable. Each cell meta inherits settings from higher layers. When a property doesn't
 * exist in that layer, it is looked up through a prototype to the highest layer. Starting
 * from CellMeta -> ColumnMeta and ending to GlobalMeta, which stores default settings. Adding,
 * removing, or changing property in that object has no direct reflection on any other layers.
 *
 * +-------------+
 * │ GlobalMeta  │
 * │ (prototype) │
 * +-------------+\
 *       │         \
 *       │          \
 *      \│/         _\|
 * +-------------+    +-------------+
 * │ TableMeta   │    │ ColumnMeta  │
 * │ (instance)  │    │ (prototype) │
 * +-------------+    +-------------+
 *                         │
 *                         │
 *                        \│/
 *                    +-------------+
 *                    │  CellMeta   │
 *                    │ (instance)  │
 *                    +-------------+
 */
export default class CellMeta {
  /**
   * Reference to the ColumnMeta layer. While creating new cell meta objects, all new objects
   * inherit properties from the ColumnMeta layer.
   *
   * @type {ColumnMeta}
   */
  declare columnMeta: ColumnMeta;
  /**
   * Holder for cell meta objects, organized as a grid of LazyFactoryMap of LazyFactoryMaps.
   * The access to the cell meta object is done through access to the row defined by the physical
   * row index and then by accessing the second LazyFactory Map under the physical column index.
   *
   * @type {LazyFactoryMap<number, LazyFactoryMap<number, object>>}
   */
  metas = new LazyFactoryMap(() => this._createRow());
  /**
   * Counts how many times user-defined meta recording has been suspended without a matching
   * resume. Recording is active only when the count is `0`. A counter (rather than a boolean) keeps
   * nested suspend/resume scopes correct - for example, when a re-entrant `updateSettings` runs from
   * a `setCellMeta` hook while the outer `cell` option loop is still applying declarative writes.
   *
   * @type {number}
   */
  #userDefinedMetaRecordingSuspendCount = 0;

  /**
   * Initializes the cell meta layer with a reference to the ColumnMeta layer used as the prototype source for new cell meta objects.
   */
  constructor(columnMeta: ColumnMeta) {
    this.columnMeta = columnMeta;
  }

  /**
   * Resumes tracking of user-defined cell meta properties by closing one suspension scope opened by
   * `disableUserDefinedMetaRecording`. Recording becomes active again only once every suspension has
   * been closed. Subsequent `setMeta` calls then mark their keys as user-defined, so they are
   * preserved across `updateSettings`.
   */
  enableUserDefinedMetaRecording() {
    if (this.#userDefinedMetaRecordingSuspendCount > 0) {
      this.#userDefinedMetaRecordingSuspendCount -= 1;
    }
  }

  /**
   * Suspends tracking of user-defined cell meta properties. While suspended, `setMeta` calls are
   * treated as declarative writes and de-mark their keys, so they are not preserved across
   * `updateSettings`. Suspensions nest - each call must be matched by an `enableUserDefinedMetaRecording`
   * call before recording resumes.
   */
  disableUserDefinedMetaRecording() {
    this.#userDefinedMetaRecordingSuspendCount += 1;
  }

  /**
   * Updates cell meta object by merging settings with the current state.
   *
   * @param {number} physicalRow The physical row index which points what cell meta object is updated.
   * @param {number} physicalColumn The physical column index which points what cell meta object is updated.
   * @param {object} settings An object to merge with.
   */
  updateMeta(physicalRow: number, physicalColumn: number, settings: Record<string, unknown>) {
    const meta = this.getMeta(physicalRow, physicalColumn);

    extend(meta, settings);
    extendByMetaType(meta, settings);
  }

  /**
   * Creates one or more rows at specific position.
   *
   * @param {number} physicalRow The physical row index which points from what position the row is added.
   * @param {number} amount An amount of rows to add.
   */
  createRow(physicalRow: number, amount: number) {
    this.metas.insert(physicalRow, amount);
  }

  /**
   * Creates one or more columns at specific position.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is added.
   * @param {number} amount An amount of columns to add.
   */
  createColumn(physicalColumn: number, amount: number) {
    for (let i = 0; i < this.metas.size(); i++) {
      this.metas.obtain(i).insert(physicalColumn, amount);
    }
  }

  /**
   * Removes one or more rows from the collection.
   *
   * @param {number} physicalRow The physical row index which points from what position the row is removed.
   * @param {number} amount An amount of rows to remove.
   */
  removeRow(physicalRow: number, amount: number) {
    this.metas.remove(physicalRow, amount);
  }

  /**
   * Removes one or more columns from the collection.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is removed.
   * @param {number} amount An amount of columns to remove.
   */
  removeColumn(physicalColumn: number, amount: number) {
    for (let i = 0; i < this.metas.size(); i++) {
      this.metas.obtain(i).remove(physicalColumn, amount);
    }
  }

  /**
   * Gets settings object for this layer.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {string} [key] If the key exists its value will be returned, otherwise the whole cell meta object.
   * @returns {object}
   */
  getMeta(physicalRow: number, physicalColumn: number): Record<string, unknown>;
  /**
   * Returns the value of the specified property key from the cell meta object at the given physical row and column.
   */
  getMeta(physicalRow: number, physicalColumn: number, key: string): unknown;
  /**
   * Returns the cell meta object or a specific property value from it, depending on whether a key is provided.
   */
  getMeta(physicalRow: number, physicalColumn: number, key?: string): Record<string, unknown> | unknown {
    const cellMeta = this.metas.obtain(physicalRow).obtain(physicalColumn);

    if (key === undefined) {
      return cellMeta;
    }

    return cellMeta[key];
  }

  /**
   * Sets settings object for this layer defined by "key" property.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {string} key The property name to set.
   * @param {*} value Value to save.
   */
  setMeta(physicalRow: number, physicalColumn: number, key: string, value: unknown) {
    const cellMeta = this.metas.obtain(physicalRow).obtain(physicalColumn);

    (cellMeta._automaticallyAssignedMetaProps as Set<string> | undefined)?.delete(key);
    cellMeta[key] = value;

    // Every `setMeta` write - imperative or declarative (`cell` option) - is non-reconstructable by
    // `getCellMeta`, so record it; the viewport-eviction pass keeps cells whose set is non-empty.
    if (cellMeta._persistedMetaProps === undefined) {
      cellMeta._persistedMetaProps = new Set();
    }

    (cellMeta._persistedMetaProps as Set<string>).add(key);

    if (this.#userDefinedMetaRecordingSuspendCount === 0) {
      if (cellMeta._userDefinedMetaProps === undefined) {
        cellMeta._userDefinedMetaProps = new Set();
      }

      (cellMeta._userDefinedMetaProps as Set<string>).add(key);
    } else {
      (cellMeta._userDefinedMetaProps as Set<string> | undefined)?.delete(key);
    }
  }

  /**
   * Removes a property defined by the "key" argument from the cell meta object.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {string} key The property name to remove.
   */
  removeMeta(physicalRow: number, physicalColumn: number, key: string) {
    const cellMeta = this.metas.obtain(physicalRow).obtain(physicalColumn);

    delete cellMeta[key];
    (cellMeta._userDefinedMetaProps as Set<string> | undefined)?.delete(key);
    (cellMeta._persistedMetaProps as Set<string> | undefined)?.delete(key);
  }

  /**
   * Returns all cell meta objects that were created during the Handsontable operation. As cell meta
   * objects are created lazy, the length of the returned collection depends on how and when the
   * table has asked for access to that meta objects.
   *
   * @returns {object[]}
   */
  getMetas(): Record<string, unknown>[] {
    const metas: Record<string, unknown>[] = [];
    const rows = Array.from(this.metas.values());

    for (let row = 0; row < rows.length; row++) {
      // Getting a meta for already added row (new row already exist - it has been added using `createRow` method).
      // However, is not ready until the first `getMeta` call (lazy loading).
      if (isDefined(rows[row])) {
        metas.push(...Array.from(rows[row].values()));
      }
    }

    return metas;
  }

  /**
   * Returns all cell meta objects that were created during the Handsontable operation but for
   * specific row index.
   *
   * @param {number} physicalRow The physical row index.
   * @returns {object[]}
   */
  getMetasAtRow(physicalRow: number) {
    assert(() => isUnsignedNumber(physicalRow), 'Expecting an unsigned number.');

    const rowsMeta = new Map(
      this.metas as unknown as Iterable<readonly [number, LazyFactoryMap<Record<string, unknown>>]>
    );

    if (!rowsMeta.has(physicalRow)) {
      return [];
    }

    return Array.from((rowsMeta.get(physicalRow) as LazyFactoryMap))
      .sort(([a], [b]) => a - b)
      .map(([, meta]) => meta);
  }

  /**
   * Returns a flat snapshot of all cell meta properties that were set imperatively through
   * `setMeta` (tracked in each cell's `_userDefinedMetaProps`). The coordinates are read from the
   * map keys (physical indexes), not from the meta object's `row`/`col` properties, which are only
   * populated on `getCellMeta` and become stale after row or column shifts. Used to preserve
   * user-defined meta across a cache clear during `updateSettings`.
   *
   * @returns {{physicalRow: number, physicalColumn: number, key: string, value: *}[]}
   */
  getUserDefinedMetas(): { physicalRow: number, physicalColumn: number, key: string, value: unknown }[] {
    const result: { physicalRow: number, physicalColumn: number, key: string, value: unknown }[] = [];

    for (const [physicalRow, rowMap] of this.metas) {
      for (const [physicalColumn, meta] of rowMap) {
        const userDefinedProps = meta._userDefinedMetaProps as Set<string> | undefined;

        if (userDefinedProps === undefined) {
          continue; // eslint-disable-line no-continue
        }

        userDefinedProps.forEach((key) => {
          if (hasOwnProperty(meta, key)) {
            result.push({ physicalRow, physicalColumn, key, value: meta[key] });
          }
        });
      }
    }

    return result;
  }

  /**
   * Releases render-derived cell meta objects for a single physical row, freeing memory for rows
   * scrolled out of the viewport. Only cells that carry no persisted meta props (nothing set through
   * `setMeta`/`setCellMeta`, whether imperatively or via the declarative `cell` option) are evicted -
   * those objects are pure cascade/`cells`/`type` derivations and are re-created lazily on the next
   * `getMeta` call. Cells with persisted props are kept so those values survive scrolling. When the
   * whole row is purely render-derived, its inner map is dropped as well.
   *
   * @param {number} physicalRow The physical row index to evict.
   * @returns {boolean} `true` when at least one cell meta object was evicted.
   */
  evictRow(physicalRow: number) {
    const rowStorageIndex = this.metas._getStorageIndexByKey(physicalRow);

    if (rowStorageIndex < 0) {
      return false;
    }

    const rowMap = this.metas.data[rowStorageIndex];

    if (rowMap === undefined) {
      return false;
    }

    let hasPersistedCell = false;
    let evicted = false;

    for (const [physicalColumn, meta] of rowMap) {
      const persistedProps = meta._persistedMetaProps as Set<string> | undefined;

      if (persistedProps !== undefined && persistedProps.size > 0) {
        hasPersistedCell = true;
      } else {
        rowMap.evict(physicalColumn);
        evicted = true;
      }
    }

    if (!hasPersistedCell) {
      this.metas.evict(physicalRow);
    }

    return evicted;
  }

  /**
   * Clears all saved cell meta objects.
   */
  clearCache() {
    this.metas.clear();
  }

  /**
   * Creates and returns new structure for cell meta objects stored in columnar axis.
   *
   * @private
   * @returns {object}
   */
  _createRow() {
    return new LazyFactoryMap((physicalColumn: number) => this._createMeta(physicalColumn));
  }

  /**
   * Creates and returns new cell meta object with properties inherited from the column meta layer.
   *
   * @private
   * @param {number} physicalColumn The physical column index.
   * @returns {object}
   */
  _createMeta(physicalColumn: number) {
    const ColumnMeta = this.columnMeta.getMetaConstructor(physicalColumn) as new () => Record<string, unknown>;

    return new ColumnMeta();
  }
}
