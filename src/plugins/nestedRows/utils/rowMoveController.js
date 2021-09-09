import { isUndefined } from '../../../helpers/mixed';
import { warn } from '../../../helpers/console';
import { toSingleLine } from '../../../helpers/templateLiteralTag';
import { CellCoords } from '../../../3rdparty/walkontable/src';

/**
 * Helper class for the row-move-related operations.
 *
 * @class RowMoveController
 * @plugin NestedRows
 * @private
 */
export default class RowMoveController {
  constructor(plugin) {
    /**
     * Reference to the Nested Rows plugin instance.
     *
     * @type {NestedRows}
     */
    this.plugin = plugin;
    /**
     * Reference to the Handsontable instance.
     *
     * @type {Handsontable.Core}
     */
    this.hot = plugin.hot;
    /**
     * Reference to the Data Manager class instance.
     *
     * @type {DataManager}
     */
    this.dataManager = plugin.dataManager;
    /**
     * Reference to the Collapsing UI class instance.
     *
     * @type {CollapsingUI}
     */
    this.collapsingUI = plugin.collapsingUI;
  }

  /**
   * `beforeRowMove` hook callback.
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements
   *   will be placed after the moving action. To check the visualization of the final index, please take a look at
   *   [documentation](@/guides/rows/row-moving.md).
   * @param {undefined|number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we
   *   are going to drop the moved elements. To check visualization of drop index please take a look at
   *   [documentation](@/guides/rows/row-moving.md).
   * @param {boolean} movePossible Indicates if it's possible to move rows to the desired position.
   * @fires Hooks#afterRowMove
   * @returns {boolean}
   */
  onBeforeRowMove(rows, finalIndex, dropIndex, movePossible) {
    const improperUsage = this.displayAPICompatibilityWarning({ rows, finalIndex, dropIndex, movePossible });

    if (improperUsage) {
      return false;
    }

    this.movedToCollapsed = false;
    const dropToLastRow = dropIndex === this.hot.countRows();
    const physicalDropIndex = dropToLastRow ?
      this.hot.countSourceRows() :
      this.dataManager.translateTrimmedRow(dropIndex);
    let allowMove = true;
    const physicalStartIndexes = rows.map((rowIndex) => {
      // Don't do the logic for the rest of the rows, as it's bound to fail anyway.
      if (!allowMove) {
        return false;
      }

      const physicalRowIndex = this.dataManager.translateTrimmedRow(rowIndex);

      allowMove = this.shouldAllowMoving(physicalRowIndex, physicalDropIndex);

      return physicalRowIndex;
    });
    const willDataChange = physicalStartIndexes.indexOf(physicalDropIndex) === -1;

    if (!allowMove || !willDataChange) {
      return false;
    }

    const baseParent = this.getBaseParent(physicalStartIndexes);
    const targetParent = this.getTargetParent(dropToLastRow, physicalDropIndex);
    const sameParent = baseParent === targetParent;

    this.movedToCollapsed = this.collapsingUI.areChildrenCollapsed(targetParent);

    // Stash the current state of collapsed rows
    this.collapsingUI.collapsedRowsStash.stash();

    this.shiftCollapsibleParentsLocations(physicalStartIndexes, physicalDropIndex, sameParent);

    this.moveRows(physicalStartIndexes, physicalDropIndex, targetParent);

    this.dataManager.rewriteCache();

    this.moveCellsMeta(physicalStartIndexes, physicalDropIndex);

    this.collapsingUI.collapsedRowsStash.applyStash(false);

    // TODO: Trying to mock real work of the `ManualRowMove` plugin. It was blocked by returning `false` below.
    this.hot.runHooks('afterRowMove',
      rows, finalIndex, dropIndex, movePossible, movePossible && this.isRowOrderChanged(rows, finalIndex));

    // Not necessary - added to keep compatibility with other plugins (namely: columnSummary).
    this.hot.render();

    this.selectCells(rows, dropIndex);

    return false;
  }

  /**
   * Display a `dragRows`/`moveRows` method compatibility warning if needed.
   *
   * @param {object} beforeMoveRowHookArgs A set of arguments from the `beforeMoveRow` hook.
   * @returns {boolean} `true` if is a result of an improper usage of the moving API.
   */
  displayAPICompatibilityWarning(beforeMoveRowHookArgs) {
    const {
      rows,
      finalIndex,
      dropIndex,
      movePossible
    } = beforeMoveRowHookArgs;
    let shouldTerminate = false;

    if (isUndefined(dropIndex)) {
      warn(toSingleLine`Since version 8.0.0 of the Handsontable the 'moveRows' method isn't used for moving rows\x20
      when the NestedRows plugin is enabled. Please use the 'dragRows' method instead.`);

      // TODO: Trying to mock real work of the `ManualRowMove` plugin. It was blocked by returning `false` below.
      this.hot.runHooks('afterRowMove', rows, finalIndex, dropIndex, movePossible, false);

      shouldTerminate = true;
    }

    return shouldTerminate;
  }

  /**
   * Check if the moving action should be allowed.
   *
   * @param {number} physicalRowIndex Physical start row index.
   * @param {number} physicalDropIndex Physical drop index.
   * @returns {boolean} `true` if it should continue with the moving action.
   */
  shouldAllowMoving(physicalRowIndex, physicalDropIndex) {
    /*
       We can't move rows when any of them is:
       - a parent
       - a top-level element
       - is being moved to the top level
       - is being moved to the position of any of the moved rows (not changing position)
    */

    return !(
      this.dataManager.isParent(physicalRowIndex) ||
      this.dataManager.isRowHighestLevel(physicalRowIndex) ||
      physicalRowIndex === physicalDropIndex ||
      physicalDropIndex === 0
    );
  }

