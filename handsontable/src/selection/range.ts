/**
 * The SelectionRange class is a simple CellRanges collection designed for easy manipulation of the multiple
 * consecutive and non-consecutive selections.
 *
 * @class SelectionRange
 * @util
 */
import { CellRange as WalkontableCellRange } from '../3rdparty/walkontable/src/selection/interfaces';
import { CellCoords } from './../core/types';
// Extending the CellRange interface to include the includes method that exists in the implementation
interface CellRange extends WalkontableCellRange {
  includes(coords: CellCoords): boolean;
}

class SelectionRange {
  /**
   * List of all CellRanges added to the class instance.
   *
   * @type {CellRange[]}
   */
  ranges: CellRange[] = [];
  /**
   * @type {function(CellCoords): CellRange}
   */
  createCellRange: (coords: CellCoords) => CellRange;

  constructor(createCellRange: (coords: CellCoords) => CellRange) {
    this.createCellRange = createCellRange;
  }

  /**
   * Check if selected range is empty.
   *
   * @returns {boolean}
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  /**
   * Set coordinates to the class instance. It clears all previously added coordinates and push `coords`
   * to the collection.
   *
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @returns {SelectionRange}
   */
  set(coords: CellCoords): SelectionRange {
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
  add(coords: CellCoords): SelectionRange {
    this.ranges.push(this.createCellRange(coords));

    return this;
  }

  /**
   * Removes from the stack the last added coordinates.
   *
   * @returns {SelectionRange}
   */
  pop(): SelectionRange {
    this.ranges.pop();

    return this;
  }

  /**
   * Get last added coordinates from ranges, it returns a CellRange instance.
   *
   * @returns {CellRange|undefined}
   */
  current(): CellRange | undefined {
    return this.peekByIndex(this.size() - 1);
  }

  /**
   * Get previously added coordinates from ranges, it returns a CellRange instance.
   *
   * @returns {CellRange|undefined}
   */
  previous(): CellRange | undefined {
    return this.peekByIndex(this.size() - 2);
  }

  /**
   * Returns `true` if coords is within selection coords. This method iterates through all selection layers to check if
   * the coords object is within selection range.
   *
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @returns {boolean}
   */
  includes(coords: CellCoords): boolean {
    return this.ranges.some(cellRange => cellRange.includes(coords));
  }

  /**
   * Clear collection.
   *
   * @returns {SelectionRange}
   */
  clear(): SelectionRange {
    this.ranges.length = 0;

    return this;
  }

  /**
   * Get count of added all coordinates added to the selection.
   *
   * @returns {number}
   */
  size(): number {
    return this.ranges.length;
  }

  /**
   * Peek the coordinates based on the index where that coordinate resides in the collection.
   *
   * @param {number} [index=0] An index where the coordinate will be retrieved from. The index '0' gets the
   * latest range.
   * @returns {CellRange|undefined}
   */
  peekByIndex(index: number = 0): CellRange | undefined {
    let cellRange;

    if (index >= 0 && index < this.size()) {
      cellRange = this.ranges[index];
    }

    return cellRange;
  }

  [Symbol.iterator](): IterableIterator<CellRange> {
    return this.ranges[Symbol.iterator]();
  }
}

export default SelectionRange;
