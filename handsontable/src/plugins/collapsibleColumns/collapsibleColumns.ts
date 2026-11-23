import { BasePlugin } from '../base';
import type { HidingMap } from '../../translations';
import { arrayEach, arrayFilter, arrayMap, arrayUnique, getDifferenceOfArrays } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { warn } from '../../helpers/console';
import {
  addClass,
  eventTargetEl,
  hasClass,
  removeClass,
  removeAttribute,
  setAttribute
} from '../../helpers/dom/element';
import { hasTouchList } from '../../helpers/dom/event';
import { isLongPressReplay } from '../../helpers/dom/longPress';
import { armPressRelease, getCoordsWithinGrid } from '../../helpers/dom/pointerRelease';
import { throwWithCause } from '../../helpers/errors';
import { isPlainObject } from '../../helpers/object';
import { clampFixedColumnsEnd } from '../../3rdparty/walkontable/src/settings/fixedColumnsEnd';
import { syncIcon } from '../../themes/engine/icons';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcuts/contexts';
import {
  A11Y_EXPANDED,
  A11Y_HIDDEN
} from '../../helpers/a11y';
import type { NestedHeaders } from '../nestedHeaders/nestedHeaders';
import type StateManager from '../nestedHeaders/stateManager';
import type { ColumnVisibility } from '../nestedHeaders/stateManager/columnVisibility';
import { getEndOverlayHeaders } from '../../utils/endOverlayHeaders';
import { announce } from '../../utils/a11yAnnouncer';
import { getHeaderLabelText } from '../../utils/headerLabel';
import { spreadsheetColumnLabel } from '../../helpers/data';
import { isGridBodyCovered } from '../../shortcuts/guards';
import {
  COLLAPSIBLE_COLUMNS_ANNOUNCEMENT_COLLAPSED,
  COLLAPSIBLE_COLUMNS_ANNOUNCEMENT_EXPANDED,
} from '../../i18n/constants';
import { findClosestToggleLevel } from './toggleLevel';
import { LICENSE, PLUGIN_DEPS } from './feature.generated';

export const PLUGIN_KEY = 'collapsibleColumns';
export const PLUGIN_PRIORITY = 290;
const SETTING_KEYS = ['nestedHeaders'];
const COLLAPSIBLE_ELEMENT_CLASS = 'collapsibleIndicator';
/**
 * The `syncIcon()` slot class of the collapse/expand icon inside the indicator.
 *
 * @type {string}
 */
const INDICATOR_ICON_SLOT_CLASS = 'collapsibleIndicator__icon';
// Name of the hiding map that holds columns hidden by the per-child `visibleWhen` rules (issue
// #10243). Kept separate from the main collapsed-columns map so `getCollapsedColumns()` and the
// collapse hooks never report a column that is merely hidden in the expanded state.
const VISIBLE_WHEN_MAP_NAME = 'collapsibleColumns.visibleWhen';
const SHORTCUTS_GROUP = PLUGIN_KEY;
// The group both sorting plugins register their `Enter` header shortcut under. A string, not an import:
// plugins do not import each other.
const SHORTCUTS_GROUP_SORTING = 'columnSorting';

/**
 * The collapsed header groups, as `CollapsibleColumns#captureState()` records them.
 */
interface CollapsedGroupsState {
  readonly groups: ReadonlyArray<{ headerLevel: number, authoredColumnIndex: number }>;
  /**
   * The header state manager's config version when the groups were recorded. Groups from another
   * `nestedHeaders` configuration name that configuration's headers.
   */
  readonly configVersion: number;
}

/**
 * The collapsed header groups of one dataset, as `CollapsibleColumns#_exportViewState()` returns them.
 * The columns they hide are not part of it: the import derives them from the groups.
 */
export interface CollapsedColumnsViewState {
  groups: Array<{ headerLevel: number, authoredColumnIndex: number }>;
}

/**
 * Tells whether a value is a state `CollapsibleColumns#captureState()` recorded.
 *
 * @param {*} value The value to test.
 * @returns {boolean}
 */
