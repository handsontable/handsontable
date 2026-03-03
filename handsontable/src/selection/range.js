/**
 * The SelectionRange class is a simple CellRanges collection designed for easy manipulation of the multiple
 * consecutive and non-consecutive selections.
 *
 * @class SelectionRange
 * @util
 */
class SelectionRange {
  /**
   * List of all CellRanges added to the class instance.
   *
   * @type {CellRange[]}
   */
  ranges = [];
  /**
   * @type {function(CellCoords): CellRange}
   */
  createCellRange;

  constructor(createCellRange) {
    this.createCellRange = createCellRange;
  }

  /**
   * Check if selected range is empty.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this.size() === 0;
  }

  /**
   * Set coordinates to the class instance. It clears all previously added coordinates and push `coords`
   * to the collection.
   *
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @returns {SelectionRange}
   */
  set(coords) {
    this.clear();
    this.ranges.push(this.createCellRange(coords));

    return this;
  }

  /**
   * Add coordinates to the class instance. The new coordinates are added to the end of the range collection.
   *
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @returns {SelectionRange}
   */
  add(coords) {
    this.ranges.push(this.createCellRange(coords));

    return this;
  }

  /**
   * Pushes a new CellRange instance to the collection.
   *
   * @param {CellRange} cellRange The CellRange instance with defined visual coordinates.
   * @returns {SelectionRange}
   */
  push(cellRange) {
    this.ranges.push(cellRange);

    return this;
  }

  /**
   * Removes from the stack the last added coordinates.
   *
   * @returns {CellRange}
   */
  pop() {
    return this.ranges.pop();
  }

  /**
   * Get last added coordinates from ranges, it returns a CellRange instance.
   *
   * @returns {CellRange|undefined}
   */
  current() {
    return this.peekByIndex(this.size() - 1);
  }

  /**
   * Get previously added coordinates from ranges, it returns a CellRange instance.
   *
   * @returns {CellRange|undefined}
   */
  previous() {
    return this.peekByIndex(this.size() - 2);
  }

  /**
   * Returns `true` if coords is within any selection coords. This method iterates through
   * all selection layers to check if the coords object is within selection range.
   *
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @param {function(CellRange, number): boolean} [criteria] The function that allows injecting custom criteria.
   * @returns {boolean}
   */
  includes(coords, criteria = () => true) {
    return this.ranges
      .some((cellRange, index) => cellRange.includes(coords) && criteria(cellRange, index));
  }

  /**
   * Find all ranges that are equal to the provided range.
   *
   * @param {CellRange} cellRange The CellRange instance with defined visual coordinates.
   * @returns {Array<{range: CellRange, layer: number}>}
   */
  findAll(cellRange) {
    const result = [];

    this.ranges.forEach((range, layer) => {
      if (range.isEqual(cellRange)) {
        result.push({
          range,
          layer,
        });
      }
    });

    return result;
  }

  /**
   * Removes all ranges that are equal to the provided ranges.
   *
   * @param {CellRange[]} cellRanges The array of CellRange instances with defined visual coordinates.
   * @returns {SelectionRange}
   */
  remove(cellRanges) {
    this.ranges = this.ranges
      .filter(range => !cellRanges.some(cellRange => cellRange.isEqual(range)));

    return this;
  }

  /**
   * Removes the ranges based on the provided index layers (0 no N).
   *
   * @param {number[]} layerIndexes The array of indexes that will be removed from the selection.
   * @returns {SelectionRange}
   */
  removeLayers(layerIndexes) {
    this.ranges = this.ranges.filter((_, index) => !layerIndexes.includes(index));

    return this;
  }

  /**
   * Clear collection.
   *
   * @returns {SelectionRange}
   */
  clear() {
    this.ranges.length = 0;

    return this;
  }

  /**
   * Get count of added all coordinates added to the selection.
   *
   * @returns {number}
   */
  size() {
    return this.ranges.length;
  }

  /**
   * Creates a clone of this class.
   *
   * @returns {SelectionRange}
   */
  clone() {
    const clone = new SelectionRange(this.createCellRange);

    clone.ranges = this.ranges.map(cellRange => cellRange.clone());

    return clone;
  }

  /**
   * Allows applying custom index translations for any range within the class instance.
   *
   * @param {function(CellRange): CellRange} mapFunction The function that allows injecting custom index translation logic.
   * @returns {SelectionRange}
   */
  map(mapFunction) {
    this.ranges = this.ranges.map((cellRange, index) => mapFunction(cellRange, index));

    return this;
  }

  /**
   * Peek the coordinates based on the index where that coordinate resides in the collection.
   *
   * @param {number} [index=0] An index where the coordinate will be retrieved from. The index '0' gets the
   * latest range.
   * @returns {CellRange|undefined}
   */
  peekByIndex(index = 0) {
    let cellRange;

    if (index >= 0 && index < this.size()) {
      cellRange = this.ranges[index];
    }

    return cellRange;
  }

  [Symbol.iterator]() {
    return this.ranges[Symbol.iterator]();
  }
}

export default SelectionRange;
