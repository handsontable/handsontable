import { ChangesObserver } from './observer';
import { arrayDiff } from './utils';

/**
 * The ChangesObservable module is an object that represents a resource that provides
 * the ability to observe the changes that happened in the index map indexes during
 * the code running.
 *
 * @class ChangesObservable
 */
export class ChangesObservable {
  /**
   * The list of registered ChangesObserver instances.
   *
   * @type {ChangesObserver[]}
   */
  #observers = new Set();
  /**
   * An array with default values that act as a base array that will be compared with
   * the last saved index state. The changes are generated and immediately send through
   * the newly created ChangesObserver object. Thanks to that, the observer initially has
   * all information about what indexes are currently changed.
   *
   * @type {Array}
   */
  #indexMatrix = [];
  /**
   * An array that holds the indexes state that is currently valid. The value is changed on every
   * index mapper cache update.
   *
   * @type {Array}
   */
  #currentIndexState = [];
  /**
   * The flag determines if the observable is initialized or not. Not initialized object creates
   * index matrix once while emitting new changes.
   *
   * @type {boolean}
   */
  #isMatrixIndexesInitialized = false;
  /**
   * The initial index value allows control from what value the index matrix array will be created.
   * Changing that value changes how the array diff generates the changes for the initial data
   * sent to the subscribers. For example, the changes can be triggered by detecting the changes
   * from `false` to `true` value or vice versa. Generally, it depends on which index map type
   * the Observable will work with. For "hiding" or "trimming" index types, it will be boolean
   * values. For various index maps, it can be anything, but I suspect that the most appropriate
   * initial value will be "undefined" in that case.
   *
   * @type {boolean}
   */
  #initialIndexValue = false;

  constructor({ initialIndexValue } = {}) {
    this.#initialIndexValue = initialIndexValue ?? false;
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
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
  /* eslint-enable jsdoc/require-description-complete-sentence */
  createObserver() {
    const observer = new ChangesObserver();

    this.#observers.add(observer);

    observer.addLocalHook('unsubscribe', () => {
      this.#observers.delete(observer);
    });

    observer._writeInitialChanges(arrayDiff(this.#indexMatrix, this.#currentIndexState));

    return observer;
  }

  /**
   * The method is an entry point for triggering new index map changes. Emitting the
   * changes triggers comparing algorithm which compares last saved state with a new
   * state. When there are some differences, the changes are sent to all subscribers.
   *
   * @param {Array} indexesState An array with index map state.
   */
  emit(indexesState) {
    let currentIndexState = this.#currentIndexState;

    if (!this.#isMatrixIndexesInitialized || this.#indexMatrix.length !== indexesState.length) {
      if (indexesState.length === 0) {
        indexesState = new Array(currentIndexState.length).fill(this.#initialIndexValue);
      } else {
        this.#indexMatrix = new Array(indexesState.length).fill(this.#initialIndexValue);
      }

      if (!this.#isMatrixIndexesInitialized) {
        this.#isMatrixIndexesInitialized = true;
        currentIndexState = this.#indexMatrix;
      }
    }

    const changes = arrayDiff(currentIndexState, indexesState);

    this.#observers.forEach(observer => observer._write(changes));
    this.#currentIndexState = indexesState;
  }
}