function isCollapsedGroupsState(value: unknown): value is CollapsedGroupsState {
  return typeof value === 'object' && value !== null && 'groups' in value && Array.isArray(value.groups) &&
    'configVersion' in value && typeof value.configVersion === 'number';
}

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
 * Read more:
 * - [Guides: Column groups](@/guides/columns/column-groups/column-groups.md#collapsible-headers)
 * - [Setting options: `collapsibleColumns`](@/api/options.md#collapsiblecolumns)
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
    return [...PLUGIN_DEPS];
  }

  /**
   * Returns the license token of the plugin, its display name, where it is checked, and the tokens it
   * requires.
   */
  static get LICENSE() {
    return LICENSE;
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
  nestedHeadersPlugin: NestedHeaders | null = null;
  /**
   * The NestedHeaders plugin StateManager instance.
   *
   * @private
   * @type {StateManager}
   */
  headerStateManager: StateManager | null = null;
  /**
   * Map of collapsed columns by the plugin.
   */
  #collapsedColumnsMap: HidingMap | null = null;
  /**
   * Map of columns hidden by the per-child `visibleWhen` rules (issue #10243), kept separate from
   * `#collapsedColumnsMap`.
   */
  #visibleWhenMap: HidingMap | null = null;
  /**
   * The collapsed-groups version of the header state manager at which each state `captureState()`
   * returned was last known to be current. Kept out of the state itself: a state returned again
   * after a version change must still be the same object.
   */
  #capturedVersions = new WeakMap<object, number>();
  /**
   * The collapsed-groups version of the header state manager at the start of each column cache update
   * in progress, innermost last. A version that moved by the end of the update means NestedHeaders
   * re-derived the header tree for a new column order there.
   */
  #versionsBeforeCacheUpdate: number[] = [];
  /**
   * `true` from an enable or update until the ready step writes the `collapsible` flags. While it is set,
   * NestedHeaders' `afterHeaderStateRebuild` local hook leaves the flags to the step, which runs right after
   * NestedHeaders' own, so one pass writes them once.
   *
   * @type {boolean}
   */
  #flagsOwed = false;
  /**
   * Whether the ready step still owes the check that `nestedHeaders` is configured. Set by `enablePlugin()`,
   * because the settings it runs on may not be the ones in force once the data is loaded (a sheet's own
   * `nestedHeaders` under SheetsBar arrives after the grid-level enable).
   */
  #nestedHeadersCheckOwed = false;

  /**
   * The visual columns of the group <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>ArrowUp</kbd> is collapsing,
   * set only while that toggle runs, for a press on a data cell and on a column header alike. When
   * the collapse hides the highlighted column, the selection moves to the first column of this range
   * that is still shown, in the row it was in, so the same key expands the same group again.
   *
   * @type {{ from: number, to: number }|null}
   */
  #keyToggleGroupColumns: { from: number, to: number } | null = null;

  /**
   * Drops the press on an indicator that waits for its release (see `#onBeforeOnCellMouseDown`). The
   * listeners of a press that is still held go with the event manager when the plugin is disabled or
   * destroyed.
   */
  #disposePress: (() => void) | null = null;

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

    if (this.pluginName) {
      this.#collapsedColumnsMap = this.hot.columnIndexMapper
        .createAndRegisterIndexMap(this.pluginName, 'hiding');
    }
    this.#visibleWhenMap = this.hot.columnIndexMapper
      .createAndRegisterIndexMap(VISIBLE_WHEN_MAP_NAME, 'hiding');
    this.nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders');
    this.headerStateManager = this.nestedHeadersPlugin.getStateManager();
    this.nestedHeadersPlugin.addLocalHook('afterHeaderStateRebuild', this.#onAfterHeaderStateRebuild);

    this.addHook('afterGetColHeader', this.#onAfterGetColHeader);
    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    // NestedHeaders (priority 280) rebuilds the header tree on column insert/remove/move before this
    // plugin (priority 290) runs, so refreshing here re-derives the `visibleWhen` hidden set against
    // the freshly rebuilt tree (with `isCollapsed` re-attached by group identity). On a move a group
    // that stayed contiguous keeps its collapse; a split group has its `isCollapsed` dropped, so the
    // re-derived `visibleWhen` set excludes it and these columns are released.
    this.addHook('afterCreateCol', this.#onAfterColumnStructureChange);
    this.addHook('afterRemoveCol', this.#onAfterColumnStructureChange);
    this.addHook('beforeColumnMove', this.#onBeforeColumnMove);
    this.addHook('afterColumnMove', this.#onAfterColumnStructureChange);
    this.hot.columnIndexMapper.addLocalHook('beforeCacheUpdate', this.#onBeforeColumnCacheUpdate);
    this.hot.columnIndexMapper.addLocalHook('afterCacheUpdate', this.#onAfterColumnCacheUpdate);

    this.registerShortcuts();
    this.#flagsOwed = true;
    this.#nestedHeadersCheckOwed = true;
    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *   - [`collapsibleColumns`](@/api/options.md#collapsiblecolumns)
   *   - [`nestedHeaders`](@/api/options.md#nestedheaders)
   *
   * The update runs in the plugin's ready step, once the call returns and the data is loaded.
   */
  updatePlugin(): void {
    this.#flagsOwed = true;
    super.updatePlugin();
  }

  /**
   * Marks the collapsible headers and hides the `visibleWhen` columns, against the header tree NestedHeaders
   * (priority 280) built in its own ready step just before this one. Core runs it once after each enable or
   * update, when the data is loaded. The step that follows an enable also warns when no `nestedHeaders`
   * setting is in force, which is read here rather than in `enablePlugin()` because a sheet's own setting
   * under SheetsBar is applied after the grid-level enable.
   *
   * @private
   */
  onGridReady(): void {
    if (this.#nestedHeadersCheckOwed) {
      this.#nestedHeadersCheckOwed = false;

      if (!this.hot.getSettings().nestedHeaders && !this.#sheetsDeclareNestedHeaders()) {
        warn('You need to configure the Nested Headers plugin in order to use collapsible headers.');
      }
    }

    this.#flagsOwed = false;
    this.#applyCollapsibleFlags();
  }

  /**
   * Tells whether any entry of the `sheetsBar.sheets` setting declares `nestedHeaders` of its own. The
   * ready step runs with the opening sheet's settings in force, so a workbook whose first sheet has no
   * nested headers while a later one does would otherwise warn at init. The entries are read from the
   * grid settings, not from the SheetsBar plugin, so this plugin stays decoupled from it; a sheet added
   * later through the SheetsBar API is not seen, and an update does not re-check.
   *
   * @returns {boolean}
   */
  #sheetsDeclareNestedHeaders(): boolean {
    const { sheetsBar } = this.hot.getSettings();
    const sheets = isPlainObject(sheetsBar) ? sheetsBar.sheets : undefined;

    return Array.isArray(sheets) && sheets.some(sheet => Boolean(sheet?.settings?.nestedHeaders));
  }

  /**
   * Writes the `collapsible` flags of the plugin's settings into the NestedHeaders state, then applies
   * the per-child `visibleWhen` rules. NestedHeaders resets those flags whenever its ready step builds its
   * state from its own setting (after a data load, or a `nestedHeaders` update), so this runs again from its
   * `afterHeaderStateRebuild` local hook. Relying on this plugin's own `afterLoadData` listener lost them:
   * that listener runs before the NestedHeaders one, which then reset the flags.
   */
  #applyCollapsibleFlags(): void {
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
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    this.hot.columnIndexMapper.removeLocalHook('beforeCacheUpdate', this.#onBeforeColumnCacheUpdate);
    this.hot.columnIndexMapper.removeLocalHook('afterCacheUpdate', this.#onAfterColumnCacheUpdate);
    this.#versionsBeforeCacheUpdate = [];

    if (this.pluginName) {
      this.hot.columnIndexMapper.unregisterMap(this.pluginName);
    }
    this.hot.columnIndexMapper.unregisterMap(VISIBLE_WHEN_MAP_NAME);
    this.#collapsedColumnsMap = null;
    this.#visibleWhenMap = null;
    this.nestedHeadersPlugin?.removeLocalHook('afterHeaderStateRebuild', this.#onAfterHeaderStateRebuild);
    this.nestedHeadersPlugin = null;

    this.unregisterShortcuts();
    this.clearButtons();
    super.disablePlugin();
    this.#nestedHeadersCheckOwed = false;
  }

  /**
   * Register shortcuts responsible for toggling collapsible columns.
   *
   * @private
   */
  registerShortcuts() {
    const context = this.hot.getShortcutManager().getContext('grid');
    // Enter on a collapsible header collapses it and never sorts, whichever plugin registered first: when
    // a sorting shortcut is already on `Enter`, go in front of it, otherwise in front of the editor.
    const hasSortingShortcut = context?.getShortcuts(['Enter'])
      .some(({ group }) => group === SHORTCUTS_GROUP_SORTING);

    context
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

          this.#toggleSectionByUser({ row, col: columnIndex }, isCollapsed ? 'expand' : 'collapse');

          // prevent default Enter behavior (move to the next row within a selection range)
          return false;
        },
        runOnlyIf: (): boolean => !!(this.hot.getSelectedRangeActive()?.isSingle() &&
          this.hot.getSelectedRangeActive()?.highlight.isHeader()),
        group: SHORTCUTS_GROUP,
        relativeToGroup: hasSortingShortcut ? SHORTCUTS_GROUP_SORTING : SHORTCUTS_GROUP_EDITOR,
        position: 'before',
      });

    context?.addShortcut({
      keys: [['Shift', 'Alt', 'ArrowUp']],
      callback: () => {
        const target = this.#getKeyToggleTarget();

        if (target) {
          this.#keyToggleGroupColumns = target.groupColumns;

          try {
            this.#toggleSectionByUser(target.coords, target.action);
          } finally {
            this.#keyToggleGroupColumns = null;
          }
        }

        return false;
      },
      runOnlyIf: (): boolean => this.#getKeyToggleTarget() !== null,
      group: SHORTCUTS_GROUP,
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
   * Clears the expand/collapse buttons. The buttons live in the header rows the table drew last, so
   * those rows are walked, not the levels the settings declare: an update that turns the plugin off
   * together with a deeper `nestedHeaders` disables it while the table still shows the previous levels.
   *
   * @private
   */
  clearButtons() {
    if (!this.hot.view) {
      return;
    }

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

    const headerLevels = mainHeaders.childNodes.length;

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

      // The inline-end clones render only the last columns, so they are walked on their own.
      getEndOverlayHeaders(this.hot).forEach((endHeaders) => {
        endHeaders.childNodes[i]?.childNodes.forEach((endChild) => {
          removeButton((endChild as Element).querySelector<HTMLElement>(`.${COLLAPSIBLE_ELEMENT_CLASS}`));
        });
      });
    });
  }

  /**
   * Expands section at the provided coords. `coords.col` may be any column the group's header spans,
   * not only its first (anchor) column - it resolves to the owning collapsible group.
   *
   * @param {object} coords Contains coordinates information. (`coords.row`, `coords.col`).
   */
  expandSection(coords: { row: number, col: number }): void {
    this.toggleCollapsibleSection([coords], 'expand');
  }

  /**
   * Collapses section at the provided coords. `coords.col` may be any column the group's header spans,
   * not only its first (anchor) column - it resolves to the owning collapsible group.
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
          row: this.headerStateManager?.levelToRowCoords(Number(headerLevel)) ?? 0,
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
    this.runOperation(action === 'expand' ? 'expand_columns' : 'collapse_columns',
      () => this.#toggleCollapsibleSection(coords, action));
  }

  /**
   * Returns the collapsed header groups, for UndoRedo. The columns they hide are restored with the
   * rest of the index maps. When the groups did not change since the previous capture, the previous
   * state itself is returned.
   *
   * @private
   * @param {*} previous The value the previous capture returned.
   * @returns {object|undefined}
   */
  captureState(previous: unknown): unknown {
    if (this.headerStateManager === null) {
      return undefined;
    }

    const version = this.headerStateManager.getCollapsedGroupsVersion();
    const configVersion = this.headerStateManager.getConfigVersion();
    const isSameConfig = isCollapsedGroupsState(previous) && previous.configVersion === configVersion;

    // Every transaction captures the state, so the tree is walked only when it may have changed.
    if (isSameConfig && this.#capturedVersions.get(previous) === version) {
      return previous;
    }

    const groups = this.headerStateManager.exportCollapsedGroups();
    const state = (
      isSameConfig &&
      previous.groups.length === groups.length &&
      previous.groups.every((group, index) => group.headerLevel === groups[index].headerLevel &&
        group.authoredColumnIndex === groups[index].authoredColumnIndex)
    ) ? previous : { groups, configVersion };

    this.#capturedVersions.set(state, version);

    return state;
  }

  /**
   * A group is recorded by its header position, and the columns a collapse hides are in this plugin's
   * hiding maps, which the UndoRedo check of a `columns` settings update reads column by column. So the
   * groups themselves never make a step unsafe to undo.
   *
   * @private
   * @returns {number[]}
   */
  getStateColumns(): readonly number[] {
    return [];
  }

  /**
   * Collapses exactly the header groups a `captureState()` call recorded, and makes this plugin's
   * hiding map hold the columns those collapses hide. Hook-silent: the collapse hooks fired when the
   * user acted. Groups recorded under another `nestedHeaders` configuration are not put back: they
   * would collapse whatever group of the new one sits at the same position.
   *
   * @private
   * @param {*} state The recorded state.
   */
  restoreState(state: unknown): void {
    if (
      this.headerStateManager !== null && isCollapsedGroupsState(state) &&
      state.configVersion === this.headerStateManager.getConfigVersion()
    ) {
      this.#collapseGroups(state.groups);
    }
  }

  /**
   * Returns the collapsed header groups, for the sheets bar to keep with a sheet the user leaves: a data
   * load rebuilds the header state with every group expanded. `null` while the plugin is off.
   *
   * @private
   * @returns {object|null}
   */
  _exportViewState(): CollapsedColumnsViewState | null {
    if (!this.enabled || this.headerStateManager === null) {
      return null;
    }

    return { groups: this.headerStateManager.exportCollapsedGroups() };
  }

  /**
   * Collapses exactly the groups {@link CollapsibleColumns#_exportViewState} returned, or expands every
   * group for `null`. Like {@link CollapsibleColumns#restoreState}, it writes this plugin's hiding map
   * too, with the columns those collapses hide in the column order and group membership the grid has now,
   * which can differ from the ones the groups were captured under. Unlike it, it does not check the
   * header config version. Hook-silent: the sheets bar calls it on a switch, and the user collapsed those
   * groups on that sheet before.
   *
   * @private
   * @param {object|null} state The collapsed groups.
   */
  _importViewState(state: CollapsedColumnsViewState | null): void {
    if (!this.enabled) {
      return;
    }

    this.#collapseGroups(state?.groups ?? []);
  }

  /**
   * Collapses exactly the given groups on a freshly derived header tree and makes this plugin's hiding
   * map hold the columns those collapses hide, and only them. The groups are the record of what is
   * collapsed, not the map: columns the map kept from an earlier order or membership could hide a column
   * no collapsed group owns, with no header left to show it again. The collapses are derived against
   * the columns hidden by every other source, so a column this map hid before does not move a group's
   * first visible column. Hook-silent.
   *
   * @param {Array<{headerLevel: number, authoredColumnIndex: number}>} groups The groups to collapse.
   */
  #collapseGroups(groups: ReadonlyArray<{ headerLevel: number, authoredColumnIndex: number }>): void {
    const map = this.#collapsedColumnsMap;
    const stateManager = this.headerStateManager;

    if (stateManager === null || !map) {
      return;
    }

    const currentColumns = map.getHiddenIndexes();
    const isAlreadyExpanded = groups.length === 0 && currentColumns.length === 0 &&
      stateManager.exportCollapsedGroups().length === 0;
    const nextColumns = isAlreadyExpanded ? [] : arrayMap(
      stateManager.importCollapsedGroups(groups, this.#createVisibilityWithout(map)),
      visualColumn => this.hot.toPhysicalColumn(visualColumn),
    );
    const isUnchanged = nextColumns.length === currentColumns.length &&
      getDifferenceOfArrays(nextColumns, currentColumns).length === 0;

    if (!isUnchanged) {
      this.hot.batchExecution(() => {
        map.clear();
        arrayEach(nextColumns, (physicalColumn) => {
          map.setValueAtIndex(physicalColumn, true);
        });
      }, true);
    }

    this.#refreshVisibleWhenColumns();
  }

  /**
   * Returns a column visibility that reports the columns hidden by every hiding map except the given
   * one.
   *
   * @param {HidingMap} excludedMap The hiding map to leave out.
   * @returns {ColumnVisibility}
   */
  #createVisibilityWithout(excludedMap: HidingMap): ColumnVisibility {
    const mapper = this.hot.columnIndexMapper;
    const otherMaps = mapper.hidingMapsCollection.get().filter(map => map !== excludedMap);

    return {
      isVisible(visualColumn: number) {
        const physicalColumn = mapper.getPhysicalFromVisualIndex(visualColumn);

        return physicalColumn !== null && !otherMaps.some(map => map.getValueAtIndex(physicalColumn) === true);
      },
    };
  }

  /**
   * The body of `toggleCollapsibleSection()`, run inside its operation.
   *
   * @param {Array} coords Array of coords - section coordinates.
   * @param {string} [action] Action definition ('collapse' or 'expand').
   */
  #toggleCollapsibleSection(coords: { row: number, col: number }[], action?: 'collapse' | 'expand'): void {
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

    // The collapse hooks report the collapsed-columns map only. A declarative `visibleWhen` group
    // hides its columns through the separate `#visibleWhenMap` (so `getCollapsedColumns()` stays a
    // faithful record of legacy collapses), so for such a group `destinationCollapsedColumns` equals
    // `currentCollapsedColumns` even though columns were hidden - the `successfullyCollapsed` flag,
    // not the array delta, tells a consumer whether the toggle did anything.
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

    // The declarative `visibleWhen` hidden set is a pure function of the `isCollapsed` flags that the
    // node modification just toggled, so re-derive it and diff against the snapshot taken before the
    // toggle. `newlyHiddenByVisibleWhen` are the columns this toggle hid through `visibleWhen` - on a
    // collapse the group's own columns, on an expand the `visibleWhen: 'collapsed'` summary columns
    // that are only visible while collapsed. Only refresh when it changed, so a plain legacy collapse
    // does not trigger an extra cache update that would disturb the selection adjustment below.
    const visibleWhenHiddenAfter = this.headerStateManager?.getVisibleWhenHiddenColumns() ?? [];
    const newlyHiddenByVisibleWhen = getDifferenceOfArrays(visibleWhenHiddenAfter, visibleWhenHiddenBefore);
    const isVisibleWhenChanged = newlyHiddenByVisibleWhen.length > 0 ||
      visibleWhenHiddenAfter.length !== visibleWhenHiddenBefore.length;

    if (isVisibleWhenChanged) {
      // Pass the already-computed set so the refresh does not walk the header tree a third time.
      this.#refreshVisibleWhenColumns(visibleWhenHiddenAfter);
    }

    const isActionPerformed = this.getCollapsedColumns().length !== currentCollapsedColumns.length ||
      isVisibleWhenChanged;

    // Move the selection off any column this toggle hid - a collapse hides the group's columns plus
    // any `visibleWhen` columns, while an expand hides the `visibleWhen: 'collapsed'` columns that are
    // only visible while collapsed.
    const newlyHiddenColumns = action === 'collapse'
      ? arrayUnique([...affectedColumnsIndexes, ...newlyHiddenByVisibleWhen])
      : newlyHiddenByVisibleWhen;

    if (isActionPerformed && newlyHiddenColumns.length > 0) {
      this.#adjustSelectionAfterHide(newlyHiddenColumns);
    }

    this.hot.runHooks(
      actionTranslator.afterHook,
      currentCollapsedColumns,
      destinationCollapsedColumns,
      isActionPossible,
      isActionPerformed,
    );

    this.hot.render();
  }

  /**
   * Collapses or expands a header group in answer to a user gesture - <kbd>Enter</kbd> on its header,
   * a press on its indicator, or <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>ArrowUp</kbd> - and announces
   * the result to assistive technologies through a polite live region. `aria-expanded` on the header
   * is read only when the header takes the focus again, and a toggle made from a data cell never moves
   * the focus there.
   *
   * The public methods do not announce: an app calling them knows what it changed and can tell the
   * user itself, and `collapseAll()` would otherwise queue one message per group. A toggle that
   * changed nothing (a `beforeColumnCollapse` or `beforeColumnExpand` veto) is silent as well.
   *
   * @param {{ row: number, col: number }} coords The header coordinates of the group.
   * @param {'collapse'|'expand'} action The change to make.
   */
  #toggleSectionByUser(coords: { row: number, col: number }, action: 'collapse' | 'expand'): void {
    const label = this.#getGroupLabel(coords);
    const wasCollapsed = this.#isGroupCollapsed(coords);

    this.toggleCollapsibleSection([coords], action);

    if (this.#isGroupCollapsed(coords) === wasCollapsed || !this.hot.getSettings().ariaTags) {
      return;
    }

    const phrase = action === 'expand' ?
      COLLAPSIBLE_COLUMNS_ANNOUNCEMENT_EXPANDED : COLLAPSIBLE_COLUMNS_ANNOUNCEMENT_COLLAPSED;

    announce(String(this.hot.getTranslatedPhrase(phrase, { label }) ?? ''), 'polite');
  }

  /**
   * Tells whether the header group at the coordinates is collapsed.
   *
   * @param {{ row: number, col: number }} coords The header coordinates of the group.
   * @returns {boolean}
   */
  #isGroupCollapsed({ row, col }: { row: number, col: number }): boolean {
    return this.headerStateManager?.getHeaderTreeNodeData(row, col)?.isCollapsed === true;
  }

  /**
   * Returns the text that names a header group in an announcement: the text its rendered header
   * shows, or its declared label when the header is scrolled out of the viewport. A group without a
   * label is named by the spreadsheet letter of its first column.
   *
   * @param {{ row: number, col: number }} coords The header coordinates of the group.
   * @returns {string}
   */
  #getGroupLabel({ row, col }: { row: number, col: number }): string {
    const nodeData = this.headerStateManager?.getHeaderTreeNodeData(row, col);
    const column = nodeData?.columnIndex ?? col;
    const label = getHeaderLabelText(this.hot.getCell(row, column, true), nodeData?.label);

    return label !== '' ? label : spreadsheetColumnLabel(column);
  }

  /**
   * Tells whether a header group gets a toggle: it is marked collapsible, spans more than one
   * column, and touches neither frozen band, where a collapse would change which columns the band
   * covers.
   *
   * @param {boolean|undefined} collapsible The `collapsible` flag of the header.
   * @param {number|undefined} origColspan The number of columns the header was declared over.
   * @param {number} column The visual index of the header's first column.
   * @returns {boolean}
   */
  #isGroupToggleable(collapsible: boolean | undefined, origColspan: number | undefined, column: number): boolean {
    return collapsible === true &&
      (origColspan ?? 0) > 1 &&
      column >= (this.hot.getSettings().fixedColumnsStart ?? 0) &&
      !this.#reachesFixedColumnsEnd(column, origColspan ?? 0);
  }

  /**
   * Resolves the header group <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>ArrowUp</kbd> toggles, or `null`
   * when the key does not apply. From a data cell it is the group closest to the data among the
   * headers over the cell's column. From a column header it is that header's own group, or the
   * closest group above it. The key works with `navigableHeaders` off, where no header can take the
   * focus. It applies to a single selection range only, and from a data cell only while nothing
   * covers the grid body.
   *
   * The answer also carries the group's visual column range. A header below the group can sit over a
   * column the collapse hides, as a data cell can, and the selection then has to stay in the group.
   *
   * @returns {{ coords: { row: number, col: number }, action: 'collapse'|'expand',
   * groupColumns: { from: number, to: number } }|null}
   */
  #getKeyToggleTarget(): {
    coords: { row: number, col: number },
    action: 'collapse' | 'expand',
    groupColumns: { from: number, to: number },
  } | null {
    const stateManager = this.headerStateManager;
    const highlight = this.hot.getSelectedRangeActive()?.highlight;

    if (!stateManager || !highlight || this.hot.getSelectedRange()?.length !== 1) {
      return null;
    }

    const { row, col } = highlight;

    if (row === null || col === null || col < 0 || (row >= 0 && isGridBodyCovered(this.hot))) {
      return null;
    }

    const startLevel = row < 0 ? stateManager.rowCoordsToLevel(row) : stateManager.getLayersCount() - 1;
    const headerLevel = startLevel === null ? null : findClosestToggleLevel(startLevel, (level) => {
      const nodeData = stateManager.getHeaderTreeNodeData(level, col);

      return !!nodeData &&
        this.#isGroupToggleable(nodeData.collapsible, nodeData.origColspan, nodeData.columnIndex);
    });
    const nodeData = headerLevel === null ? null : stateManager.getHeaderTreeNodeData(headerLevel, col);
    const headerRow = headerLevel === null ? null : stateManager.levelToRowCoords(headerLevel);

    if (!nodeData || headerRow === null) {
      return null;
    }

    const lastColumn = nodeData.columnIndex + Math.max(nodeData.origColspan, 1) - 1;

    return {
      coords: { row: headerRow, col: nodeData.columnIndex },
      action: nodeData.isCollapsed ? 'expand' : 'collapse',
      groupColumns: { from: nodeData.columnIndex, to: lastColumn },
    };
  }

  /**
   * Returns the column the selection moves to when a toggle hid the highlighted one: the nearest
   * column that is still shown, or, for the <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>ArrowUp</kbd> key, the
   * first column of the toggled group that is still shown. The nearest column can belong to the next group, and the key would then
   * toggle that group on the next press.
   *
   * @param {number} column The visual index of the highlighted column, hidden by the toggle.
   * @returns {number|null}
   */
  #getColumnAfterHide(column: number): number | null {
    const { columnIndexMapper } = this.hot;
    const groupColumns = this.#keyToggleGroupColumns;

    if (groupColumns) {
      for (let groupColumn = groupColumns.from; groupColumn <= groupColumns.to; groupColumn++) {
        if (!columnIndexMapper.isHidden(this.hot.toPhysicalColumn(groupColumn))) {
          return groupColumn;
        }
      }
    }

    return columnIndexMapper.getNearestNotHiddenIndex(column, 1, true);
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
   * Moves the active cell selection off any column a collapse or expand action just hid, so the
   * highlight never lingers on a now-hidden column (for example a `visibleWhen: 'collapsed'` summary
   * column that is hidden again when its group expands).
   *
   * @param {number[]} hiddenColumnsIndexes Visual indexes of columns this action hid.
   */
  #adjustSelectionAfterHide(hiddenColumnsIndexes: number[]): void {
    const selectionRange = this.hot.getSelectedRangeActive();

    if (!selectionRange) {
      return;
    }

    const { row, col } = selectionRange.highlight;

    if (row === null || col === null) {
      return;
    }

    const isHidden = this.hot.rowIndexMapper.isHidden(row) || this.hot.columnIndexMapper.isHidden(col);

    if (isHidden && hiddenColumnsIndexes.includes(col)) {
      const nextRow = row >= 0 ? this.hot.rowIndexMapper.getNearestNotHiddenIndex(row, 1, true) : row;
      const nextColumn = col >= 0 ? this.#getColumnAfterHide(col) : col;

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
   * update, or column insert/remove. The hidden set is passed in by the toggle path (which has just
   * computed it) and re-derived for the settings/structure-change paths. The map is rewritten only
   * when the hidden set actually changed, so a legacy collapsible setup - which never produces a
   * `visibleWhen` hidden set - does not pay an index-cache rebuild on every update.
   */
  #refreshVisibleWhenColumns(
    visualColumnsToHide = this.headerStateManager?.getVisibleWhenHiddenColumns() ?? []
  ): void {
    if (!this.#visibleWhenMap) {
      return;
    }

    const visibleWhenMap = this.#visibleWhenMap;
    const nextHiddenColumns = arrayMap(visualColumnsToHide, visualColumn => this.hot.toPhysicalColumn(visualColumn));
    const currentHiddenColumns = visibleWhenMap.getHiddenIndexes();
    const isUnchanged = nextHiddenColumns.length === currentHiddenColumns.length &&
      getDifferenceOfArrays(nextHiddenColumns, currentHiddenColumns).length === 0;

    if (isUnchanged) {
      return;
    }

    this.hot.batchExecution(() => {
      visibleWhenMap.clear();

      arrayEach(nextHiddenColumns, (physicalColumn) => {
        visibleWhenMap.setValueAtIndex(physicalColumn, true);
      });
    }, true);
  }

  /**
   * Re-derives the `visibleWhen` hidden set after NestedHeaders rebuilds the header tree on column
   * insertion or removal. The tree (with `isCollapsed` restored) is the source of truth, so a full
   * refresh keeps the hidden set correct without tracking shifted indexes manually.
   */
  #onAfterColumnStructureChange = () => {
    this.#refreshVisibleWhenColumns();
  };

  /**
   * Expands, before a column move runs, any collapsed group the move would split - whether by taking
   * some (but not all) of the group's columns out, or by dropping an unrelated column into the middle
   * of its span. Both leave the group's columns non-adjacent, which drops its collapse indicator while
   * the columns stay hidden, with no control left to expand them. Expanding while the group is still
   * contiguous releases its columns through the normal expand path; hiding does not change visual
   * indexes, so the pending move's coordinates stay valid. A move that keeps a group's columns
   * together (including moving the whole group) leaves it collapsed.
   *
   * @param {number[]} movedColumns Visual indexes of the columns being moved.
   * @param {number} finalIndex The visual index the moved columns will start at after the move.
   * @param {number|undefined} dropIndex The drop visual index (unused).
   * @param {boolean} movePossible Whether the move can be performed.
   */
  #onBeforeColumnMove = (movedColumns: number[], finalIndex: number, dropIndex: number | undefined,
                         movePossible: boolean) => {
    const stateManager = this.headerStateManager;

    if (movePossible === false || !stateManager) {
      return;
    }

    const projectedOrder = this.#projectColumnOrderAfterMove(movedColumns, finalIndex);
    const positionByColumn = new Map(projectedOrder.map((visualColumn, position) => [visualColumn, position]));

    stateManager.getCollapsedGroups().forEach(({ headerLevel, columnIndex, origColspan }) => {
      if (this.#isGroupSplitByOrder(columnIndex, origColspan, positionByColumn)) {
        const row = stateManager.levelToRowCoords(headerLevel);

        if (row !== null) {
          this.toggleCollapsibleSection([{ row, col: columnIndex }], 'expand');
        }
      }
    });
  };

  /**
   * Projects the visual column order a pending move will produce, expressed in the current visual
   * indexes. Mirrors the move itself: remove the moved columns, then re-insert them at `finalIndex`.
   *
   * @param {number[]} movedColumns Visual indexes of the columns being moved.
   * @param {number} finalIndex The visual index the moved columns will start at after the move.
   * @returns {number[]} The current visual indexes in their post-move order.
   */
  #projectColumnOrderAfterMove(movedColumns: number[], finalIndex: number): number[] {
    const movedColumnsSet = new Set(movedColumns);
    const remaining: number[] = [];

    for (let column = 0, columnsCount = this.hot.countCols(); column < columnsCount; column++) {
      if (!movedColumnsSet.has(column)) {
        remaining.push(column);
      }
    }

    return [...remaining.slice(0, finalIndex), ...movedColumns, ...remaining.slice(finalIndex)];
  }

  /**
   * Reports whether a group's columns stop being adjacent in the projected post-move order. The group
   * is split when its members no longer occupy one contiguous run of positions.
   *
   * @param {number} columnIndex The group's leftmost visual column index.
   * @param {number} origColspan The group's column span.
   * @param {Map<number, number>} positionByColumn Maps a current visual index to its post-move position.
   * @returns {boolean} `true` when the move would split the group.
   */
  #isGroupSplitByOrder(columnIndex: number, origColspan: number, positionByColumn: Map<number, number>): boolean {
    let minPosition = Infinity;
    let maxPosition = -Infinity;
    let memberCount = 0;

    for (let column = columnIndex; column < columnIndex + origColspan; column++) {
      const position = positionByColumn.get(column);

      if (position !== undefined) {
        minPosition = Math.min(minPosition, position);
        maxPosition = Math.max(maxPosition, position);
        memberCount += 1;
      }
    }

    return memberCount > 0 && (maxPosition - minPosition) !== (memberCount - 1);
  }

  /**
   * Brings an indicator's content in line with its state: the '+'/'-' text, kept as a no-CSS
   * fallback (`text-indent` and `font-size: 0` hide it visually), followed by one icon.
   *
   * This runs for every collapsible header on every draw, so it touches only what changed. The
   * text node is updated in place and the icon goes through `syncIcon()`, which keeps the same
   * element (and does not re-run a renderer callback) until the state or the theme's icon mapping
   * changes. Emptying the indicator on each draw, which `fastInnerText()` does once the text has
   * a sibling, rebuilt both nodes per header per scroll frame.
   *
   * @param {HTMLElement} indicator The `.collapsibleIndicator` element.
   * @param {string} text The fallback text.
   * @param {string} iconName The icon to show.
   */
  #syncIndicatorContent(indicator: HTMLElement, text: string, iconName: 'collapseOn' | 'collapseOff') {
    const first = indicator.firstChild;

    if (first?.nodeType === 3) {
      if (first.textContent !== text) {
        first.textContent = text;
      }
    } else {
      indicator.insertBefore(this.hot.rootDocument.createTextNode(text), first);
    }

    syncIcon(this.hot, indicator, INDICATOR_ICON_SLOT_CLASS, iconName);
  }

  /**
   * Checks whether a group that starts at the column and spans `colspan` columns touches the
   * `fixedColumnsEnd` band. Such a group gets no toggle: collapsing it would move the band over other columns
   * (the same reason a group that starts in the `fixedColumnsStart` band gets none).
   *
   * The group is judged by its authored range, never by its visible end. A collapsed group hides its last
   * columns, and a hidden column keeps its slot in the band, so judging by the visible end would give the
   * group a toggle while it is collapsed and take it away once it expands over the band.
   *
   * @param {number} column The visual column the group starts at.
   * @param {number} colspan The authored number of columns of the group.
   * @returns {boolean}
   */
  #reachesFixedColumnsEnd(column: number, colspan: number): boolean {
    const settings = this.hot.getSettings();
    // The configured band, not the drawn one: with `limitFixedToViewport` the grid may draw fewer end columns for now,
    // and a group collapsed inside the configured band would end up in the frozen band when the grid grows.
    const fixedColumnsEnd = clampFixedColumnsEnd(
      settings.fixedColumnsEnd, settings.fixedColumnsStart, this.hot.countCols()
    );

    if (!fixedColumnsEnd) {
      return false;
    }

    return column + colspan - 1 >= this.hot.countCols() - fixedColumnsEnd;
  }

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
    const isNodeCollapsible = this.#isGroupToggleable(collapsible, origColspan, column) &&
      !this.hot.view.isColumnHeaderCorner(TH);
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
        this.#syncIndicatorContent(el, '+', 'collapseOn');

        // Add ARIA tags
        if (isAriaTagsEnabled) {
          setAttribute(TH, ...A11Y_EXPANDED(false));
        }

      } else {
        addClass(el, 'expanded');
        this.#syncIndicatorContent(el, '-', 'collapseOff');

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
   * Indicator mouse event callback. A press on the indicator is claimed at once, so it selects nothing, but
   * the group toggles when the pointer is released over the same indicator: moving it off before letting go
   * cancels the toggle. A tap toggles at once, because Walkontable replays it at `touchend`.
   *
   * @param {object} event Mouse event.
   * @param {object} coords Event coordinates.
   */
  #onBeforeOnCellMouseDown = (event: MouseEvent, coords: { row: number; col: number }) => {
    // Matched by ancestor, like every other icon host's gate: an icon renderer can put markup
    // that takes pointer events inside the indicator, and a press on it must still toggle.
    const target = eventTargetEl(event)?.closest<HTMLElement>(`.${COLLAPSIBLE_ELEMENT_CLASS}`);

    if (target) {
      if (hasClass(target, 'expanded') || hasClass(target, 'collapsed')) {
        // An earlier press whose release was lost would take the synthetic `mouseup` below for its own, so it
        // is dropped first. The event is fired before this press is armed, so it is not taken for its release.
        this.#disposePress?.();
        this.#disposePress = null;
        this.eventManager.fireEvent(target, 'mouseup');

        if (hasTouchList(event)) {
          // A tap acts at once. A long press is replayed with the finger still down and acts on nothing.
          if (!isLongPressReplay(event)) {
            this.#toggleSectionByUser(coords, hasClass(target, 'expanded') ? 'collapse' : 'expand');
          }

        } else {
          this.#armIndicatorPress(event, coords);
        }
      }

      // Only the grid's own flag, which makes the table skip selection handling. The shared
      // `stopImmediatePropagation()` helper also sets `cancelBubble`, so the press would never reach
      // `document` and a dropdown menu or context menu open at that moment would not close (DEV-214).
      (event as MouseEvent & { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled = false;
    }
  };

  /**
   * Waits for the release of a press on an indicator, and toggles the group there when it is over the same
   * indicator.
   *
   * @param {MouseEvent} event The `mousedown` event.
   * @param {object} coords The coordinates of the pressed header.
   */
  #armIndicatorPress(event: MouseEvent, coords: { row: number; col: number }): void {
    // The header cell resolves to the same coordinates at the release, whatever node a render put there.
    const isSameIndicator = (releaseTarget: HTMLElement | null) => {
      const indicator = releaseTarget?.closest<HTMLElement>(`.${COLLAPSIBLE_ELEMENT_CLASS}`) ?? null;
      const header = indicator?.closest<HTMLElement>('th') ?? null;
      const releaseCoords = getCoordsWithinGrid(this.hot, header);

      return !!releaseCoords && releaseCoords.row === coords.row && releaseCoords.col === coords.col;
    };

    this.#disposePress = armPressRelease(this.eventManager, this.hot.rootDocument, event, {
      isSame: isSameIndicator,
      onRelease: () => {
        this.#disposePress = null;
        // The state is read again: it is what the user sees at the release.
        this.#toggleSectionByUser(coords, this.#isGroupCollapsed(coords) ? 'expand' : 'collapse');
      },
      onCancel: () => {
        this.#disposePress = null;
      },
    });
  }

  /**
   * Records the collapsed-groups version at the start of a column cache update.
   */
  #onBeforeColumnCacheUpdate = () => {
    this.#versionsBeforeCacheUpdate.push(this.headerStateManager?.getCollapsedGroupsVersion() ?? 0);
  };

  /**
   * Collapses the current groups again when NestedHeaders re-derived the header tree during the column
   * cache update that just ended, which it does for a new column order. A write that is not a column move
   * (`setIndexesSequence()`) never reaches `#onBeforeColumnMove`, so a collapsed group the new order split
   * lost its collapse in the re-derive while this plugin's map still hid its columns. Runs after the
   * update, so the map write starts a cache update of its own.
   */
  #onAfterColumnCacheUpdate = () => {
    const versionBefore = this.#versionsBeforeCacheUpdate.pop();
    const stateManager = this.headerStateManager;

    if (!this.enabled || stateManager === null || versionBefore === stateManager.getCollapsedGroupsVersion()) {
      return;
    }

    this.#collapseGroups(stateManager.exportCollapsedGroups());
  };

  /**
   * NestedHeaders' `afterHeaderStateRebuild` local hook callback. Its state was just built from the
   * `nestedHeaders` setting, without the `collapsible` flags, so they are written again.
   */
  #onAfterHeaderStateRebuild = () => {
    if (this.enabled && this.hot.view && !this.#flagsOwed) {
      this.#applyCollapsibleFlags();
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
