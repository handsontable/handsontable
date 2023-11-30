import { extend } from '../../../helpers/object';
import { extendByMetaType } from '../utils';
import metaSchemaFactory from '../metaSchema';

/**
 * @typedef {Options} TableMeta
 */
/**
 * @returns {TableMeta} Returns an empty object. The holder for global meta object.
 */
function createTableMetaEmptyClass() {
  return class TableMeta {};
}

/**
 * The global meta object is a root of all default settings, which are recognizable by Handsontable.
 * Other layers are inherited from this object. Adding, removing, or changing property in that
 * object has a direct reflection to all layers such as: TableMeta, ColumnMeta, or CellMeta layers.
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
export default class GlobalMeta {
  /**
   * An alias for the constructor. Necessary for inheritance for creating new layers.
   *
   * @type {TableMeta}
   */
  metaCtor = createTableMetaEmptyClass();
  /**
   * Main object (prototype of the internal TableMeta class), holder for all default settings.
   *
   * @type {object}
   */
  meta;

  constructor(hot) {
    this.meta = this.metaCtor.prototype;

    extend(this.meta, metaSchemaFactory());

    this.meta.instance = hot;
  }

  /**
   * Gets constructor of the global meta object. Necessary for inheritance for creating the next meta layers.
   *
   * @returns {Function}
   */
  getMetaConstructor() {
    return this.metaCtor;
  }

  /**
   * Gets settings object for this layer.
   *
   * @returns {object}
   */
  getMeta() {
    return this.meta;
  }

  /**
   * Updates global settings object by merging settings with the current state.
   *
   * @param {object} settings An object to merge with.
   */
  updateMeta(settings) {
    extend(this.meta, settings);
    extendByMetaType(this.meta, {
      ...settings,
      type: settings.type ?? this.meta.type,
    }, settings);
  }
}
