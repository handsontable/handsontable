import { extend } from '../../../helpers/object';
import { columnFactory, extendByMetaType } from '../utils';
import LazyFactoryMap from '../lazyFactoryMap';
import { MetaObject } from '../../types';

/**
 * List of props which have to be cleared in the column meta-layer. That props have a
 * different meaning when using in column meta.
 *
 * @type {string[]}
 */
const COLUMNS_PROPS_CONFLICTS = ['data', 'width'];

/**
 * The column meta object is a root of all settings defined in the column property of the Handsontable
 * settings. Each column in the Handsontable is associated with a unique meta object which is managed by
 * this layer. Adding, removing, or changing property in that object has a direct reflection only for
 * the CellMeta layer. The reflection will be visible only if the property doesn't exist in the lower
 * layers (prototype lookup).
 *
 * +-------------+.
 * │ GlobalMeta  │
 * │ (prototype) │
 * +-------------+\
 *       │         \
 *       │          \
 *      \│/         _\|
 * +-------------+    +-------------+.
 * │ TableMeta   │    │ ColumnMeta  │
 * │ (instance)  │    │ (prototype) │
 * +-------------+    +-------------+.
 *                         │
 *                         │
 *                        \│/
 *                    +-------------+.
 *                    │  CellMeta   │
 *                    │ (instance)  │
 *                    +-------------+.
 */
export default class ColumnMeta {
  /**
   * Reference to the GlobalMeta layer. While creating new column meta objects, all new objects
   * inherit properties from the GlobalMeta layer.
   *
   * @type {GlobalMeta}
   */
  globalMeta: any;
  /**
   * The LazyFactoryMap structure, holder for column meta objects where each column meta is
   * stored under the physical column index.
   *
   * @type {LazyFactoryMap}
   */
  metas: LazyFactoryMap = new LazyFactoryMap(() => this._createMeta());

  constructor(globalMeta: any) {
    this.globalMeta = globalMeta;
    this.metas = new LazyFactoryMap(() => this._createMeta());
  }

  /**
   * Updates column meta object by merging settings with the current state.
   *
   * @param {number} physicalColumn The physical column index which points what column meta object is updated.
   * @param {object} settings An object to merge with.
   */
  updateMeta(physicalColumn: number, settings: MetaObject): void {
    const meta = this.getMeta(physicalColumn);

    extend(meta, settings);
    // @ts-ignore
    extendByMetaType(meta, settings);
  }

  /**
   * Creates one or more columns at specific position.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is added.
   * @param {number} amount An amount of columns to add.
   */
  createColumn(physicalColumn: number | null, amount: number): void {
    this.metas.insert(physicalColumn, amount);
  }

  /**
   * Removes one or more columns from the collection.
   *
   * @param {number} physicalColumn The physical column index which points from what position the column is removed.
   * @param {number} amount An amount columns to remove.
   */
  removeColumn(physicalColumn: number, amount: number): void {
    this.metas.remove(physicalColumn, amount);
  }

  /**
   * Gets settings object for this layer.
   *
   * @param {number} physicalColumn The physical column index.
   * @returns {object}
   */
  getMeta(physicalColumn: number): MetaObject {
    return this.metas.obtain(physicalColumn);
  }

  /**
   * Gets constructor of the column meta object. Necessary for inheritance - creating the next meta layers.
   *
   * @param {number} physicalColumn The physical column index.
   * @returns {Function}
   */
  getMetaConstructor(physicalColumn: number): any {
    return this.metas.obtain(physicalColumn).constructor;
  }

  /**
   * Clears all saved column meta objects.
   */
  clearCache(): void {
    this.metas.clear();
  }

  /**
   * Creates and returns new column meta object with properties inherited from the global meta layer.
   *
   * @private
   * @returns {object}
   */
  _createMeta(): MetaObject {
    return columnFactory(this.globalMeta.getMetaConstructor(), COLUMNS_PROPS_CONFLICTS).prototype;
  }
}
