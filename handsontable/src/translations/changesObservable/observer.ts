import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

/**
 * The ChangesObserver module is an object that represents a disposable resource
 * provided by the ChangesObservable module.
 *
 * @class ChangesObserver
 */
export class ChangesObserver {
  // Mixin-injected properties/methods (added by `mixin(ChangesObserver, localHooks)`)
  /**
   * Internal storage map for local hook callbacks, keyed by hook name.
   */
  declare _localHooks: Record<string, Function[]>;
  /**
   * Registers a callback function for the given local hook name.
   */
  declare addLocalHook: (key: string, callback: Function) => this;
  /**
   * Triggers all callbacks registered under the given local hook name.
   */
  declare runLocalHooks: (key: string, ...args: unknown[]) => void;
  /**
   * Removes all locally registered hook callbacks from this observer instance.
   */
  declare clearLocalHooks: () => this;

  /**
   * The field holds initial changes that will be used to notify the callbacks added using
   * subscribe method. Regardless of the moment of listening for changes, the subscriber
   * will be notified once with all changes made before subscribing.
   *
   * @type {Array}
   */
  #currentInitialChanges: unknown[] = [];

  /**
   * Subscribes to the observer.
   *
   * @param {Function} callback A function that will be called when the new changes will appear.
   * @returns {ChangesObserver}
   */
  subscribe(callback: Function) {
    this.addLocalHook('change', callback);
    this._write(this.#currentInitialChanges);

    return this;
  }

  /**
   * Unsubscribes all subscriptions. After the method call, the observer would not produce
   * any new events.
   *
   * @returns {ChangesObserver}
   */
  unsubscribe() {
    this.runLocalHooks('unsubscribe');
    this.clearLocalHooks();

    return this;
  }

  /**
   * The write method is executed by the ChangesObservable module. The module produces all
   * changes events that are distributed further by the observer.
   *
   * @private
   * @param {object} changes The chunk of changes produced by the ChangesObservable module.
   * @returns {ChangesObserver}
   */
  _write(changes: unknown[]) {
    if (changes.length > 0) {
      this.runLocalHooks('change', changes);
    }

    return this;
  }

  /**
   * The write method is executed by the ChangesObservable module. The module produces initial
   * changes that will be used to notify new subscribers.
   *
   * @private
   * @param {object} initialChanges The chunk of changes produced by the ChangesObservable module.
   */
  _writeInitialChanges(initialChanges: unknown[]) {
    this.#currentInitialChanges = initialChanges;
  }
}

mixin(ChangesObserver, localHooks);
