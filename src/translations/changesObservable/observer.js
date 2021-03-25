import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

/**
 * The ChangesObserver module is an object that represents a disposable resource
 * provided by the ChangesObservable module.
 *
 * @class ChangesObserver
 */
export class ChangesObserver {
  /**
   * The list of the unique index map names that will be used to filter changes
   * comes to the observer.
   *
   * @type {string[]}
   */
  #mapNamesIgnoreList = [];

  constructor({ mapNamesIgnoreList } = {}) {
    this.#mapNamesIgnoreList = mapNamesIgnoreList ?? [];
  }

  /**
   * Subscribes to the observer.
   *
   * @param {Function} callback A function that will be called when the new changes will appear.
   * @returns {ChangesObserver}
   */
  subscribe(callback) {
    this.addLocalHook('change', callback);

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
   * @param {object} changesChunk The chunk of changes produced by the ChangesObservable module.
   * @returns {ChangesObserver}
   */
  _write(changesChunk) {
    const { changes, callerMapName } = changesChunk;

    if (!this.#mapNamesIgnoreList.includes(callerMapName)) {
      this.runLocalHooks('change', changes);
    }

    return this;
  }
}

mixin(ChangesObserver, localHooks);
