import { arrayEach } from './../helpers/array';
import { defineGetter, objectEach } from './../helpers/object';
import { Constructor } from './constructor.type';
import { HotInstance } from '../core.types';

const MIXIN_NAME = 'hooksRefRegisterer';

export type IncludingHot = Constructor<{ hot: HotInstance }>;

/**
 * Mixin object to extend objects functionality for auto registering hooks in an Handsontable instance.
 *
 * @type {object}
 */
export function HooksRefRegistererMixin<T extends IncludingHot>(Base: T) {
  return class HooksRefRegisterer extends Base {
    /**
     * Internal hooks storage.
     */
    _hooksStorage = Object.create(null);

    /**
     * Add hook to the collection.
     *
     * @param {string} key The hook name.
     * @param {Function} callback The hook callback.
     * @returns {object}
     */
    addHook(key: string, callback: Function): HooksRefRegisterer {
      if (!this._hooksStorage[key]) {
        this._hooksStorage[key] = [];
      }

      this.hot.addHook(key, callback);
      this._hooksStorage[key].push(callback);

      return this;
    }

    /**
     * Remove all hooks listeners by hook name.
     *
     * @param {string} key The hook name.
     */
    removeHooksByKey(key: string): void {
      arrayEach(this._hooksStorage[key] || [], (callback: Function) => {
        this.hot.removeHook(key, callback);
      });
    }

    /**
     * Clear all added hooks.
     */
    clearHooks(): void {
      objectEach(this._hooksStorage, (callbacks: Function[], name: string) => this.removeHooksByKey(name));

      this._hooksStorage = {};
    }
  };
}
