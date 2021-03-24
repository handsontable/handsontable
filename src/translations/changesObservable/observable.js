import ChangesObserver from './observer';
import { arrayDiff } from './diff';

const SUPPORTED_INDEX_MAP_TYPES = ['hiding'];
const SUPPORTED_CHANGES_TYPES = ['multiple', 'single'];

class ChangesObservable {
  #observers = new Map();
  #globalObserversCount = 0;
  #collectedChanges = new Map();

  constructor() {
    SUPPORTED_INDEX_MAP_TYPES.forEach((indexMapType) => {
      this.#observers.set(indexMapType, new Set());
      this.#collectedChanges.set(indexMapType, new Set());
    });
  }

  createObserver(indexMapType, observerOptions) {
    if (!SUPPORTED_INDEX_MAP_TYPES.includes(indexMapType)) {
      throw new Error(`Unsupported index map type "${indexMapType}"`);
    }

    const observer = new ChangesObserver(observerOptions);
    const observers = this.#observers.get(indexMapType);

    observers.add(observer);
    this.#globalObserversCount += 1;

    observer.addLocalHook('unsubscribe', () => {
      observers.delete(observer);
      this.#globalObserversCount -= 1;
    });

    return observer;
  }

  collect(indexMapType, mapName, changes) {
    if (this.#globalObserversCount === 0 || !SUPPORTED_CHANGES_TYPES.includes(changes.changeType)) {
      return;
    }

    if (!SUPPORTED_INDEX_MAP_TYPES.includes(indexMapType)) {
      throw new Error(`Unsupported index map type "${indexMapType}"`);
    }

    const observers = this.#observers.get(indexMapType);

    if (observers.size === 0) {
      return;
    }

    this.#collectedChanges.get(indexMapType).add({
      mapName,
      changes,
    });
  }

  flush() {
    if (this.#globalObserversCount === 0) {
      return;
    }

    const cachedChanges = new Map();

    this.#observers.forEach((observers, indexMapType) => {
      if (observers.size === 0) {
        return;
      }

      const rawChanges = this.#collectedChanges.get(indexMapType);

      if (rawChanges.size === 0) {
        return;
      }

      let changesChunk = {};

      if (cachedChanges.has(indexMapType)) {
        changesChunk = cachedChanges.get(indexMapType);
      } else {
        changesChunk = this._generateChangesChunk(rawChanges);
        cachedChanges.set(indexMapType, changesChunk);
      }

      observers.forEach((observer) => {
        observer.write(changesChunk);
      });

      this.#collectedChanges.get(indexMapType).clear();
    });

    cachedChanges.clear();
  }

  _generateChangesChunk(rawChanges) {
    const changesChunk = {
      changes: [],
      callerMapName: null,
    };

    rawChanges.forEach(({ changes: changesEntry, mapName }) => {
      const { changeType, oldValue, newValue } = changesEntry;

      changesChunk.callerMapName = mapName;

      if (changeType === 'multiple') {
        changesChunk.changes.push(...arrayDiff(oldValue, newValue));

      } else if (changeType === 'single') {
        changesChunk.changes.push({
          op: 'replace',
          index: oldValue.index,
          oldValue: oldValue.value,
          newValue: newValue.value,
        });
      }
    });

    return changesChunk;
  }
}

export default ChangesObservable;
