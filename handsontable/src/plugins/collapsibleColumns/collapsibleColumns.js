import { BasePlugin } from '../base';
import { arrayEach, arrayFilter, arrayUnique } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { warn } from '../../helpers/console';
import {
  addClass,
  hasClass,
  removeClass,
  fastInnerText,
  removeAttribute,
  setAttribute
} from '../../helpers/dom/element';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcutContexts';
import {
  A11Y_EXPANDED,
  A11Y_HIDDEN
} from '../../helpers/a11y';

export const PLUGIN_KEY = 'collapsibleColumns';
export const PLUGIN_PRIORITY = 290;
const SETTING_KEYS = ['nestedHeaders'];
const COLLAPSIBLE_ELEMENT_CLASS = 'collapsibleIndicator';
const SHORTCUTS_GROUP = PLUGIN_KEY;

const actionDictionary = new Map([
  ['collapse', {
    hideColumn: true,
    beforeHook: 'beforeColumnCollapse',
    afterHook: 'afterColumnCollapse',
  }],
  ['expand', {
    hideColumn: false,
    beforeHook: 'beforeColumnExpand',
    afterHook: 'afterColumnExpand',
  }],
]);

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin CollapsibleColumns
 * @class CollapsibleColumns
 *
 * @description
 * The _CollapsibleColumns_ plugin allows collapsing of columns, covered by a header with the `colspan` property defined.
 *
 * Clicking the "collapse/expand" button collapses (or expands) all "child" headers except the first one.
 *
 * Setting the {@link Options#collapsiblecolumns} property to `true` will display a "collapse/expand" button in every header
 * with a defined `colspan` property.
 *
 * To limit this functionality to a smaller group of headers, define the `collapsibleColumns` property as an array
 * of objects, as in the example below.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: generateDataObj(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   nestedHeaders: true,
 *   // enable plugin
 *   collapsibleColumns: true,
 * });
 *
 * // or
 * const hot = new Handsontable(container, {
 *   data: generateDataObj(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   nestedHeaders: true,
 *   // enable and configure which columns can be collapsed
 *   collapsibleColumns: [
 *     {row: -4, col: 1, collapsible: true},
 *     {row: -3, col: 5, collapsible: true}
 *   ],
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={generateDataObj()}
 *   colHeaders={true}
 *   rowHeaders={true}
 *   nestedHeaders={true}
 *   // enable plugin
 *   collapsibleColumns={true}
 * />
 *
 * // or
 * <HotTable
 *   data={generateDataObj()}
 *   colHeaders={true}
 *   rowHeaders={true}
 *   nestedHeaders={true}
 *   // enable and configure which columns can be collapsed
 *   collapsibleColumns={[
 *     {row: -4, col: 1, collapsible: true},
 *     {row: -3, col: 5, collapsible: true}
 *   ]}
 * />
 * ```
 * :::
 */
export class CollapsibleColumns extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get PLUGIN_DEPS() {
    return [
      'plugin:NestedHeaders',
    ];
  }

  static get SETTING_KEYS() {
    return [
      PLUGIN_KEY,
      ...SETTING_KEYS
    ];
  }

  /**
   * Cached reference to the NestedHeaders plugin.
   *
   * @private
   * @type {NestedHeaders}
   */
  nestedHeadersPlugin = null;
  /**
   * The NestedHeaders plugin StateManager instance.
   *
   * @private
   * @type {StateManager}
   */
  headerStateManager = null;
  /**
   * Map of collapsed columns by the plugin.
   *
   * @private
   * @type {HidingMap|null}
   */
  #collapsedColumnsMap = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link CollapsibleColumns#enablePlugin} method is called.
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

    const { nestedHeaders } = this.hot.getSettings();

    if (!nestedHeaders) {
      warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');
    }

    this.#collapsedColumnsMap = this.hot.columnIndexMapper.createAndRegisterIndexMap(this.pluginName, 'hiding');
    this.nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders');
    this.headerStateManager = this.nestedHeadersPlugin.getStateManager();

    this.addHook('init', () => this.#onInit());
    this.addHook('afterLoadData', (...args) => this.#onAfterLoadData(...args));
    this.addHook('afterGetColHeader', (...args) => this.#onAfterGetColHeader(...args));
    this.addHook('beforeOnCellMouseDown', (event, coords, TD) => this.#onBeforeOnCellMouseDown(event, coords, TD));

    this.registerShortcuts();
    super.enablePlugin();
    // @TODO: Workaround for broken plugin initialization abstraction (#6806).
    this.updatePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *   - [`collapsibleColumns`](@/api/options.md#collapsiblecolumns)
   *   - [`nestedHeaders`](@/api/options.md#nestedheaders)
   */
  updatePlugin() {
    // @TODO: Workaround for broken plugin initialization abstraction (#6806).
    if (!this.hot.view) {
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

        this.headerStateManager.mapState(() => {
          return { collapsible: false };
        });

        this.headerStateManager.mergeStateWith(collapsibleColumns);
      }
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.columnIndexMapper.unregisterMap(this.pluginName);
    this.#collapsedColumnsMap = null;
    this.nestedHeadersPlugin = null;

    this.unregisterShortcuts();
    this.clearButtons();
    super.disablePlugin();
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
          const { row, col } = this.hot.getSelectedRangeLast().highlight;
          const {
            collapsible,
            isCollapsed,
            columnIndex,
          } = this.headerStateManager.getHeaderTreeNodeData(row, col) ?? {};

          if (!collapsible) {
            return;
          }

          if (isCollapsed) {
            this.expandSection({ row, col: columnIndex });
          } else {
            this.collapseSection({ row, col: columnIndex });
          }

          // prevent default Enter behavior (move to the next row within a selection range)
          return false;
        },
        runOnlyIf: () => this.hot.getSelectedRangeLast()?.isSingle() &&
          this.hot.getSelectedRangeLast()?.highlight.isHeader(),
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
   * Clears the expand/collapse buttons.
   *
   * @private
   */
  clearButtons() {
    if (!this.hot.view) {
      return;
    }

    const headerLevels = this.hot.view._wt.getSetting('columnHeaders').length;
    const mainHeaders = this.hot.view._wt.wtTable.THEAD;
    const topHeaders = this.hot.view._wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerHeaders = this.hot.view._wt.wtOverlays.topInlineStartCornerOverlay ?
      this.hot.view._wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.THEAD : null;

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
        let button = masterLevel.childNodes[j].querySelector(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

        removeButton(button);

        if (topLevel && topLevel.childNodes[j]) {
          button = topLevel.childNodes[j].querySelector(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

          removeButton(button);
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          button = topLeftCornerLevel.childNodes[j].querySelector(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

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
    const coords = this.headerStateManager.mapNodes((headerSettings) => {
      const {
        collapsible,
        origColspan,
        headerLevel,
        columnIndex,
        isCollapsed,
      } = headerSettings;

      if (collapsible === true && origColspan > 1
          && (isCollapsed && action === 'expand' || !isCollapsed && action === 'collapse')) {
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
      const { collapsible, isCollapsed } = this.headerStateManager.getHeaderSettings(row, column) ?? {};

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

    const currentCollapsedColumns = this.getCollapsedColumns();
    let destinationCollapsedColumns = [];

    if (action === 'collapse') {
      destinationCollapsedColumns = arrayUnique([...currentCollapsedColumns, ...affectedColumnsIndexes]);

    } else if (action === 'expand') {
      destinationCollapsedColumns = arrayFilter(currentCollapsedColumns,
        index => !affectedColumnsIndexes.includes(index));
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

    this.hot.batchExecution(() => {
      arrayEach(affectedColumnsIndexes, (visualColumn) => {
        this.#collapsedColumnsMap
          .setValueAtIndex(this.hot.toPhysicalColumn(visualColumn), actionTranslator.hideColumn);
      });
    }, true);

    const isActionPerformed = this.getCollapsedColumns().length !== currentCollapsedColumns.length;
    const selectionRange = this.hot.getSelectedRangeLast();

    if (action === 'collapse' && isActionPerformed && selectionRange) {
      const { row, col } = selectionRange.highlight;
      const isHidden = this.hot.rowIndexMapper.isHidden(row) || this.hot.columnIndexMapper.isHidden(col);

      if (isHidden && affectedColumnsIndexes.includes(col)) {
        const nextRow = row >= 0 ? this.hot.rowIndexMapper.getNearestNotHiddenIndex(row, 1, true) : row;
        const nextColumn = col >= 0 ? this.hot.columnIndexMapper.getNearestNotHiddenIndex(col, 1, true) : col;

        if (nextRow !== null && nextColumn !== null) {
          this.hot.selectCell(nextRow, nextColumn);
        }
      }
    }

    this.hot.runHooks(
      actionTranslator.afterHook,
      currentCollapsedColumns,
      destinationCollapsedColumns,
      isActionPossible,
      isActionPerformed,
    );

    this.hot.render();
    this.hot.view.adjustElementsSize();
  }

  /**
   * Gets an array of physical indexes of collapsed columns.
   *
   * @private
   * @returns {number[]}
   */
  getCollapsedColumns() {
    return this.#collapsedColumnsMap.getHiddenIndexes();
  }

  /**
   * Adds the indicator to the headers.
   *
   * @param {number} column Column index.
   * @param {HTMLElement} TH TH element.
   * @param {number} headerLevel The index of header level counting from the top (positive
   *                             values counting from 0 to N).
   */
  #onAfterGetColHeader(column, TH, headerLevel) {
    const {
      collapsible,
      origColspan,
      isCollapsed,
    } = this.headerStateManager.getHeaderSettings(headerLevel, column) ?? {};
    const isNodeCollapsible = collapsible && origColspan > 1 && column >= this.hot.getSettings().fixedColumnsStart;
    const isAriaTagsEnabled = this.hot.getSettings().ariaTags;
    let collapsibleElement = TH.querySelector(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

    removeAttribute(TH, [
      A11Y_EXPANDED('')[0]
    ]);

    if (isNodeCollapsible) {
      if (!collapsibleElement) {
        collapsibleElement = this.hot.rootDocument.createElement('div');

        addClass(collapsibleElement, COLLAPSIBLE_ELEMENT_CLASS);
        TH.querySelector('div:first-child').appendChild(collapsibleElement);
      }

      removeClass(collapsibleElement, ['collapsed', 'expanded']);

      if (isCollapsed) {
        addClass(collapsibleElement, 'collapsed');

        fastInnerText(collapsibleElement, '+');

        // Add ARIA tags
        if (isAriaTagsEnabled) {
          setAttribute(TH, ...A11Y_EXPANDED(false));
        }

      } else {
        addClass(collapsibleElement, 'expanded');

        fastInnerText(collapsibleElement, '-');

        // Add ARIA tags
        if (isAriaTagsEnabled) {
          setAttribute(TH, ...A11Y_EXPANDED(true));
        }
      }

      if (isAriaTagsEnabled) {
        setAttribute(collapsibleElement, ...A11Y_HIDDEN());
      }

    } else {
      collapsibleElement?.remove();
    }
  }

  /**
   * Indicator mouse event callback.
   *
   * @param {object} event Mouse event.
   * @param {object} coords Event coordinates.
   */
  #onBeforeOnCellMouseDown(event, coords) {
    if (hasClass(event.target, COLLAPSIBLE_ELEMENT_CLASS)) {
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
   */
  #onInit() {
    // @TODO: Workaround for broken plugin initialization abstraction (#6806).
    this.updatePlugin();
  }

  /**
   * Updates the plugin state after new dataset load.
   *
   * @param {Array[]} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded
   *                              during the initialization.
   */
  #onAfterLoadData(sourceData, initialLoad) {
    if (!initialLoad) {
      this.updatePlugin();
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#collapsedColumnsMap = null;

    super.destroy();
  }
}
