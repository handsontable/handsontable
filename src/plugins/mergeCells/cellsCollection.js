import MergedCellCoords from './cellCoords';
import { CellCoords, CellRange } from '../../3rdparty/walkontable/src/index';
import { rangeEach, rangeEachReverse } from '../../helpers/number';
import { warn } from '../../helpers/console';
import { arrayEach } from '../../helpers/array';
import { applySpanProperties } from './utils';
import { toSingleLine } from '../../helpers/templateLiteralTag';

/**
 * Defines a container object for the merged cells.
 *
 * @class MergedCellsCollection
 * @plugin MergeCells
 */
class MergedCellsCollection {
  constructor(plugin) {
    /**
     * Reference to the Merge Cells plugin.
     *
     * @type {MergeCells}
     */
    this.plugin = plugin;
    /**
     * Array of merged cells.
     *
     * @type {Array}
     */
    this.mergedCells = [];
    /**
     * The Handsontable instance.
     *
     * @type {Handsontable}
     */
    this.hot = plugin.hot;
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
   * Get a merged cell containing the provided range.
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
      const from = new CellCoords(testedRange.from.row, testedRange.from.col);
      const to = new CellCoords(testedRange.to.row, testedRange.to.col);

      testedRange = new CellRange(from, from, to);
    }

    arrayEach(mergedCells, (mergedCell) => {
      const mergedCellTopLeft = new CellCoords(mergedCell.row, mergedCell.col);
      const mergedCellBottomRight = new CellCoords(
        mergedCell.row + mergedCell.rowspan - 1,
        mergedCell.col + mergedCell.colspan - 1
      );
      const mergedCellRange = new CellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);

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
   * @returns {MergedCellCoords|boolean} Returns the new merged cell on success and `false` on failure.
   */
  add(mergedCellInfo) {
    const mergedCells = this.mergedCells;
    const row = mergedCellInfo.row;
    const column = mergedCellInfo.col;
    const rowspan = mergedCellInfo.rowspan;
    const colspan = mergedCellInfo.colspan;
    const newMergedCell = new MergedCellCoords(row, column, rowspan, colspan);
    const alreadyExists = this.get(row, column);
    const isOverlapping = this.isOverlapping(newMergedCell);

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
    const mergedCellRange = new CellRange(
      new CellCoords(0, 0),
      new CellCoords(mergedCell.row, mergedCell.col),
      new CellCoords(mergedCell.row + mergedCell.rowspan - 1, mergedCell.col + mergedCell.colspan - 1));
    let result = false;

    arrayEach(this.mergedCells, (col) => {
      const currentRange = new CellRange(
        new CellCoords(0, 0),
        new CellCoords(col.row, col.col),
        new CellCoords(col.row + col.rowspan - 1, col.col + col.colspan - 1)
      );

      if (currentRange.overlaps(mergedCellRange)) {
        result = true;

        return false;
      }

      return true;
    });

    return result;
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
    return mergeParent && this.hot.rowIndexMapper.getFirstNotHiddenIndex(mergeParent.row, 1) === row &&
        this.hot.columnIndexMapper.getFirstNotHiddenIndex(mergeParent.col, 1) === column;
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
      return new CellCoords(row, column);
    }

    const firstRenderableRow = this.hot.rowIndexMapper.getFirstNotHiddenIndex(mergeParent.row, 1);
    const firstRenderableColumn = this.hot.columnIndexMapper.getFirstNotHiddenIndex(mergeParent.col, 1);

    return new CellCoords(firstRenderableRow, firstRenderableColumn);
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
