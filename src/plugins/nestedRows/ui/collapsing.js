import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { arrayEach } from '../../../helpers/array';
import { rangeEach } from '../../../helpers/number';
import { hasClass } from '../../../helpers/dom/element';
import BaseUI from './_base';
import HeadersUI from './headers';

/**
 * Class responsible for the UI for collapsing and expanding groups.
 *
 * @class
 * @util
 * @extends BaseUI
 */
class CollapsingUI extends BaseUI {
  constructor(nestedRowsPlugin, hotInstance) {
    super(nestedRowsPlugin, hotInstance);

    /**
     * Reference to the Trim Rows plugin.
     */
    this.trimRowsPlugin = nestedRowsPlugin.trimRowsPlugin;
    this.dataManager = this.plugin.dataManager;
    this.collapsedRows = [];
    this.collapsedRowsStash = {
      stash: () => {
        this.lastCollapsedRows = this.collapsedRows.slice(0);

        // Workaround for wrong indexes being set in the trimRows plugin
        this.expandMultipleChildren(this.lastCollapsedRows, false);
      },
      shiftStash: (index, delta = 1) => {
        const elementIndex = this.translateTrimmedRow(index);
        arrayEach(this.lastCollapsedRows, (elem, i) => {
          if (elem > elementIndex - 1) {
            this.lastCollapsedRows[i] = elem + delta;
          }
        });
      },
      applyStash: () => {
        // Workaround for wrong indexes being set in the trimRows plugin
        this.hot.runHooks('skipLengthCache', 100);
        this.collapseMultipleChildren(this.lastCollapsedRows, true);
        this.lastCollapsedRows = void 0;
      },
      trimStash: (realElementIndex, amount) => {
        rangeEach(realElementIndex, realElementIndex + amount - 1, (i) => {
          const indexOfElement = this.lastCollapsedRows.indexOf(i);
          if (indexOfElement > -1) {
            this.lastCollapsedRows.splice(indexOfElement, 1);
          }
        });
      }
    };
  }

  /**
   * Collapse the children of the row passed as an argument.
   *
   * @param {Number|Object} row The parent row.
   * @param {Boolean} [forceRender=true] Whether to render the table after the function ends.
   */
  collapseChildren(row, forceRender = true, doTrimming = true) {
    const rowsToCollapse = [];
    let rowObject = null;
    let rowIndex = null;
    let rowsToTrim = null;

    if (isNaN(row)) {
      rowObject = row;
      rowIndex = this.dataManager.getRowIndex(rowObject);
    } else {
      rowObject = this.dataManager.getDataObject(row);
      rowIndex = row;
    }

    if (this.dataManager.hasChildren(rowObject)) {
      arrayEach(rowObject.__children, (elem) => {
        rowsToCollapse.push(this.dataManager.getRowIndex(elem));
      });
    }

    rowsToTrim = this.collapseRows(rowsToCollapse, true, false);

    if (doTrimming) {
      this.trimRowsPlugin.trimRows(rowsToTrim);
    }

    if (forceRender) {
      this.renderAndAdjust();
    }

    if (this.collapsedRows.indexOf(rowIndex) === -1) {
      this.collapsedRows.push(rowIndex);
    }

    return rowsToTrim;
  }

  /**
   * Collapse multiple children.
   *
   * @param {Array} rows Rows to collapse (including their children)
   * @param {Boolean} [forceRender = true] `true` if the table should be rendered after finishing the function.
   * @param {Boolean} [doTrimming = true] `true` if the table should trim the provided rows.
   */
  collapseMultipleChildren(rows, forceRender = true, doTrimming = true) {
    const rowsToTrim = [];

    arrayEach(rows, (elem) => {
      rowsToTrim.push(...this.collapseChildren(elem, false, false));
    });

    if (doTrimming) {
      this.trimRowsPlugin.trimRows(rowsToTrim);
    }

    if (forceRender) {
      this.renderAndAdjust();
    }
  }

  /**
   * Collapse a single row.
   *
   * @param {Number} rowIndex Index of the row to collapse.
   * @param {Boolean} [recursive = true] `true` if it should collapse the row's children.
   */
  collapseRow(rowIndex, recursive = true) {
    this.collapseRows([rowIndex], recursive);
  }

