import MergedCellCoords from './cellCoords';
import { rangeEach, rangeEachReverse } from '../../helpers/number';
import { warn } from '../../helpers/console';
import { arrayEach } from '../../helpers/array';
import { applySpanProperties, findMergedCell } from './utils';
import { toSingleLine } from '../../helpers/templateLiteralTag';

/**
 * Defines a container object for the merged cells.
 *
 * @private
 * @class MergedCellsCollection
 */
class MergedCellsCollection {
  /**
   * Reference to the Merge Cells plugin.
   *
   * @type {MergeCells}
   */
  plugin;
  /**
   * Array of merged cells.
   *
   * @type {Array}
   */
  mergedCells = [];
  /**
   * The Handsontable instance.
   *
   * @type {Handsontable}
   */
  hot;

  constructor(mergeCellsPlugin) {
    this.plugin = mergeCellsPlugin;
    this.hot = mergeCellsPlugin.hot;
  }

  /**
   * Get a warning message for when the declared merged cell data overlaps already existing merged cells.
   *
   * @param {object} newMergedCell Object containg information about the merged cells that was about to be added.
   * @returns {string}
   */
  static IS_OVERLAPPING_WARNING(newMergedCell) {
    return toSingleLine`The merged cell declared at [${newMergedCell.row}, ${newMergedCell.col}], overlaps\x20
      with the other declared merged cell. The overlapping merged cell was not added to the table, please\x20
      fix your setup.`;
  }

  /**
   * Get a merged cell from the container, based on the provided arguments. You can provide either the "starting coordinates"
   * of a merged cell, or any coordinates from the body of the merged cell.
   *
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @returns {MergedCellCoords|boolean} Returns a wanted merged cell on success and `false` on failure.
   */
  get(row, column) {
    const mergedCells = this.mergedCells;
    let result = false;

    // const mergedCell = findMergedCell(mergedCells, row, column);

    // if (mergedCell) {
    //   result = mergedCell;
    // }

    arrayEach(mergedCells, (mergedCell) => {
      if (mergedCell.row <= row && mergedCell.row + mergedCell.rowspan - 1 >= row &&
        mergedCell.col <= column && mergedCell.col + mergedCell.colspan - 1 >= column) {
        result = mergedCell;

        return false;
      }

      return true;
    });

    return result;
  }

  /**
   * Get the first-found merged cell containing the provided range.
   *
   * @param {CellRange|object} range The range to search merged cells for.
   * @returns {MergedCellCoords|boolean}
   */
  getByRange(range) {
    const mergedCells = this.mergedCells;
    let result = false;

    arrayEach(mergedCells, (mergedCell) => {
      if (mergedCell.row <= range.from.row && mergedCell.row + mergedCell.rowspan - 1 >= range.to.row &&
        mergedCell.col <= range.from.col && mergedCell.col + mergedCell.colspan - 1 >= range.to.col) {
        result = mergedCell;

        return result;
      }

      return true;
    });

    return result;
  }

  /**
   * Filters merge cells objects provided by users from overlapping cells.
   *
   * @param {{ row: number, col: number, rowspan: number, colspan: number }} mergedCellInfo The merged cell information object.
   * Has to contain `row`, `col`, `colspan` and `rowspan` properties.
   * @returns {{ row: number, col: number, rowspan: number, colspan: number }[]}
   */
  filterOverlappingMergeCells(mergedCellsInfo) {
    const occupiedCells = new Set();

    this.mergedCells.forEach((mergedCell) => {
      let { row, col, colspan, rowspan } = mergedCell;

      for (let r = row; r < row + rowspan; r++) {
        for (let c = col; c < col + colspan; c++) {
          occupiedCells.add(`r${r},c${c}`);
        }
      }
    });

    const filteredMergeCells = mergedCellsInfo.filter((mergedCell) => {
      let { row, col, colspan, rowspan } = mergedCell;
      const localOccupiedCells = new Set();
      let isOverlapping = false;

      for (let r = row; r < row + rowspan; r++) {
        for (let c = col; c < col + colspan; c++) {
          const cellId = `r${r},c${c}`;

          if (occupiedCells.has(cellId)) {
            warn(MergedCellsCollection.IS_OVERLAPPING_WARNING(mergedCell));
            isOverlapping = true;
            break;
          }

          localOccupiedCells.add(cellId);
        }

        if (isOverlapping) {
          break;
        }
      }

      if (!isOverlapping) {
        occupiedCells.add(...localOccupiedCells);
      }

      return !isOverlapping;
    });

    return filteredMergeCells;
  }

