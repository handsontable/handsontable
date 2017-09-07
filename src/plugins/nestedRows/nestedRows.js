import BasePlugin from 'handsontable/plugins/_base';
import {registerPlugin} from 'handsontable/plugins';
import {rangeEach, rangeEachReverse} from 'handsontable/helpers/number';
import {arrayEach} from 'handsontable/helpers/array';
import {CellCoords} from 'handsontable/3rdparty/walkontable/src';
import DataManager from './data/dataManager';
import CollapsingUI from './ui/collapsing';
import HeadersUI from './ui/headers';
import ContextMenuUI from './ui/contextMenu';

import './nestedRows.css';

const privatePool = new WeakMap();

/**
 * @plugin NestedRows
 * @pro
 * @experimental
 *
 * @description
 * Plugin responsible for displaying and operating on data sources with nested structures.
 *
 * @dependencies TrimRows BindRowsWithHeaders
 */
class NestedRows extends BasePlugin {

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Source data object.
     *
     * @type {Object}
     */
    this.sourceData = null;
    /**
     * Reference to the Trim Rows plugin.
     *
     * @type {Object}
     */
    this.trimRowsPlugin = null;
    /**
     * Reference to the BindRowsWithHeaders plugin.
     *
     * @type {Object}
     */
    this.bindRowsWithHeadersPlugin = null;

    /**
     * Reference to the DataManager instance.
     *
     * @type {Object}
     */
    this.dataManager = null;

    /**
     * Reference to the HeadersUI instance.
     *
     * @type {Object}
     */
    this.headersUI = null;