  /**
   * Collapse multiple rows.
   *
   * @param {Array} rowIndexes Array of row indexes to collapse.
   * @param {Boolean} [recursive = true] `true` if it should collapse the rows' children.
   * @param {Boolean} [doTrimming = false] `true` if the provided rows should be collapsed.
   * @returns {Array} Rows prepared for trimming (or trimmed, if doTrimming == true)
   */
  collapseRows(rowIndexes, recursive = true, doTrimming = false) {
    const rowsToTrim = [];

    arrayEach(rowIndexes, (elem) => {
      rowsToTrim.push(elem);
      if (recursive) {
        this.collapseChildRows(elem, rowsToTrim);
      }
    });

    if (doTrimming) {
      this.trimRowsPlugin.trimRows(rowsToTrim);
    }

    return rowsToTrim;
  }

  /**
   * Collapse child rows of the row at the provided index.
   *
   * @param {Number} parentIndex Index of the parent node.
   * @param {Array} [rowsToTrim = []] Array of rows to trim. Defaults to an empty array.
   * @param {Boolean} [recursive] `true` if the collapsing process should be recursive.
   * @param {Boolean} [doTrimming = false] `true` if rows should be trimmed.
   */
  collapseChildRows(parentIndex, rowsToTrim = [], recursive, doTrimming = false) {
    if (this.dataManager.hasChildren(parentIndex)) {
      const parentObject = this.dataManager.getDataObject(parentIndex);

      arrayEach(parentObject.__children, (elem) => {
        const elemIndex = this.dataManager.getRowIndex(elem);
        rowsToTrim.push(elemIndex);
        this.collapseChildRows(elemIndex, rowsToTrim);
      });
    }

    if (doTrimming) {
      this.trimRowsPlugin.trimRows(rowsToTrim);
    }
  }

  /**
   * Expand a single row.
   *
   * @param {Number} rowIndex Index of the row to expand.
   * @param {Boolean} [recursive = true] `true` if it should expand the row's children recursively.
   */
  expandRow(rowIndex, recursive = true) {
    this.expandRows([rowIndex], recursive);
  }

  /**
   * Expand multiple rows.
   *
   * @param {Array} rowIndexes Array of indexes of the rows to expand.
   * @param {Boolean} [recursive = true] `true` if it should expand the rows' children recursively.
   * @param {Boolean} [doTrimming = false] `true` if rows should be untrimmed.
   * @returns {Array} Array of row indexes to be untrimmed.
   */
  expandRows(rowIndexes, recursive = true, doTrimming = false) {
    const rowsToUntrim = [];

    arrayEach(rowIndexes, (elem) => {
      rowsToUntrim.push(elem);
      if (recursive) {
        this.expandChildRows(elem, rowsToUntrim);
      }
    });

    if (doTrimming) {
      this.trimRowsPlugin.untrimRows(rowsToUntrim);
    }

    return rowsToUntrim;
  }

  /**
   * Expand child rows of the provided index.
   *
   * @param {Number} parentIndex Index of the parent row.
   * @param {Array} [rowsToUntrim = []] Array of the rows to be untrimmed.
   * @param {Boolean} [recursive] `true` if it should expand the rows' children recursively.
   * @param {Boolean} [doTrimming = false] `true` if rows should be untrimmed.
   */
  expandChildRows(parentIndex, rowsToUntrim = [], recursive, doTrimming = false) {
    if (this.dataManager.hasChildren(parentIndex)) {
      const parentObject = this.dataManager.getDataObject(parentIndex);

      arrayEach(parentObject.__children, (elem) => {
        if (!this.isAnyParentCollapsed(elem)) {
          const elemIndex = this.dataManager.getRowIndex(elem);
          rowsToUntrim.push(elemIndex);
          this.expandChildRows(elemIndex, rowsToUntrim);
        }
      });
    }

    if (doTrimming) {
      this.trimRowsPlugin.untrimRows(rowsToUntrim);
    }
  }

  /**
   * Expand the children of the row passed as an argument.
   *
   * @param {Number|Object} row Parent row.
   * @param {Boolean} [forceRender=true] Whether to render the table after the function ends.
   * @param {Boolean} [doTrimming=true] If set to `true`, the trimming will be applied when the function finishes.
   */
  expandChildren(row, forceRender = true, doTrimming = true) {
    const rowsToExpand = [];
    let rowObject = null;
    let rowIndex = null;
    let rowsToUntrim = null;

    if (isNaN(row)) {
      rowObject = row;
      rowIndex = this.dataManager.getRowIndex(row);
    } else {
      rowObject = this.dataManager.getDataObject(row);
      rowIndex = row;
    }

    this.collapsedRows.splice(this.collapsedRows.indexOf(rowIndex), 1);

    if (this.dataManager.hasChildren(rowObject)) {
      arrayEach(rowObject.__children, (elem) => {
        const childIndex = this.dataManager.getRowIndex(elem);

        rowsToExpand.push(childIndex);
      });
    }

    rowsToUntrim = this.expandRows(rowsToExpand, true, false);

    if (doTrimming) {
      this.trimRowsPlugin.untrimRows(rowsToUntrim);
    }

    if (forceRender) {
      this.renderAndAdjust();
    }

    return rowsToUntrim;
  }