  /**
   * Get a merged cell contained in the provided range.
   *
   * @param {CellRange|object} range The range to search merged cells in.
   * @param {boolean} [countPartials=false] If set to `true`, all the merged cells overlapping the range will be taken into calculation.
   * @returns {Array|boolean} Array of found merged cells of `false` if none were found.
   */
  getWithinRange(range, countPartials = false) {
    const mergedCells = this.mergedCells;
    const foundMergedCells = [];
    let testedRange = range;

    if (!testedRange.includesRange) {
      const from = this.hot._createCellCoords(testedRange.from.row, testedRange.from.col);
      const to = this.hot._createCellCoords(testedRange.to.row, testedRange.to.col);

      testedRange = this.hot._createCellRange(from, from, to);
    }

    arrayEach(mergedCells, (mergedCell) => {
      const mergedCellTopLeft = this.hot._createCellCoords(mergedCell.row, mergedCell.col);
      const mergedCellBottomRight = this.hot._createCellCoords(
        mergedCell.row + mergedCell.rowspan - 1,
        mergedCell.col + mergedCell.colspan - 1
      );
      const mergedCellRange = this.hot._createCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);

      if (countPartials) {
        if (testedRange.overlaps(mergedCellRange)) {
          foundMergedCells.push(mergedCell);
        }

      } else if (testedRange.includesRange(mergedCellRange)) {
        foundMergedCells.push(mergedCell);
      }
    });

