import { BasePlugin } from '../base';
import type { HidingMap } from '../../translations';
import { arrayEach, arrayFilter, arrayMap, arrayUnique } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { warn } from '../../helpers/console';
import {
  addClass,
  eventTargetEl,
  hasClass,
  removeClass,
  fastInnerText,
  removeAttribute,
  setAttribute
} from '../../helpers/dom/element';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import { throwWithCause } from '../../helpers/errors';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcuts/contexts';
import {
  A11Y_EXPANDED,
  A11Y_HIDDEN
} from '../../helpers/a11y';

/**
 * Interface for NestedHeaders plugin StateManager.
 */
interface HeaderStateManager {
  getHeaderTreeNodeData(row: number, col: number): {
    collapsible: boolean; isCollapsed: boolean; columnIndex: number; headerLevel: number;
  } | undefined;
  getHeaderSettings(headerLevel: number, column: number): {
    collapsible: boolean; origColspan: number; isCollapsed: boolean;
  } | undefined;
  mapState(callback: (headerSettings: Record<string, unknown>) => Record<string, unknown>): void;
  mergeStateWith(settings: unknown[]): void;
  mapNodes(callback: (headerSettings: Record<string, unknown>) => unknown): unknown[];
  levelToRowCoords(headerLevel: unknown): number;
  triggerNodeModification(action: string, row: number, column: number): {
    colspanCompensation: number; affectedColumns: number[]; rollbackModification: Function;
  };
  getVisibleWhenHiddenColumns(): number[];
}

/**
 * Interface for the NestedHeaders plugin instance.
 */
interface NestedHeadersPlugin {
  getStateManager(): HeaderStateManager;
  detectedOverlappedHeaders: boolean;
  [key: string]: unknown;
}

export const PLUGIN_KEY = 'collapsibleColumns';
export const PLUGIN_PRIORITY = 290;
const SETTING_KEYS = ['nestedHeaders'];
const COLLAPSIBLE_ELEMENT_CLASS = 'collapsibleIndicator';
// Name of the hiding map that holds columns hidden by the per-child `visibleWhen` rules (issue
// #10243). Kept separate from the main collapsed-columns map so `getCollapsedColumns()` and the
// collapse hooks never report a column that is merely hidden in the expanded state.
const VISIBLE_WHEN_MAP_NAME = 'collapsibleColumns.visibleWhen';
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
 *
 * ::: only-for angular
 * ```ts
 * // Enable the collapsibleColumns plugin
 * settings = {
 *   data: generateDataObj(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   nestedHeaders: true,
 *   // enable plugin
 *   collapsibleColumns: true,
 * };
 *
 * // Or enable and configure specific collapsible columns
 * settings = {
 *   data: generateDataObj(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   nestedHeaders: true,
 *   // enable and configure which columns can be collapsed
 *   collapsibleColumns: [
 *     { row: -4, col: 1, collapsible: true },
 *     { row: -3, col: 5, collapsible: true },
 *   ],
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings"></hot-table>
 * ```
 * :::
 */
