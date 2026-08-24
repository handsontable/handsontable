import { arrayEach } from './../helpers/array';
import { defineGetter, objectEach } from './../helpers/object';

const MIXIN_NAME = 'hooksRefRegisterer';

interface HooksRefRegisterer {
  _hooksStorage: Record<string, Function[]>;
  addHook(key: string, callback: Function): this;
  removeHooksByKey(key: string): void;
  clearHooks(): void;
}

interface HooksRefRegistererContext extends HooksRefRegisterer {
  hot: { addHook(key: string, callback: Function): void; removeHook(key: string, callback: Function): void };
}

/**
 * Mixin object to extend objects functionality for auto registering hooks in an Handsontable instance.
 *
 * @type {object}
 */
const hooksRefRegisterer: HooksRefRegisterer = {
  /**
   * Internal hooks storage.
   */
  _hooksStorage: Object.create(null) as Record<string, Function[]>,

  /**
   * Add hook to the collection.
   *
   * @param {string} key The hook name.
   * @param {Function} callback The hook callback.
   * @returns {object}
   */
  addHook(this: HooksRefRegistererContext, key: string, callback: Function): typeof hooksRefRegisterer {
    if (!this._hooksStorage[key]) {
      this._hooksStorage[key] = [];
    }

    this.hot.addHook(key, callback);
    this._hooksStorage[key].push(callback);

    return this;
  },

  /**
   * Remove all hooks listeners by hook name.
   *
   * @param {string} key The hook name.
   */
  removeHooksByKey(this: HooksRefRegistererContext, key: string) {
    arrayEach(this._hooksStorage[key] || [], (callback) => {
      this.hot.removeHook(key, callback);
    });
  },

  /**
   * Clear all added hooks.
   */
  clearHooks() {
    objectEach(this._hooksStorage, (callbacks, name) => this.removeHooksByKey(name));

    this._hooksStorage = {};
  },
};

defineGetter(hooksRefRegisterer, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default hooksRefRegisterer;
