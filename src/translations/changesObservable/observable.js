import ChangesObserver from './observer';
import { arrayDiff } from './diff';

const SUPPORTED_COLLECTION_NAMES = ['hiding'];
const SUPPORTED_CHANGES_TYPES = ['multiple', 'single'];

class ChangesObservable {
  #observers = new Map();
  #observersCount = 0;

  #collectedChanges = new Map();

  constructor() {
    SUPPORTED_COLLECTION_NAMES.forEach((collectionName) => {
      this.#observers.set(collectionName, new Set());
      this.#collectedChanges.set(collectionName, new Set());
    });
  }

  createObserver(collectionName, observerOptions) {
    if (!SUPPORTED_COLLECTION_NAMES.includes(collectionName)) {
      throw new Error(`Unsupported collection name ${collectionName}`);
    }

    const observer = new ChangesObserver(observerOptions);
    const observerCollection = this.#observers.get(collectionName);

    observerCollection.add(observer);
    this.#observersCount += 1;

    observer.addLocalHook('destroy', () => {
      observerCollection.delete(observer);
      this.#observersCount -= 1;
    });

    return observer;
  }

  collect(collectionName, mapName, changes) {
    if (this.#observersCount === 0 ||
        !SUPPORTED_COLLECTION_NAMES.includes(collectionName) ||
        !SUPPORTED_CHANGES_TYPES.includes(changes.changeType)) {
      return;
    }

    const observerCollection = this.#observers.get(collectionName);

    if (observerCollection.size === 0) {
      return;
    }

    this.#collectedChanges.get(collectionName).add({
      mapName,
      changes,
    });
  }

  flush() {
    if (this.#observersCount === 0) {
      return;
    }

    this.#observers.forEach((observers, collectionName) => {
      if (observers.size === 0) {
        return;
      }

      observers.forEach((observer) => {
        const changes = this._generateChanges(collectionName);

        observer.write(changes);
      });

      this._clearCollectedChanges(collectionName);
    });
  }

  _generateChanges(collectionName) {
    const diff = [];

    this.#collectedChanges.get(collectionName).forEach((a) => {
      const { changeType, index, oldValue, newValue } = a;

      if (changeType === 'multiple') {
        diff.push(...arrayDiff(oldValue, newValue));

      } else if (changeType === 'single') {
        diff.push({
          op: 'replace',
          index: oldValue.index,
          oldValue: oldValue.value,
          newValue: newValue.value,
        });
      }
    });

    return diff;
  }

  _clearCollectedChanges(collectionName) {
    this.#collectedChanges.get(collectionName).clear();
  }
}

export default ChangesObservable;
