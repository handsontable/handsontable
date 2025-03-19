import { extend } from '../../../helpers/object';
import { extendByMetaType, assert, isUnsignedNumber } from '../utils';
import LazyFactoryMap from '../lazyFactoryMap';
import { isDefined } from '../../../helpers/mixed';
import { MetaObject } from '../../types';

/* eslint-disable jsdoc/require-description-complete-sentence */
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
/* eslint-enable jsdoc/require-description-complete-sentence */
export default class CellMeta {
  /**
   * Reference to the ColumnMeta layer. While creating new cell meta objects, all new objects
   * inherit properties from the ColumnMeta layer.
   *
   * @type {ColumnMeta}
   */
  columnMeta: any;
  /**
   * Holder for cell meta objects, organized as a grid of LazyFactoryMap of LazyFactoryMaps.
   * The access to the cell meta object is done through access to the row defined by the physical
   * row index and then by accessing the second LazyFactory Map under the physical column index.
   *
   * @type {LazyFactoryMap}
   */
  metas = new LazyFactoryMap(() => this._createRow());

  constructor(columnMeta: any) {
    this.columnMeta = columnMeta;
  }

  /**
   * Updates cell meta object by merging settings with the current state.
   *
   * @param {number} physicalRow The physical row index which points what cell meta object is updated.
   * @param {number} physicalColumn The physical column index which points what cell meta object is updated.
   * @param {object} settings An object to merge with.
   */
  updateMeta(physicalRow: number, physicalColumn: number, settings: MetaObject): void {
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
  createRow(physicalRow: number | null, amount: number): void {
    this.metas.insert(physicalRow, amount);
  }

  /**
   * Creates one or more columns at specific position.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is added.
   * @param {number} amount An amount of columns to add.
   */
  createColumn(physicalColumn: number | null, amount: number): void {
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
  removeRow(physicalRow: number, amount: number): void {
    this.metas.remove(physicalRow, amount);
  }

  /**
   * Removes one or more columns from the collection.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is removed.
   * @param {number} amount An amount of columns to remove.
   */
  removeColumn(physicalColumn: number, amount: number): void {
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
  getMeta(physicalRow: number, physicalColumn: number, key?: string): MetaObject | any {
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
  setMeta(physicalRow: number, physicalColumn: number, key: string, value: any): void {
    const cellMeta = this.metas.obtain(physicalRow).obtain(physicalColumn);

    cellMeta._automaticallyAssignedMetaProps?.delete(key);
    cellMeta[key] = value;
  }

  /**
   * Removes a property defined by the "key" argument from the cell meta object.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {string} key The property name to remove.
   */
  removeMeta(physicalRow: number, physicalColumn: number, key: string): void {
    const cellMeta = this.metas.obtain(physicalRow).obtain(physicalColumn);

    delete cellMeta[key];
  }

  /**
   * Returns all cell meta objects that were created during the Handsontable operation. As cell meta
   * objects are created lazy, the length of the returned collection depends on how and when the
   * table has asked for access to that meta objects.
   *
   * @returns {object[]}
   */
  getMetas(): any[] {
    const metas: any[] = [];
    const rows = Array.from(this.metas.values());

    for (let row = 0; row < rows.length; row++) {
      // Getting a meta for already added row (new row already exist - it has been added using `createRow` method).
      // However, is not ready until the first `getMeta` call (lazy loading).
      if (isDefined(rows[row])) {
        const rowValues = rows[row].values();
        metas.push(...Array.from(rowValues));
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
  getMetasAtRow(physicalRow: number): any[] {
    assert(() => isUnsignedNumber(physicalRow), 'Expecting an unsigned number.');

    const rowsMeta = new Map(this.metas);

    if (rowsMeta.has(physicalRow)) {
      const rowValues = rowsMeta.get(physicalRow).values();
      return Array.from(rowValues);
    }
    
    return [];
  }

  /**
   * Clears all saved cell meta objects.
   */
  clearCache(): void {
    this.metas.clear();
  }

  /**
   * Creates and returns new structure for cell meta objects stored in columnar axis.
   *
   * @private
   * @returns {object}
   */
  _createRow(): LazyFactoryMap<number, MetaObject> {
    return new LazyFactoryMap(physicalColumn => this._createMeta(physicalColumn));
  }

  /**
   * Creates and returns new cell meta object with properties inherited from the column meta layer.
   *
   * @private
   * @param {number} physicalColumn The physical column index.
   * @returns {object}
   */
  _createMeta(physicalColumn: number): MetaObject {
    const ColumnMeta = this.columnMeta.getMetaConstructor(physicalColumn);

    return new ColumnMeta();
  }
}