    privatePool.set(this, {
      changeSelection: false,
      movedToFirstChild: false,
      movedToCollapsed: false,
      skipRender: null,
    });
  }

  /**
   * Checks if the plugin is enabled in the settings.
   */
  isEnabled() {
    return !!this.hot.getSettings().nestedRows;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    this.sourceData = this.hot.getSourceData();
    this.trimRowsPlugin = this.hot.getPlugin('trimRows');
    this.manualRowMovePlugin = this.hot.getPlugin('manualRowMove');
    this.bindRowsWithHeadersPlugin = this.hot.getPlugin('bindRowsWithHeaders');

    this.dataManager = new DataManager(this, this.hot, this.sourceData);
    this.collapsingUI = new CollapsingUI(this, this.hot, this.trimRowsPlugin);
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
    this.addHook('afterRowMove', (...args) => this.onAfterRowMove(...args));

    if (!this.trimRowsPlugin.isEnabled()) {
      // Workaround to prevent calling updateSetttings in the enablePlugin method, which causes many problems.
      this.trimRowsPlugin.enablePlugin();
      this.hot.getSettings().trimRows = true;
    }

    super.enablePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Update the plugin.
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
   * @param {Array} rows Array of row indexes to be moved.
   * @param {Number} target Index of the target row.
   */
  onBeforeRowMove(rows, target) {
    const priv = privatePool.get(this);
    const rowsLen = rows.length;
    const translatedStartIndexes = [];

    let translatedTargetIndex = this.dataManager.translateTrimmedRow(target);
    let allowMove = true;
    let i;
    let fromParent = null;
    let toParent = null;
    let sameParent = null;

    for (i = 0; i < rowsLen; i++) {
      translatedStartIndexes.push(this.dataManager.translateTrimmedRow(rows[i]));

      if (this.dataManager.isParent(translatedStartIndexes[i])) {
        allowMove = false;
      }
    }

    if (translatedStartIndexes.indexOf(translatedTargetIndex) > -1 || !allowMove) {
      return false;
    }

    fromParent = this.dataManager.getRowParent(translatedStartIndexes[0]);
    toParent = this.dataManager.getRowParent(translatedTargetIndex);

    if (toParent == null) {
      toParent = this.dataManager.getRowParent(translatedTargetIndex - 1);
    }

    if (toParent == null) {
      toParent = this.dataManager.getDataObject(translatedTargetIndex - 1);
      priv.movedToFirstChild = true;
    }

    if (!toParent) {
      return false;
    }

    sameParent = fromParent === toParent;
    priv.movedToCollapsed = this.collapsingUI.areChildrenCollapsed(toParent);
    this.collapsingUI.collapsedRowsStash.stash();

    if (!sameParent) {
      if (Math.max(...translatedStartIndexes) <= translatedTargetIndex) {
        this.collapsingUI.collapsedRowsStash.shiftStash(translatedStartIndexes[0], (-1) * rows.length);

      } else {
        this.collapsingUI.collapsedRowsStash.shiftStash(translatedTargetIndex, rows.length);
      }
    }

    priv.changeSelection = true;

    if (translatedStartIndexes[rowsLen - 1] <= translatedTargetIndex && sameParent || priv.movedToFirstChild === true) {
      rows.reverse();
      translatedStartIndexes.reverse();

      if (priv.movedToFirstChild !== true) {
        translatedTargetIndex--;
      }
    }

    for (i = 0; i < rowsLen; i++) {
      this.dataManager.moveRow(translatedStartIndexes[i], translatedTargetIndex);
    }

    const movingDown = translatedStartIndexes[translatedStartIndexes.length - 1] < translatedTargetIndex;

    if (movingDown) {
      for (i = rowsLen - 1; i >= 0; i--) {
        this.dataManager.moveCellMeta(translatedStartIndexes[i], translatedTargetIndex);
      }
    } else {
      for (i = 0; i < rowsLen; i++) {
        this.dataManager.moveCellMeta(translatedStartIndexes[i], translatedTargetIndex);
      }
    }

    if ((translatedStartIndexes[rowsLen - 1] <= translatedTargetIndex && sameParent) || this.dataManager.isParent(translatedTargetIndex)) {
      rows.reverse();
    }

    this.dataManager.rewriteCache();

    return false;
  }

  /**
   * `afterRowMove` hook callback.
   *
   * @private
   * @param {Array} rows Array of row indexes to be moved.
   * @param {Number} target Index of the target row.
   */
  onAfterRowMove(rows, target) {
    const priv = privatePool.get(this);

    if (!priv.changeSelection) {
      return;
    }

    const rowsLen = rows.length;
    let startRow = 0;
    let endRow = 0;
    let translatedTargetIndex = null;
    let selection = null;
    let lastColIndex = null;

    this.collapsingUI.collapsedRowsStash.applyStash();

    translatedTargetIndex = this.dataManager.translateTrimmedRow(target);

    if (priv.movedToFirstChild) {
      priv.movedToFirstChild = false;

      startRow = target;
      endRow = target + rowsLen - 1;

      if (target >= Math.max(...rows)) {
        startRow -= rowsLen;
        endRow -= rowsLen;
      }

    } else if (priv.movedToCollapsed) {
      let parentObject = this.dataManager.getRowParent(translatedTargetIndex - 1);
      if (parentObject == null) {
        parentObject = this.dataManager.getDataObject(translatedTargetIndex - 1);
      }
      let parentIndex = this.dataManager.getRowIndex(parentObject);

      startRow = parentIndex;
      endRow = startRow;

    } else if (rows[rowsLen - 1] < target) {
      endRow = target - 1;
      startRow = endRow - rowsLen + 1;

    } else {
      startRow = target;
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
   * @param {Array} logicRows
   * @returns {Boolean}
   */
  onBeforeDataFilter(index, amount, logicRows) {
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
   * @param {Number} index Removed row.
   * @param {Number} amount Amount of removed rows.
   * @param {Array} logicRows
   * @param {String} source Source of action.
   * @private
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
      let translated = this.collapsingUI.translateTrimmedRow(i);
      let currentDataObj = this.dataManager.getDataObject(translated);

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
        childrenCount--;
      }
    });

    return amount + childrenCount;
  }

  /**
   * `beforeAddChild` hook callback.
   *
   * @private
   * @param {Object} parent Parent element.
   * @param {Object} element New child element.
   */
  onBeforeAddChild(parent, element) {
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
   * @param {Object} parent Parent element.
   * @param {Object} element New child element.
   */
  onBeforeDetachChild(parent, element) {
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
   * @param {Number} index
   * @param {Number} amount
   * @param {String} source
   * @private
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
    // Workaround to fix an issue caused by the 'bindRowsWithHeaders' plugin loading before this one.
    if (this.bindRowsWithHeadersPlugin.bindStrategy.strategy) {
      this.bindRowsWithHeadersPlugin.bindStrategy.createMap(this.hot.countSourceRows());
    }

    let deepestLevel = Math.max(...this.dataManager.cache.levels);

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
}

registerPlugin('nestedRows', NestedRows);

export default NestedRows;
