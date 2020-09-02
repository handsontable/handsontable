import { extend } from '../../../helpers/object';
import { expandMetaType, assert, isUnsignedNumber } from '../utils';
import LazyFactoryMap from '../lazyFactoryMap';

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
  constructor(columnMeta) {
    /**
     * Reference to the ColumnMeta layer. While creating new cell meta objects, all new objects
     * inherit properties from the ColumnMeta layer.
     *
     * @type {ColumnMeta}
     */
    this.columnMeta = columnMeta;
    /**
     * Holder for cell meta objects, organized as a grid of LazyFactoryMap of LazyFactoryMaps.
     * The access to the cell meta object is done through access to the row defined by the physical
     * row index and then by accessing the second LazyFactory Map under the physical column index.
     *
     * @type {LazyFactoryMap<number, LazyFactoryMap<number, object>>}
     */
    this.metas = new LazyFactoryMap(() => this._createRow());
  }

  /**
   * Updates cell meta object by merging settings with the current state.
   *
   * @param {number} physicalRow The physical row index which points what cell meta object is updated.
   * @param {number} physicalColumn The physical column index which points what cell meta object is updated.
   * @param {object} settings An object to merge with.
   */
  updateMeta(physicalRow, physicalColumn, settings) {
    const meta = this.getMeta(physicalRow, physicalColumn);

    extend(meta, settings);
    extend(meta, expandMetaType(settings.type, meta));
  }

  /**
   * Creates one or more rows at specific position.
   *
   * @param {number} physicalRow The physical row index which points from what position the row is added.
   * @param {number} amount An amount of rows to add.
   */
  createRow(physicalRow, amount) {
    this.metas.insert(physicalRow, amount);
  }

  /**
   * Creates one or more columns at specific position.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is added.
   * @param {number} amount An amount of columns to add.
   */
  createColumn(physicalColumn, amount) {
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
  removeRow(physicalRow, amount) {
    this.metas.remove(physicalRow, amount);
  }

  /**
   * Removes one or more columns from the collection.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is removed.
   * @param {number} amount An amount of columns to remove.
   */
  removeColumn(physicalColumn, amount) {
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
  getMeta(physicalRow, physicalColumn, key) {
    const cellMeta = this.metas.obtain(physicalRow).obtain(physicalColumn);

    if (key === void 0) {
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
  setMeta(physicalRow, physicalColumn, key, value) {
    const cellMeta = this.metas.obtain(physicalRow).obtain(physicalColumn);

    cellMeta[key] = value;
  }

  /**
   * Removes a property defined by the "key" argument from the cell meta object.
   *
   * @param {number} physicalRow The physical row index.
   * @param {number} physicalColumn The physical column index.
   * @param {string} key The property name to remove.
   */
  removeMeta(physicalRow, physicalColumn, key) {
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
  getMetas() {
    const metas = [];
    const rows = Array.from(this.metas.values());

    for (let row = 0; row < rows.length; row++) {
      metas.push(...rows[row].values());
    }

    return metas;
  }

  /**
   * Returns all cell meta objects that were created during the Handsontable operation but for
   * specyfic row index.
   *
   * @param {number} physicalRow The physical row index.
   * @returns {object[]}
   */
  getMetasAtRow(physicalRow) {
    assert(() => isUnsignedNumber(physicalRow), 'Expecting an unsigned number.');

    const rowsMeta = new Map(this.metas);

    return rowsMeta.has(physicalRow) ? Array.from(rowsMeta.get(physicalRow).values()) : [];
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
    return new LazyFactoryMap(physicalColumn => this._createMeta(physicalColumn));
  }

  /**
   * Creates and returns new cell meta object with properties inherited from the column meta layer.
   *
   * @private
   * @param {number} physicalColumn The physical column index.
   * @returns {object}
   */
  _createMeta(physicalColumn) {
    const ColumnMeta = this.columnMeta.getMetaConstructor(physicalColumn);

    return new ColumnMeta();
  }
}