export class CollapsibleColumns extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the list of plugin dependencies required before this plugin can be initialized.
   */
  static get PLUGIN_DEPS() {
    return [
      'plugin:NestedHeaders',
    ];
  }

  /**
   * Returns the setting keys that trigger a plugin update when changed via `updateSettings`.
   */
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
  nestedHeadersPlugin: NestedHeadersPlugin | null = null;
  /**
   * The NestedHeaders plugin StateManager instance.
   *
   * @private
   * @type {StateManager}
   */
  headerStateManager: HeaderStateManager | null = null;
  /**
   * Map of collapsed columns by the plugin.
   *
   * @private
   * @type {HidingMap|null}
   */
  #collapsedColumnsMap: HidingMap | null = null;
  /**
   * Map of columns hidden by the per-child `visibleWhen` rules (issue #10243), kept separate from
   * `#collapsedColumnsMap`.
   *
   * @private
   * @type {HidingMap|null}
   */
  #visibleWhenMap: HidingMap | null = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link CollapsibleColumns#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    const { nestedHeaders } = this.hot.getSettings();

    if (!nestedHeaders) {
      warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');
    }

    if (this.pluginName) {
      this.#collapsedColumnsMap = this.hot.columnIndexMapper
        .createAndRegisterIndexMap(this.pluginName, 'hiding') as HidingMap;
    }
    this.#visibleWhenMap = this.hot.columnIndexMapper
      .createAndRegisterIndexMap(VISIBLE_WHEN_MAP_NAME, 'hiding') as HidingMap;
    this.nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders') as unknown as NestedHeadersPlugin;
    this.headerStateManager = this.nestedHeadersPlugin.getStateManager();

    this.addHook('init', this.#onInit);
    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('afterGetColHeader', this.#onAfterGetColHeader);
    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    // NestedHeaders (priority 280) rebuilds the header tree on column insert/remove before this
    // plugin (priority 290) runs, so refreshing here re-derives the `visibleWhen` hidden set against
    // the freshly rebuilt tree (with `isCollapsed` already restored).
    this.addHook('afterCreateCol', this.#onAfterColumnStructureChange);
    this.addHook('afterRemoveCol', this.#onAfterColumnStructureChange);

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
  updatePlugin(): void {
    // @TODO: Workaround for broken plugin initialization abstraction (#6806).
    if (!this.hot.view) {
      return;
    }

    if (!this.nestedHeadersPlugin?.detectedOverlappedHeaders) {
      const { collapsibleColumns } = this.hot.getSettings();

      if (typeof collapsibleColumns === 'boolean') {
        // Add `collapsible: true` attribute to all headers with colspan higher than 1.
        this.headerStateManager?.mapState((headerSettings: Record<string, unknown>) => {
          return { collapsible: Number(headerSettings.origColspan) > 1 };
        });

      } else if (Array.isArray(collapsibleColumns)) {

        this.headerStateManager?.mapState(() => {
          return { collapsible: false };
        });

        this.headerStateManager?.mergeStateWith(collapsibleColumns);
      }
    }

    // Apply the per-child `visibleWhen` rules once the `collapsible` flags are in place - on the
    // initial render this hides every `visibleWhen: 'collapsed'` column (all groups start expanded).
    this.#refreshVisibleWhenColumns();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    if (this.pluginName) {
      this.hot.columnIndexMapper.unregisterMap(this.pluginName);
    }
    this.hot.columnIndexMapper.unregisterMap(VISIBLE_WHEN_MAP_NAME);
    this.#collapsedColumnsMap = null;
    this.#visibleWhenMap = null;
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
      ?.addShortcut({
        keys: [['Enter']],
        callback: () => {
          const activeRange = this.hot.getSelectedRangeActive();

          if (!activeRange) {
            return;
          }

          const { row, col } = activeRange.highlight;

          if (row === null || col === null) {
            return;
          }

          const nodeData = this.headerStateManager?.getHeaderTreeNodeData(row, col) ?? {
            collapsible: false, isCollapsed: false, columnIndex: 0, headerLevel: 0
          };
          const { collapsible, isCollapsed, columnIndex } = nodeData;

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
        runOnlyIf: (): boolean => !!(this.hot.getSelectedRangeActive()?.isSingle() &&
          this.hot.getSelectedRangeActive()?.highlight.isHeader()),
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
      ?.removeShortcutsByGroup(SHORTCUTS_GROUP);
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

    const headerLevels = (this.hot.view._wt.getSetting('columnHeaders') as unknown[]).length;
    const mainHeaders = this.hot.view._wt.wtTable.THEAD;
    const topHeaders = this.hot.view._wt.wtOverlays.topOverlay?.clone?.wtTable.THEAD ?? null;
    const topLeftCornerHeaders = this.hot.view._wt.wtOverlays.topInlineStartCornerOverlay
      ? this.hot.view._wt.wtOverlays.topInlineStartCornerOverlay.clone?.wtTable.THEAD ?? null
      : null;

    const removeButton = function(button: HTMLElement | null) {
      if (button && button.parentNode) {
        button.parentNode.removeChild(button);
      }
    };

    if (!mainHeaders || !topHeaders) {
      return;
    }

    rangeEach(0, headerLevels - 1, (i: number) => {
      const masterLevel = mainHeaders.childNodes[i];
      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      rangeEach(0, masterLevel.childNodes.length - 1, (j) => {
        let button = (masterLevel.childNodes[j] as Element).querySelector<HTMLElement>(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

        removeButton(button);

        if (topLevel && topLevel.childNodes[j]) {
          button = (topLevel.childNodes[j] as Element).querySelector<HTMLElement>(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

          removeButton(button);
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          button = (topLeftCornerLevel.childNodes[j] as Element)
            .querySelector<HTMLElement>(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

          removeButton(button);
        }
      });
    });
  }

  /**
   * Expands section at the provided coords.
   *
   * @param {object} coords Contains coordinates information. (`coords.row`, `coords.col`).
   */
  expandSection(coords: { row: number, col: number }): void {
    this.toggleCollapsibleSection([coords], 'expand');
  }

  /**
   * Collapses section at the provided coords.
   *
   * @param {object} coords Contains coordinates information. (`coords.row`, `coords.col`).
   */
  collapseSection(coords: { row: number, col: number }): void {
    this.toggleCollapsibleSection([coords], 'collapse');
  }

  /**
   * Collapses or expand all collapsible sections, depending on the action parameter.
   *
   * @param {string} action 'collapse' or 'expand'.
   */
  toggleAllCollapsibleSections(action: 'collapse' | 'expand'): void {
    const coords = this.headerStateManager?.mapNodes((headerSettings: Record<string, unknown>) => {
      const {
        collapsible,
        origColspan,
        headerLevel,
        columnIndex,
        isCollapsed,
      } = headerSettings;

      if (collapsible === true && Number(origColspan) > 1
          && (isCollapsed && action === 'expand' || !isCollapsed && action === 'collapse')) {
        return {
          row: this.headerStateManager?.levelToRowCoords(headerLevel) ?? 0,
          col: columnIndex,
        };
      }
    }) as { row: number, col: number }[];

    this.toggleCollapsibleSection(coords, action);
  }

  /**
   * Collapses all collapsible sections.
   */
  collapseAll(): void {
    this.toggleAllCollapsibleSections('collapse');
  }

  /**
   * Expands all collapsible sections.
   */
  expandAll(): void {
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
  toggleCollapsibleSection(coords: { row: number, col: number }[], action?: 'collapse' | 'expand'): void {
    if (action === undefined || !actionDictionary.has(action)) {
      throwWithCause(`Unsupported action is passed (${action}).`);
    }
    if (!Array.isArray(coords)) {
      return;
    }

    // Ignore coordinates which points to the cells range.
    const filteredCoords = arrayFilter(coords, ({ row }) => row < 0);
    const isActionPossible = this.#checkIsActionPossible(filteredCoords, action!);

    const nodeModRollbacks: Function[] = [];
    const affectedColumnsIndexes: number[] = [];
    // Snapshot the declarative `visibleWhen` hidden set (issue #10243) before the nodes are toggled.
    // triggerNodeModification flips `isCollapsed` for declarative groups, so re-deriving afterwards
    // tells us which columns the toggle hid/showed - used for selection adjustment and the
    // action-performed check.
    const visibleWhenHiddenBefore = this.headerStateManager?.getVisibleWhenHiddenColumns() ?? [];

    if (isActionPossible) {
      arrayEach(filteredCoords, ({ row, col: column }) => {
        const {
          affectedColumns,
          rollbackModification,
        } = this.headerStateManager?.triggerNodeModification(action, row, column) ?? {
          colspanCompensation: 0, affectedColumns: [], rollbackModification: () => {}
        };

        // Always keep the rollback - a declarative group toggles `isCollapsed` without reporting
        // affected columns, so its rollback must still run if the before-hook vetoes the action.
        // No-op modifications return an empty rollback, so this stays safe.
        nodeModRollbacks.push(rollbackModification);

        // Gate on whether any columns were affected, not on the colspan delta. A collapse can own
        // columns without changing the colspan - when the columns it claims are already hidden by
        // another source (e.g. HiddenColumns) the colspan is unchanged, but the collapse must still
        // record those columns so the group stays collapsed if that external hide is later removed.
        if (affectedColumns.length > 0) {
          affectedColumnsIndexes.push(...affectedColumns);
        }
      });
    }

    const currentCollapsedColumns = this.getCollapsedColumns();
    let destinationCollapsedColumns: number[] = [];

    if (action === 'collapse') {
      destinationCollapsedColumns = arrayUnique([...currentCollapsedColumns, ...affectedColumnsIndexes]);

    } else if (action === 'expand') {
      destinationCollapsedColumns = arrayFilter(currentCollapsedColumns,
        index => !affectedColumnsIndexes.includes(index));
    }

    const actionTranslator = actionDictionary.get(action)!;
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
          ?.setValueAtIndex(this.hot.toPhysicalColumn(visualColumn), actionTranslator.hideColumn);
      });
    }, true);

    // Determine whether the declarative `visibleWhen` hidden set changed (its inputs - the
    // `isCollapsed` flags - were just toggled). Only refresh the map when it actually changed, so a
    // plain legacy collapse does not trigger an extra cache update that would disturb the selection
    // adjustment below.
    const visibleWhenHiddenAfter = this.headerStateManager?.getVisibleWhenHiddenColumns() ?? [];
    const visibleWhenHiddenBeforeSet = new Set(visibleWhenHiddenBefore);
    const newlyHiddenByVisibleWhen = arrayFilter(
      visibleWhenHiddenAfter, column => !visibleWhenHiddenBeforeSet.has(column)
    );
    const isVisibleWhenChanged = newlyHiddenByVisibleWhen.length > 0 ||
      visibleWhenHiddenAfter.length !== visibleWhenHiddenBefore.length;

    if (isVisibleWhenChanged) {
      this.#refreshVisibleWhenColumns();
    }

    const isActionPerformed = this.getCollapsedColumns().length !== currentCollapsedColumns.length ||
      isVisibleWhenChanged;

    if (action === 'collapse' && isActionPerformed) {
      this.#adjustSelectionAfterCollapse([...affectedColumnsIndexes, ...newlyHiddenByVisibleWhen]);
    }

    this.hot.runHooks(
      actionTranslator.afterHook,
      currentCollapsedColumns,
      destinationCollapsedColumns,
      isActionPossible,
      isActionPerformed,
    );

    this.hot.view.adjustElementsSize();
    this.hot.render();
  }

  /**
   * Checks whether a collapse or expand action is possible for the given filtered coordinates.
   *
   * @param {Array} filteredCoords Header coordinates filtered to header rows only.
   * @param {string} action Action definition ('collapse' or 'expand').
   * @returns {boolean}
   */
  #checkIsActionPossible(
    filteredCoords: { row: number, col: number }[],
    action: 'collapse' | 'expand'
  ): boolean {
    if (filteredCoords.length === 0) {
      return false;
    }

    let isActionPossible = true;

    arrayEach(filteredCoords, ({ row, col: column }) => {
      // Read the tree node, not the generated matrix: a declarative group (issue #10243) can hide its
      // own anchor column when collapsed, in which case the matrix cell at the anchor is a hidden
      // placeholder with no collapse state. The tree node always carries the authoritative
      // `collapsible`/`isCollapsed` regardless of which columns are hidden.
      const { collapsible, isCollapsed } = this.headerStateManager?.getHeaderTreeNodeData(row, column)
        ?? {} as Record<string, unknown>;

      if (!collapsible || isCollapsed && action === 'collapse' || !isCollapsed && action === 'expand') {
        isActionPossible = false;

        return false;
      }
    });

    return isActionPossible;
  }

  /**
   * Adjusts the active cell selection after a collapse action moves selected cells out of view.
   *
   * @param {number[]} affectedColumnsIndexes Visual indexes of columns hidden by the collapse.
   */
  #adjustSelectionAfterCollapse(affectedColumnsIndexes: number[]): void {
    const selectionRange = this.hot.getSelectedRangeActive();

    if (!selectionRange) {
      return;
    }

    const { row, col } = selectionRange.highlight;

    if (row === null || col === null) {
      return;
    }

    const isHidden = this.hot.rowIndexMapper.isHidden(row) || this.hot.columnIndexMapper.isHidden(col);

    if (isHidden && affectedColumnsIndexes.includes(col)) {
      const nextRow = row >= 0 ? this.hot.rowIndexMapper.getNearestNotHiddenIndex(row, 1, true) : row;
      const nextColumn = col >= 0 ? this.hot.columnIndexMapper.getNearestNotHiddenIndex(col, 1, true) : col;

      if (nextRow !== null && nextColumn !== null) {
        this.hot.selectCell(nextRow, nextColumn);
      }
    }
  }

  /**
   * Gets an array of physical indexes of collapsed columns.
   *
   * @private
   * @returns {number[]}
   */
  getCollapsedColumns(): number[] {
    return this.#collapsedColumnsMap?.getHiddenIndexes() ?? [];
  }

  /**
   * Re-derives the set of columns hidden by the per-child `visibleWhen` rules (issue #10243) from the
   * current header tree (markers + each group's `isCollapsed` state) and writes it into the dedicated
   * `#visibleWhenMap`. Pure recompute - safe to call after any collapse/expand toggle, settings
   * update, or column insert/remove.
   *
   * @private
   */
  #refreshVisibleWhenColumns(): void {
    if (!this.#visibleWhenMap || !this.headerStateManager) {
      return;
    }

    const visibleWhenMap = this.#visibleWhenMap;
    const physicalColumnsToHide = new Set(
      arrayMap(
        this.headerStateManager.getVisibleWhenHiddenColumns(),
        visualColumn => this.hot.toPhysicalColumn(visualColumn)
      )
    );

    this.hot.batchExecution(() => {
      visibleWhenMap.clear();

      physicalColumnsToHide.forEach((physicalColumn) => {
        visibleWhenMap.setValueAtIndex(physicalColumn, true);
      });
    }, true);
  }

  /**
   * Re-derives the `visibleWhen` hidden set after NestedHeaders rebuilds the header tree on column
   * insertion or removal. The tree (with `isCollapsed` restored) is the source of truth, so a full
   * refresh keeps the hidden set correct without tracking shifted indexes manually.
   *
   * @private
   */
  #onAfterColumnStructureChange = () => {
    this.#refreshVisibleWhenColumns();
  };

  /**
   * Adds the indicator to the headers.
   *
   * @param {number} column Column index.
   * @param {HTMLElement} TH TH element.
   * @param {number} headerLevel The index of header level counting from the top (positive
   *                             values counting from 0 to N).
   */
  #onAfterGetColHeader = (column: number, TH: HTMLTableHeaderCellElement, headerLevel: number) => {
    const headerSettings = this.headerStateManager?.getHeaderSettings(headerLevel, column);
    const { collapsible, origColspan, isCollapsed } = headerSettings ?? {};
    const isNodeCollapsible = collapsible === true &&
      (origColspan ?? 0) > 1 &&
      column >= (this.hot.getSettings().fixedColumnsStart ?? 0);
    const isAriaTagsEnabled = this.hot.getSettings().ariaTags;
    let collapsibleElement = TH.querySelector<HTMLElement>(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

    removeAttribute(TH, [
      A11Y_EXPANDED('')[0]
    ]);

    if (isNodeCollapsible) {
      if (!collapsibleElement) {
        collapsibleElement = this.hot.rootDocument.createElement('div');

        addClass(collapsibleElement, COLLAPSIBLE_ELEMENT_CLASS);
        TH.querySelector('div:first-child')?.appendChild(collapsibleElement);
      }

      const el = collapsibleElement;

      removeClass(el, ['collapsed', 'expanded']);

      if (isCollapsed) {
        addClass(el, 'collapsed');

        fastInnerText(el, '+');

        // Add ARIA tags
        if (isAriaTagsEnabled) {
          setAttribute(TH, ...A11Y_EXPANDED(false));
        }

      } else {
        addClass(el, 'expanded');

        fastInnerText(el, '-');

        // Add ARIA tags
        if (isAriaTagsEnabled) {
          setAttribute(TH, ...A11Y_EXPANDED(true));
        }
      }

      if (isAriaTagsEnabled) {
        setAttribute(el, ...A11Y_HIDDEN());
      }

    } else {
      collapsibleElement?.remove();
    }
  };

  /**
   * Indicator mouse event callback.
   *
   * @param {object} event Mouse event.
   * @param {object} coords Event coordinates.
   */
  #onBeforeOnCellMouseDown = (event: MouseEvent, coords: { row: number; col: number }) => {
    const target = eventTargetEl(event)!;

    if (hasClass(target, COLLAPSIBLE_ELEMENT_CLASS)) {
      if (hasClass(target, 'expanded')) {
        this.eventManager.fireEvent(target, 'mouseup');
        this.toggleCollapsibleSection([coords], 'collapse');

      } else if (hasClass(target, 'collapsed')) {
        this.eventManager.fireEvent(target, 'mouseup');
        this.toggleCollapsibleSection([coords], 'expand');
      }

      stopImmediatePropagation(event);
    }
  };

  /**
   * Updates the plugin state after HoT initialization.
   */
  #onInit = () => {
    // @TODO: Workaround for broken plugin initialization abstraction (#6806).
    this.updatePlugin();
  };

  /**
   * Updates the plugin state after new dataset load.
   *
   * @param {Array[]} sourceData Array of arrays or array of objects containing data.
   * @param {boolean} initialLoad Flag that determines whether the data has been loaded
   *                              during the initialization.
   */
  #onAfterLoadData = (_sourceData: unknown[], initialLoad: boolean) => {
    if (!initialLoad) {
      this.updatePlugin();
    }
  };

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.#collapsedColumnsMap = null;
    this.#visibleWhenMap = null;

    super.destroy();
  }
}
