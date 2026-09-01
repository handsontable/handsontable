import type { default as CellCoords } from '../../../3rdparty/walkontable/src/cell/coords';
import type { HotInstance } from '../../../core/types';
import type { NestedRows } from '../nestedRows';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { throwWithCause } from '../../../helpers/errors';
import { arrayEach } from '../../../helpers/array';
import { rangeEach } from '../../../helpers/number';
import { eventTargetEl, hasClass } from '../../../helpers/dom/element';
import BaseUI from './_base';
import HeadersUI from './headers';
import type DataManager from '../data/dataManager';
import type { RowObject } from '../data/dataManager';

const actionDictionary = new Map([
  ['collapse', {
    beforeHook: 'beforeRowCollapse',
    afterHook: 'afterRowCollapse',
  }],
  ['expand', {
    beforeHook: 'beforeRowExpand',
    afterHook: 'afterRowExpand',
  }],
]);

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

  /**
   * Initializes the collapsing UI component and sets up the stash mechanism for preserving collapsed row state across operations.
   */
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
        this.expandMultipleChildren(this.lastCollapsedRows ?? [], forceRender);
      },
      shiftStash: (baseIndex: number, targetIndex: number | null | undefined = undefined, delta = 1) => {
        const targetIdx = targetIndex === null || targetIndex === undefined ? Infinity : targetIndex;

        arrayEach(this.lastCollapsedRows ?? [], (elem: number, i: number) => {
          if (elem >= baseIndex && elem < targetIdx) {
            this.lastCollapsedRows![i] = elem + delta;
          }
        });
      },
      applyStash: (forceRender = true) => {
        this.collapseMultipleChildren(this.lastCollapsedRows ?? [], forceRender);
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
  collapseChildren(row: number, forceRender = true, doTrimming = true): number[] {
    const rowsToCollapse: number[] = [];
    let rowObject: Record<string, unknown> | null | undefined = null;
    let rowIndex: number | null = null;
    let rowsToTrim: number[] | null = null;

    if (isNaN(row)) {
      rowObject = row as unknown as Record<string, unknown>;
      rowIndex = this.dataManager.getRowIndex(rowObject);
    } else {
      rowObject = this.dataManager.getDataObject(row);
      rowIndex = row;
    }

    const hasChildren = !!rowObject && this.dataManager.hasChildren(rowObject);

    if (hasChildren) {
      arrayEach(rowObject!.__children as unknown[], (elem) => {
        const childIndex = this.dataManager.getRowIndex(elem);

        // Skip children the cache does not know about - `getRowIndex` returns `null` for a row
        // object that is no longer part of the current nested structure.
        if (childIndex !== null) {
          rowsToCollapse.push(childIndex);
        }
      });
    }

    rowsToTrim = this.collapseRows(rowsToCollapse, true, false);

    if (doTrimming) {
      this.trimRows(rowsToTrim);
    }

    if (forceRender) {
      this.renderAndAdjust();
    }

    // Only a row that actually has children can be collapsed. Without this check pressing Enter on a
    // leaf row header would record that leaf as a collapsed parent.
    if (hasChildren && rowIndex !== null && this.collapsedRows.indexOf(rowIndex) === -1) {
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
  collapseMultipleChildren(rows: number[] | RowObject[], forceRender = true, doTrimming = true) {
    const rowsToTrim: number[] = [];

    arrayEach(rows as number[], (elem: number) => {
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
  collapseRows(rowIndexes: number[], recursive = true, doTrimming = false): number[] {
    const rowsToTrim: number[] = [];

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
  collapseChildRows(parentIndex: number, rowsToTrim: number[] = [], recursive?: boolean, doTrimming = false) {
    if (this.dataManager.hasChildren(parentIndex)) {
      const parentObject = this.dataManager.getDataObject(parentIndex);

      arrayEach(parentObject!.__children ?? [], (elem: unknown) => {
        const elemIndex = this.dataManager.getRowIndex(elem);

        if (elemIndex !== null) {
          rowsToTrim.push(elemIndex);
          this.collapseChildRows(elemIndex, rowsToTrim);
        }
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
  expandRows(rowIndexes: number[], recursive = true, doTrimming = false): number[] {
    const rowsToUntrim: number[] = [];

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
  expandChildRows(parentIndex: number, rowsToUntrim: number[] = [], recursive?: boolean, doTrimming = false) {
    if (this.dataManager.hasChildren(parentIndex)) {
      const parentObject = this.dataManager.getDataObject(parentIndex);

      arrayEach(parentObject!.__children ?? [], (elem: RowObject) => {
        if (!this.isAnyParentCollapsed(elem)) {
          const elemIndex = this.dataManager.getRowIndex(elem);

          if (elemIndex !== null) {
            rowsToUntrim.push(elemIndex);
            this.expandChildRows(elemIndex, rowsToUntrim);
          }
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
  expandChildren(row: number, forceRender = true, doTrimming = true): number[] {
    const rowsToExpand: number[] = [];
    let rowObject: Record<string, unknown> | null | undefined = null;
    let rowIndex: number | null = null;
    let rowsToUntrim: number[] | null = null;

    if (isNaN(row)) {
      rowObject = row as unknown as Record<string, unknown>;
      rowIndex = this.dataManager.getRowIndex(row);
    } else {
      rowObject = this.dataManager.getDataObject(row);
      rowIndex = row;
    }

    const collapsedIndex = rowIndex === null ? -1 : this.collapsedRows.indexOf(rowIndex);

    // `indexOf` returns -1 for a row that is not collapsed, and `splice(-1, 1)` would drop the last
    // tracked parent instead of doing nothing.
    if (collapsedIndex > -1) {
      this.collapsedRows.splice(collapsedIndex, 1);
    }

    if (rowObject && this.dataManager.hasChildren(rowObject)) {
      arrayEach(rowObject.__children as unknown[], (elem) => {
        const childIndex = this.dataManager.getRowIndex(elem);

        if (childIndex !== null) {
          rowsToExpand.push(childIndex);
        }
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
  expandMultipleChildren(rows: number[] | RowObject[], forceRender = true, doTrimming = true) {
    const rowsToUntrim: number[] = [];

    arrayEach(rows as number[], (elem: number) => {
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
   * Returns the physical indexes of the parent rows that are collapsed right now.
   *
   * The list is sorted ascending so hook payloads are stable and comparable between calls.
   *
   * @returns {number[]} Physical row indexes of collapsed parents.
   */
  getCollapsedParents(): number[] {
    return this.collapsedRows.slice().sort((a, b) => a - b);
  }

  /**
   * Collapses or expands the given parent rows and fires the matching pair of hooks.
   *
   * This is the single choke point for every collapse and expand in the plugin - the row header
   * button, the Enter shortcut, and the public plugin methods all run through it, so all of them
   * produce the same state change and the same hooks.
   *
   * @param {number[]} parents Physical row indexes of the parents to act on.
   * @param {string} action Either `'collapse'` or `'expand'`.
   * @param {boolean} [shouldRunHooks=true] `false` skips both hooks - used when replaying state that the
   * user already chose, such as restoring after an `updateSettings` call.
   * @returns {boolean} `true` if the collapsed state actually changed.
   * @fires Hooks#beforeRowCollapse
   * @fires Hooks#afterRowCollapse
   * @fires Hooks#beforeRowExpand
   * @fires Hooks#afterRowExpand
   */
  toggleCollapsedRows(parents: number[], action: 'collapse' | 'expand', shouldRunHooks = true): boolean {
    return this.applyCollapsedRowsChange(parents, action, shouldRunHooks).performed;
  }

  /**
   * Same as `toggleCollapsedRows`, but it also reports whether a `before*` hook blocked the action.
   *
   * A caller that performs two passes needs that apart from `performed`: `performed` is `false` both
   * when a hook blocked the change and when there was simply nothing to do, and those two cases call
   * for opposite decisions.
   *
   * @param {number[]} parents Physical row indexes of the parents to act on.
   * @param {string} action Either `'collapse'` or `'expand'`.
   * @param {boolean} [shouldRunHooks=true] `false` skips both hooks.
   * @returns {{performed: boolean, vetoed: boolean}} `performed` says the collapsed state changed,
   * `vetoed` says a `before*` hook returned `false`.
   * @fires Hooks#beforeRowCollapse
   * @fires Hooks#afterRowCollapse
   * @fires Hooks#beforeRowExpand
   * @fires Hooks#afterRowExpand
   */
  applyCollapsedRowsChange(
    parents: number[],
    action: 'collapse' | 'expand',
    shouldRunHooks = true
  ): { performed: boolean, vetoed: boolean } {
    const actionTranslator = actionDictionary.get(action);

    if (!actionTranslator) {
      throwWithCause(`Unsupported action is passed (${action}).`);
    }

    if (!Array.isArray(parents)) {
      return { performed: false, vetoed: false };
    }

    const isCollapse = action === 'collapse';
    const currentCollapsedRows = this.getCollapsedParents();
    // The action is possible only when every index points at a row that really has children. An
    // impossible action still reports through the hooks, matching the CollapsibleColumns plugin.
    const actionPossible = parents.length > 0 && parents.every(parent => this.#isCollapsibleParent(parent));
    const destinationCollapsedRows = this.#getDestinationCollapsedRows(currentCollapsedRows, parents, isCollapse);

    if (shouldRunHooks) {
      const isActionAllowed = this.hot.runHooks(
        actionTranslator!.beforeHook,
        currentCollapsedRows,
        destinationCollapsedRows,
        actionPossible,
      );

      if (isActionAllowed === false) {
        return { performed: false, vetoed: true };
      }
    }

    if (actionPossible) {
      if (isCollapse) {
        this.collapseMultipleChildren(parents, false, true);
      } else {
        this.expandMultipleChildren(parents, false, true);
      }
    }

    const isActionPerformed = !this.#isSameCollapsedState(currentCollapsedRows);

    if (isActionPerformed) {
      this.renderAndAdjust();
    }

    if (shouldRunHooks) {
      this.hot.runHooks(
        actionTranslator!.afterHook,
        currentCollapsedRows,
        destinationCollapsedRows,
        actionPossible,
        isActionPerformed,
      );
    }

    return { performed: isActionPerformed, vetoed: false };
  }

  /**
   * Builds the collapsed-parents list the grid will hold once the action finishes.
   *
   * @param {number[]} currentCollapsedRows Physical indexes of the currently collapsed parents.
   * @param {number[]} parents Physical indexes of the parents being collapsed or expanded.
   * @param {boolean} isCollapse `true` for a collapse, `false` for an expand.
   * @returns {number[]} Physical row indexes, sorted ascending.
   */
  #getDestinationCollapsedRows(currentCollapsedRows: number[], parents: number[], isCollapse: boolean): number[] {
    const collapsible = parents.filter(parent => this.#isCollapsibleParent(parent));

    if (isCollapse) {
      const destination = currentCollapsedRows.slice();

      collapsible.forEach((parent) => {
        if (destination.indexOf(parent) === -1) {
          destination.push(parent);
        }
      });

      return destination.sort((a, b) => a - b);
    }

    return currentCollapsedRows.filter(parent => collapsible.indexOf(parent) === -1);
  }

  /**
   * Checks whether the physical row index points at a row that can be collapsed, meaning it exists
   * and has children.
   *
   * @param {number} parent Physical row index.
   * @returns {boolean}
   */
  #isCollapsibleParent(parent: number): boolean {
    if (!Number.isInteger(parent) || parent < 0) {
      return false;
    }

    const rowObject = this.dataManager.getDataObject(parent);

    return !!rowObject && this.dataManager.hasChildren(rowObject);
  }

  /**
   * Compares the collapsed-parents list against a snapshot taken before an action ran.
   *
   * @param {number[]} snapshot Physical row indexes captured before the action.
   * @returns {boolean} `true` when nothing changed.
   */
  #isSameCollapsedState(snapshot: number[]): boolean {
    const current = this.getCollapsedParents();

    return current.length === snapshot.length && current.every((row, index) => row === snapshot[index]);
  }

  /**
   * Collapse all collapsable rows.
   */
  collapseAll() {
    this.toggleCollapsedRows(this.#getTopLevelParents(), 'collapse');
  }

  /**
   * Expand all collapsable rows.
   *
   * Acts on the top-level parents, which leaves a parent that was collapsed inside another one
   * collapsed. Use `NestedRows#expandAll` to expand every level.
   */
  expandAll() {
    this.toggleCollapsedRows(this.#getTopLevelParents(), 'expand');
  }

  /**
   * Physical row indexes of every top-level row that has children.
   *
   * @returns {number[]}
   */
  #getTopLevelParents(): number[] {
    const data = this.dataManager.getData() ?? [];
    const parents: number[] = [];

    arrayEach(data, (elem: RowObject) => {
      if (this.dataManager.hasChildren(elem)) {
        const rowIndex = this.dataManager.getRowIndex(elem);

        if (rowIndex !== null) {
          parents.push(rowIndex);
        }
      }
    });

    return parents;
  }

  /**
   * Collapsed parents ordered from the shallowest to the deepest, so an ancestor is always handled
   * before its own descendants.
   *
   * @returns {number[]} Physical row indexes.
   */
  getCollapsedParentsShallowestFirst(): number[] {
    return this.getCollapsedParents()
      .map(row => ({ row, level: this.dataManager.getRowLevel(row) ?? 0 }))
      .sort((a, b) => a.level - b.level)
      .map(({ row }) => row);
  }

  /**
   * Trim rows.
   *
   * @param {Array} rows Physical row indexes.
   */
  trimRows(rows: number[]) {
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
  untrimRows(rows: number[]) {
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
    let rowObj: Record<string, unknown> | null | undefined = isNaN(row)
      ? row as unknown as Record<string, unknown>
      : this.dataManager.getDataObject(row);
    let allCollapsed = true;

    // Checking the children of the top-level "parent"
    if (rowObj === null || rowObj === undefined) {
      rowObj = {
        __children: this.dataManager.data
      };

    }

    if (rowObj && this.dataManager.hasChildren(rowObj)) {
      arrayEach(rowObj.__children as unknown[], (elem) => {
        const rowIndex = this.dataManager.getRowIndex(elem);

        if (rowIndex === null || !this.plugin.collapsedRowsMap!.getValueAtIndex(rowIndex)) {
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

      if (parentIndex !== null && this.collapsedRows.indexOf(parentIndex) > -1) {
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
      this.toggleCollapsedRows([row], this.areChildrenCollapsed(row) ? 'expand' : 'collapse');

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
