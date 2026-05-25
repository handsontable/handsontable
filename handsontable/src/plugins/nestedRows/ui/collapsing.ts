import type { default as CellCoords } from '../../../3rdparty/walkontable/src/cell/coords';
import type { HotInstance } from '../../../core/types';
import type { NestedRows } from '../nestedRows';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { arrayEach } from '../../../helpers/array';
import { rangeEach } from '../../../helpers/number';
import { eventTargetEl, hasClass } from '../../../helpers/dom/element';
import BaseUI from './_base';
import HeadersUI from './headers';
import type DataManager from '../data/dataManager';
import type { RowObject } from '../data/dataManager';

/**
 * Class responsible for the UI for collapsing and expanding groups.
 *
 * @private
 * @class
 * @augments BaseUI
 */
class CollapsingUI extends BaseUI {
  /**
   * Reference to the DataManager instance.
   *
   * @type {object}
   */
  declare dataManager: DataManager;
  /**
   * Array of currently collapsed rows.
   *
   * @type {Array}
   */
  declare collapsedRows: number[];
  /**
   * Object for stashing and restoring collapsed rows state.
   *
   * @type {object}
   */
  collapsedRowsStash: {
    stash: (forceRender?: boolean) => void;
    shiftStash: (baseIndex: number, targetIndex?: number | null, delta?: number) => void;
    applyStash: (forceRender?: boolean) => void;
    trimStash: (realElementIndex: number, amount: number) => void;
  };
  /**
   * Stashed copy of collapsed rows from the last stash operation.
   *
   * @type {Array|undefined}
   */
  declare lastCollapsedRows: number[] | undefined;

