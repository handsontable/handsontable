import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { arrayEach } from '../../../helpers/array';
import { rangeEach } from '../../../helpers/number';
import { hasClass } from '../../../helpers/dom/element';
import BaseUI from './_base';
import HeadersUI from './headers';

/**
 * Class responsible for the UI for collapsing and expanding groups.
 *
 * @private
 * @class
 * @augments BaseUI
 */
class CollapsingUI extends BaseUI {
  constructor(nestedRowsPlugin, hotInstance) {
    super(nestedRowsPlugin, hotInstance);

    /**
     * Reference to the TrimRows plugin.
     */
    this.dataManager = this.plugin.dataManager;
    this.collapsedRows = [];
    this.collapsedRowsStash = {
      stash: (forceRender = false) => {
        this.lastCollapsedRows = this.collapsedRows.slice(0);

        // Workaround for wrong indexes being set in the trimRows plugin
        this.expandMultipleChildren(this.lastCollapsedRows, forceRender);
      },
      shiftStash: (baseIndex, targetIndex, delta = 1) => {
        if (targetIndex === null || targetIndex === undefined) {
          targetIndex = Infinity;
        }

        arrayEach(this.lastCollapsedRows, (elem, i) => {
          if (elem >= baseIndex && elem < targetIndex) {
            this.lastCollapsedRows[i] = elem + delta;
          }
        });
      },
      applyStash: (forceRender = true) => {
        this.collapseMultipleChildren(this.lastCollapsedRows, forceRender);
        this.lastCollapsedRows = undefined;
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
   * @param {number|object} row The parent row.
   * @param {boolean} [forceRender=true] Whether to render the table after the function ends.
   * @param {boolean} [doTrimming=true] I determine whether collapsing should envolve trimming rows.
   * @returns {Array}
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
      this.trimRows(rowsToTrim);
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
   * @param {Array} rows Rows to collapse (including their children).
   * @param {boolean} [forceRender=true] `true` if the table should be rendered after finishing the function.
   * @param {boolean} [doTrimming=true] I determine whether collapsing should envolve trimming rows.
   */
  collapseMultipleChildren(rows, forceRender = true, doTrimming = true) {
    const rowsToTrim = [];

    arrayEach(rows, (elem) => {
      rowsToTrim.push(...this.collapseChildren(elem, false, false));
    });

    if (doTrimming) {
      this.trimRows(rowsToTrim);
    }

    if (forceRender) {
      this.renderAndAdjust();
    }
  }

  /**
   * Collapse a single row.
   *
   * @param {number} rowIndex Index of the row to collapse.
   * @param {boolean} [recursive=true] `true` if it should collapse the row's children.
   */
  collapseRow(rowIndex, recursive = true) {
    this.collapseRows([rowIndex], recursive);
  }

  /**
   * Collapse multiple rows.
   *
   * @param {Array} rowIndexes Array of row indexes to collapse.
   * @param {boolean} [recursive=true] `true` if it should collapse the rows' children.
   * @param {boolean} [doTrimming=true] I determine whether collapsing should envolve trimming rows.
   * @returns {Array} Rows prepared for trimming (or trimmed, if doTrimming == true).
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
      this.trimRows(rowsToTrim);
    }

    return rowsToTrim;
  }

  /**
   * Collapse child rows of the row at the provided index.
   *
   * @param {number} parentIndex Index of the parent node.
   * @param {Array} [rowsToTrim=[]] Array of rows to trim. Defaults to an empty array.
   * @param {boolean} [recursive] `true` if the collapsing process should be recursive.
   * @param {boolean} [doTrimming=true] I determine whether collapsing should envolve trimming rows.
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
      this.trimRows(rowsToTrim);
    }
  }

  /**
   * Expand a single row.
   *
   * @param {number} rowIndex Index of the row to expand.
   * @param {boolean} [recursive=true] `true` if it should expand the row's children recursively.
   */
  expandRow(rowIndex, recursive = true) {
    this.expandRows([rowIndex], recursive);
  }

  /**
   * Expand multiple rows.
   *
   * @param {Array} rowIndexes Array of indexes of the rows to expand.
   * @param {boolean} [recursive=true] `true` if it should expand the rows' children recursively.
   * @param {boolean} [doTrimming=true] I determine whether collapsing should envolve trimming rows.
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
      this.untrimRows(rowsToUntrim);
    }

    return rowsToUntrim;
  }

  /**
   * Expand child rows of the provided index.
   *
   * @param {number} parentIndex Index of the parent row.
   * @param {Array} [rowsToUntrim=[]] Array of the rows to be untrimmed.
   * @param {boolean} [recursive] `true` if it should expand the rows' children recursively.
   * @param {boolean} [doTrimming=false] I determine whether collapsing should envolve trimming rows.
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
      this.untrimRows(rowsToUntrim);
    }
  }

  /**
   * Expand the children of the row passed as an argument.
   *
   * @param {number|object} row Parent row.
   * @param {boolean} [forceRender=true] Whether to render the table after the function ends.
   * @param {boolean} [doTrimming=true] If set to `true`, the trimming will be applied when the function finishes.
   * @returns {number[]}
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
      this.untrimRows(rowsToUntrim);
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
   * @param {boolean} [forceRender=true] `true` if the table should render after finishing the function.
   * @param {boolean} [doTrimming=true] `true` if the rows should be untrimmed after finishing the function.
   */
  expandMultipleChildren(rows, forceRender = true, doTrimming = true) {
    const rowsToUntrim = [];

    arrayEach(rows, (elem) => {
      rowsToUntrim.push(...this.expandChildren(elem, false, false));
    });

    if (doTrimming) {
      this.untrimRows(rowsToUntrim);
    }

    if (forceRender) {
      this.renderAndAdjust();
    }
  }

  /**
   * Collapse all collapsable rows.
   */
  collapseAll() {
    const data = this.dataManager.getData();
    const parentsToCollapse = [];

    arrayEach(data, (elem) => {
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
    const data = this.dataManager.getData();
    const parentsToExpand = [];

    arrayEach(data, (elem) => {
      if (this.dataManager.hasChildren(elem)) {
        parentsToExpand.push(elem);
      }
    });

    this.expandMultipleChildren(parentsToExpand);

    this.renderAndAdjust();
  }

  /**
   * Trim rows.
   *
   * @param {Array} rows Physical row indexes.
   */
  trimRows(rows) {
    this.hot.batchExecution(() => {
      arrayEach(rows, (physicalRow) => {
        this.plugin.collapsedRowsMap.setValueAtIndex(physicalRow, true);
      });
    }, true);
  }

  /**
   * Untrim rows.
   *
   * @param {Array} rows Physical row indexes.
   */
  untrimRows(rows) {
    this.hot.batchExecution(() => {
      arrayEach(rows, (physicalRow) => {
        this.plugin.collapsedRowsMap.setValueAtIndex(physicalRow, false);
      });
    }, true);
  }

  /**
   * Check if all child rows are collapsed.
   *
   * @private
   * @param {number|object|null} row The parent row. `null` for the top level.
   * @returns {boolean}
   */
  areChildrenCollapsed(row) {
    let rowObj = isNaN(row) ? row : this.dataManager.getDataObject(row);
    let allCollapsed = true;

    // Checking the children of the top-level "parent"
    if (rowObj === null) {
      rowObj = {
        __children: this.dataManager.data
      };

    }

    if (this.dataManager.hasChildren(rowObj)) {
      arrayEach(rowObj.__children, (elem) => {
        const rowIndex = this.dataManager.getRowIndex(elem);

        if (!this.plugin.collapsedRowsMap.getValueAtIndex(rowIndex)) {
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
   * @param {object} rowObj Row object.
   * @returns {boolean}
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
   * @param {MouseEvent} event `mousedown` event.
   * @param {object} coords Coordinates of the clicked cell/header.
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
   * Translate visual row after trimming to physical base row index.
   *
   * @private
   * @param {number} row Row index.
   * @returns {number} Base row index.
   */
  translateTrimmedRow(row) {
    return this.hot.toPhysicalRow(row);
  }

  /**
   * Translate physical row after trimming to visual base row index.
   *
   * @private
   * @param {number} row Row index.
   * @returns {number} Base row index.
   */
  untranslateTrimmedRow(row) {
    return this.hot.toVisualRow(row);
  }

  /**
   * Helper function to render the table and call the `adjustElementsSize` method.
   *
   * @private
   */
  renderAndAdjust() {
    this.hot.render();

    // Dirty workaround to prevent scroll height not adjusting to the table height. Needs refactoring in the future.
    this.hot.view.adjustElementsSize();
  }
}

export default CollapsingUI;