  /**
   * Expand multiple rows' children.
   *
   * @param {Array} rows Array of rows which children are about to be expanded.
   * @param {Boolean} [forceRender = true] `true` if the table should render after finishing the function.
   * @param {Boolean} [doTrimming = true] `true` if the rows should be untrimmed after finishing the function.
   */
  expandMultipleChildren(rows, forceRender = true, doTrimming = true) {
    const rowsToUntrim = [];

    arrayEach(rows, (elem) => {
      rowsToUntrim.push(...this.expandChildren(elem, false, false));
    });

    if (doTrimming) {
      this.trimRowsPlugin.untrimRows(rowsToUntrim);
    }

    if (forceRender) {
      this.renderAndAdjust();
    }
  }

  /**
   * Collapse all collapsable rows.
   */
  collapseAll() {
    const sourceData = this.hot.getSourceData();
    const parentsToCollapse = [];

    arrayEach(sourceData, (elem) => {
      if (this.dataManager.hasChildren(elem)) {
        parentsToCollapse.push(elem);
      }
    });

    this.collapseMultipleChildren(parentsToCollapse);

    this.renderAndAdjust();
  }

  /**
   * Expand all collapsable rows.
   */
  expandAll() {
    const sourceData = this.hot.getSourceData();
    const parentsToExpand = [];

    arrayEach(sourceData, (elem) => {
      if (this.dataManager.hasChildren(elem)) {
        parentsToExpand.push(elem);
      }
    });

    this.expandMultipleChildren(parentsToExpand);

    this.renderAndAdjust();
  }

  /**
   * Check if all child rows are collapsed.
   *
   * @param {Number|Object} row The parent row.
   * @private
   */
  areChildrenCollapsed(row) {
    let rowObj = null;
    let allCollapsed = true;

    if (isNaN(row)) {
      rowObj = row;
    } else {
      rowObj = this.dataManager.getDataObject(row);
    }

    if (this.dataManager.hasChildren(rowObj)) {
      arrayEach(rowObj.__children, (elem) => {
        const rowIndex = this.dataManager.getRowIndex(elem);

        if (!this.trimRowsPlugin.isTrimmed(rowIndex)) {
          allCollapsed = false;
          return false;
        }
      });
    }

    return allCollapsed;
  }

  /**
   * Check if any of the row object parents are collapsed.
   *
   * @private
   * @param {Object} rowObj Row object.
   * @returns {Boolean}
   */
  isAnyParentCollapsed(rowObj) {
    let parent = rowObj;

    while (parent !== null) {
      parent = this.dataManager.getRowParent(parent);
      const parentIndex = this.dataManager.getRowIndex(parent);

      if (this.collapsedRows.indexOf(parentIndex) > -1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Toggle collapsed state. Callback for the `beforeOnCellMousedown` hook.
   *
   * @private
   * @param {MouseEvent} event `mousedown` event
   * @param {Object} coords Coordinates of the clicked cell/header.
   */
  toggleState(event, coords) {
    if (coords.col >= 0) {
      return;
    }

    const row = this.translateTrimmedRow(coords.row);

    if (hasClass(event.target, HeadersUI.CSS_CLASSES.button)) {
      if (this.areChildrenCollapsed(row)) {
        this.expandChildren(row);
      } else {
        this.collapseChildren(row);
      }

      stopImmediatePropagation(event);
    }
  }

  /**
   * Translate physical row after trimming to physical base row index.
   *
   * @private
   * @param {Number} row Row index.
   * @returns {Number} Base row index.
   */
  translateTrimmedRow(row) {
    return this.trimRowsPlugin.rowsMapper.getValueByIndex(row);
  }

  /**
   * Helper function to render the table and call the `adjustElementsSize` method.
   *
   * @private
   */
  renderAndAdjust() {
    this.hot.render();

    // Dirty workaround to prevent scroll height not adjusting to the table height. Needs refactoring in the future.
    this.hot.view.wt.wtOverlays.adjustElementsSize();
  }
}

export default CollapsingUI;