    return foundMergedCells.length ? foundMergedCells : false;
  }

  /**
   * Add a merged cell to the container.
   *
   * @param {object} mergedCellInfo The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties.
   * @param {boolean} [auto=false] `true` if called internally by the plugin (usually in batch).
   * @returns {MergedCellCoords|boolean} Returns the new merged cell on success and `false` on failure.
   */
  add(mergedCellInfo, auto = false) {
    const mergedCells = this.mergedCells;
    const row = mergedCellInfo.row;
    const column = mergedCellInfo.col;
    const rowspan = mergedCellInfo.rowspan;
    const colspan = mergedCellInfo.colspan;
    const newMergedCell = new MergedCellCoords(row, column, rowspan, colspan,
      this.hot._createCellCoords, this.hot._createCellRange);
    const alreadyExists = this.get(row, column);
    const isOverlapping = auto ? false : this.isOverlapping(newMergedCell);

    if (!alreadyExists && !isOverlapping) {
      if (this.hot) {
        newMergedCell.normalize(this.hot);
      }

      mergedCells.push(newMergedCell);

      return newMergedCell;
    }

    warn(MergedCellsCollection.IS_OVERLAPPING_WARNING(newMergedCell));

    return false;
  }

  /**
   * Remove a merged cell from the container. You can provide either the "starting coordinates"
   * of a merged cell, or any coordinates from the body of the merged cell.
   *
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @returns {MergedCellCoords|boolean} Returns the removed merged cell on success and `false` on failure.
   */
  remove(row, column) {
    const mergedCells = this.mergedCells;
    const wantedCollection = this.get(row, column);
    const wantedCollectionIndex = wantedCollection ? this.mergedCells.indexOf(wantedCollection) : -1;

    if (wantedCollection && wantedCollectionIndex !== -1) {
      mergedCells.splice(wantedCollectionIndex, 1);

      return wantedCollection;
    }

    return false;
  }

  /**
   * Clear all the merged cells.
   */
  clear() {
    const mergedCells = this.mergedCells;
    const mergedCellParentsToClear = [];
    const hiddenCollectionElements = [];

    arrayEach(mergedCells, (mergedCell) => {
      const TD = this.hot.getCell(mergedCell.row, mergedCell.col);

      if (TD) {
        mergedCellParentsToClear.push([TD, this.get(mergedCell.row, mergedCell.col), mergedCell.row, mergedCell.col]);
      }
    });

    this.mergedCells.length = 0;

    arrayEach(mergedCellParentsToClear, (mergedCell, i) => {
      rangeEach(0, mergedCell.rowspan - 1, (j) => {
        rangeEach(0, mergedCell.colspan - 1, (k) => {
          if (k !== 0 || j !== 0) {
            const TD = this.hot.getCell(mergedCell.row + j, mergedCell.col + k);

            if (TD) {
              hiddenCollectionElements.push([TD, null, null, null]);
            }
          }
        });
      });

      mergedCellParentsToClear[i][1] = null;
    });

    arrayEach(mergedCellParentsToClear, (mergedCellParents) => {
      applySpanProperties(...mergedCellParents);
    });

    arrayEach(hiddenCollectionElements, (hiddenCollectionElement) => {
      applySpanProperties(...hiddenCollectionElement);
    });
  }

  /**
   * Check if the provided merged cell overlaps with the others in the container.
   *
   * @param {MergedCellCoords} mergedCell The merged cell to check against all others in the container.
   * @returns {boolean} `true` if the provided merged cell overlaps with the others, `false` otherwise.
   */
  isOverlapping(mergedCell) {
    const mergedCellRange = mergedCell.getRange();

    for (let i = 0; i < this.mergedCells.length; i++) {
      const otherMergedCell = this.mergedCells[i];
      const otherMergedCellRange = otherMergedCell.getRange();

      if (otherMergedCellRange.overlaps(mergedCellRange)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check whether the provided row/col coordinates direct to a first not hidden cell within merge area.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  isFirstRenderableMergedCell(row, column) {
    const mergeParent = this.get(row, column);

    // Return if row and column indexes are within merge area and if they are first rendered indexes within the area.
    return mergeParent && this.hot.rowIndexMapper.getNearestNotHiddenIndex(mergeParent.row, 1) === row &&
        this.hot.columnIndexMapper.getNearestNotHiddenIndex(mergeParent.col, 1) === column;
  }

  /**
   * Get the first renderable coords of the merged cell at the provided coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {CellCoords} A `CellCoords` object with the coordinates to the first renderable cell within the
   *                        merged cell.
   */
  getFirstRenderableCoords(row, column) {
    const mergeParent = this.get(row, column);

    if (!mergeParent || this.isFirstRenderableMergedCell(row, column)) {
      return this.hot._createCellCoords(row, column);
    }

    const firstRenderableRow = this.hot.rowIndexMapper.getNearestNotHiddenIndex(mergeParent.row, 1);
    const firstRenderableColumn = this.hot.columnIndexMapper.getNearestNotHiddenIndex(mergeParent.col, 1);

    return this.hot._createCellCoords(firstRenderableRow, firstRenderableColumn);
  }

  /**
   * Gets the start-most visual column index that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {number} visualColumnIndex The visual column index to start the search from.
   * @returns {number}
   */
  getStartMostColumnIndex(range, visualColumnIndex) {
    const indexes = this.#getNonIntersectingIndexes(range, 'col', -1);
    let startMostIndex = visualColumnIndex;

    for (let i = 0; i < indexes.length; i++) {
      if (indexes[i] <= visualColumnIndex) {
        startMostIndex = indexes[i];
        break;
      }
    }

    return startMostIndex;
  }

  /**
   * Gets the end-most visual column index that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {number} visualColumnIndex The visual column index to start the search from.
   * @returns {number}
   */
  getEndMostColumnIndex(range, visualColumnIndex) {
    const indexes = this.#getNonIntersectingIndexes(range, 'col', 1);
    let endMostIndex = visualColumnIndex;

    for (let i = 0; i < indexes.length; i++) {
      if (indexes[i] >= visualColumnIndex) {
        endMostIndex = indexes[i];
        break;
      }
    }

    return endMostIndex;
  }

  /**
   * Gets the top-most visual row index that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {number} visualRowIndex The visual row index to start the search from.
   * @returns {number}
   */
  getTopMostRowIndex(range, visualRowIndex) {
    const indexes = this.#getNonIntersectingIndexes(range, 'row', -1);
    let topMostIndex = visualRowIndex;

    for (let i = 0; i < indexes.length; i++) {
      if (indexes[i] <= visualRowIndex) {
        topMostIndex = indexes[i];
        break;
      }
    }

    return topMostIndex;
  }

  /**
   * Gets the bottom-most visual row index that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {number} visualRowIndex The visual row index to start the search from.
   * @returns {number}
   */
  getBottomMostRowIndex(range, visualRowIndex) {
    const indexes = this.#getNonIntersectingIndexes(range, 'row', 1);
    let bottomMostIndex = visualRowIndex;

    for (let i = 0; i < indexes.length; i++) {
      if (indexes[i] >= visualRowIndex) {
        bottomMostIndex = indexes[i];
        break;
      }
    }

    return bottomMostIndex;
  }

  /**
   * Gets the list of the indexes that do not intersect with other merged cells within the provided range.
   *
   * @param {CellRange} range The range to search within.
   * @param {'row' | 'col'} axis The axis to search within.
   * @param {number} scanDirection  The direction to scan the range. `1` for forward, `-1` for backward.
   * @returns {number[]}
   */
  #getNonIntersectingIndexes(range, axis, scanDirection = 1) {
    const indexes = new Map();
    const from = scanDirection === 1 ? range.getTopStartCorner() : range.getBottomEndCorner();
    const to = scanDirection === 1 ? range.getBottomEndCorner() : range.getTopStartCorner();

    for (
      let row = from.row;
      scanDirection === 1 ? row <= to.row : row >= to.row;
      row += scanDirection
    ) {
      for (
        let column = from.col;
        scanDirection === 1 ? column <= to.col : column >= to.col;
        column += scanDirection
      ) {
        const index = axis === 'row' ? row : column;
        const mergedCell = this.get(row, column);
        let lastIndex = index;

        if (mergedCell) {
          lastIndex = scanDirection === 1 ? mergedCell[axis] + mergedCell[`${axis}span`] - 1 : mergedCell[axis];
        }

        if (!indexes.has(index)) {
          indexes.set(index, new Set());
        }

        indexes.get(index).add(lastIndex);
      }
    }

    return Array.from(
      new Set(Array.from(indexes.entries())
        .filter(([, set]) => set.size === 1)
        .flatMap(([, set]) => Array.from(set)))
    );
  }

  /**
   * Shift the merged cell in the direction and by an offset defined in the arguments.
   *
   * @param {string} direction `right`, `left`, `up` or `down`.
   * @param {number} index Index where the change, which caused the shifting took place.
   * @param {number} count Number of rows/columns added/removed in the preceding action.
   */
  shiftCollections(direction, index, count) {
    const shiftVector = [0, 0];

    switch (direction) {
      case 'right':
        shiftVector[0] += count;
        break;

      case 'left':
        shiftVector[0] -= count;
        break;

      case 'down':
        shiftVector[1] += count;
        break;

      case 'up':
        shiftVector[1] -= count;
        break;

      default:
    }

    arrayEach(this.mergedCells, (currentMerge) => {
      currentMerge.shift(shiftVector, index);
    });

    rangeEachReverse(this.mergedCells.length - 1, 0, (i) => {
      const currentMerge = this.mergedCells[i];

      if (currentMerge && currentMerge.removed) {
        this.mergedCells.splice(this.mergedCells.indexOf(currentMerge), 1);
      }
    });
  }
}

export default MergedCellsCollection;
