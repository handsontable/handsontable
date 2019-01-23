const changesCollection = new WeakMap();

function coordsToString(row, column) {
  return `${row}x${column}`;
}

class Storage {
  constructor() {
    this.collection = new Map();
    this.ready = false;
    this.disableToNextCycle = false;
  }

  nextTick() {
    console.log('cyk');
    this.disableToNextCycle = true;
  }

  hasChangedByCoords(row, column) {
    if (!this.ready || this.disableToNextCycle) {
      return true;
    }

    if (!this.collection.has(column)) {
      return false;
    }

    return this.collection.get(column).has(row);
  }

  hasChangedByColumn(column) {
    if (!this.ready || this.disableToNextCycle) {
      return true;
    }

    if (!this.collection.has(column)) {
      return false;
    }

    return this.collection.get(column).has('all');
  }

  markCoordsAsChanged(row, column) {
    if (this.ready) {
      if (this.collection.has(column)) {
        this.collection.get(column).set(row, true);
      } else {
        this.collection.set(column, new Map([[row, true]]));
      }
    }
  }

  markColumnAsChanged(column) {
    if (this.ready) {
      if (this.collection.has(column)) {
        this.collection.get(column).set('all', true);
      } else {
        this.collection.set(column, new Map([['all', true]]));
      }
    }
  }

  clearColumnChanges(column) {
    if (this.ready && this.collection.has(column)) {
      this.collection.get(column).clear();
    }
  }

  clearChanges() {
    this.ready = true;
    this.disableToNextCycle = false;
    this.collection.clear();
  }
}

export function getStorage(hot) {
  let storage;

  if (changesCollection.has(hot)) {
    storage = changesCollection.get(hot);
  } else {
    storage = new Storage();
    changesCollection.set(hot, storage);
  }

  return storage;
}
