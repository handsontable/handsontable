import { arrayEach, arrayFilter, arrayUnique } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { warn } from '../../helpers/console';
import {
  addClass,
  hasClass,
  fastInnerText
} from '../../helpers/dom/element';
import EventManager from '../../eventManager';
import { registerPlugin } from '../../plugins';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import BasePlugin from '../_base';

const actionDictionary = new Map([
  ['collapse', {
    hiddenAction: 'hideColumns',
    beforeHook: 'beforeColumnCollapse',
    afterHook: 'afterColumnCollapse',
  }],
  ['expand', {
    hiddenAction: 'showColumns',
    beforeHook: 'beforeColumnExpand',
    afterHook: 'afterColumnExpand',
  }],
]);

/**
 * @plugin CollapsibleColumns
 *
 * @description
 * The {@link CollapsibleColumns} plugin allows collapsing of columns, covered by a header with the `colspan` property defined.
 *
 * Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.
 *
 * Setting the {@link Options#collapsibleColumns} property to `true` will display a "collapse/expand" button in every header
 * with a defined `colspan` property.
 *
 * To limit this functionality to a smaller group of headers, define the `collapsibleColumns` property as an array
 * of objects, as in the example below.
 *
 * @example
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: generateDataObj(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   // enable plugin
 *   collapsibleColumns: true,
 * });
 *
 * // or
 * const hot = new Handsontable(container, {
 *   data: generateDataObj(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   // enable and configure which columns can be collapsed
 *   collapsibleColumns: [
 *     {row: -4, col: 1, collapsible: true},
 *     {row: -3, col: 5, collapsible: true}
 *   ],
 * });
 * ```
 */
class CollapsibleColumns extends BasePlugin {
  /**
   * Cached reference to the HiddenColumns plugin.
   *
   * @private
   * @type {HiddenColumns}
   */
  hiddenColumnsPlugin = null;
  /**
   * Cached reference to the NestedHeaders plugin.
   *
   * @private
   * @type {NestedHeaders}
   */
  nestedHeadersPlugin = null;
  /**
   * Event manager instance reference.
   *
   * @private
   * @type {EventManager}
   */
  eventManager = new EventManager(this);
  /**
   * The NestedHeaders plugin StateManager instance.
   *
   * @type {StateManager}
   */
  headerStateManager = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link CollapsibleColumns#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().collapsibleColumns;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const { nestedHeaders, hiddenColumns } = this.hot.getSettings();

    if (!nestedHeaders) {
      warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');
    }

    if (!hiddenColumns) {
      warn('You need to configure the Hidden Columns plugin in order to use collapsible headers.');
    }

    this.hiddenColumnsPlugin = this.hot.getPlugin('hiddenColumns');
    this.nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders');
    this.headerStateManager = this.nestedHeadersPlugin.getStateManager();

    this.addHook('init', () => this.onInit());
    this.addHook('afterLoadData', (...args) => this.onAfterLoadData(...args));
    this.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
    this.addHook('beforeOnCellMouseDown', (event, coords, TD) => this.onBeforeOnCellMouseDown(event, coords, TD));

    super.enablePlugin();
    this.updatePlugin(); // @TODO: Workaround for broken plugin initialization abstraction.
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    if (!this.hot.view) { // @TODO: Workaround for broken plugin initialization abstraction.
      return;
    }

    if (!this.nestedHeadersPlugin.detectedOverlappedHeaders) {
      const { collapsibleColumns } = this.hot.getSettings();

      if (typeof collapsibleColumns === 'boolean') {
        // Add `collapsible: true` attribute to all headers with colspan higher than 1.
        this.headerStateManager.mapState((headerSettings) => {
          return { collapsible: headerSettings.origColspan > 1 };
        });

      } else if (Array.isArray(collapsibleColumns)) {
        this.headerStateManager.mergeStateWith(collapsibleColumns);
      }
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hiddenColumnsPlugin = null;
    this.nestedHeadersPlugin = null;

    this.clearButtons();
    super.disablePlugin();
  }

