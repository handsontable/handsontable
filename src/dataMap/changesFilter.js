const changesCollection = new WeakMap();

/* eslint-disable import/prefer-default-export */
class Storage {
  constructor() {
    this.collection = new Map();
    this.ready = false;
    this.disableToNextCycle = false;
  }

  nextTick() {
    this.disableToNextCycle = true;
  }

  hasChangedByCoords(row, column) {
    let result;

    if (!this.ready || this.disableToNextCycle) {
      result = true;
    } else if (!this.collection.has(column)) {
      result = false;
    } else {
      result = this.collection.get(column).has(row);
    }

    // console.log('changesFilter: hasChangedByCoords', result);

    return result;
  }

  hasChangedByColumn(column) {
    let result;

    if (!this.ready || this.disableToNextCycle) {
      result = true;
    } else if (!this.collection.has(column)) {
      result = false;
    } else {
      result = this.collection.get(column).has('all');
    }

    // console.log('changesFilter: hasChangedByColumn', result);

    return result;
  }

  markRangeAsChanged(rowStart, colStart, rowEnd, colEnd) {
    if (this.ready) {
      for (let row = rowStart; row < rowEnd; row++) {
        for (let column = colStart; column < colEnd; column++) {
          this.markCoordsAsChanged(row, column);
        }
      }
    }
  }

  markCoordsAsChanged(row, column) {
    if (this.ready) {
      // console.log('changesFilter: markCoordsAsChanged');

      if (this.collection.has(column)) {
        this.collection.get(column).set(row, true);
      } else {
        this.collection.set(column, new Map([[row, true]]));
      }
    }
  }

  markColumnAsChanged(column) {
    if (this.ready) {
      // console.log('changesFilter: markColumnAsChanged');

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
    // console.log('changesFilter: clearChanges');

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
