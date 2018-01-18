import {CellRange} from './../3rdparty/walkontable/src';

class SelectionRange {
  constructor() {
    this.ranges = [];
  }

  isEmpty() {
    return this.ranges.length === 0;
  }

  set(coords) {
    this.clear();
    this.ranges.push(new CellRange(coords));

    return this;
  }

  add(coords) {
    this.ranges.push(new CellRange(coords));

    return this;
  }

  current() {
    return this.ranges[Math.max(this.size() - 1, 0)];
  }

  clear() {
    this.ranges.length = 0;

    return this;
  }

  size() {
    return this.ranges.length;
  }

  [Symbol.iterator]() {
    return this.ranges[Symbol.iterator]();
  }
}

export default SelectionRange;