  /**
   * Clears the expand/collapse buttons.
   *
   * @private
   */
  clearButtons() {
    if (!this.hot.view) {
      return;
    }

    const headerLevels = this.hot.view.wt.getSetting('columnHeaders').length;
    const mainHeaders = this.hot.view.wt.wtTable.THEAD;
    const topHeaders = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerHeaders = this.hot.view.wt.wtOverlays.topLeftCornerOverlay ?
      this.hot.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.THEAD : null;

    const removeButton = function(button) {
      if (button) {
        button.parentNode.removeChild(button);
      }
    };

    rangeEach(0, headerLevels - 1, (i) => {
      const masterLevel = mainHeaders.childNodes[i];
      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      rangeEach(0, masterLevel.childNodes.length - 1, (j) => {
        let button = masterLevel.childNodes[j].querySelector('.collapsibleIndicator');

        removeButton(button);

        if (topLevel && topLevel.childNodes[j]) {
          button = topLevel.childNodes[j].querySelector('.collapsibleIndicator');

          removeButton(button);
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          button = topLeftCornerLevel.childNodes[j].querySelector('.collapsibleIndicator');

          removeButton(button);
        }
      });
    }, true);
  }

  /**
   * Expands section at the provided coords.
   *
   * @param {object} coords Contains coordinates information. (`coords.row`, `coords.col`).
   */
  expandSection(coords) {
    this.toggleCollapsibleSection([coords], 'expand');
  }

  /**
   * Collapses section at the provided coords.
   *
   * @param {object} coords Contains coordinates information. (`coords.row`, `coords.col`).
   */
  collapseSection(coords) {
    this.toggleCollapsibleSection([coords], 'collapse');
  }

  /**
   * Collapses or expand all collapsible sections, depending on the action parameter.
   *
   * @param {string} action 'collapse' or 'expand'.
   */
  toggleAllCollapsibleSections(action) {
    const coords = this.headerStateManager.mapNodes(({ collapsible, origColspan, headerLevel, columnIndex }) => {
      if (collapsible === true && origColspan > 1) {
        return {
          row: this.headerStateManager.levelToRowCoords(headerLevel),
          col: columnIndex,
        };
      }
    });

    this.toggleCollapsibleSection(coords, action);
  }

  /**
   * Collapses all collapsible sections.
   */
  collapseAll() {
    this.toggleAllCollapsibleSections('collapse');
  }

  /**
   * Expands all collapsible sections.
   */
  expandAll() {
    this.toggleAllCollapsibleSections('expand');
  }

  /**
   * Collapses/Expands a section.
   *
   * @param {Array} coords Array of coords - section coordinates.
   * @param {string} [action] Action definition ('collapse' or 'expand').
   * @fires Hooks#beforeColumnCollapse
   * @fires Hooks#beforeColumnExpand
   * @fires Hooks#afterColumnCollapse
   * @fires Hooks#afterColumnExpand
   */
  toggleCollapsibleSection(coords, action) {
    if (!actionDictionary.has(action)) {
      throw new Error(`Unsupported action is passed (${action}).`);
    }
    if (!Array.isArray(coords)) {
      return;
    }

    // Ignore coordinates which points to the cells range.
    const filteredCoords = arrayFilter(coords, ({ row }) => row < 0);
    let isActionPossible = filteredCoords.length > 0;

    arrayEach(filteredCoords, ({ row, col: column }) => {
      const { collapsible, isCollapsed } = this.headerStateManager.getHeaderSettings(row, column);

      if (!collapsible || isCollapsed && action === 'collapse' || !isCollapsed && action === 'expand') {
        isActionPossible = false;

        return false;
      }
    });

    const nodeModRollbacks = [];
    const affectedColumnsIndexes = [];

    if (isActionPossible) {
      arrayEach(filteredCoords, ({ row, col: column }) => {
        const {
          colspanCompensation,
          affectedColumns,
          rollbackModification,
        } = this.headerStateManager.triggerNodeModification(action, row, column);

        if (colspanCompensation > 0) {
          affectedColumnsIndexes.push(...affectedColumns);
          nodeModRollbacks.push(rollbackModification);
        }
      });
    }

    const currentCollapsedColumns = [...this.hiddenColumnsPlugin.getHiddenColumns()];
    let destinationCollapsedColumns = [];

    if (action === 'collapse') {
      destinationCollapsedColumns = arrayUnique([...currentCollapsedColumns, ...affectedColumnsIndexes]);

    } else if (action === 'expand') {
      destinationCollapsedColumns = arrayFilter(currentCollapsedColumns, index => !affectedColumnsIndexes.includes(index));
    }

    const actionTranslator = actionDictionary.get(action);
    const isActionAllowed = this.hot.runHooks(
      actionTranslator.beforeHook,
      currentCollapsedColumns,
      destinationCollapsedColumns,
      isActionPossible,
    );

    if (isActionAllowed === false) {
      // Rollback all header nodes modification (collapse or expand).
      arrayEach(nodeModRollbacks, (nodeModRollback) => {
        nodeModRollback();
      });

      return;
    }

    this.hiddenColumnsPlugin[actionTranslator.hiddenAction](affectedColumnsIndexes);

    const isActionPerformed = this.hiddenColumnsPlugin.getHiddenColumns().length !== currentCollapsedColumns.length;

    this.hot.runHooks(
      actionTranslator.afterHook,
      currentCollapsedColumns,
      destinationCollapsedColumns,
      isActionPossible,
      isActionPerformed,
    );

    this.hot.render();
    this.hot.view.wt.wtOverlays.adjustElementsSize(true);
  }

