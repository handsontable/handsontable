import { extend, isObject } from '../../../helpers/object';
import { extendByMetaType, proxyGetter } from '../utils';
import metaSchemaFactory from '../metaSchema';

/**
 * @typedef {Options} TableMeta
 */
/**
 * @returns {TableMeta} Returns an empty class. The holder for global meta object.
 */
function createTableMetaEmptyClass() {
  return function TableMeta() {};
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
  /**
   * Whether to enable initial state mode.
   *
   * @type {boolean}
   */
  #initialStateMode = true;

  constructor(hot, { initialState } = {}) {
    this.#initialStateMode = isObject(initialState);

    if (this.#initialStateMode) {
      this.meta = this.#createMetaObjectProxy(this.metaCtor.prototype);
      this.metaCtor.prototype = this.meta;
    } else {
      this.meta = this.metaCtor.prototype;
    }

    extend(this.meta, metaSchemaFactory());

    this.meta.instance = hot;
  }

  /**
   * Sets the initial state mode for table meta layer. When sets to `true`, the options at
   * first will be taken from the `initialState` object then from the `meta` object. When sets to
   * `false`, the options will be taken from the `meta` object only.
   *
   * @param {boolean} enabled Whether to enable initial state mode.
   */
  initialStateMode(enabled) {
    this.#initialStateMode = enabled;
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

  /**
   * Creates a Proxy wrapper for the meta object (prototype) that handles `initialState` logic.
   *
   * @param {object} metaObject The meta object to wrap.
   * @returns {Proxy}
   */
  #createMetaObjectProxy(metaObject) {
    const proxy = new Proxy(metaObject, {
      get: (...args) => proxyGetter(...args, this.#initialStateMode),
    });

    Object.defineProperty(proxy, '__isProxy__', { value: true });

    return proxy;
  }
}
