import { extend } from '../../../helpers/object';
import { extendByMetaType } from '../utils';
import { MetaObject } from '../../types';

/**
 * The table meta object is a layer that keeps all settings of the Handsontable that was passed in
 * the constructor. That layer contains all default settings inherited from the GlobalMeta layer
 * merged with settings passed by the developer. Adding, removing, or changing property in that
 * object has no direct reflection on any other layers.
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
export default class TableMeta {
  /**
   * Main object (instance of the internal TableMeta class from GlobalMeta), holder for all settings defined in the table scope.
   *
   * @type {TableMeta}
   */
  meta: MetaObject;

  constructor(globalMeta: any) {
    const MetaCtor = globalMeta.getMetaConstructor();

    this.meta = new MetaCtor();
  }

  /**
   * Gets settings object for this layer.
   *
   * @returns {TableMeta}
   */
  getMeta(): MetaObject {
    return this.meta;
  }

  /**
   * Updates table settings object by merging settings with the current state.
   *
   * @param {object} settings An object to merge with.
   */
  updateMeta(settings: MetaObject): void {
    extend(this.meta, settings);
    // @ts-ignore
    extendByMetaType(this.meta, settings, settings);
  }
}
