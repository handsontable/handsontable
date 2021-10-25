/**
 * The ChangesObserver module is an object that represents a disposable resource
 * provided by the ChangesObservable module.
 *
 * @private
 * @class ChangesObserver
 */
export class ChangesObserver {
    /**
     * Subscribes to the observer.
     *
     * @param {Function} callback A function that will be called when the new changes will appear.
     * @returns {ChangesObserver}
     */
    subscribe(callback: Function): ChangesObserver;
    /**
     * Unsubscribes all subscriptions. After the method call, the observer would not produce
     * any new events.
     *
     * @returns {ChangesObserver}
     */
    unsubscribe(): ChangesObserver;
    /**
     * The write method is executed by the ChangesObservable module. The module produces all
     * changes events that are distributed further by the observer.
     *
     * @private
     * @param {object} changes The chunk of changes produced by the ChangesObservable module.
     * @returns {ChangesObserver}
     */
    private _write;
    /**
     * The write method is executed by the ChangesObservable module. The module produces initial
     * changes that will be used to notify new subscribers.
     *
     * @private
     * @param {object} initialChanges The chunk of changes produced by the ChangesObservable module.
     */
    private _writeInitialChanges;
    #private;
}
