import { IndexChange } from '../types';
import { AnyFunction } from '../../helpers/types';
import LocalHooksMixin from './../../mixins/localHooks';

/**
 * The ChangesObserver module is an object that represents a disposable resource
 * provided by the ChangesObservable module.
 *
 * @class ChangesObserver
 */
export class ChangesObserver extends LocalHooksMixin(Object) {
  /**
   * The field holds initial changes that will be used to notify the callbacks added using
   * subscribe method. Regardless of the moment of listening for changes, the subscriber
   * will be notified once with all changes made before subscribing.
   *
   * @type {Array}
   */
  #currentInitialChanges: IndexChange[] = [];

  /**
   * Subscribes to the observer.
   *
   * @param {Function} callback A function that will be called when the new changes will appear.
   * @returns {ChangesObserver}
   */
  subscribe(callback: (changes: IndexChange[]) => void): ChangesObserver {
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
  unsubscribe(): ChangesObserver {
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
  _write(changes: IndexChange[]): ChangesObserver {
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
  _writeInitialChanges(initialChanges: IndexChange[]): void {
    this.#currentInitialChanges = initialChanges;
  }
}
