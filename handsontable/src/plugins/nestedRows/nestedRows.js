import { BasePlugin } from '../base';
import DataManager from './data/dataManager';
import CollapsingUI from './ui/collapsing';
import HeadersUI from './ui/headers';
import ContextMenuUI from './ui/contextMenu';
import { error } from '../../helpers/console';
import { isArrayOfObjects } from '../../helpers/data';
import { TrimmingMap } from '../../translations';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcutContexts';
import RowMoveController from './utils/rowMoveController';

export const PLUGIN_KEY = 'nestedRows';
export const PLUGIN_PRIORITY = 300;
const SHORTCUTS_GROUP = PLUGIN_KEY;

/* eslint-disable jsdoc/require-description-complete-sentence */
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

  /**
   * Reference to the DataManager instance.
   *
   * @private
   * @type {object}
   */
  dataManager = null;
  /**
   * Reference to the HeadersUI instance.
   *
   * @private
   * @type {object}
   */
  headersUI = null;
  /**
   * Map of skipped rows by plugin.
   *
   * @private
   * @type {null|TrimmingMap}
   */
  collapsedRowsMap = null;
  /**
   * Allows skipping the render cycle if set as `true`.
   *
   * @type {boolean}
   */
  #skipRender = false;
  /**
   * Allows skipping the internal Core methods call if set as `true`.
   *
   * @type {boolean}
   */
  #skipCoreAPIModifiers = false;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link NestedRows#enablePlugin} method is called.
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

    this.addHook('afterInit', (...args) => this.#onAfterInit(...args));
    this.addHook('beforeViewRender', (...args) => this.#onBeforeViewRender(...args));
    this.addHook('modifyRowData', (...args) => this.onModifyRowData(...args));
    this.addHook('modifySourceLength', (...args) => this.onModifySourceLength(...args));
    this.addHook('beforeDataSplice', (...args) => this.onBeforeDataSplice(...args));
    this.addHook('filterData', (...args) => this.#onFilterData(...args));
    this.addHook('afterContextMenuDefaultOptions', (...args) => this.#onAfterContextMenuDefaultOptions(...args));
    this.addHook('afterGetRowHeader', (...args) => this.#onAfterGetRowHeader(...args));
    this.addHook('beforeOnCellMouseDown', (...args) => this.#onBeforeOnCellMouseDown(...args));
    this.addHook('beforeRemoveRow', (...args) => this.#onBeforeRemoveRow(...args));
    this.addHook('afterRemoveRow', (...args) => this.#onAfterRemoveRow(...args));
    this.addHook('beforeAddChild', (...args) => this.#onBeforeAddChild(...args));
    this.addHook('afterAddChild', (...args) => this.#onAfterAddChild(...args));
    this.addHook('beforeDetachChild', (...args) => this.#onBeforeDetachChild(...args));
    this.addHook('afterDetachChild', (...args) => this.#onAfterDetachChild(...args));
    this.addHook('modifyRowHeaderWidth', (...args) => this.#onModifyRowHeaderWidth(...args));
    this.addHook('afterCreateRow', (...args) => this.#onAfterCreateRow(...args));
    this.addHook('beforeRowMove', (...args) => this.#onBeforeRowMove(...args));
    this.addHook('beforeLoadData', data => this.#onBeforeLoadData(data));
    this.addHook('beforeUpdateData', data => this.#onBeforeLoadData(data));

    this.registerShortcuts();
    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper.unregisterMap('nestedRows');

    this.unregisterShortcuts();
    super.disablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`nestedRows`](@/api/options.md#nestedrows)
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
   * Register shortcuts responsible for toggling collapsible columns.
   *
   * @private
   */
  registerShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      .addShortcut({
        keys: [['Enter']],
        callback: () => {
          const { highlight } = this.hot.getSelectedRangeLast();
          const row = this.collapsingUI.translateTrimmedRow(highlight.row);

          if (this.collapsingUI.areChildrenCollapsed(row)) {
            this.collapsingUI.expandChildren(row);
          } else {
            this.collapsingUI.collapseChildren(row);
          }

          // prevent default Enter behavior (move to the next row within a selection range)
          return false;
        },
        runOnlyIf: () => {
          const highlight = this.hot.getSelectedRangeLast()?.highlight;

          return highlight && this.hot.getSelectedRangeLast()?.isSingle() &&
            this.hot.selection.isCellVisible(highlight) && highlight.col === -1 && highlight.row >= 0;
        },
        group: SHORTCUTS_GROUP,
        relativeToGroup: SHORTCUTS_GROUP_EDITOR,
        position: 'before',
      });
  }

  /**
   * Unregister shortcuts responsible for toggling collapsible columns.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      .removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * `beforeRowMove` hook callback.
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements
   *   will be placed after the moving action. To check the visualization of the final index, please take a look at
   *   [documentation](@/guides/rows/row-summary/row-summary.md).
   * @param {undefined|number} dropIndex Visual row index, being a drop index for the moved rows. Points to where we
   *   are going to drop the moved elements. To check visualization of drop index please take a look at
   *   [documentation](@/guides/rows/row-summary/row-summary.md).
   * @param {boolean} movePossible Indicates if it's possible to move rows to the desired position.
   * @fires Hooks#afterRowMove
   * @returns {boolean}
   */
  #onBeforeRowMove(rows, finalIndex, dropIndex, movePossible) {
    return this.rowMoveController.onBeforeRowMove(rows, finalIndex, dropIndex, movePossible);
  }

  /**
   * Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
   * modifications.
   *
   * @private
   */
  disableCoreAPIModifiers() {
    this.#skipCoreAPIModifiers = true;
  }

  /**
   * Disable the modify hook skipping flag.
   *
   * @private
   */
  enableCoreAPIModifiers() {
    this.#skipCoreAPIModifiers = false;
  }

  /**
   * `beforeOnCellMousedown` hook callback.
   *
   * @param {MouseEvent} event Mousedown event.
   * @param {object} coords Cell coords.
   * @param {HTMLElement} TD Clicked cell.
   */
  #onBeforeOnCellMouseDown(event, coords, TD) {
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
    if (this.#skipCoreAPIModifiers) {
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
    if (this.#skipCoreAPIModifiers) {
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
    if (this.#skipCoreAPIModifiers || this.dataManager.isRowHighestLevel(index)) {
      return true;
    }

    this.dataManager.spliceData(index, amount, element);

    return false;
  }

  /**
   * Provide custom source data filtering. It's handled by core method and replaces the native filtering.
   *
   * @param {number} index The index where the data filtering starts.
   * @param {number} amount An amount of rows which filtering applies to.
   * @param {number} physicalRows Physical row indexes.
   * @returns {Array}
   */
  #onFilterData(index, amount, physicalRows) {
    this.collapsingUI.collapsedRowsStash.stash();
    this.collapsingUI.collapsedRowsStash.trimStash(physicalRows[0], amount);
    this.collapsingUI.collapsedRowsStash.shiftStash(physicalRows[0], null, (-1) * amount);
    this.dataManager.filterData(index, amount, physicalRows);

    this.#skipRender = true;

    return this.dataManager.getData().slice(); // Data contains reference sometimes.
  }

  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @param {object} defaultOptions The default context menu items order.
   * @returns {boolean}
   */
  #onAfterContextMenuDefaultOptions(defaultOptions) {
    return this.contextMenuUI.appendOptions(defaultOptions);
  }

  /**
   * `afterGetRowHeader` hook callback.
   *
   * @param {number} row Row index.
   * @param {HTMLElement} TH Row header element.
   */
  #onAfterGetRowHeader(row, TH) {
    this.headersUI.appendLevelIndicators(row, TH);
  }

  /**
   * `modifyRowHeaderWidth` hook callback.
   *
   * @param {number} rowHeaderWidth The initial row header width(s).
   * @returns {number}
   */
  #onModifyRowHeaderWidth(rowHeaderWidth) {
    return Math.max(this.headersUI.rowHeaderWidthCache, rowHeaderWidth);
  }

  /**
   * `onAfterRemoveRow` hook callback.
   *
   * @param {number} index Removed row.
   * @param {number} amount Amount of removed rows.
   * @param {Array} logicRows An array of the removed physical rows.
   * @param {string} source Source of action.
   */
  #onAfterRemoveRow(index, amount, logicRows, source) {
    if (source === this.pluginName) {
      return;
    }

    this.hot._registerTimeout(() => {
      this.#skipRender = false;
      this.headersUI.updateRowHeaderWidth();
      this.collapsingUI.collapsedRowsStash.applyStash();
    });
  }

  /**
   * Callback for the `beforeRemoveRow` change list of removed physical indexes by reference. Removing parent node
   * has effect in removing children nodes.
   *
   * @param {number} index Visual index of starter row.
   * @param {number} amount Amount of rows to be removed.
   * @param {Array} physicalRows List of physical indexes.
   */
  #onBeforeRemoveRow(index, amount, physicalRows) {
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
   */
  #onBeforeAddChild() {
    this.collapsingUI.collapsedRowsStash.stash();
  }

  /**
   * `afterAddChild` hook callback.
   *
   * @param {object} parent Parent element.
   * @param {object} element New child element.
   */
  #onAfterAddChild(parent, element) {
    this.collapsingUI.collapsedRowsStash.shiftStash(this.dataManager.getRowIndex(element));
    this.collapsingUI.collapsedRowsStash.applyStash();

    this.headersUI.updateRowHeaderWidth();
  }

  /**
   * `beforeDetachChild` hook callback.
   */
  #onBeforeDetachChild() {
    this.collapsingUI.collapsedRowsStash.stash();
  }

  /**
   * `afterDetachChild` hook callback.
   *
   * @param {object} parent Parent element.
   * @param {object} element New child element.
   * @param {number} finalElementRowIndex The final row index of the detached element.
   */
  #onAfterDetachChild(parent, element, finalElementRowIndex) {
    this.collapsingUI.collapsedRowsStash.shiftStash(finalElementRowIndex, null, -1);
    this.collapsingUI.collapsedRowsStash.applyStash();

    this.headersUI.updateRowHeaderWidth();
  }

  /**
   * `afterCreateRow` hook callback.
   */
  #onAfterCreateRow() {
    this.dataManager.rewriteCache();
  }

  /**
   * `afterInit` hook callback.
   */
  #onAfterInit() {
    this.headersUI.updateRowHeaderWidth();
  }

  /**
   * `beforeViewRender` hook callback.
   *
   * @param {boolean} force Indicates if the render call was triggered by a change of settings or data.
   * @param {object} skipRender An object, holder for skipRender functionality.
   */
  #onBeforeViewRender(force, skipRender) {
    if (this.#skipRender) {
      skipRender.skipRender = true;
    }
  }

  /**
   * `beforeLoadData` hook callback.
   *
   * @param {Array} data The source data.
   */
  #onBeforeLoadData(data) {
    if (!isArrayOfObjects(data)) {
      error(WRONG_DATA_TYPE_ERROR);

      this.hot.getSettings()[PLUGIN_KEY] = false;
      this.disablePlugin();

      return;
    }

    this.dataManager.setData(data);
    this.dataManager.rewriteCache();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