  /**
   * Get the base row parent.
   *
   * @param {number} physicalStartIndexes Physical start row index.
   * @returns {object|null} The base row parent.
   */
  getBaseParent(physicalStartIndexes) {
    return this.dataManager.getRowParent(physicalStartIndexes[0]);
  }

  /**
   * Get the target row parent.
   *
   * @param {boolean} dropToLastRow `true` if the row is moved to the last row of the table.
   * @param {number} physicalDropIndex Physical drop row index.
   * @returns {object|null} The target row parent.
   */
  getTargetParent(dropToLastRow, physicalDropIndex) {
    let targetParent = this.dataManager.getRowParent(dropToLastRow ? physicalDropIndex - 1 : physicalDropIndex);

    // If we try to move an element to the place of a top-level parent, snap the element to the previous top-level
    // parent's children instead
    if (targetParent === null || targetParent === void 0) {
      targetParent = this.dataManager.getRowParent(physicalDropIndex - 1);
    }

    return targetParent;
  }

  /**
   * Shift the cached collapsible rows position according to the move action.
   *
   * @param {number[]} physicalStartIndexes Physical start row indexes.
   * @param {number} physicalDropIndex Physical drop index.
   * @param {boolean} sameParent `true` if the row's being moved between siblings of the same parent.
   */
  shiftCollapsibleParentsLocations(physicalStartIndexes, physicalDropIndex, sameParent) {
    if (!sameParent) {
      if (Math.max(...physicalStartIndexes) <= physicalDropIndex) {
        this.collapsingUI.collapsedRowsStash.shiftStash(physicalStartIndexes[0], physicalDropIndex,
          (-1) * physicalStartIndexes.length);

      } else {
        this.collapsingUI.collapsedRowsStash.shiftStash(physicalDropIndex, physicalStartIndexes[0],
          physicalStartIndexes.length);
      }
    }
  }

  /**
   * Move the rows at the provided coordinates.
   *
   * @param {number[]} physicalStartIndexes Physical indexes of the rows about to be moved.
   * @param {number} physicalDropIndex Physical drop index.
   * @param {object} targetParent Parent of the destination row.
   */
  moveRows(physicalStartIndexes, physicalDropIndex, targetParent) {
    const moveToLastChild = physicalDropIndex === this.dataManager.getRowIndex(targetParent) +
      this.dataManager.countChildren(targetParent) + 1;

    this.hot.batchRender(() => {
      physicalStartIndexes.forEach((physicalStartIndex) => {
        this.dataManager.moveRow(physicalStartIndex, physicalDropIndex, this.movedToCollapsed, moveToLastChild);
      });
    });
  }

  /**
   * Move the cell meta for multiple rows.
   *
   * @param {number[]} baseIndexes Array of indexes for the rows being moved.
   * @param {number} targetIndex Index of the destination of the move.
   */
  moveCellsMeta(baseIndexes, targetIndex) {
    const rowsOfMeta = [];
    const movingDown = Math.max(...baseIndexes) < targetIndex;

    baseIndexes.forEach((baseIndex) => {
      rowsOfMeta.push(this.hot.getCellMetaAtRow(baseIndex));
    });

    this.hot.spliceCellsMeta(baseIndexes[0], baseIndexes.length);

    this.hot.spliceCellsMeta(targetIndex - (movingDown ? rowsOfMeta.length : 0), 0, ...rowsOfMeta);
  }

  /**
   * Select cells after the move.
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {undefined|number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we
   *   are going to drop the moved elements. To check visualization of drop index please take a look at
   *   [documentation](@/guides/rows/row-moving.md).
   */
  selectCells(rows, dropIndex) {
    const rowsLen = rows.length;
    let startRow = 0;
    let endRow = 0;
    let selection = null;
    let lastColIndex = null;

    if (this.movedToCollapsed) {
      let physicalDropIndex = null;

      if (rows[rowsLen - 1] < dropIndex) {
        physicalDropIndex = this.dataManager.translateTrimmedRow(dropIndex - rowsLen);

      } else {
        physicalDropIndex = this.dataManager.translateTrimmedRow(dropIndex);
      }

      const parentObject = this.dataManager.getRowParent(
        physicalDropIndex === null ? this.hot.countSourceRows() - 1 : physicalDropIndex - 1
      );
      const parentIndex = this.dataManager.getRowIndex(parentObject);

      startRow = this.dataManager.untranslateTrimmedRow(parentIndex);
      endRow = startRow;

    } else if (rows[rowsLen - 1] < dropIndex) {
      endRow = dropIndex - 1;
      startRow = endRow - rowsLen + 1;

    } else {
      startRow = dropIndex;
      endRow = startRow + rowsLen - 1;
    }

    selection = this.hot.selection;
    lastColIndex = this.hot.countCols() - 1;

    selection.setRangeStart(new CellCoords(startRow, 0));
    selection.setRangeEnd(new CellCoords(endRow, lastColIndex), true);
  }

  // TODO: Reimplementation of function which is inside the `ManualRowMove` plugin.
  /**
   * Indicates if order of rows was changed.
   *
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements
   *   will be placed after the moving action. To check the visualization of the final index, please take a look at
   *   [documentation](@/guides/rows/row-moving.md).
   * @returns {boolean}
   */
  isRowOrderChanged(movedRows, finalIndex) {
    return movedRows.some((row, nrOfMovedElement) => row - nrOfMovedElement !== finalIndex);
  }
}
