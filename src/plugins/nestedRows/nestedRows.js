import { BasePlugin } from '../base';
import DataManager from './data/dataManager';
import CollapsingUI from './ui/collapsing';
import HeadersUI from './ui/headers';
import ContextMenuUI from './ui/contextMenu';
import { error } from '../../helpers/console';
import { isArrayOfObjects } from '../../helpers/data';
import { TrimmingMap } from '../../translations';
import RowMoveController from './utils/rowMoveController';

import './nestedRows.css';

export const PLUGIN_KEY = 'nestedRows';
export const PLUGIN_PRIORITY = 300;

const privatePool = new WeakMap();

/**
 * Error message for the wrong data type error.
 */
const WRONG_DATA_TYPE_ERROR = 'The Nested Rows plugin requires an Array of Objects as a dataset to be' +
  ' provided. The plugin has been disabled.';

/**
 * @plugin NestedRows
 * @class NestedRows
 *
 * @description
 * Plugin responsible for displaying and operating on data sources with nested structures.
 */
export class NestedRows extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Reference to the DataManager instance.
     *
     * @private
     * @type {object}
     */
    this.dataManager = null;

    /**
     * Reference to the HeadersUI instance.
     *
     * @private
     * @type {object}
     */
    this.headersUI = null;
    /**
     * Map of skipped rows by plugin.
     *
     * @private
     * @type {null|TrimmingMap}
     */
    this.collapsedRowsMap = null;

    privatePool.set(this, {
      movedToCollapsed: false,
      skipRender: null,
      skipCoreAPIModifiers: false
    });
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link NestedRows#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.collapsedRowsMap = this.hot.rowIndexMapper.registerMap('nestedRows', new TrimmingMap());

    this.dataManager = new DataManager(this, this.hot);
    this.collapsingUI = new CollapsingUI(this, this.hot);
    this.headersUI = new HeadersUI(this, this.hot);
    this.contextMenuUI = new ContextMenuUI(this, this.hot);
    this.rowMoveController = new RowMoveController(this);

    this.addHook('afterInit', (...args) => this.onAfterInit(...args));
    this.addHook('beforeViewRender', (...args) => this.onBeforeViewRender(...args));
    this.addHook('modifyRowData', (...args) => this.onModifyRowData(...args));
    this.addHook('modifySourceLength', (...args) => this.onModifySourceLength(...args));
    this.addHook('beforeDataSplice', (...args) => this.onBeforeDataSplice(...args));
    this.addHook('filterData', (...args) => this.onFilterData(...args));
    this.addHook('afterContextMenuDefaultOptions', (...args) => this.onAfterContextMenuDefaultOptions(...args));
    this.addHook('afterGetRowHeader', (...args) => this.onAfterGetRowHeader(...args));
    this.addHook('beforeOnCellMouseDown', (...args) => this.onBeforeOnCellMouseDown(...args));
    this.addHook('beforeRemoveRow', (...args) => this.onBeforeRemoveRow(...args));
    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
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

    // We store a state of the data manager.
    const currentSourceData = this.dataManager.getData();

    this.enablePlugin();

    // After enabling plugin previously stored data is restored.
    this.dataManager.updateWithData(currentSourceData);

    super.updatePlugin();
  }

  /**
   * `beforeRowMove` hook callback.
   *
   * @private
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements
   *   will be placed after the moving action. To check the visualization of the final index, please take a look at
   *   [documentation](@/guides/rows/row-summary.md).
   * @param {undefined|number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we
   *   are going to drop the moved elements. To check visualization of drop index please take a look at
   *   [documentation](@/guides/rows/row-summary.md).
   * @param {boolean} movePossible Indicates if it's possible to move rows to the desired position.
   * @fires Hooks#afterRowMove
   * @returns {boolean}
   */
  onBeforeRowMove(rows, finalIndex, dropIndex, movePossible) {
    return this.rowMoveController.onBeforeRowMove(rows, finalIndex, dropIndex, movePossible);
  }

  /**
   * Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
   * modifications.
   */
  disableCoreAPIModifiers() {
    const priv = privatePool.get(this);

    priv.skipCoreAPIModifiers = true;
  }

  /**
   * Disable the modify hook skipping flag.
   */
  enableCoreAPIModifiers() {
    const priv = privatePool.get(this);

    priv.skipCoreAPIModifiers = false;
  }

  /**
   * `beforeOnCellMousedown` hook callback.
   *
   * @private
   * @param {MouseEvent} event Mousedown event.
   * @param {object} coords Cell coords.
   * @param {HTMLElement} TD Clicked cell.
   */
  onBeforeOnCellMouseDown(event, coords, TD) {
    this.collapsingUI.toggleState(event, coords, TD);
  }

  /**
   * The modifyRowData hook callback.
   *
   * @private
   * @param {number} row Visual row index.
   * @returns {boolean}
   */
  onModifyRowData(row) {
    const priv = privatePool.get(this);

    if (priv.skipCoreAPIModifiers) {
      return;
    }

    return this.dataManager.getDataObject(row);
  }

  /**
   * Modify the source data length to match the length of the nested structure.
   *
   * @private
   * @returns {number}
   */
  onModifySourceLength() {
    const priv = privatePool.get(this);

    if (priv.skipCoreAPIModifiers) {
      return;
    }

    return this.dataManager.countAllRows();
  }

  /**
   * @private
   * @param {number} index The index where the data was spliced.
   * @param {number} amount An amount of items to remove.
   * @param {object} element An element to add.
   * @returns {boolean}
   */
  onBeforeDataSplice(index, amount, element) {
    const priv = privatePool.get(this);

    if (priv.skipCoreAPIModifiers || this.dataManager.isRowHighestLevel(index)) {
      return true;
    }

    this.dataManager.spliceData(index, amount, element);

    return false;
  }

  /**
   * Provide custom source data filtering. It's handled by core method and replaces the native filtering.
   *
   * @private
   * @param {number} index The index where the data filtering starts.
   * @param {number} amount An amount of rows which filtering applies to.
   * @param {number} physicalRows Physical row indexes.
   * @returns {Array}
   */
  onFilterData(index, amount, physicalRows) {
    const priv = privatePool.get(this);

    this.collapsingUI.collapsedRowsStash.stash();
    this.collapsingUI.collapsedRowsStash.trimStash(physicalRows[0], amount);
    this.collapsingUI.collapsedRowsStash.shiftStash(physicalRows[0], null, (-1) * amount);
    this.dataManager.filterData(index, amount, physicalRows);

    priv.skipRender = true;

    return this.dataManager.getData().slice(); // Data contains reference sometimes.
  }

  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @private
   * @param {object} defaultOptions The default context menu items order.
   * @returns {boolean}
   */
  onAfterContextMenuDefaultOptions(defaultOptions) {
    return this.contextMenuUI.appendOptions(defaultOptions);
  }

  /**
   * `afterGetRowHeader` hook callback.
   *
   * @private
   * @param {number} row Row index.
   * @param {HTMLElement} TH Row header element.
   */
  onAfterGetRowHeader(row, TH) {
    this.headersUI.appendLevelIndicators(row, TH);
  }

  /**
   * `modifyRowHeaderWidth` hook callback.
   *
   * @private
   * @param {number} rowHeaderWidth The initial row header width(s).
   * @returns {number}
   */
  onModifyRowHeaderWidth(rowHeaderWidth) {
    return this.headersUI.rowHeaderWidthCache || rowHeaderWidth;
  }

  /**
   * `onAfterRemoveRow` hook callback.
   *
   * @private
   * @param {number} index Removed row.
   * @param {number} amount Amount of removed rows.
   * @param {Array} logicRows An array of the removed physical rows.
   * @param {string} source Source of action.
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
   * Callback for the `beforeRemoveRow` change list of removed physical indexes by reference. Removing parent node
   * has effect in removing children nodes.
   *
   * @private
   * @param {number} index Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @param {Array} physicalRows List of physical indexes.
   */
  onBeforeRemoveRow(index, amount, physicalRows) {
    const modifiedPhysicalRows = Array.from(physicalRows.reduce((removedRows, physicalIndex) => {
      if (this.dataManager.isParent(physicalIndex)) {
        const children = this.dataManager.getDataObject(physicalIndex).__children;

        // Preserve a parent in the list of removed rows.
        removedRows.add(physicalIndex);

        if (Array.isArray(children)) {
          // Add a children to the list of removed rows.
          children.forEach(child => removedRows.add(this.dataManager.getRowIndex(child)));
        }

        return removedRows;
      }

      // Don't modify list of removed rows when already checked element isn't a parent.
      return removedRows.add(physicalIndex);
    }, new Set()));

    // Modifying hook's argument by the reference.
    physicalRows.length = 0;
    physicalRows.push(...modifiedPhysicalRows);
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
   * @param {object} parent Parent element.
   * @param {object} element New child element.
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
   * @param {object} parent Parent element.
   * @param {object} element New child element.
   * @param {number} finalElementRowIndex The final row index of the detached element.
   */
  onAfterDetachChild(parent, element, finalElementRowIndex) {
    this.collapsingUI.collapsedRowsStash.shiftStash(finalElementRowIndex, null, -1);
    this.collapsingUI.collapsedRowsStash.applyStash();

    this.headersUI.updateRowHeaderWidth();
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   */
  onAfterCreateRow() {
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
   * `beforeViewRender` hook callback.
   *
   * @param {boolean} force Indicates if the render call was trigered by a change of settings or data.
   * @param {object} skipRender An object, holder for skipRender functionality.
   * @private
   */
  onBeforeViewRender(force, skipRender) {
    const priv = privatePool.get(this);

    if (priv.skipRender) {
      skipRender.skipRender = true;
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }

  /**
   * `beforeLoadData` hook callback.
   *
   * @param {Array} data The source data.
   * @private
   */
  onBeforeLoadData(data) {
    if (!isArrayOfObjects(data)) {
      error(WRONG_DATA_TYPE_ERROR);

      this.disablePlugin();

      return;
    }

    this.dataManager.setData(data);
    this.dataManager.rewriteCache();
  }
}