  constructor(nestedRowsPlugin: NestedRows, hotInstance: HotInstance) {
    super(nestedRowsPlugin, hotInstance);

    /**
     * Reference to the TrimRows plugin.
     */
    this.dataManager = this.plugin.dataManager!;
    this.collapsedRows = [];
    this.collapsedRowsStash = {
      stash: (forceRender = false) => {
        this.lastCollapsedRows = this.collapsedRows.slice(0);

        // Workaround for wrong indexes being set in the trimRows plugin
        this.expandMultipleChildren(this.lastCollapsedRows, forceRender);
      },
      shiftStash: (baseIndex: number, targetIndex: number | null | undefined = undefined, delta = 1) => {
        const targetIdx = targetIndex === null || targetIndex === undefined ? Infinity : targetIndex;

        arrayEach(this.lastCollapsedRows, (elem: number, i: number) => {
          if (elem >= baseIndex && elem < targetIdx) {
            this.lastCollapsedRows![i] = elem + delta;
          }
        });
      },
      applyStash: (forceRender = true) => {
        this.collapseMultipleChildren(this.lastCollapsedRows, forceRender);
        this.lastCollapsedRows = undefined;
      },
      trimStash: (realElementIndex: number, amount: number) => {
        rangeEach(realElementIndex, realElementIndex + amount - 1, (i: number) => {
          const indexOfElement = this.lastCollapsedRows!.indexOf(i);

          if (indexOfElement > -1) {
            this.lastCollapsedRows!.splice(indexOfElement, 1);
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
  collapseChildren(row: number, forceRender = true, doTrimming = true): unknown[] {
    const rowsToCollapse: number[] = [];
    let rowObject: Record<string, unknown> | null = null;
    let rowIndex: number | null = null;
    let rowsToTrim: unknown[] | null = null;

    if (isNaN(row)) {
      rowObject = row as unknown as Record<string, unknown>;
      rowIndex = this.dataManager.getRowIndex(rowObject);
    } else {
      rowObject = this.dataManager.getDataObject(row);
      rowIndex = row;
    }

    if (this.dataManager.hasChildren(rowObject)) {
      arrayEach(rowObject.__children as unknown[], (elem) => {
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

    if (this.collapsedRows.indexOf(rowIndex!) === -1) {
      this.collapsedRows.push(rowIndex!);
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
  collapseMultipleChildren(rows: unknown[], forceRender = true, doTrimming = true) {
    const rowsToTrim: unknown[] = [];

    arrayEach(rows, (elem: number) => {
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
  collapseRow(rowIndex: number, recursive = true) {
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
  collapseRows(rowIndexes: unknown[], recursive = true, doTrimming = false): unknown[] {
    const rowsToTrim: unknown[] = [];

    arrayEach(rowIndexes, (elem: number) => {
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
  collapseChildRows(parentIndex: number, rowsToTrim: unknown[] = [], recursive?: boolean, doTrimming = false) {
    if (this.dataManager.hasChildren(parentIndex)) {
      const parentObject = this.dataManager.getDataObject(parentIndex);

      arrayEach(parentObject.__children, (elem: unknown) => {
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
  expandRow(rowIndex: number, recursive = true) {
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
  expandRows(rowIndexes: unknown[], recursive = true, doTrimming = false): unknown[] {
    const rowsToUntrim: unknown[] = [];

    arrayEach(rowIndexes, (elem: number) => {
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
  expandChildRows(parentIndex: number, rowsToUntrim: unknown[] = [], recursive?: boolean, doTrimming = false) {
    if (this.dataManager.hasChildren(parentIndex)) {
      const parentObject = this.dataManager.getDataObject(parentIndex);

      arrayEach(parentObject.__children, (elem: RowObject) => {
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
  expandChildren(row: number, forceRender = true, doTrimming = true): unknown[] {
    const rowsToExpand: number[] = [];
    let rowObject: Record<string, unknown> | null = null;
    let rowIndex: number | null = null;
    let rowsToUntrim: unknown[] | null = null;

    if (isNaN(row)) {
      rowObject = row as unknown as Record<string, unknown>;
      rowIndex = this.dataManager.getRowIndex(row);
    } else {
      rowObject = this.dataManager.getDataObject(row);
      rowIndex = row;
    }

    this.collapsedRows.splice(this.collapsedRows.indexOf(rowIndex!), 1);

    if (this.dataManager.hasChildren(rowObject)) {
      arrayEach(rowObject.__children as unknown[], (elem) => {
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
  expandMultipleChildren(rows: unknown[], forceRender = true, doTrimming = true) {
    const rowsToUntrim: unknown[] = [];

    arrayEach(rows, (elem: number) => {
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
    const data = this.dataManager.getData()!;
    const parentsToCollapse: RowObject[] = [];

    arrayEach(data, (elem: RowObject) => {
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
    const data = this.dataManager.getData()!;
    const parentsToExpand: RowObject[] = [];

    arrayEach(data, (elem: RowObject) => {
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
  trimRows(rows: unknown[]) {
    this.hot.batchExecution(() => {
      arrayEach(rows, (physicalRow: number) => {
        this.plugin.collapsedRowsMap!.setValueAtIndex(physicalRow, true);
      });
    }, true);
  }

  /**
   * Untrim rows.
   *
   * @param {Array} rows Physical row indexes.
   */
  untrimRows(rows: unknown[]) {
    this.hot.batchExecution(() => {
      arrayEach(rows, (physicalRow: number) => {
        this.plugin.collapsedRowsMap!.setValueAtIndex(physicalRow, false);
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
  areChildrenCollapsed(row: number): boolean {
    let rowObj: Record<string, unknown> = isNaN(row)
      ? row as unknown as Record<string, unknown>
      : this.dataManager.getDataObject(row);
    let allCollapsed = true;

    // Checking the children of the top-level "parent"
    if (rowObj === null) {
      rowObj = {
        __children: this.dataManager.data
      };

    }

    if (this.dataManager.hasChildren(rowObj)) {
      arrayEach(rowObj.__children as unknown[], (elem) => {
        const rowIndex = this.dataManager.getRowIndex(elem);

        if (!this.plugin.collapsedRowsMap!.getValueAtIndex(rowIndex)) {
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
  isAnyParentCollapsed(rowObj: RowObject | null): boolean {
    let parent: RowObject | null = rowObj;

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
  toggleState(event: Event, coords: CellCoords, _TD?: HTMLTableCellElement) {
    if ((coords as { col: number }).col >= 0) {
      return;
    }

    const row = this.translateTrimmedRow((coords as { row: number }).row);

    if (hasClass(eventTargetEl(event)!, HeadersUI.CSS_CLASSES.button)) {
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
  translateTrimmedRow(row: number): number {
    return this.hot.toPhysicalRow(row);
  }

  /**
   * Translate physical row after trimming to visual base row index.
   *
   * @private
   * @param {number} row Row index.
   * @returns {number} Base row index.
   */
  untranslateTrimmedRow(row: number): number {
    return this.hot.toVisualRow(row);
  }

  /**
   * Helper function to render the table and call the `adjustElementsSize` method.
   *
   * @private
   */
  renderAndAdjust() {
    // Dirty workaround to prevent scroll height not adjusting to the table height. Needs refactoring in the future.
    this.hot.view.adjustElementsSize();
    this.hot.render();
  }
}

export default CollapsingUI;
