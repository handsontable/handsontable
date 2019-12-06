import BasePlugin from '../_base';
import { registerPlugin } from '../../plugins';
import { rangeEach } from '../../helpers/number';
import { arrayEach } from '../../helpers/array';
import { isUndefined } from '../../helpers/mixed';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { CellCoords } from '../../3rdparty/walkontable/src';
import DataManager from './data/dataManager';
import CollapsingUI from './ui/collapsing';
import HeadersUI from './ui/headers';
import ContextMenuUI from './ui/contextMenu';

import './nestedRows.css';
import { SkipMap } from '../../translations';

const privatePool = new WeakMap();

/**
 * @plugin NestedRows
 *
 * @description
 * Plugin responsible for displaying and operating on data sources with nested structures.
 *
 * @dependencies BindRowsWithHeaders
 */
class NestedRows extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Source data object.
     *
     * @private
     * @type {Object}
     */
    this.sourceData = null;
    /**
     * Reference to the BindRowsWithHeaders plugin.
     *
     * @private
     * @type {Object}
     */
    this.bindRowsWithHeadersPlugin = null;

    /**
     * Reference to the DataManager instance.
     *
     * @private
     * @type {Object}
     */
    this.dataManager = null;

    /**
     * Reference to the HeadersUI instance.
     *
     * @private
     * @type {Object}
     */
    this.headersUI = null;
    /**
     * Map of skipped rows by plugin.
     *
     * @private
     * @type {null|SkipMap}
     */
    this.collapsedRowsMap = null;

    privatePool.set(this, {
      changeSelection: false,
      movedToFirstChild: false,
      movedToCollapsed: false,
      skipRender: null,
    });
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link NestedRows#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().nestedRows;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    this.sourceData = this.hot.getSourceData();
    this.bindRowsWithHeadersPlugin = this.hot.getPlugin('bindRowsWithHeaders');
    this.collapsedRowsMap = this.hot.rowIndexMapper.registerMap('nestedRows', new SkipMap());

    this.dataManager = new DataManager(this, this.hot, this.sourceData);
    this.collapsingUI = new CollapsingUI(this, this.hot);
    this.headersUI = new HeadersUI(this, this.hot);
    this.contextMenuUI = new ContextMenuUI(this, this.hot);

    this.dataManager.rewriteCache();

    this.addHook('afterInit', (...args) => this.onAfterInit(...args));
    this.addHook('beforeRender', (...args) => this.onBeforeRender(...args));
    this.addHook('modifyRowData', (...args) => this.onModifyRowData(...args));
    this.addHook('modifySourceLength', (...args) => this.onModifySourceLength(...args));
    this.addHook('beforeDataSplice', (...args) => this.onBeforeDataSplice(...args));
    this.addHook('beforeDataFilter', (...args) => this.onBeforeDataFilter(...args));
    this.addHook('afterContextMenuDefaultOptions', (...args) => this.onAfterContextMenuDefaultOptions(...args));
    this.addHook('afterGetRowHeader', (...args) => this.onAfterGetRowHeader(...args));
    this.addHook('beforeOnCellMouseDown', (...args) => this.onBeforeOnCellMouseDown(...args));
    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('modifyRemovedAmount', (...args) => this.onModifyRemovedAmount(...args));
    this.addHook('beforeAddChild', (...args) => this.onBeforeAddChild(...args));
    this.addHook('afterAddChild', (...args) => this.onAfterAddChild(...args));
    this.addHook('beforeDetachChild', (...args) => this.onBeforeDetachChild(...args));
    this.addHook('afterDetachChild', (...args) => this.onAfterDetachChild(...args));
    this.addHook('modifyRowHeaderWidth', (...args) => this.onModifyRowHeaderWidth(...args));
    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('beforeRowMove', (...args) => this.onBeforeRowMove(...args));
    this.addHook('beforeLoadData', data => this.onBeforeLoadData(data));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper.unregisterMap('nestedRows');

    super.disablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * `beforeRowMove` hook callback.
   *
   * @private
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {Number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](/demo-moving.html#manualRowMove).
   * @param {undefined|Number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements.
   * To check visualization of drop index please take a look at [documentation](/demo-moving.html#manualRowMove).
   * @param {Boolean} movePossible Indicates if it's possible to move rows to the desired position.
   * @fires Hooks#afterRowMove
   */
  onBeforeRowMove(rows, finalIndex, dropIndex, movePossible) {
    if (isUndefined(dropIndex)) {
      warn(toSingleLine`Since version 8.0.0 of the Handsontable the 'moveRows' method isn't used for moving rows when the NestedRows plugin is enabled. 
      Please use the 'dragRows' method instead.`);

      // TODO: Trying to mock real work of the `ManualRowMove` plugin. It was blocked by returning `false` below.
      this.hot.runHooks('afterRowMove', rows, finalIndex, dropIndex, movePossible, false);

      return false;
    }

    const priv = privatePool.get(this);
    const rowsLen = rows.length;
    const translatedStartIndexes = [];

    let translatedDropIndex = this.dataManager.translateTrimmedRow(dropIndex);
    let allowMove = true;
    let i;
    let fromParent = null;
    let toParent = null;
    let sameParent = null;

    // We can't move rows when any of them is a parent
    for (i = 0; i < rowsLen; i++) {
      translatedStartIndexes.push(this.dataManager.translateTrimmedRow(rows[i]));

      if (this.dataManager.isParent(translatedStartIndexes[i])) {
        allowMove = false;
      }
    }

    // We can't move rows when any of them is tried to be moved to the position of moved row
    // TODO: Another work than the `ManualRowMove` plugin.
    if (translatedStartIndexes.indexOf(translatedDropIndex) > -1 || !allowMove) {
      return false;
    }

    fromParent = this.dataManager.getRowParent(translatedStartIndexes[0]);
    toParent = this.dataManager.getRowParent(translatedDropIndex);

    // We move row to the first parent of destination row whether there was a try of moving it on the row being a parent
    if (toParent === null || toParent === void 0) {
      toParent = this.dataManager.getRowParent(translatedDropIndex - 1);
    }

    // We add row to element as child whether there is no parent of final destination row
    if (toParent === null || toParent === void 0) {
      toParent = this.dataManager.getDataObject(translatedDropIndex - 1);
      priv.movedToFirstChild = true;
    }

    // Can't move row whether there was a try of moving it on the row being a parent and it has no rows above.
    if (!toParent) {
      return false;
    }

    sameParent = fromParent === toParent;
    priv.movedToCollapsed = this.collapsingUI.areChildrenCollapsed(toParent);
    this.collapsingUI.collapsedRowsStash.stash();

    if (!sameParent) {
      if (Math.max(...translatedStartIndexes) <= translatedDropIndex) {
        this.collapsingUI.collapsedRowsStash.shiftStash(translatedStartIndexes[0], (-1) * rows.length);

      } else {
        this.collapsingUI.collapsedRowsStash.shiftStash(translatedDropIndex, rows.length);
      }
    }

    priv.changeSelection = true;

    if (translatedStartIndexes[rowsLen - 1] <= translatedDropIndex && sameParent || priv.movedToFirstChild === true) {
      rows.reverse();
      translatedStartIndexes.reverse();

      if (priv.movedToFirstChild !== true) {
        translatedDropIndex -= 1;
      }
    }

    for (i = 0; i < rowsLen; i++) {
      this.dataManager.moveRow(translatedStartIndexes[i], translatedDropIndex);
    }

    const movingDown = translatedStartIndexes[translatedStartIndexes.length - 1] < translatedDropIndex;

    if (movingDown) {
      for (i = rowsLen - 1; i >= 0; i--) {
        this.dataManager.moveCellMeta(translatedStartIndexes[i], translatedDropIndex);
      }
    } else {
      for (i = 0; i < rowsLen; i++) {
        this.dataManager.moveCellMeta(translatedStartIndexes[i], translatedDropIndex);
      }
    }

    if ((translatedStartIndexes[rowsLen - 1] <= translatedDropIndex && sameParent) || this.dataManager.isParent(translatedDropIndex)) {
      rows.reverse();
    }

    this.dataManager.rewriteCache();

    // TODO: Trying to mock real work of the `ManualRowMove` plugin. It was blocked by returning `false` below.
    this.hot.runHooks('afterRowMove', rows, finalIndex, dropIndex, movePossible, movePossible && this.isRowOrderChanged(rows, finalIndex));

    this.selectCells(rows, dropIndex);

    return false;
  }

  // TODO: Reimplementation of function which is inside the `ManualRowMove` plugin.
  /**
   * Indicates if order of rows was changed.
   *
   * @private
   * @param {Array} movedRows Array of visual row indexes to be moved.
   * @param {Number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](/demo-moving.html#manualRowMove).
   * @returns {Boolean}
   */
  isRowOrderChanged(movedRows, finalIndex) {
    return movedRows.some((row, nrOfMovedElement) => row - nrOfMovedElement !== finalIndex);
  }

  /**
   * Select cells after the move.
   *
   * @private
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {undefined|Number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements.
   * To check visualization of drop index please take a look at [documentation](/demo-moving.html#manualRowMove).
   */
  selectCells(rows, dropIndex) {
    const priv = privatePool.get(this);

    if (!priv.changeSelection) {
      return;
    }

    const rowsLen = rows.length;
    let startRow = 0;
    let endRow = 0;
    let translatedDropIndex = null;
    let selection = null;
    let lastColIndex = null;

    this.collapsingUI.collapsedRowsStash.applyStash();

    translatedDropIndex = this.dataManager.translateTrimmedRow(dropIndex);

    if (priv.movedToFirstChild) {
      priv.movedToFirstChild = false;

      startRow = dropIndex;
      endRow = dropIndex + rowsLen - 1;

      if (dropIndex >= Math.max(...rows)) {
        startRow -= rowsLen;
        endRow -= rowsLen;
      }

    } else if (priv.movedToCollapsed) {
      let parentObject = this.dataManager.getRowParent(translatedDropIndex - 1);
      if (parentObject === null || parentObject === void 0) {
        parentObject = this.dataManager.getDataObject(translatedDropIndex - 1);
      }
      const parentIndex = this.dataManager.getRowIndex(parentObject);

      startRow = parentIndex;
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

    priv.changeSelection = false;
  }

  /**
   * `beforeOnCellMousedown` hook callback.
   *
   * @private
   * @param {MouseEvent} event Mousedown event.
   * @param {Object} coords Cell coords.
   * @param {HTMLElement} TD clicked cell.
   */
  onBeforeOnCellMouseDown(event, coords, TD) {
    this.collapsingUI.toggleState(event, coords, TD);
  }

  /**
   * The modifyRowData hook callback.
   *
   * @private
   * @param {Number} row Visual row index.
   */
  onModifyRowData(row) {
    return this.dataManager.getDataObject(row);
  }

  /**
   * Modify the source data length to match the length of the nested structure.
   *
   * @private
   * @returns {Number}
   */
  onModifySourceLength() {
    return this.dataManager.countAllRows();
  }

  /**
   * @private
   * @param {Number} index
   * @param {Number} amount
   * @param {Object} element
   * @returns {Boolean}
   */
  onBeforeDataSplice(index, amount, element) {
    this.dataManager.spliceData(index, amount, element);

    return false;
  }

  /**
   * Called before the source data filtering. Returning `false` stops the native filtering.
   *
   * @private
   * @param {Number} index
   * @param {Number} amount
   * @returns {Boolean}
   */
  onBeforeDataFilter(index, amount) {
    const realLogicRows = [];
    const startIndex = this.dataManager.translateTrimmedRow(index);
    const priv = privatePool.get(this);

    rangeEach(startIndex, startIndex + amount - 1, (i) => {
      realLogicRows.push(i);
    });

    this.collapsingUI.collapsedRowsStash.stash();
    this.collapsingUI.collapsedRowsStash.trimStash(startIndex, amount);
    this.collapsingUI.collapsedRowsStash.shiftStash(startIndex, (-1) * amount);
    this.dataManager.filterData(index, amount, realLogicRows);

    priv.skipRender = true;

    return false;
  }

  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @private
   * @param {Object} defaultOptions
   */
  onAfterContextMenuDefaultOptions(defaultOptions) {
    return this.contextMenuUI.appendOptions(defaultOptions);
  }

  /**
   * `afterGetRowHeader` hook callback.
   *
   * @private
   * @param {Number} row Row index.
   * @param {HTMLElement} TH row header element.
   */
  onAfterGetRowHeader(row, TH) {
    this.headersUI.appendLevelIndicators(row, TH);
  }

  /**
   * `modifyRowHeaderWidth` hook callback.
   *
   * @private
   * @param {Number} rowHeaderWidth The initial row header width(s).
   * @returns {Number}
   */
  onModifyRowHeaderWidth(rowHeaderWidth) {
    return this.headersUI.rowHeaderWidthCache || rowHeaderWidth;
  }

  /**
   * `onAfterRemoveRow` hook callback.
   *
   * @private
   * @param {Number} index Removed row.
   * @param {Number} amount Amount of removed rows.
   * @param {Array} logicRows
   * @param {String} source Source of action.
   */
  onAfterRemoveRow(index, amount, logicRows, source) {
    if (source === this.pluginName) {
      return;
    }

    const priv = privatePool.get(this);

    setTimeout(() => {
      priv.skipRender = null;
      this.headersUI.updateRowHeaderWidth();
      this.collapsingUI.collapsedRowsStash.applyStash();
    }, 0);
  }

  /**
   * `modifyRemovedAmount` hook callback.
   *
   * @private
   * @param {Number} amount Initial amount.
   * @param {Number} index Index of the starting row.
   * @returns {Number} Modified amount.
   */
  onModifyRemovedAmount(amount, index) {
    const lastParents = [];
    let childrenCount = 0;

    rangeEach(index, index + amount - 1, (i) => {
      let isChild = false;
      const translated = this.collapsingUI.translateTrimmedRow(i);
      const currentDataObj = this.dataManager.getDataObject(translated);

      if (this.dataManager.hasChildren(currentDataObj)) {
        lastParents.push(currentDataObj);

        arrayEach(lastParents, (elem) => {
          if (elem.__children.indexOf(currentDataObj) > -1) {
            isChild = true;
            return false;
          }
        });

        if (!isChild) {
          childrenCount += this.dataManager.countChildren(currentDataObj);
        }
      }

      isChild = false;
      arrayEach(lastParents, (elem) => {
        if (elem.__children.indexOf(currentDataObj) > -1) {
          isChild = true;
          return false;
        }
      });

      if (isChild) {
        childrenCount -= 1;
      }
    });

    return amount + childrenCount;
  }

  /**
   * `beforeAddChild` hook callback.
   *
   * @private
   */
  onBeforeAddChild() {
    this.collapsingUI.collapsedRowsStash.stash();
  }

  /**
   * `afterAddChild` hook callback.
   *
   * @private
   * @param {Object} parent Parent element.
   * @param {Object} element New child element.
   */
  onAfterAddChild(parent, element) {
    this.collapsingUI.collapsedRowsStash.shiftStash(this.dataManager.getRowIndex(element));
    this.collapsingUI.collapsedRowsStash.applyStash();

    this.headersUI.updateRowHeaderWidth();
  }

  /**
   * `beforeDetachChild` hook callback.
   *
   * @private
   */
  onBeforeDetachChild() {
    this.collapsingUI.collapsedRowsStash.stash();
  }

  /**
   * `afterDetachChild` hook callback.
   *
   * @private
   * @param {Object} parent Parent element.
   * @param {Object} element New child element.
   */
  onAfterDetachChild(parent, element) {
    this.collapsingUI.collapsedRowsStash.shiftStash(this.dataManager.getRowIndex(element));
    this.collapsingUI.collapsedRowsStash.applyStash();

    this.headersUI.updateRowHeaderWidth();
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {Number} index
   * @param {Number} amount
   * @param {String} source
   */
  onAfterCreateRow(index, amount, source) {
    if (source === this.pluginName) {
      return;
    }
    this.dataManager.rewriteCache();
  }

  /**
   * `afterInit` hook callback.
   *
   * @private
   */
  onAfterInit() {
    const deepestLevel = Math.max(...this.dataManager.cache.levels);

    if (deepestLevel > 0) {
      this.headersUI.updateRowHeaderWidth(deepestLevel);
    }
  }

  /**
   * `beforeRender` hook callback.
   *
   * @param {Boolean} force
   * @param {Object} skipRender
   * @private
   */
  onBeforeRender(force, skipRender) {
    const priv = privatePool.get(this);

    if (priv.skipRender) {
      skipRender.skipRender = true;
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.hot.rowIndexMapper.unregisterMap('nestedRows');

    super.destroy();
  }

  /**
   * `beforeLoadData` hook callback.
   *
   * @param {Array} data
   * @private
   */
  onBeforeLoadData(data) {
    this.dataManager.data = data;
    this.dataManager.rewriteCache();
  }
}

registerPlugin('nestedRows', NestedRows);

export default NestedRows;