  /**
   * Generates the indicator element.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} column Column index.
   * @returns {HTMLElement}
   */
  generateIndicator(row, column) {
    const divEl = this.hot.rootDocument.createElement('div');
    const columnSettings = this.headerStateManager.getHeaderSettings(row, column);

    addClass(divEl, 'collapsibleIndicator');

    if (columnSettings.isCollapsed) {
      addClass(divEl, 'collapsed');
      fastInnerText(divEl, '+');

    } else {
      addClass(divEl, 'expanded');
      fastInnerText(divEl, '-');
    }

    return divEl;
  }

  /**
   * Adds the indicator to the headers.
   *
   * @private
   * @param {number} column Column index.
   * @param {HTMLElement} TH TH element.
   */
  onAfterGetColHeader(column, TH) {
    const TR = TH.parentNode;
    const THEAD = TR.parentNode;
    const row = ((-1) * THEAD.childNodes.length) + Array.prototype.indexOf.call(THEAD.childNodes, TR);
    const { collapsible, origColspan } = this.headerStateManager.getHeaderSettings(row, column);

    if (collapsible && origColspan > 1 && column >= this.hot.getSettings().fixedColumnsLeft) {
      const button = this.generateIndicator(row, column);

      TH.querySelector('div:first-child').appendChild(button);
    }
  }

  /**
   * Indicator mouse event callback.
   *
   * @private
   * @param {object} event Mouse event.
   * @param {object} coords Event coordinates.
   */
  onBeforeOnCellMouseDown(event, coords) {
    if (hasClass(event.target, 'collapsibleIndicator')) {
      if (hasClass(event.target, 'expanded')) {
        this.eventManager.fireEvent(event.target, 'mouseup');
        this.toggleCollapsibleSection([coords], 'collapse');

      } else if (hasClass(event.target, 'collapsed')) {
        this.eventManager.fireEvent(event.target, 'mouseup');
        this.toggleCollapsibleSection([coords], 'expand');
      }

      stopImmediatePropagation(event);
    }
  }

  /**
   * Updates the plugin state after HoT initialization.
   *
   * @private
   */
  onInit() {
    // @TODO: Workaround for broken plugin initialization abstraction.
    this.updatePlugin();
  }

  /**
   * Updates the plugin state after new dataset load.
   *
   * @private
   * @param {Array[]} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded
   *                              during the initialization.
   */
  onAfterLoadData(sourceData, initialLoad) {
    if (!initialLoad) {
      this.updatePlugin();
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

registerPlugin('collapsibleColumns', CollapsibleColumns);

export default CollapsibleColumns;
