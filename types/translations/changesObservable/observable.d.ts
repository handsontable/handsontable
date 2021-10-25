/**
 * The ChangesObservable module is an object that represents a resource that provides
 * the ability to observe the changes that happened in the index map indexes during
 * the code running.
 *
 * @private
 * @class ChangesObservable
 */
export class ChangesObservable {
    constructor({ initialIndexValue }?: {
        initialIndexValue: any;
    });
    /**
     * Creates and returns a new instance of the ChangesObserver object. The resource
     * allows subscribing to the index changes that during the code running may change.
     * Changes are emitted as an array of the index change. Each change is represented
     * separately as an object with `op`, `index`, `oldValue`, and `newValue` props.
     *
     * For example:
     * ```
     * [
     *   { op: 'replace', index: 1, oldValue: false, newValue: true },
     *   { op: 'replace', index: 3, oldValue: false, newValue: true },
     *   { op: 'insert', index: 4, oldValue: false, newValue: true },
     * ]
     * // or when the new index map changes have less indexes
     * [
     *   { op: 'replace', index: 1, oldValue: false, newValue: true },
     *   { op: 'remove', index: 4, oldValue: false, newValue: true },
     * ]
     * ```
     *
     * @returns {ChangesObserver}
     */
    createObserver(): ChangesObserver;
    /**
     * The method is an entry point for triggering new index map changes. Emitting the
     * changes triggers comparing algorithm which compares last saved state with a new
     * state. When there are some differences, the changes are sent to all subscribers.
     *
     * @param {Array} indexesState An array with index map state.
     */
    emit(indexesState: any[]): void;
    #private;
}
import { ChangesObserver } from "./observer";
