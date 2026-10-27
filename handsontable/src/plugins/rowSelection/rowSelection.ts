import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { isPlainObject } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import {
  addClass,
  empty,
  eventTargetEl,
  getCellContentRoot,
  hasClass,
  isBottomMostColumnHeader,
  removeAttribute,
  removeClass,
  setAttribute,
} from '../../helpers/dom/element';
import { isLeftClick, isTouchEvent } from '../../helpers/dom/event';
import { A11Y_CHECKED, A11Y_LABEL } from '../../helpers/a11y';
import { canAccessCellContent } from '../../shortcuts/guards';
import { isUndoRedoSource } from '../../utils/undoRedoSource';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcuts/contexts';
import {
  ROW_SELECTION_ANNOUNCE_COUNT,
  ROW_SELECTION_ANNOUNCE_ROW_DESELECTED,
  ROW_SELECTION_ANNOUNCE_ROW_SELECTED,
  ROW_SELECTION_MENU_CLEAR,
  ROW_SELECTION_MENU_REMOVE,
  ROW_SELECTION_SELECT_ALL,
  ROW_SELECTION_SELECT_ROW,
} from '../../i18n/constants';
import { announce } from '../../utils/a11yAnnouncer';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import type { HotInstance } from '../../core/types';
import type { PluginTypeMap } from '../types';
import {
  collectRowsInScope,
  computeHeaderCheckboxState,
  isSelectAllScope,
  resolveHeaderToggleTarget,
  type HeaderCheckboxSummary,
  type ScopeHost,
  type SelectAllScope,
} from '../../utils/rowScope';
import { RowIdSelection, type ServerRowSelection } from './rowIdSelection';
import {
  getCheckboxCellMeta,
  isCheckboxMeta,
  isCheckedValue,
  writeCheckboxColumn,
  type CheckboxMeta,
} from '../../utils/checkboxColumn';
import { warn } from '../../helpers/console';
import { syncIcon } from '../../themes/engine/icons';
import type { PhysicalIndexToValueMap } from '../../translations';

Hooks.getSingleton().register('beforeRowSelectionChange');
Hooks.getSingleton().register('afterRowSelectionChange');

export const PLUGIN_KEY = 'rowSelection';
export const PLUGIN_PRIORITY = 385;

const SHORTCUTS_GROUP = PLUGIN_KEY;
const CHECKBOX_CLASS = 'htRowSelectionCheckbox';
const CHECKBOX_BOX_CLASS = 'htRowSelectionCheckboxBox';
const CHECKBOX_ICON_CLASS = 'htRowSelectionCheckboxIcon';
const ROW_CELL_CLASS = 'htRowSelectionCell';
const HEADER_CELL_CLASS = 'htRowSelectionHeader';
const CORNER_CELL_CLASS = 'htRowSelectionCorner';
const CHECKBOX_ONLY_CELL_CLASS = 'htRowSelectionCheckboxOnly';
const SELECTED_ROW_CLASS = 'htRowSelected';
const HIDDEN_CHECKBOX_CLASS = 'htRowSelectionCheckboxHidden';
const DEFAULT_CHECKBOX_SIZE = 16;
const DEFAULT_CELL_PADDING = 8;
const BOUND_WRITE_SOURCE = 'RowSelection.change';

/**
 * Who changed the row selection. Passed to the `beforeRowSelectionChange` and
 * `afterRowSelectionChange` hooks.
 */
export type RowSelectionSource = 'checkbox' | 'headerCheckbox' | 'click' | 'keyboard' | 'api' | 'dataChange';

/**
 * The checked rows of one dataset, as {@link RowSelection#_exportViewState} returns them.
 */
export interface RowSelectionViewState {
  /**
   * The physical rows checked in the selection map.
   */
  rows: number[];
  /**
   * The selection by row id of a server-backed grid, or `null` for a grid that holds its own rows.
   */
  server: ServerRowSelection | null;
  /**
   * The number of rows matching the server query.
   */
  serverTotalRows: number;
}

/**
 * A checkbox column whose values are the row selection: its `data` property, or its physical index.
 */
export interface RowSelectionBoundColumn {
  column: string | number;
}

/**
 * How a click on a cell changes the row selection.
 */
export type RowSelectionClickMode = boolean | 'enableSelection' | 'enableDeselection';

/**
 * The `rowSelection` option's object form.
 */
export interface RowSelectionSettings {
  /**
   * `'multiRow'` lets the user select any number of rows, `'singleRow'` at most one.
   */
  mode?: 'multiRow' | 'singleRow';
  /**
   * Shows a checkbox for each row. A function decides it per row.
   */
  checkboxes?: boolean | ((rowData: unknown, physicalRow: number) => boolean);
  /**
   * Shows the "select all" checkbox. Only in the `'multiRow'` mode.
   */
  headerCheckbox?: boolean;
  /**
   * The rows the "select all" checkbox acts on.
   */
  selectAll?: SelectAllScope;
  /**
   * Lets a click on a cell select its row.
   */
  enableClickSelection?: RowSelectionClickMode;
  /**
   * Decides whether a row can be selected.
   */
  isRowSelectable?: (rowData: unknown, physicalRow: number) => boolean;
  /**
   * Hides the checkbox of a row that cannot be selected, instead of disabling it.
   */
  hideDisabledCheckboxes?: boolean;
  /**
   * Where the checkboxes are rendered: an extra row header column, the first visible column, or a
   * checkbox column whose values are the selection (`{ column: 'selected' }`).
   */
  checkboxLocation?: 'rowHeader' | 'firstColumn' | RowSelectionBoundColumn;
  /**
   * How the rows of a [`NestedRows`](@/api/nestedRows.md) tree are selected: a parent through its
   * descendants (`'descendants'`), every row on its own (`'self'`), or only the top-level rows
   * (`'topLevel'`).
   */
  groupSelects?: RowSelectionGroupSelects;
}

/**
 * How the rows of a NestedRows tree are selected.
 *
 * - `'descendants'` - selecting a parent selects every row under it, and a parent shows a mixed
 *   state while only some of the rows under it are selected.
 * - `'self'` - every row, at any level, is selected on its own.
 * - `'topLevel'` - only the top-level rows can be selected.
 */
export type RowSelectionGroupSelects = 'descendants' | 'self' | 'topLevel';

/**
 * The per-row questions, with everything that does not depend on the row resolved once. A loop over
 * the rows creates one with `#createRowChecks()`: resolving the bound column, the NestedRows plugin
 * and the settings for every row made "select all" on 100,000 rows take seconds.
 */
interface RowChecks {
  /**
   * Checks whether the physical row is selected.
   */
  isSelected(physicalRow: number | null): boolean;
  /**
   * Checks whether the physical row can be selected.
   */
  isSelectable(physicalRow: number): boolean;
  /**
   * Checks whether the physical row is a parent that shows the mixed state (`groupSelects:
   * 'descendants'`).
   */
  isMixed(physicalRow: number): boolean;
  /**
   * Checks whether the physical row is a parent whose state comes from its descendants.
   */
  isGroup(physicalRow: number): boolean;
  /**
   * Whether the parents are selected through their descendants (`groupSelects: 'descendants'`).
   */
  groupMode: boolean;
}

/**
 * The NestedRows data manager, as the plugin reads it.
 */
type NestedRowsDataManager = NonNullable<PluginTypeMap['nestedRows']['dataManager']>;

/**
 * A row object of the NestedRows tree.
 */
type NestedRowObject = NonNullable<ReturnType<NestedRowsDataManager['getDataObject']>>;

/**
 * The state of every row of a NestedRows tree with `groupSelects: 'descendants'`, by physical index.
 */
interface GroupTree {
  /**
   * `1` for a row that can be selected: a leaf `isRowSelectable` accepts (and every parent above it
   * accepts), or a parent with such a leaf under it.
   */
  selectable: Uint8Array;
  /**
   * {@link GROUP_UNCHECKED}, {@link GROUP_MIXED}, or {@link GROUP_CHECKED}.
   */
  state: Uint8Array;
  /**
   * `1` for a row with children.
   */
  isParent: Uint8Array;
}

const GROUP_UNCHECKED = 0;
const GROUP_MIXED = 1;
const GROUP_CHECKED = 2;

type ResolvedSettings = Required<Omit<RowSelectionSettings, 'isRowSelectable'>> &
  Pick<RowSelectionSettings, 'isRowSelectable'>;

/**
 * The state a parent shows for the selectable leaves under it.
 *
 * @param {number} total The number of selectable leaves.
 * @param {number} selected The number of selected ones among them.
 * @returns {number}
 */
function resolveGroupState(total: number, selected: number): number {
  if (selected === 0) {
    return GROUP_UNCHECKED;
  }

  return selected === total ? GROUP_CHECKED : GROUP_MIXED;
}

/**
 * @plugin RowSelection
 * @class RowSelection
 *
 * @description
 * The `RowSelection` plugin lets the user select rows with checkboxes, the way a "select all" checkbox
 * works in a mail client or a file manager. The row selection is a state of its own: it is not the
 * cell selection, and the plugin never writes it into the data.
 *
 * By default, the checkboxes are rendered in an extra row header column, and the "select all"
 * checkbox in the corner above it. Set `checkboxLocation` to `'firstColumn'` to render them in the
 * first visible column instead.
 *
 * The selection follows its rows when you sort, filter, move, add, or remove rows.
 * {@link Core#loadData} clears it. {@link Core#updateData} keeps it by row position: the row at each
 * selected position stays selected, whatever record the new data puts there. The framework wrappers
 * call `updateData()` when you pass new `data`, so the selection survives an update that replaces the
 * array. To start over after an update, call {@link RowSelection#deselectAll}. A selection kept in a
 * checkbox column of the data (`checkboxLocation: { column }`) is read from the new data instead.
 *
 * You can set the following configuration options:
 *
 * | Option | Required | Type | Default | Description |
 * |---|---|---|---|---|
 * | `mode` | No | String | `'multiRow'` | `'multiRow'` lets the user select many rows, `'singleRow'` at most one |
 * | `checkboxes` | No | Boolean \| Function | `true` | Shows the row checkboxes. A function `(rowData, physicalRow) => boolean` decides per row |
 * | `headerCheckbox` | No | Boolean | `true` | Shows the "select all" checkbox (`'multiRow'` mode only) |
 * | `selectAll` | No | String | `'all'` | The rows "select all" acts on: `'all'`, `'filtered'`, or `'currentPage'` |
 * | `enableClickSelection` | No | Boolean \| String | `false` | Lets a click on a cell select its row: `true`, `'enableSelection'`, or `'enableDeselection'` |
 * | `isRowSelectable` | No | Function | - | `(rowData, physicalRow) => boolean`. A row that returns `false` cannot be selected |
 * | `hideDisabledCheckboxes` | No | Boolean | `false` | Hides the checkboxes of the rows that cannot be selected, instead of disabling them |
 * | `checkboxLocation` | No | String \| Object | `'rowHeader'` | `'rowHeader'`, `'firstColumn'`, or `{ column }`: a checkbox column whose values are the selection |
 * | `groupSelects` | No | String | `'descendants'` | How the rows of a [`NestedRows`](@/api/nestedRows.md) tree are selected: `'descendants'`, `'self'`, or `'topLevel'` |
 *
 * The "select all" checkbox always describes the rows a click on it acts on. When some of them are
 * selected, it shows the mixed state, and a click selects all of them. Rows hidden by the
 * [`HiddenRows`](@/api/hiddenRows.md) plugin and rows trimmed by the [`TrimRows`](@/api/trimRows.md)
 * plugin are never in its scope, nor in a Shift+click range or a range toggled with Space. With
 * `headerCheckbox: false` or the `'singleRow'` mode, the corner shows no checkbox and a click on it
 * selects nothing.
 *
 * With the [`NestedRows`](@/api/nestedRows.md) plugin, `groupSelects` sets how the rows of the tree
 * are selected. With `'descendants'` (the default), selecting a parent row selects every row under
 * it, and a parent shows a mixed state while only some of the rows under it are selected. With
 * `'self'`, every row is selected on its own. With `'topLevel'`, only the top-level rows can be
 * selected. The `'singleRow'` mode and a bound checkbox column (`checkboxLocation: { column }`) use
 * `'self'` in place of `'descendants'`.
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   rowHeaders: true,
 *   rowSelection: {
 *     selectAll: 'filtered',
 *     isRowSelectable: (rowData) => rowData.status !== 'archived',
 *   },
 *   afterRowSelectionChange() {
 *     console.log(hot.getPlugin('rowSelection').getSelectedRowsData());
 *   },
 * });
 *
 * const rowSelectionPlugin = hot.getPlugin('rowSelection');
 *
 * // select the rows at visual indexes 0 and 2
 * rowSelectionPlugin.selectRows([0, 2]);
 *
 * // select every row in the "select all" scope
 * rowSelectionPlugin.selectAll();
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef = useRef(null);
 *
 * <HotTable
 *   ref={hotRef}
 *   data={getData()}
 *   rowHeaders={true}
 *   rowSelection={{
 *     selectAll: 'filtered',
 *     isRowSelectable: (rowData) => rowData.status !== 'archived',
 *   }}
 * />
 *
 * const rowSelectionPlugin = hotRef.current.hotInstance.getPlugin('rowSelection');
 *
 * rowSelectionPlugin.selectRows([0, 2]);
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * gridSettings = {
 *   data: this.getData(),
 *   rowHeaders: true,
 *   rowSelection: {
 *     selectAll: 'filtered',
 *   },
 * };
 * ```
 * :::
 */
export class RowSelection extends BasePlugin {
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
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    return {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
      selectAll: 'all',
      enableClickSelection: false,
      isRowSelectable: undefined,
      hideDisabledCheckboxes: false,
      checkboxLocation: 'rowHeader',
      groupSelects: 'descendants',
    };
  }

  /**
   * Returns the validators the plugin settings are checked against.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      mode: (value: unknown) => value === 'multiRow' || value === 'singleRow',
      checkboxes: (value: unknown) => typeof value === 'boolean' || isFunction(value),
      headerCheckbox: (value: unknown) => typeof value === 'boolean',
      selectAll: (value: unknown) => isSelectAllScope(value),
      enableClickSelection: (value: unknown) => typeof value === 'boolean' ||
        value === 'enableSelection' || value === 'enableDeselection',
      isRowSelectable: (value: unknown) => value === undefined || isFunction(value),
      hideDisabledCheckboxes: (value: unknown) => typeof value === 'boolean',
      groupSelects: (value: unknown) => value === 'descendants' || value === 'self' || value === 'topLevel',
      checkboxLocation: (value: unknown) => value === 'rowHeader' || value === 'firstColumn' ||
        (isPlainObject(value) && ['string', 'number'].includes(typeof (value as Record<string, unknown>).column)),
    };
  }

  /**
   * The selected state of every physical row.
   */
  #selectedRowsMap: PhysicalIndexToValueMap | null = null;

  /**
   * The position of the plugin's column among the row header renderers.
   */
  #rowHeaderRendererIndex = -1;

  /**
   * The physical row a Shift+click range starts from.
   */
  #anchorPhysicalRow: number | null = null;

  /**
   * The memoized state of the "select all" checkbox. Dropped on every change that can affect it.
   */
  #headerSummaryCache: HeaderCheckboxSummary | null = null;

  /**
   * The settings resolved with their defaults. Resolved once per enable: `afterRenderer` reads them
   * for every painted cell.
   */
  #settings: ResolvedSettings | null = null;

  /**
   * The selection by row id, used with a server-backed grid (the DataProvider plugin), where every
   * page change reloads the data and the physical map starts over. It outlives the loads.
   */
  #rowIdSelection = new RowIdSelection();

  /**
   * The number of rows matching the server query, from the last DataProvider response.
   */
  #serverTotalRows = 0;

  /**
   * Whether the missing `dataProvider.rowId` warning was already shown.
   */
  #rowIdWarningShown = false;

  /**
   * Whether the warning about a bound column that is not a checkbox column was already shown.
   */
  #boundColumnWarningShown = false;

  /**
   * Whether the warning about `checkboxLocation: 'firstColumn'` landing on a checkbox column was
   * already shown.
   */
  #firstColumnWarningShown = false;

  /**
   * The NestedRows plugin instance (`null` when it is not registered), see `#getNestedRowsPlugin()`.
   */
  #nestedRowsPlugin: PluginTypeMap['nestedRows'] | null | undefined = undefined;
  /**
   * The row checks one draw shares (`#getDrawRowChecks()`), or `null` when the next draw builds them.
   */
  #drawRowChecks: RowChecks | null = null;

  /**
   * The cached state of a NestedRows tree with `groupSelects: 'descendants'`, dropped together with
   * the header state.
   */
  #groupTree: GroupTree | null = null;

  /**
   * The resolved bound column (`checkboxLocation: { column }`): `undefined` until resolved. Resolving
   * it costs a `propToCol()` and a column meta read, and the render path asks for it for every painted
   * cell, so it is kept until the settings, the data, or the columns change.
   */
  #boundColumnCache: number | null | undefined = undefined;

  /**
   * The rows a write of the plugin's own to the bound column really changed, collected from
   * `afterChange` while the write runs, and the selection source to report them with.
   */
  #boundWrite: { source: RowSelectionSource; selected: number[]; deselected: number[]; open: boolean } | null = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link RowSelection#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#settings = this.#resolveSettings();
    this.#selectedRowsMap = this.hot.rowIndexMapper
      .createAndRegisterIndexMap(this.pluginName!, 'physicalIndexToValue', false);
    this.#selectedRowsMap.addLocalHook('change', this.#onMapChange);
    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#onRowIndexCacheUpdated);
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#invalidateBoundColumn);
    this.#boundColumnCache = undefined;

    this.addHook('afterGetRowHeaderRenderers', this.#onAfterGetRowHeaderRenderers);
    this.addHook('afterGetColHeader', this.#onAfterGetColHeader);
    this.addHook('afterGetRowHeader', this.#onAfterGetRowHeader);
    this.addHook('beforeRender', this.#dropDrawRowChecks);
    this.addHook('afterRenderer', this.#onAfterRenderer);
    this.addHook('modifyRowHeaderWidth', this.#onModifyRowHeaderWidth);
    this.addHook('modifyColWidth', this.#onModifyColWidth);
    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    this.addHook('afterOnCellMouseDown', this.#onAfterOnCellMouseDown);
    this.addHook('beforeChange', this.#onBeforeChange);
    this.addHook('afterChange', this.#onAfterChange);
    // An edit renders before `afterChange` runs; the header state must be dropped, and the bound
    // column's rows marked, before that render.
    this.addHook('beforeChangeRender', this.#onBeforeChangeRender);

    // `setSourceDataAtCell()`, which UndoRedo restores through, fires no `afterChange`. A listener
    // makes core read the old value of every source write, so only a bound column adds one.
    if (isPlainObject(this.#settings.checkboxLocation)) {
      this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell);
    }
    this.addHook('afterSetCellMeta', this.#onCellMetaChange);
    this.addHook('afterRemoveCellMeta', this.#onCellMetaChange);
    // UndoRedo restores cell meta through the meta manager, which fires no `afterSetCellMeta`.
    this.addHook('beforeUndo', this.#onCellMetaChange);
    this.addHook('beforeRedo', this.#onCellMetaChange);
    this.addHook('afterUndo', this.#onCellMetaChange);
    this.addHook('afterRedo', this.#onCellMetaChange);
    this.addHook('afterUpdateSettings', this.#invalidateBoundColumn);
    this.addHook('afterRowsMutation', this.#onAfterRowsMutation);
    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('afterUpdateData', this.#onAfterLoadData);
    this.addHook('afterPageChange', this.#invalidateHeaderSummary);
    this.addHook('afterDataProviderFetch', this.#onAfterDataProviderFetch);
    this.addHook('afterLanguageChange', this.#onAfterLanguageChange);
    this.addHook('afterContextMenuDefaultOptions', this.#onAfterContextMenuDefaultOptions);

    this.eventManager.addEventListener(this.hot.rootElement, 'mousedown', this.#onRootMouseDown);
    this.eventManager.addEventListener(this.hot.rootElement, 'click', this.#onRootClick);
    this.#registerShortcuts();

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`rowSelection`](@/api/options.md#rowselection)
   */
  updatePlugin() {
    // The selection survives a settings update: only the configuration changes. Disabling the
    // plugin unregisters the map and drops the selection by row id, so both are carried over by hand.
    const selectedValues = this.#selectedRowsMap ? this.#selectedRowsMap.getValues().slice() : null;
    const rowIdSelection = this.#rowIdSelection;
    const serverTotalRows = this.#serverTotalRows;
    const anchorPhysicalRow = this.#anchorPhysicalRow;

    this.disablePlugin();
    this.enablePlugin();

    this.#rowIdSelection = rowIdSelection;
    this.#serverTotalRows = serverTotalRows;
    this.#anchorPhysicalRow = anchorPhysicalRow;

    if (this.#isServerMode()) {
      this.#hydrateFromRowIds();

    } else if (selectedValues && selectedValues.length === this.hot.rowIndexMapper.getNumberOfIndexes()) {
      this.#writeSilently(() => this.#selectedRowsMap!.setValues(selectedValues));
    }

    if (this.#getSettings().mode === 'singleRow') {
      this.#reduceToSingleRow();
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();

    this.hot.getShortcutManager().getContext('grid')?.removeShortcutsByGroup(SHORTCUTS_GROUP);
    this.hot.rowIndexMapper.removeLocalHook('cacheUpdated', this.#onRowIndexCacheUpdated);
    this.hot.columnIndexMapper.removeLocalHook('cacheUpdated', this.#invalidateBoundColumn);
    this.hot.rowIndexMapper.unregisterMap(this.pluginName!);
    this.#removeHeaderCheckboxes();

    this.#selectedRowsMap = null;
    this.#settings = null;
    this.#rowHeaderRendererIndex = -1;
    this.#anchorPhysicalRow = null;
    this.#headerSummaryCache = null;
    this.#drawRowChecks = null;
    this.#groupTree = null;
    this.#boundColumnCache = undefined;
    this.#boundWrite = null;
    // A disabled plugin has no selection: re-enabling it must not bring back a server selection the
    // client grid no longer shows. `updatePlugin()` carries both over by hand.
    this.#rowIdSelection = new RowIdSelection();
    this.#serverTotalRows = 0;
  }

  /**
   * Checks whether the row is selected.
   *
   * @param {number} row Visual row index.
   * @returns {boolean}
   */
  isRowSelected(row: number): boolean {
    return this.#isPhysicalRowSelected(this.hot.toPhysicalRow(row));
  }

  /**
   * Checks whether the row can be selected. A row cannot be selected when the `isRowSelectable`
   * function returns `false` for it or for a parent above it, when it is a nested row and
   * `groupSelects` is `'topLevel'`, when it is a parent with no selectable row under it
   * (`groupSelects: 'descendants'`), or when its cell in a bound checkbox column is read-only.
   *
   * @param {number} row Visual row index.
   * @returns {boolean}
   */
  isRowSelectable(row: number): boolean {
    const physicalRow = this.hot.toPhysicalRow(row);

    return physicalRow !== null && this.#isPhysicalRowSelectable(physicalRow);
  }

  /**
   * Selects the rows. Rows that cannot be selected are skipped. In the `'singleRow'` mode, only the
   * last row of the list is selected, and every other row is deselected.
   *
   * @param {number[]} rows Visual row indexes.
   * @returns {boolean} `true` if the selection changed.
   */
  selectRows(rows: number[]): boolean {
    return this.#select(this.#toPhysicalRows(rows), 'api');
  }

  /**
   * Deselects the rows.
   *
   * @param {number[]} rows Visual row indexes.
   * @returns {boolean} `true` if the selection changed.
   */
  deselectRows(rows: number[]): boolean {
    return this.#applyChange([], this.#toPhysicalRows(rows), 'api');
  }

  /**
   * Toggles the selection of the row.
   *
   * @param {number} row Visual row index.
   * @returns {boolean} `true` if the selection changed.
   */
  toggleRow(row: number): boolean {
    return this.#toggleRow(row, 'api');
  }

  /**
   * Selects every selectable row in the scope.
   *
   * @param {string} [scope] `'all'`, `'filtered'`, or `'currentPage'`. Defaults to the `selectAll` setting.
   * @returns {boolean} `true` if the selection changed.
   */
  selectAll(scope?: SelectAllScope): boolean {
    if (this.#getSettings().mode === 'singleRow') {
      return false;
    }

    if (this.#isServerWideScope(scope)) {
      return this.#applyServerWide(true, 'api');
    }

    return this.#applyChange(this.#getRowsInScope(scope), [], 'api');
  }

  /**
   * Deselects every row in the scope.
   *
   * @param {string} [scope] `'all'`, `'filtered'`, or `'currentPage'`. Defaults to `'all'`, so that
   * a call clears the whole selection, rows filtered out included.
   * @returns {boolean} `true` if the selection changed.
   */
  deselectAll(scope: SelectAllScope = 'all'): boolean {
    if (this.#isServerWideScope(scope)) {
      return this.#applyServerWide(false, 'api');
    }

    const rows = scope === 'all' ? this.getSelectedPhysicalRows() : this.#getRowsInScope(scope, false);

    return this.#applyChange([], rows, 'api');
  }

  /**
   * Returns the visual indexes of the selected rows, in visual order. Selected rows the
   * [`Filters`](@/api/filters.md) plugin filtered out have no visual index and are not listed - use
   * {@link RowSelection#getSelectedPhysicalRows} or {@link RowSelection#getSelectedRowsData} for them.
   *
   * @returns {number[]}
   */
  getSelectedRows(): number[] {
    const selected: number[] = [];
    const rowsCount = this.hot.countRows();
    const { isSelected } = this.#createRowChecks();

    for (let visualRow = 0; visualRow < rowsCount; visualRow++) {
      if (isSelected(this.hot.toPhysicalRow(visualRow))) {
        selected.push(visualRow);
      }
    }

    return selected;
  }

  /**
   * Returns the physical indexes of the selected rows, including the rows the
   * [`Filters`](@/api/filters.md) plugin filtered out.
   *
   * @returns {number[]}
   */
  getSelectedPhysicalRows(): number[] {
    const checks = this.#createRowChecks();

    if (checks.groupMode || this.getBoundColumn() !== null) {
      const selected: number[] = [];
      const count = this.hot.rowIndexMapper.getNumberOfIndexes();
      const { isSelected } = checks;

      for (let physicalRow = 0; physicalRow < count; physicalRow++) {
        if (isSelected(physicalRow)) {
          selected.push(physicalRow);
        }
      }

      return selected;
    }

    const values = this.#selectedRowsMap?.getValues() ?? [];
    const selected: number[] = [];

    for (let physicalRow = 0; physicalRow < values.length; physicalRow++) {
      if (values[physicalRow] === true) {
        selected.push(physicalRow);
      }
    }

    return selected;
  }

  /**
   * Returns the source data of the selected rows, in physical order, including the rows the
   * [`Filters`](@/api/filters.md) plugin filtered out. With a server-backed grid (the
   * [`DataProvider`](@/api/dataProvider.md) plugin), only the loaded rows have data: use
   * {@link RowSelection#getServerSelection} for the rest.
   *
   * @returns {Array}
   */
  getSelectedRowsData(): unknown[] {
    return this.getSelectedPhysicalRows().map(physicalRow => this.hot.getSourceDataAtRow(physicalRow));
  }

  /**
   * Returns the state of the "select all" checkbox: `'checked'`, `'unchecked'`, `'mixed'`, or
   * `'disabled'` (no row in the scope can be selected), with the number of selected and selectable
   * rows in the scope.
   *
   * @returns {{ state: string, selected: number, total: number }}
   */
  getHeaderCheckboxState(): HeaderCheckboxSummary {
    if (this.#isServerWideScope()) {
      return this.#rowIdSelection.summarize(this.#serverTotalRows);
    }

    if (this.#headerSummaryCache === null) {
      this.#headerSummaryCache = computeHeaderCheckboxState(
        this.#getRowsInScope(),
        this.#createRowChecks().isSelected,
      );
    }

    return { ...this.#headerSummaryCache };
  }

  /**
   * Toggles every selectable row in the scope, the way a click on the "select all" checkbox does:
   * a checked checkbox deselects them, an unchecked or mixed one selects them.
   *
   * @returns {boolean} `true` if the selection changed.
   */
  toggleAll(): boolean {
    return this.#toggleAll('api');
  }

  /**
   * Removes the selected rows from the grid, in one undo step. Only rows with a visual index are
   * removed: selected rows the [`Filters`](@/api/filters.md) plugin filtered out stay. With a
   * server-backed grid after a "select all", the rows on other pages cannot be removed from the
   * client, so nothing is removed and the method returns `false`.
   *
   * @returns {boolean} `true` if any row was removed.
   */
  removeSelectedRows(): boolean {
    if (!this.#canRemoveSelectedRows()) {
      return false;
    }

    const rows = this.#getRemovableRows();

    // Groups of consecutive visual rows, as `alter()` takes them: `[[index, amount], ...]`.
    const groups: Array<[number, number]> = [];

    rows.forEach((row) => {
      const last = groups[groups.length - 1];

      if (last && last[0] + last[1] === row) {
        last[1] += 1;
      } else {
        groups.push([row, 1]);
      }
    });

    this.hot.alter('remove_row', groups, undefined, 'RowSelection.remove');

    return true;
  }

  /**
   * Tells whether the selected rows can be removed: some are visible, the grid allows removing rows,
   * and the selection does not cover rows the client never loaded.
   *
   * @returns {boolean}
   */
  #canRemoveSelectedRows(): boolean {
    return this.#countRemovableRows() > 0;
  }

  /**
   * Counts the rows {@link RowSelection#removeSelectedRows} removes: the selected rows with a visual
   * index, or none when the grid does not allow removing rows or the selection covers rows the client
   * never loaded.
   *
   * @returns {number}
   */
  #countRemovableRows(): number {
    if (this.hot.getSettings().allowRemoveRow === false ||
      (this.#isServerMode() && this.#rowIdSelection.export().selectAll)) {
      return 0;
    }

    return this.#getRemovableRows().length;
  }

  /**
   * The visual rows {@link RowSelection#removeSelectedRows} removes: the selected rows, except a
   * parent (`groupSelects: 'descendants'`) with a row under it that is not selected. Such a parent
   * counts as selected once every SELECTABLE row under it is, but removing it takes its whole subtree,
   * so a row `isRowSelectable` rejects would go with it. Its selected rows are removed one by one.
   *
   * @returns {number[]}
   */
  #getRemovableRows(): number[] {
    const rows = this.getSelectedRows();
    const checks = this.#createRowChecks();

    if (!checks.groupMode) {
      return rows;
    }

    const dataManager = this.#getNestedRowsPlugin()!.dataManager!;

    return rows.filter((row) => {
      const physicalRow = this.hot.toPhysicalRow(row);

      if (physicalRow === null || !checks.isGroup(physicalRow)) {
        return true;
      }

      // A parent's descendants are the rows right after it, in tree order.
      const last = physicalRow + dataManager.countChildren(physicalRow);

      for (let descendant = physicalRow + 1; descendant <= last; descendant++) {
        if (!checks.isGroup(descendant) && !checks.isSelected(descendant)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Returns the visual index of the checkbox column whose values are the selection
   * (`checkboxLocation: { column }`), or `null` when the selection is not bound to a column.
   *
   * @returns {number|null}
   */
  getBoundColumn(): number | null {
    if (this.#boundColumnCache === undefined || !this.enabled) {
      const boundColumn = this.#resolveBoundColumn();

      if (!this.enabled) {
        return boundColumn;
      }

      this.#boundColumnCache = boundColumn;
    }

    return this.#boundColumnCache;
  }

  /**
   * Resolves the bound column (`checkboxLocation: { column }`). {@link RowSelection#getBoundColumn}
   * keeps the result until the settings, the data, or the columns change.
   *
   * @returns {number|null}
   */
  #resolveBoundColumn(): number | null {
    const location = this.#getSettings().checkboxLocation;

    if (!isPlainObject(location)) {
      return null;
    }

    const { column } = location as unknown as RowSelectionBoundColumn;
    const visualColumn = typeof column === 'string' ?
      this.hot.propToCol(column) : this.hot.toVisualColumn(column);

    if (typeof visualColumn !== 'number' || visualColumn < 0 || visualColumn >= this.hot.countCols() ||
      !isCheckboxMeta(this.hot.getColumnMeta(visualColumn) as CheckboxMeta)) {
      if (!this.#boundColumnWarningShown) {
        this.#boundColumnWarningShown = true;
        warn(`RowSelection: \`checkboxLocation.column\` (${String(column)}) is not a checkbox column. ` +
          'The selection falls back to the row header location.');
      }

      return null;
    }

    return visualColumn;
  }

  /**
   * Returns the number of selected rows. With a server-backed grid (the
   * [`DataProvider`](@/api/dataProvider.md) plugin) and a "select all" scope other than
   * `'currentPage'`, it counts the rows matching the server query, including the rows on other pages.
   *
   * @returns {number}
   */
  getSelectedCount(): number {
    if (this.#isServerMode()) {
      return this.#rowIdSelection.summarize(this.#serverTotalRows).selected;
    }

    const checks = this.#createRowChecks();

    // With `groupSelects: 'descendants'` a parent is a summary of its leaves, so only the leaves count.
    return this.getSelectedPhysicalRows().filter(physicalRow => !checks.isGroup(physicalRow)).length;
  }

  /**
   * Returns the selection of a server-backed grid (the [`DataProvider`](@/api/dataProvider.md)
   * plugin) in a form your server can apply to the rows it did not send: `selectAll: false` with the
   * ids of the selected rows, or `selectAll: true` with the ids of the rows deselected after "select
   * all". The ids come from the `dataProvider.rowId` option. Returns `null` without a server-backed grid.
   *
   * @returns {{ selectAll: boolean, toggledRowIds: Array }|null}
   */
  getServerSelection(): ServerRowSelection | null {
    return this.#isServerMode() ? this.#rowIdSelection.export() : null;
  }

  /**
   * Replaces the selection of a server-backed grid (the [`DataProvider`](@/api/dataProvider.md)
   * plugin), for example to restore one you saved with {@link RowSelection#getServerSelection}.
   *
   * @param {object} selection The selection.
   * @param {boolean} selection.selectAll Whether every row is selected, except `toggledRowIds`.
   * @param {Array} selection.toggledRowIds The row ids that differ from `selectAll`.
   * @returns {boolean} `true` if the selection was applied.
   */
  setServerSelection(selection: ServerRowSelection): boolean {
    if (!this.#isServerMode() || !isPlainObject(selection)) {
      return false;
    }

    const next = new RowIdSelection();

    next.import(selection);

    return this.#replaceServerSelection(next, 'api');
  }

  /**
   * Returns the checked rows of the loaded dataset, for the sheets bar to keep with a sheet the user
   * leaves: the physical rows checked in the selection map, and with a server-backed grid the selection
   * by row id and the row count of the server query, which belong to that sheet's server. `null` when
   * the plugin is off or the selection lives in a bound checkbox column, whose values travel with the
   * data.
   *
   * @private
   * @returns {object|null}
   */
  _exportViewState(): RowSelectionViewState | null {
    if (!this.enabled || this.getBoundColumn() !== null) {
      return null;
    }

    const values = this.#selectedRowsMap?.getValues() ?? [];
    const rows: number[] = [];

    for (let physicalRow = 0; physicalRow < values.length; physicalRow++) {
      if (values[physicalRow] === true) {
        rows.push(physicalRow);
      }
    }

    return {
      rows,
      server: this.#isServerMode() ? this.#rowIdSelection.export() : null,
      serverTotalRows: this.#serverTotalRows,
    };
  }

  /**
   * Puts back the checked rows {@link RowSelection#_exportViewState} returned, or clears them for
   * `null`. The sheets bar calls it on a switch, so it runs no selection hook and announces nothing:
   * the user checked those rows on that sheet before. The selection by row id and the server row count
   * are replaced too, so the rows a server-backed sheet checked never show, or get removed, on another
   * sheet. A physical row past the end of the data is dropped. A bound checkbox column is left alone.
   *
   * @private
   * @param {object|null} state The checked rows.
   */
  _importViewState(state: RowSelectionViewState | null) {
    const map = this.#selectedRowsMap;

    if (!this.enabled || !map || this.getBoundColumn() !== null) {
      return;
    }

    const rowIdSelection = new RowIdSelection();

    rowIdSelection.import(state?.server ?? { selectAll: false, toggledRowIds: [] });
    this.#rowIdSelection = rowIdSelection;
    this.#serverTotalRows = state?.serverTotalRows ?? 0;
    this.#anchorPhysicalRow = null;

    if (this.#isServerMode()) {
      this.#hydrateFromRowIds();

      return;
    }

    const values = new Array<boolean>(this.hot.rowIndexMapper.getNumberOfIndexes()).fill(false);

    (state?.rows ?? []).forEach((physicalRow) => {
      if (physicalRow < values.length) {
        values[physicalRow] = true;
      }
    });

    this.#writeSilently(() => map.setValues(values));
  }

  /**
   * Returns the settings resolved with their defaults.
   *
   * @returns {object}
   */
  #getSettings(): ResolvedSettings {
    if (this.#settings === null) {
      this.#settings = this.#resolveSettings();
    }

    return this.#settings;
  }

  /**
   * Resolves the settings with their defaults. A value its validator rejects falls back to the
   * default (the base plugin already warned about it).
   *
   * @returns {object}
   */
  #resolveSettings(): ResolvedSettings {
    const setting = this.hot.getSettings()[PLUGIN_KEY];
    const defaults = (this.constructor as typeof RowSelection).DEFAULT_SETTINGS as ResolvedSettings;
    const validators = (this.constructor as typeof RowSelection).SETTINGS_VALIDATORS;
    const resolved = { ...defaults };

    if (isPlainObject(setting)) {
      (Object.keys(validators) as Array<keyof typeof validators>).forEach((key) => {
        const value = (setting as Record<string, unknown>)[key];

        if (value !== undefined && validators[key](value)) {
          (resolved as Record<string, unknown>)[key] = value;
        }
      });
    }

    return resolved;
  }

  /**
   * Selects the rows, and in the `'singleRow'` mode deselects every other one.
   *
   * @param {number[]} physicalRows Physical row indexes.
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean}
   */
  #select(physicalRows: number[], source: RowSelectionSource): boolean {
    if (this.#getSettings().mode !== 'singleRow') {
      return this.#applyChange(physicalRows, [], source);
    }

    const selectable = physicalRows.filter(this.#createRowChecks().isSelectable);
    const target = selectable[selectable.length - 1];

    if (target === undefined) {
      return false;
    }

    return this.#selectOnly(target, source);
  }

  /**
   * Selects one row and deselects every other one, including, with a server-backed grid, the rows
   * selected on other pages.
   *
   * @param {number} physicalRow Physical row index.
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean}
   */
  #selectOnly(physicalRow: number, source: RowSelectionSource): boolean {
    const rowId = this.#isServerMode() ? this.#getRowId(physicalRow) : undefined;

    if (rowId !== undefined && this.#isPhysicalRowSelectable(physicalRow)) {
      const next = new RowIdSelection();

      next.set(rowId, true);

      return this.#replaceServerSelection(next, source);
    }

    const others = this.getSelectedPhysicalRows().filter(row => row !== physicalRow);

    return this.#applyChange([physicalRow], others, source);
  }

  /**
   * Keeps at most one row selected after a switch to the `'singleRow'` mode. It keeps the anchor (the
   * row the user last toggled or clicked) when that row is selected, and otherwise the last selected
   * row in visual order (the row `selectRows()` keeps in that mode). With a server-backed grid and no
   * selected row loaded, it keeps the row id toggled last, and clears a "select all", which names no
   * single row. A bound checkbox column keeps its values: they are the user's data, and the next
   * selection in the `'singleRow'` mode clears the other rows anyway.
   */
  #reduceToSingleRow() {
    if (this.getBoundColumn() !== null || this.getSelectedCount() <= 1) {
      return;
    }

    const { isSelected } = this.#createRowChecks();
    const anchor = this.#anchorPhysicalRow;
    const selectedVisualRows = this.getSelectedRows();
    const lastVisualRow = selectedVisualRows[selectedVisualRows.length - 1];
    let keep: number | null = null;

    if (anchor !== null && this.hot.toVisualRow(anchor) !== null && isSelected(anchor)) {
      keep = anchor;
    } else if (lastVisualRow !== undefined) {
      keep = this.hot.toPhysicalRow(lastVisualRow);
    }

    if (keep !== null) {
      this.#selectOnly(keep, 'api');

      return;
    }

    if (this.#isServerMode()) {
      const { selectAll, toggledRowIds } = this.#rowIdSelection.export();
      const next = new RowIdSelection();

      if (!selectAll && toggledRowIds.length > 0) {
        next.set(toggledRowIds[toggledRowIds.length - 1], true);
      }

      this.#replaceServerSelection(next, 'api');

      return;
    }

    // Every selected row is filtered out, so none has a visual index: keep the last physical one.
    const selectedPhysicalRows = this.getSelectedPhysicalRows();

    this.#selectOnly(selectedPhysicalRows[selectedPhysicalRows.length - 1], 'api');
  }

  /**
   * Toggles one row. The row becomes the anchor of a Shift+click range only when the change happens.
   *
   * @param {number} row Visual row index.
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean}
   */
  #toggleRow(row: number, source: RowSelectionSource): boolean {
    const physicalRow = this.hot.toPhysicalRow(row);

    if (physicalRow === null) {
      return false;
    }

    const changed = this.#isPhysicalRowSelected(physicalRow) ?
      this.#applyChange([], [physicalRow], source) : this.#select([physicalRow], source);

    if (changed) {
      this.#anchorPhysicalRow = physicalRow;
    }

    return changed;
  }

  /**
   * Selects every row between the anchor and the row, both included.
   *
   * @param {number} row Visual row index.
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean}
   */
  #selectRangeTo(row: number, source: RowSelectionSource): boolean {
    const anchorRow = this.#anchorPhysicalRow === null ?
      null : this.hot.toVisualRow(this.#anchorPhysicalRow);

    if (anchorRow === null || this.#getSettings().mode === 'singleRow') {
      return this.#toggleRow(row, source);
    }

    const rows: number[] = [];
    const step = row >= anchorRow ? 1 : -1;

    for (let visualRow = anchorRow; visualRow !== row + step; visualRow += step) {
      rows.push(visualRow);
    }

    // The range is the visual rows between the anchor and the row, on every page they span: the user
    // picked both ends, so the rows of a page in between are part of what they asked for. Rows the
    // HiddenRows or TrimRows plugin excludes are out of every scope, and stay out of the range too.
    return this.#applyChange(this.#toPhysicalRows(rows).filter(this.#createScopeFilter()), [], source);
  }

  /**
   * Returns a check that tells whether a physical row can be in any scope: it is not hidden by the
   * HiddenRows plugin and not trimmed by the TrimRows plugin. The maps are read by name, as
   * `#getRowsInScope()` reads them: Pagination is a hiding map too, and a row on another page is not
   * out of scope.
   *
   * @returns {Function}
   */
  #createScopeFilter(): (physicalRow: number) => boolean {
    const trimRowsMap = this.#getFlagMap('trimRows');
    const hiddenRowsMap = this.#getFlagMap('HiddenRows');

    return physicalRow => trimRowsMap?.getValueAtIndex(physicalRow) !== true &&
      hiddenRowsMap?.getValueAtIndex(physicalRow) !== true;
  }

  /**
   * Toggles every selectable row in the scope.
   *
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean}
   */
  #toggleAll(source: RowSelectionSource): boolean {
    if (this.#getSettings().mode === 'singleRow' ||
      ((source === 'headerCheckbox' || source === 'keyboard') && !this.#hasHeaderCheckbox())) {
      return false;
    }

    const target = resolveHeaderToggleTarget(this.getHeaderCheckboxState().state);

    if (target === null) {
      return false;
    }

    if (this.#isServerWideScope()) {
      return this.#applyServerWide(target, source);
    }

    const rows = this.#getRowsInScope();

    return target ? this.#applyChange(rows, [], source) : this.#applyChange([], rows, source);
  }

  /**
   * Applies a change to the selection: runs the hooks, writes the map, and renders.
   *
   * @param {number[]} toSelect Physical rows to select.
   * @param {number[]} toDeselect Physical rows to deselect.
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean} `true` if the selection changed.
   */
  #applyChange(toSelect: number[], toDeselect: number[], source: RowSelectionSource): boolean {
    if (!this.enabled || !this.#selectedRowsMap) {
      return false;
    }

    // Only the rows whose state really changes reach the hooks. Deselecting does not ask
    // `isRowSelectable`: a row that stopped being selectable must still be clearable.
    const checks = this.#createRowChecks();
    const { isSelected, isSelectable } = checks;
    const selectCandidates = checks.groupMode ? this.#expandGroupsToLeaves(toSelect, checks) : toSelect;
    const deselectCandidates = checks.groupMode ? this.#expandGroupsToLeaves(toDeselect, checks) : toDeselect;
    const rowsToSelect = selectCandidates.filter(physicalRow => !isSelected(physicalRow) && isSelectable(physicalRow));
    const rowsToDeselect = deselectCandidates.filter(isSelected);

    if (rowsToSelect.length === 0 && rowsToDeselect.length === 0) {
      return false;
    }

    if (this.hot.runHooks('beforeRowSelectionChange', rowsToSelect, rowsToDeselect, source) === false) {
      return false;
    }

    this.#drawRowChecks = null;

    const map = this.#selectedRowsMap;
    const boundColumn = this.getBoundColumn();

    if (boundColumn !== null) {
      return this.#writeBoundColumn(boundColumn, rowsToSelect, rowsToDeselect, source);
    }

    this.#writeSilently(() => {
      if (rowsToSelect.length + rowsToDeselect.length === 1) {
        map.setValueAtIndex(rowsToSelect[0] ?? rowsToDeselect[0], rowsToSelect.length === 1);

      } else {
        const values = map.getValues().slice();

        rowsToSelect.forEach((physicalRow) => {
          values[physicalRow] = true;
        });
        rowsToDeselect.forEach((physicalRow) => {
          values[physicalRow] = false;
        });

        map.setValues(values);
      }
    });

    if (this.#isServerMode()) {
      this.#recordRowIds(rowsToSelect, true);
      this.#recordRowIds(rowsToDeselect, false);
    }

    this.#notifyChange(rowsToSelect, rowsToDeselect, source);
    this.#refreshView();

    return true;
  }

  /**
   * Writes a selection change into the bound column: a data change, with one undo step for the whole
   * change, like any edit. The write can be rejected on the way (a `beforeChange` listener that
   * cancels or nulls it, a validator with `allowInvalid: false`), so `afterRowSelectionChange` reports
   * only the rows whose value really changed: the rows the `afterChange` of the write lists, and the
   * rows with no visual index (written through `setSourceDataAtCell()`, which fires no `afterChange`)
   * whose value now reads differently. A write held by an asynchronous validator is reported when it
   * lands (see `#onAfterChange`).
   *
   * @param {number} boundColumn Visual index of the bound column.
   * @param {number[]} rowsToSelect Physical rows to select.
   * @param {number[]} rowsToDeselect Physical rows to deselect.
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean} `true` if the selection changed.
   */
  #writeBoundColumn(
    boundColumn: number,
    rowsToSelect: number[],
    rowsToDeselect: number[],
    source: RowSelectionSource,
  ): boolean {
    const write = { source, selected: [] as number[], deselected: [] as number[], open: true };

    this.#boundWrite = write;

    try {
      this.runOperation('row_selection_change', () => {
        writeCheckboxColumn(this.hot, boundColumn, rowsToSelect, true, BOUND_WRITE_SOURCE);
        writeCheckboxColumn(this.hot, boundColumn, rowsToDeselect, false, BOUND_WRITE_SOURCE);
      });
    } finally {
      write.open = false;
    }

    this.#headerSummaryCache = null;
    this.#groupTree = null;

    // The rows with no visual index skip `afterChange`: read their value back.
    const { isSelected } = this.#createRowChecks();
    const isUnlisted = (physicalRow: number) => this.hot.toVisualRow(physicalRow) === null;
    const selected = write.selected.concat(rowsToSelect.filter(row => isUnlisted(row) && isSelected(row)));
    const deselected = write.deselected.concat(rowsToDeselect.filter(row => isUnlisted(row) && !isSelected(row)));

    this.#refreshView();

    if (selected.length === 0 && deselected.length === 0) {
      return false;
    }

    this.#notifyChange(selected, deselected, source);

    return true;
  }

  /**
   * Writes the selection map without recording an undo step. The row selection is UI state, like
   * the cell selection: undo and redo do not replay it.
   *
   * @param {Function} write The write.
   */
  #writeSilently(write: () => void) {
    this.hot._getOperationScope().suppress(write);
  }

  /**
   * Tells whether the grid is backed by a server through the DataProvider plugin. Its rows then
   * come one page at a time, and every page replaces the data.
   *
   * @returns {boolean}
   */
  #isServerMode(): boolean {
    // A bound column keeps the selection in the data, which the server already persists.
    return this.getBoundColumn() === null && this.hot.getPlugin('dataProvider')?.enabled === true &&
      this.hot.runHooks('hasExternalDataSource') === true;
  }

  /**
   * Tells whether "select all" acts on every row matching the server query (rather than on the rows
   * the grid holds): a server-backed grid with the `'all'` or `'filtered'` scope. The server filters
   * the rows, so both scopes mean the same there.
   *
   * @param {string} [scope] The scope. Defaults to the `selectAll` setting.
   * @returns {boolean}
   */
  #isServerWideScope(scope?: SelectAllScope): boolean {
    const resolvedScope = isSelectAllScope(scope) ? scope : this.#getSettings().selectAll;

    return resolvedScope !== 'currentPage' && this.#isServerMode();
  }

  /**
   * Returns the `dataProvider.rowId` of a loaded row.
   *
   * @param {number} physicalRow Physical row index.
   * @returns {*} The row id, or `undefined` when the row has none.
   */
  #getRowId(physicalRow: number): unknown {
    const visualRow = this.hot.toVisualRow(physicalRow);

    if (visualRow === null) {
      return undefined;
    }

    const rowId = this.hot.getPlugin('dataProvider').getRowId(visualRow);

    if ((rowId === undefined || rowId === null) && !this.#rowIdWarningShown) {
      this.#rowIdWarningShown = true;
      warn('RowSelection: a row has no id. Set the `dataProvider.rowId` option to keep the row ' +
        'selection when the page changes.');
    }

    return rowId ?? undefined;
  }

  /**
   * Records a change made on loaded rows in the selection by row id.
   *
   * @param {number[]} physicalRows Physical row indexes.
   * @param {boolean} selected The new state.
   */
  #recordRowIds(physicalRows: number[], selected: boolean) {
    physicalRows.forEach((physicalRow) => {
      const rowId = this.#getRowId(physicalRow);

      if (rowId !== undefined) {
        this.#rowIdSelection.set(rowId, selected);
      }
    });
  }

  /**
   * Rebuilds the loaded rows' selected state from the selection by row id. Runs after every load:
   * a load re-creates the physical map with every row unselected.
   */
  #hydrateFromRowIds() {
    const map = this.#selectedRowsMap;

    if (!map) {
      return;
    }

    const values = this.#computeLoadedRowsState(this.#rowIdSelection);

    this.#writeSilently(() => map.setValues(values));
    this.#headerSummaryCache = null;
    this.#groupTree = null;
  }

  /**
   * Computes the selected state of every loaded row under a selection by row id.
   *
   * @param {RowIdSelection} selection The selection by row id.
   * @returns {boolean[]}
   */
  #computeLoadedRowsState(selection: RowIdSelection): boolean[] {
    const count = this.hot.rowIndexMapper.getNumberOfIndexes();
    const values = new Array<boolean>(count).fill(false);
    const { isSelectable } = this.#createRowChecks();

    for (let physicalRow = 0; physicalRow < count; physicalRow++) {
      const rowId = this.#getRowId(physicalRow);

      values[physicalRow] = rowId !== undefined && selection.isSelected(rowId) && isSelectable(physicalRow);
    }

    return values;
  }

  /**
   * Selects or clears every row matching the server query, loaded or not.
   *
   * @param {boolean} selected `true` to select every row, `false` to clear the selection.
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean} `true` if the selection changed.
   */
  #applyServerWide(selected: boolean, source: RowSelectionSource): boolean {
    const next = new RowIdSelection();

    next.setAll(selected);

    return this.#replaceServerSelection(next, source);
  }

  /**
   * Replaces the selection by row id. The hooks receive the loaded rows whose state changes; the
   * rows on other pages have no index to report.
   *
   * A change that leaves every loaded row as it was is still a change when rows on other pages
   * change with it (a "select all" while the loaded page is already selected): the hooks run with two
   * empty lists, so `beforeRowSelectionChange` can still veto it and `afterRowSelectionChange` still
   * tells the application that `getSelectedCount()` and `getServerSelection()` moved. When every row
   * matching the query is loaded, no other row exists, so such a change is a no-op: the new model is
   * adopted without the hooks (it can still move the "select all" state, which counts rows that
   * `isRowSelectable` rejects) and the method returns `false`.
   *
   * @param {RowIdSelection} next The new selection.
   * @param {RowSelectionSource} source The source of the change.
   * @returns {boolean} `true` if the selection changed.
   */
  #replaceServerSelection(next: RowIdSelection, source: RowSelectionSource): boolean {
    if (!this.enabled || !this.#selectedRowsMap) {
      return false;
    }

    const current = this.#rowIdSelection.export();
    const proposed = next.export();
    const currentRowIds = new Set(current.toggledRowIds);
    const isSame = current.selectAll === proposed.selectAll &&
      current.toggledRowIds.length === proposed.toggledRowIds.length &&
      proposed.toggledRowIds.every(rowId => currentRowIds.has(rowId));

    if (isSame) {
      return false;
    }

    const nextValues = this.#computeLoadedRowsState(next);
    const rowsToSelect: number[] = [];
    const rowsToDeselect: number[] = [];
    const checks = this.#createRowChecks();

    nextValues.forEach((isSelected, physicalRow) => {
      if (isSelected !== checks.isSelected(physicalRow)) {
        (isSelected ? rowsToSelect : rowsToDeselect).push(physicalRow);
      }
    });

    if (rowsToSelect.length === 0 && rowsToDeselect.length === 0 &&
      this.#serverTotalRows <= this.hot.rowIndexMapper.getNumberOfIndexes()) {
      this.#rowIdSelection = next;
      this.#invalidateHeaderSummary();
      this.#refreshView();

      return false;
    }

    if (this.hot.runHooks('beforeRowSelectionChange', rowsToSelect, rowsToDeselect, source) === false) {
      return false;
    }

    this.#drawRowChecks = null;

    this.#rowIdSelection = next;
    this.#writeSilently(() => this.#selectedRowsMap!.setValues(nextValues));
    this.#headerSummaryCache = null;
    this.#groupTree = null;

    this.#notifyChange(rowsToSelect, rowsToDeselect, source);
    this.#refreshView();

    return true;
  }

  /**
   * Repaints the grid. Under `renderMode: 'onChange'` a cell is repainted only when it is marked,
   * and the selected-row class is state of this plugin's own.
   */
  #refreshView() {
    this.hot.markAllCellsChanged();
    this.hot.render();
  }

  /**
   * Resolves the physical rows in the scope.
   *
   * @param {string} [scope] The scope. Defaults to the `selectAll` setting.
   * @param {boolean} [selectableOnly=true] Whether to skip the rows that cannot be selected.
   * @returns {number[]}
   */
  #getRowsInScope(scope?: SelectAllScope, selectableOnly = true): number[] {
    const resolvedScope = isSelectAllScope(scope) ? scope : this.#getSettings().selectAll;
    const trimRowsMap = this.#getFlagMap('trimRows');
    const hiddenRowsMap = this.#getFlagMap('HiddenRows');
    const checks = this.#createRowChecks();
    const isRowSelectable = selectableOnly ? checks.isSelectable : () => true;
    const host: ScopeHost = {
      countPhysicalRows: () => this.hot.rowIndexMapper.getNumberOfIndexes(),
      countVisualRows: () => this.hot.countRows(),
      toPhysicalRow: visualRow => this.hot.toPhysicalRow(visualRow),
      getCurrentPageRange: () => this.#getCurrentPageRange(),
      isExcludedByTrimRows: physicalRow => trimRowsMap?.getValueAtIndex(physicalRow) === true,
      isExcludedByHiddenRows: physicalRow => hiddenRowsMap?.getValueAtIndex(physicalRow) === true,
      isRowSelectable,
    };
    const rows = collectRowsInScope(host, resolvedScope);

    if (!checks.groupMode) {
      return rows;
    }

    // The leaves hold the selection, the leaves of a collapsed parent included.
    const leaves = this.#expandGroupsToLeaves(rows, checks, physicalRow =>
      host.isExcludedByTrimRows(physicalRow) || host.isExcludedByHiddenRows(physicalRow));

    return selectableOnly ? leaves.filter(checks.isSelectable) : leaves;
  }

  /**
   * The visual range of the page the Pagination plugin shows.
   *
   * @returns {Array|null}
   */
  #getCurrentPageRange(): [number, number] | null {
    const pagination = this.hot.getPlugin('pagination');

    if (!pagination?.enabled) {
      return null;
    }

    const { firstVisibleRowIndex, lastVisibleRowIndex } = pagination.getPaginationData();

    return [firstVisibleRowIndex, lastVisibleRowIndex];
  }

  /**
   * Returns the trimming or hiding map registered under the name, if any.
   *
   * @param {string} mapName The name the map is registered under.
   * @returns {object|undefined}
   */
  #getFlagMap(mapName: string): { getValueAtIndex(index: number): unknown } | undefined {
    const { trimmingMapsCollection, hidingMapsCollection } = this.hot.rowIndexMapper;

    return trimmingMapsCollection.get(mapName) ?? hidingMapsCollection.get(mapName);
  }

  /**
   * Checks whether the physical row is selected. A loop over rows uses `#createRowChecks()` instead.
   *
   * @param {number|null} physicalRow Physical row index.
   * @returns {boolean}
   */
  #isPhysicalRowSelected(physicalRow: number | null): boolean {
    return this.#createRowChecks().isSelected(physicalRow);
  }

  /**
   * Checks whether the physical row can be selected. A loop over rows uses `#createRowChecks()`
   * instead.
   *
   * @param {number} physicalRow Physical row index.
   * @returns {boolean}
   */
  #isPhysicalRowSelectable(physicalRow: number): boolean {
    return this.#createRowChecks().isSelectable(physicalRow);
  }

  /**
   * The NestedRows plugin instance, looked up once: `getPlugin()` resolves the name on every call,
   * which cost a scroll frame several times its own time when it ran for every painted cell. The
   * instance lives as long as the grid; whether it is enabled is read where it matters.
   *
   * @returns {object|undefined}
   */
  #getNestedRowsPlugin() {
    if (this.#nestedRowsPlugin === undefined) {
      this.#nestedRowsPlugin = this.hot.getPlugin('nestedRows') ?? null;
    }

    return this.#nestedRowsPlugin ?? undefined;
  }

  /**
   * Returns the row checks shared by every cell and header one draw paints, so a draw resolves the
   * bound column, the NestedRows plugin and the settings once instead of once per cell. Scroll draws
   * run no render hook, so the checks live until the end of the current task, and every change of the
   * selection, the data that the checks read, the settings, or the row indexes drops them sooner.
   * Only the rendering hooks read them; the public API builds fresh checks.
   *
   * @returns {RowChecks}
   */
  #getDrawRowChecks(): RowChecks {
    if (!this.#drawRowChecks) {
      this.#drawRowChecks = this.#createRowChecks();
      queueMicrotask(this.#dropDrawRowChecks);
    }

    return this.#drawRowChecks;
  }

  /**
   * Drops the row checks shared by one draw.
   */
  #dropDrawRowChecks = () => {
    this.#drawRowChecks = null;
  };

  /**
   * Resolves what the per-row checks need once, and returns the checks.
   *
   * @returns {RowChecks}
   */
  #createRowChecks(): RowChecks {
    const selectedRowsMap = this.#selectedRowsMap;
    const rowsCount = this.hot.rowIndexMapper.getNumberOfIndexes();
    const boundColumn = this.getBoundColumn();
    const boundProp = boundColumn === null ? null : this.hot.colToProp(boundColumn) ?? boundColumn;
    const nestedRows = this.#getNestedRowsPlugin();
    const nestedRowsDataManager = nestedRows?.enabled ? nestedRows.dataManager ?? null : null;
    const groupSelects = this.#resolveGroupSelects(boundColumn, nestedRowsDataManager !== null);
    const { isRowSelectable } = this.#getSettings();

    const isSelected = (physicalRow: number | null): boolean => {
      if (physicalRow === null || !selectedRowsMap) {
        return false;
      }

      if (boundColumn !== null) {
        const value = this.hot.getSourceDataAtCell(physicalRow, boundProp!);

        return isCheckedValue(value, this.#getBoundMeta(physicalRow, boundColumn));
      }

      return selectedRowsMap.getValueAtIndex(physicalRow) === true;
    };

    const isSelectable = (physicalRow: number): boolean => {
      if (physicalRow < 0 || physicalRow >= rowsCount) {
        return false;
      }

      if (groupSelects === 'topLevel' && nestedRowsDataManager!.getRowLevel(physicalRow) !== 0) {
        return false;
      }

      // A bound row is selected by writing its cell, so a cell that cannot be written cannot be selected.
      if (boundColumn !== null) {
        const meta = this.#getBoundMeta(physicalRow, boundColumn);

        if (meta.readOnly || !isCheckboxMeta(meta)) {
          return false;
        }
      }

      return !isRowSelectable || isRowSelectable(this.hot.getSourceDataAtRow(physicalRow), physicalRow) !== false;
    };

    if (groupSelects === 'descendants') {
      const tree = this.#getGroupTree(nestedRowsDataManager!, isSelectable);

      return {
        isSelected: physicalRow => physicalRow !== null && tree.state[physicalRow] === GROUP_CHECKED,
        isSelectable: physicalRow => tree.selectable[physicalRow] === 1,
        isMixed: physicalRow => tree.state[physicalRow] === GROUP_MIXED,
        isGroup: physicalRow => tree.isParent[physicalRow] === 1,
        groupMode: true,
      };
    }

    return { isSelected, isSelectable, isMixed: () => false, isGroup: () => false, groupMode: false };
  }

  /**
   * Resolves how the rows of a NestedRows tree are selected. A parent cannot show a mixed state in a
   * bound checkbox column, and the `'singleRow'` mode selects one row, so both fall back to `'self'`.
   *
   * @param {number|null} boundColumn The bound column, if any.
   * @param {boolean} hasNestedRows Whether the NestedRows plugin is enabled.
   * @returns {string|null} `null` without the NestedRows plugin.
   */
  #resolveGroupSelects(boundColumn: number | null, hasNestedRows: boolean): RowSelectionGroupSelects | null {
    if (!hasNestedRows) {
      return null;
    }

    const { groupSelects, mode } = this.#getSettings();

    if (groupSelects === 'descendants' && (mode === 'singleRow' || boundColumn !== null)) {
      return 'self';
    }

    return groupSelects;
  }

  /**
   * Returns the state of every row of the NestedRows tree, computed once per change.
   *
   * @param {object} dataManager The NestedRows data manager.
   * @param {Function} isRowSelectable Tells whether a row can be selected on its own.
   * @returns {object}
   */
  #getGroupTree(
    dataManager: NestedRowsDataManager,
    isRowSelectable: (physicalRow: number) => boolean,
  ): GroupTree {
    if (this.#groupTree === null) {
      this.#groupTree = this.#computeGroupTree(dataManager, isRowSelectable);
    }

    return this.#groupTree;
  }

  /**
   * Computes the state of every row of the NestedRows tree in one pass. Only the leaves store a
   * selection; a parent is checked when every selectable leaf under it is selected, mixed when some
   * are, and selectable when it has a selectable leaf. A parent that `isRowSelectable` rejects makes
   * the rows under it unselectable too.
   *
   * @param {object} dataManager The NestedRows data manager.
   * @param {Function} isRowSelectable Tells whether a row can be selected on its own.
   * @returns {object}
   */
  #computeGroupTree(
    dataManager: NestedRowsDataManager,
    isRowSelectable: (physicalRow: number) => boolean,
  ): GroupTree {
    const count = this.hot.rowIndexMapper.getNumberOfIndexes();
    const tree: GroupTree = {
      selectable: new Uint8Array(count),
      state: new Uint8Array(count),
      isParent: new Uint8Array(count),
    };
    const selectedRowsMap = this.#selectedRowsMap;

    // Returns the number of selectable leaves under the node, and of the selected ones among them.
    const visit = (node: NestedRowObject, ancestorsSelectable: boolean): [number, number] => {
      const physicalRow = dataManager.getRowIndex(node);

      if (physicalRow === null || physicalRow >= count) {
        return [0, 0];
      }

      const selectable = ancestorsSelectable && isRowSelectable(physicalRow);

      if (!dataManager.hasChildren(node)) {
        const selected = selectedRowsMap?.getValueAtIndex(physicalRow) === true;

        tree.selectable[physicalRow] = selectable ? 1 : 0;
        tree.state[physicalRow] = selected ? GROUP_CHECKED : GROUP_UNCHECKED;

        return [selectable ? 1 : 0, selectable && selected ? 1 : 0];
      }

      let total = 0;
      let selected = 0;

      (node.__children as NestedRowObject[]).forEach((child) => {
        const [childTotal, childSelected] = visit(child, selectable);

        total += childTotal;
        selected += childSelected;
      });

      tree.isParent[physicalRow] = 1;
      tree.selectable[physicalRow] = total > 0 ? 1 : 0;
      tree.state[physicalRow] = resolveGroupState(total, selected);

      return [total, selected];
    };

    (dataManager.getData() ?? []).forEach(node => visit(node as NestedRowObject, true));

    return tree;
  }

  /**
   * Replaces every parent in the list with the leaves under it (`groupSelects: 'descendants'`): the
   * leaves hold the selection.
   *
   * @param {number[]} physicalRows Physical row indexes.
   * @param {object} checks The row checks.
   * @param {Function} [isExcluded] Tells whether a leaf under a parent is out of the list.
   * @returns {number[]} Physical indexes of leaves, in ascending order.
   */
  #expandGroupsToLeaves(
    physicalRows: number[],
    checks: RowChecks,
    isExcluded: (physicalRow: number) => boolean = () => false,
  ): number[] {
    const dataManager = this.#getNestedRowsPlugin()!.dataManager!;
    const leaves = new Set<number>();

    physicalRows.forEach((physicalRow) => {
      if (!checks.isGroup(physicalRow)) {
        leaves.add(physicalRow);

        return;
      }

      // A parent's descendants are the rows right after it, in tree order.
      const last = physicalRow + dataManager.countChildren(physicalRow);

      for (let row = physicalRow + 1; row <= last; row++) {
        if (!checks.isGroup(row) && !isExcluded(row)) {
          leaves.add(row);
        }
      }
    });

    return Array.from(leaves).sort((a, b) => a - b);
  }

  /**
   * The cell meta of a row in the bound column, resolved by the physical row, so a row the filters
   * removed still gets its own meta (a `cells` callback or `setCellMeta()` read-only flag included).
   *
   * @param {number} physicalRow Physical row index.
   * @param {number} boundColumn Visual index of the bound column.
   * @returns {object}
   */
  #getBoundMeta(physicalRow: number, boundColumn: number): CheckboxMeta {
    return getCheckboxCellMeta(this.hot, physicalRow, boundColumn);
  }

  /**
   * Checks whether the row shows a checkbox at all.
   *
   * @param {number} physicalRow Physical row index.
   * @param {RowChecks} [checks] The checks to ask. The render path passes the per-draw ones, which keeps
   * `hideDisabledCheckboxes` from building new checks for every painted cell.
   * @returns {boolean}
   */
  #hasRowCheckbox(physicalRow: number, checks?: RowChecks): boolean {
    const { checkboxes, hideDisabledCheckboxes } = this.#getSettings();

    if (hideDisabledCheckboxes && !(checks ?? this.#createRowChecks()).isSelectable(physicalRow)) {
      return false;
    }

    if (typeof checkboxes === 'function') {
      return checkboxes(this.hot.getSourceDataAtRow(physicalRow), physicalRow) !== false;
    }

    return checkboxes;
  }

  /**
   * Translates visual rows into physical ones, dropping the ones that do not exist.
   *
   * @param {number[]} rows Visual row indexes.
   * @returns {number[]}
   */
  #toPhysicalRows(rows: number[]): number[] {
    const physicalRows: number[] = [];

    rows.forEach((row) => {
      const physicalRow = Number.isInteger(row) ? this.hot.toPhysicalRow(row) : null;

      if (physicalRow !== null) {
        physicalRows.push(physicalRow);
      }
    });

    return physicalRows;
  }

  /**
   * The visual column the checkboxes are rendered in with `checkboxLocation: 'firstColumn'`, or
   * `null` with the other location.
   *
   * @returns {number|null}
   */
  #getCheckboxColumn(): number | null {
    const boundColumn = this.getBoundColumn();

    if (boundColumn !== null) {
      return boundColumn;
    }

    if (this.#getSettings().checkboxLocation !== 'firstColumn') {
      return null;
    }

    return this.hot.columnIndexMapper.getVisualFromRenderableIndex(0);
  }

  /**
   * Warns once when `checkboxLocation: 'firstColumn'` draws the row checkboxes into a checkbox column:
   * every cell then shows two checkboxes, and Space toggles the row selection, not the cell value.
   *
   * @param {number} column Visual column index of the column the checkboxes are drawn in.
   */
  #warnIfFirstColumnIsCheckboxColumn(column: number) {
    if (this.#firstColumnWarningShown || column < 0 || this.#getSettings().checkboxLocation !== 'firstColumn' ||
      !isCheckboxMeta(this.hot.getColumnMeta(column) as CheckboxMeta)) {
      return;
    }

    this.#firstColumnWarningShown = true;
    warn('RowSelection: `checkboxLocation: \'firstColumn\'` draws the row checkboxes into a checkbox column ' +
      `(${column}). To use that column's values as the selection, set \`checkboxLocation: { column }\`.`);
  }

  /**
   * Tells whether the checkboxes are drawn in the plugin's row header column: with
   * `checkboxLocation: 'rowHeader'`, and as the fallback of a bound column that does not resolve to a
   * checkbox column (`getBoundColumn()` warns about it once).
   *
   * @returns {boolean}
   */
  #isRowHeaderLocation(): boolean {
    const { checkboxLocation } = this.#getSettings();

    return checkboxLocation === 'rowHeader' || (isPlainObject(checkboxLocation) && this.getBoundColumn() === null);
  }

  /**
   * The column coordinate of the plugin's row header column (negative, like every row header), or
   * `null` with `checkboxLocation: 'firstColumn'`.
   *
   * @returns {number|null}
   */
  #getRowHeaderColumnCoord(): number | null {
    if (this.#rowHeaderRendererIndex < 0 || !this.hot.view) {
      return null;
    }

    return this.#rowHeaderRendererIndex - this.hot.view.getRowHeadersCount();
  }

  /**
   * Creates or updates the checkbox inside the container.
   *
   * @param {HTMLElement} container The element the checkbox lives in.
   * @param {object} state The checkbox state.
   * @param {boolean} state.checked Whether the checkbox is checked.
   * @param {boolean} state.indeterminate Whether the checkbox shows the mixed state.
   * @param {boolean} state.disabled Whether the checkbox is disabled.
   * @param {boolean} state.hidden Whether the checkbox is hidden.
   * @param {string} state.label The accessible label.
   * @param {Node|null} [before] The node to insert a new checkbox before.
   */
  #renderCheckbox(
    container: HTMLElement,
    state: { checked: boolean; indeterminate: boolean; disabled: boolean; hidden: boolean; label: string },
    before: Node | null = container.firstChild,
  ) {
    let box = container.querySelector<HTMLElement>(`:scope > .${CHECKBOX_BOX_CLASS}`);
    let input = box?.querySelector<HTMLInputElement>(`:scope > .${CHECKBOX_CLASS}`) ?? null;

    // The tick is an `<i class="ht-icon">` sibling of the input (an `<input>` holds no children),
    // so the input and the icon share the checkbox renderer's `span.htCheckboxRendererBox` wrapper,
    // which lays the icon over the input's box.
    if (!box || !input) {
      box?.remove();
      box = this.hot.rootDocument.createElement('span');
      box.className = `htCheckboxRendererBox ${CHECKBOX_BOX_CLASS}`;
      input = this.hot.rootDocument.createElement('input');
      input.type = 'checkbox';
      input.tabIndex = -1;
      input.className = `htCheckboxRendererInput ${CHECKBOX_CLASS}`;
      box.appendChild(input);
      container.insertBefore(box, before);
    }

    syncIcon(this.hot, box, CHECKBOX_ICON_CLASS, state.indeterminate ? 'collapseOff' : 'checkbox');

    input.checked = state.checked;
    input.indeterminate = state.indeterminate;
    input.disabled = state.disabled;
    input.classList.toggle(HIDDEN_CHECKBOX_CLASS, state.hidden);

    if (this.hot.getSettings().ariaTags) {
      setAttribute(input, [
        A11Y_LABEL(state.label),
        A11Y_CHECKED(state.indeterminate ? 'mixed' : state.checked),
      ]);
    } else {
      removeAttribute(input, ['aria-label', 'aria-checked']);
    }
  }

  /**
   * Removes the plugin's checkbox from the container, if it holds one.
   *
   * @param {HTMLElement|null} container The element to clean.
   */
  #removeCheckbox(container: HTMLElement | null) {
    container?.querySelector(`:scope > .${CHECKBOX_BOX_CLASS}`)?.remove();
  }

  /**
   * Removes the "select all" checkbox, and the classes that come with it, from every column header
   * (overlays included). Core keeps a header's content on the next render and a disabled plugin runs
   * no `afterGetColHeader`, so the checkbox would otherwise stay in the header with nothing behind it.
   */
  #removeHeaderCheckboxes() {
    this.hot.rootElement.querySelectorAll<HTMLTableCellElement>(`th.${HEADER_CELL_CLASS}`).forEach((TH) => {
      removeClass(TH, [HEADER_CELL_CLASS, CORNER_CELL_CLASS, CHECKBOX_ONLY_CELL_CLASS]);
      this.#removeCheckbox(TH.firstChild as HTMLElement | null);
    });
  }

  /**
   * The state the checkbox of a row shows. A row that shows no checkbox (`checkboxes` returns
   * `false` for it, or `hideDisabledCheckboxes` hides it) gets `hidden: true`: in the first column
   * location a hidden placeholder keeps the cell values from shifting between rows. A hidden checkbox
   * is also disabled, and a press on it toggles nothing.
   *
   * @param {number} visualRow Visual row index.
   * @returns {object|null} `null` when the row does not exist.
   */
  #getRowCheckboxState(visualRow: number) {
    const physicalRow = this.hot.toPhysicalRow(visualRow);

    if (physicalRow === null) {
      return null;
    }

    const checks = this.#getDrawRowChecks();
    const hidden = !this.#hasRowCheckbox(physicalRow, checks);

    return {
      checked: !hidden && checks.isSelected(physicalRow),
      // a parent with only some of its rows selected (`groupSelects: 'descendants'`)
      indeterminate: !hidden && checks.isMixed(physicalRow),
      disabled: hidden || !checks.isSelectable(physicalRow),
      hidden,
      label: this.hot.getTranslatedPhrase(ROW_SELECTION_SELECT_ROW, { row: visualRow + 1 }) as string,
    };
  }

  /**
   * Tells whether the row shows a checkbox the user can see (and so press).
   *
   * @param {number} visualRow Visual row index.
   * @returns {boolean}
   */
  #hasVisibleRowCheckbox(visualRow: number): boolean {
    const physicalRow = this.hot.toPhysicalRow(visualRow);

    return physicalRow !== null && this.#hasRowCheckbox(physicalRow);
  }

  /**
   * Tells whether the "select all" checkbox is shown: `headerCheckbox` is on, in the `'multiRow'`
   * mode. Without it the corner (or the first column's header) is a plain header: no checkbox, no
   * pointer cursor, and a press on it selects nothing.
   *
   * @returns {boolean}
   */
  #hasHeaderCheckbox(): boolean {
    const { mode, headerCheckbox } = this.#getSettings();

    return mode !== 'singleRow' && headerCheckbox;
  }

  /**
   * The state the "select all" checkbox shows.
   *
   * @returns {object}
   */
  #getHeaderCheckboxRenderState() {
    const { state, selected, total } = this.getHeaderCheckboxState();

    return {
      checked: state === 'checked',
      indeterminate: state === 'mixed',
      disabled: state === 'disabled',
      hidden: false,
      label: this.hot.getTranslatedPhrase(ROW_SELECTION_SELECT_ALL, { selected, total }) as string,
    };
  }

  /**
   * Registers the Space shortcut that toggles the row (or every row) under the focused header.
   */
  #registerShortcuts() {
    this.hot.getShortcutManager().getContext('grid')?.addShortcut({
      keys: [['Space']],
      callback: (event: KeyboardEvent) => {
        const highlight = this.hot.getSelectedRangeActive()?.highlight;

        if (!highlight || highlight.row === null) {
          return;
        }

        if (highlight.row < 0) {
          this.#toggleAll('keyboard');
        } else {
          this.#toggleRow(highlight.row, 'keyboard');
        }

        // With `checkboxLocation: 'firstColumn'` the checkbox sits in a data cell, and the editor
        // manager opens an editor on any printable key unless the event is marked handled.
        (event as KeyboardEvent & { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled = false;

        return false;
      },
      runOnlyIf: () => canAccessCellContent(this.hot) && this.#isHighlightOnCheckbox(),
      relativeToGroup: SHORTCUTS_GROUP_EDITOR,
      position: 'before',
      group: SHORTCUTS_GROUP,
    });

    // Space on any data cell toggles its row, or every row of the selected ranges.
    // Shift+Space (select the row's cells) and Ctrl+Space (select the column) keep their meaning.
    this.hot.getShortcutManager().getContext('grid')?.addShortcut({
      keys: [['Space']],
      callback: (event: KeyboardEvent) => {
        this.#toggleSelectedRanges();
        // The editor manager opens an editor on any printable key unless the event is marked handled.
        (event as KeyboardEvent & { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled = false;

        return false;
      },
      runOnlyIf: () => canAccessCellContent(this.hot) && this.#isHighlightOnDataCell(),
      relativeToGroup: SHORTCUTS_GROUP_EDITOR,
      position: 'before',
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Tells whether Space on the focused cell should toggle row selection: a data cell that is not a
   * checkbox cell (a checkbox cell keeps its own Space, which checks it).
   *
   * @returns {boolean}
   */
  #isHighlightOnDataCell(): boolean {
    const highlight = this.hot.getSelectedRangeActive()?.highlight;

    if (!highlight || highlight.row === null || highlight.col === null || highlight.row < 0 || highlight.col < 0 ||
      this.#isHighlightOnCheckbox()) {
      return false;
    }

    return !isCheckboxMeta(this.hot.getCellMetaTransient(highlight.row, highlight.col) as CheckboxMeta);
  }

  /**
   * Toggles the rows of every selected range: selects all of them when any is not selected yet (the
   * same "mixed checks everything" rule as the header), deselects them otherwise.
   */
  #toggleSelectedRanges() {
    const visualRows = new Set<number>();

    (this.hot.getSelectedRange() ?? []).forEach((range) => {
      const from = Math.max(0, range.getTopStartCorner().row ?? 0);
      const to = range.getBottomEndCorner().row ?? -1;

      for (let row = from; row <= to; row++) {
        visualRows.add(row);
      }
    });

    // A range drawn over hidden rows (HiddenRows) still lists them; they are out of every scope.
    const { isSelected, isSelectable } = this.#createRowChecks();
    const isInScope = this.#createScopeFilter();
    const physicalRows = this.#toPhysicalRows(Array.from(visualRows).sort((a, b) => a - b))
      .filter(physicalRow => isInScope(physicalRow) && isSelectable(physicalRow));

    if (physicalRows.length === 0) {
      return;
    }

    if (physicalRows.length === 1) {
      this.#toggleRow(this.hot.toVisualRow(physicalRows[0])!, 'keyboard');

      return;
    }

    const allSelected = physicalRows.every(isSelected);

    if (allSelected) {
      this.#applyChange([], physicalRows, 'keyboard');
    } else {
      this.#select(physicalRows, 'keyboard');
    }
  }

  /**
   * Runs `afterRowSelectionChange`, and tells assistive technology what a user action changed. A
   * single row is named; a bigger change reports the count in the "select all" scope.
   *
   * @param {number[]} selected Physical rows that were selected.
   * @param {number[]} deselected Physical rows that were deselected.
   * @param {RowSelectionSource} source The source of the change.
   */
  #notifyChange(selected: number[], deselected: number[], source: RowSelectionSource) {
    this.hot.runHooks('afterRowSelectionChange', selected, deselected, source);

    if (!this.hot.getSettings().ariaTags || source === 'api' || source === 'dataChange') {
      return;
    }

    const changed = selected.length + deselected.length;
    let message: unknown;

    // A row with no visual index (filtered out, picked up by `selectAll: 'all'`) cannot be named:
    // the count is announced instead.
    const visualRow = changed === 1 ? this.hot.toVisualRow(selected[0] ?? deselected[0]) : null;

    if (visualRow !== null) {
      message = this.hot.getTranslatedPhrase(
        selected.length === 1 ? ROW_SELECTION_ANNOUNCE_ROW_SELECTED : ROW_SELECTION_ANNOUNCE_ROW_DESELECTED,
        { row: visualRow + 1 },
      );
    } else {
      this.#headerSummaryCache = null;
      this.#groupTree = null;

      const { selected: count, total } = this.getHeaderCheckboxState();

      message = this.hot.getTranslatedPhrase(ROW_SELECTION_ANNOUNCE_COUNT, { selected: count, total });
    }

    announce(String(message ?? ''));
  }

  /**
   * Tells whether the focused cell or header holds one of the plugin's checkboxes.
   *
   * @returns {boolean}
   */
  #isHighlightOnCheckbox(): boolean {
    const range = this.hot.getSelectedRangeActive();
    const highlight = range?.highlight;

    if (!range?.isSingle() || !highlight || highlight.row === null || highlight.col === null) {
      return false;
    }

    const checkboxColumn = this.#getCheckboxColumn() ?? this.#getRowHeaderColumnCoord();

    if (highlight.col !== checkboxColumn) {
      return false;
    }

    // In a bound column the cell is a checkbox cell: its own Space shortcut writes it, and the
    // change reaches the selection through `beforeChange`/`afterChange`. A row whose checkbox is
    // not shown has nothing to press.
    if (highlight.row >= 0) {
      return this.getBoundColumn() === null && this.#hasVisibleRowCheckbox(highlight.row);
    }

    if (!this.#hasHeaderCheckbox()) {
      return false;
    }

    const headerElement = this.hot.getCell(highlight.row, highlight.col, true);

    return !!headerElement && isBottomMostColumnHeader(headerElement as HTMLTableCellElement);
  }

  /**
   * Handles a press on a checkbox: toggles the row or every row, and keeps the press from
   * changing the cell selection.
   *
   * @param {MouseEvent} event The `mousedown` event.
   * @param {CellCoords} coords The coordinates of the pressed cell.
   * @param {HTMLTableCellElement} TD The pressed cell.
   */
  #onBeforeOnCellMouseDown = (event: MouseEvent, coords: { row: number; col: number }, TD: HTMLElement) => {
    const target = eventTargetEl(event);

    // On a touch device Walkontable runs this with the deferred `touchstart` (`event.ts`, `onTouchEnd`),
    // which has no `button`, so a tap counts as a left click.
    if (!target || !(isLeftClick(event) || isTouchEvent(event))) {
      return;
    }

    // With the row header location the whole header cell is the hit area; with the first column
    // location only the checkbox is, because the rest of the cell holds data. The classes are only
    // on a cell that shows a checkbox: a row with no checkbox, and a corner with no "select all"
    // checkbox, are plain headers.
    const isOwnHeaderCell = hasClass(TD, ROW_CELL_CLASS) || hasClass(TD, HEADER_CELL_CLASS);
    const isOwnCheckbox = hasClass(target, CHECKBOX_CLASS) && !hasClass(target, HIDDEN_CHECKBOX_CLASS);

    if (!isOwnCheckbox && !(isOwnHeaderCell && this.#isRowHeaderLocation())) {
      return;
    }

    // The DOM can be one render behind the settings: ask the state, not only the classes.
    if (coords.row < 0 ? !this.#hasHeaderCheckbox() : !this.#hasVisibleRowCheckbox(coords.row)) {
      return;
    }

    if (coords.row < 0) {
      this.#toggleAll('headerCheckbox');

    } else if (event.shiftKey) {
      this.#selectRangeTo(coords.row, 'checkbox');

    } else {
      this.#toggleRow(coords.row, 'checkbox');
    }

    // Only the grid's own flag, which makes the table skip selection handling. The shared
    // `stopImmediatePropagation()` helper also sets `cancelBubble`, so the press would never reach
    // `document` and an open menu would not close (DEV-214, see `../collapsibleColumns/`).
    (event as MouseEvent & { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled = false;
    // Keeps the browser focus off the checkbox: the keyboard stays with the grid, so Space and the
    // arrow keys keep working after a click.
    event.preventDefault();
    this.eventManager.fireEvent(target, 'mouseup');
  };

  /**
   * Selects rows on a click on a cell, when `enableClickSelection` allows it.
   *
   * @param {MouseEvent} event The `mousedown` event.
   * @param {CellCoords} coords The coordinates of the clicked cell.
   */
  #onAfterOnCellMouseDown = (event: MouseEvent, coords: { row: number; col: number }) => {
    const { enableClickSelection } = this.#getSettings();

    if (enableClickSelection === false || !(isLeftClick(event) || isTouchEvent(event)) ||
      coords.row < 0 || coords.col < 0 || coords.col === this.getBoundColumn()) {
      return;
    }

    const physicalRow = this.hot.toPhysicalRow(coords.row);
    const canSelect = enableClickSelection === true || enableClickSelection === 'enableSelection';
    const canDeselect = enableClickSelection === true || enableClickSelection === 'enableDeselection';
    const isSelected = this.#isPhysicalRowSelected(physicalRow);

    if (physicalRow === null) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      if (isSelected ? canDeselect : canSelect) {
        this.#toggleRow(coords.row, 'click');
      }

    } else if (event.shiftKey && canSelect) {
      this.#selectRangeTo(coords.row, 'click');

    } else if (canSelect) {
      this.#selectOnly(physicalRow, 'click');

      // The anchor moves only to a row the click left selected (a veto leaves it where it was).
      if (this.#isPhysicalRowSelected(physicalRow)) {
        this.#anchorPhysicalRow = physicalRow;
      }
    }
  };

  /**
   * Keeps the browser focus off the checkbox on every press. On a touch device Walkontable drops the
   * browser's own `mousedown` that follows a tap (it already ran the press from `touchend`), so the
   * plugin's hook never sees it and its default action would focus the input. A focused input is
   * then skipped by Walkontable's "press on the focused element" guard, and a second tap on the same
   * checkbox would do nothing.
   *
   * @param {MouseEvent} event The `mousedown` event.
   */
  #onRootMouseDown = (event: MouseEvent) => {
    const target = eventTargetEl(event);

    if (target && hasClass(target, CHECKBOX_CLASS)) {
      event.preventDefault();
    }
  };

  /**
   * Keeps a click from flipping a checkbox on its own. The state was already applied on
   * `mousedown` and rendered; letting the browser toggle it again would show the opposite.
   *
   * @param {MouseEvent} event The `click` event.
   */
  #onRootClick = (event: MouseEvent) => {
    const target = eventTargetEl(event);

    if (target && hasClass(target, CHECKBOX_CLASS)) {
      event.preventDefault();
    }
  };

  /**
   * Adds the plugin's column to the row headers.
   *
   * @param {Function[]} renderers The row header renderers.
   */
  #onAfterGetRowHeaderRenderers = (renderers: Array<(...args: unknown[]) => unknown>) => {
    if (!this.#isRowHeaderLocation()) {
      this.#rowHeaderRendererIndex = -1;

      return;
    }

    this.#rowHeaderRendererIndex = renderers.length;

    renderers.push((renderableRow: unknown, TH: unknown) => {
      const renderableRowIndex = renderableRow as number;
      const visualRow = renderableRowIndex >= 0 ?
        this.hot.rowIndexMapper.getVisualFromRenderableIndex(renderableRowIndex) : renderableRowIndex;

      this.#renderRowHeaderCell(visualRow, TH as HTMLTableCellElement);
    });
  };

  /**
   * Renders one cell of the plugin's row header column.
   *
   * @param {number|null} visualRow Visual row index.
   * @param {HTMLTableCellElement} TH The header cell.
   */
  #renderRowHeaderCell(visualRow: number | null, TH: HTMLTableCellElement) {
    let container = TH.firstChild as HTMLElement | null;

    if (!container || !hasClass(container, 'relative')) {
      empty(TH);
      container = this.hot.rootDocument.createElement('div');
      container.className = 'relative';
      TH.appendChild(container);
    }

    const state = visualRow === null || visualRow < 0 ? null : this.#getRowCheckboxState(visualRow);

    // A row with no checkbox gets a plain header cell: no checkbox, no pointer cursor, and no hit
    // area (the class is what `#onBeforeOnCellMouseDown` and the stylesheet key on). The cell's width
    // is fixed by `modifyRowHeaderWidth`, so nothing shifts without a placeholder.
    if (!state || state.hidden) {
      this.#removeCheckbox(container);

      if (visualRow !== null && visualRow >= 0 &&
        this.#getDrawRowChecks().isSelected(this.hot.toPhysicalRow(visualRow))) {
        addClass(TH, SELECTED_ROW_CLASS);
      }

      return;
    }

    addClass(TH, ROW_CELL_CLASS);

    if (state.checked) {
      addClass(TH, SELECTED_ROW_CLASS);
    }

    this.#renderCheckbox(container, state);
  }

  /**
   * Renders the "select all" checkbox into the column header it belongs to, and removes a stale
   * one from any other header (header cells are reused).
   *
   * @param {number} column Visual column index (negative for the corner).
   * @param {HTMLTableCellElement} TH The header cell.
   */
  #onAfterGetColHeader = (column: number, TH: HTMLTableCellElement) => {
    const container = TH.firstChild as HTMLElement | null;
    const checkboxColumn = this.#getCheckboxColumn() ?? this.#getRowHeaderColumnCoord();

    if (!container) {
      return;
    }

    if (column === checkboxColumn) {
      this.#warnIfFirstColumnIsCheckboxColumn(column);
    }

    // Without the "select all" checkbox the header stays a plain one: no class, so no pointer
    // cursor and no hit area.
    if (column !== checkboxColumn || !isBottomMostColumnHeader(TH) || !this.#hasHeaderCheckbox()) {
      this.#removeCheckbox(container);

      return;
    }

    // The corner gets a class of its own: core never removes `cornerHeader` from a reused header
    // label, so that class cannot tell the corner apart from a column header.
    addClass(TH, column < 0 ? [HEADER_CELL_CLASS, CORNER_CELL_CLASS] : HEADER_CELL_CLASS);

    // A header with no label (the corner, or a column made only for the checkboxes) centers the
    // checkbox: the empty label would otherwise still take the room next to it.
    if (column < 0 || (container.querySelector('.colHeader')?.textContent ?? '').trim() === '') {
      addClass(TH, CHECKBOX_ONLY_CELL_CLASS);
    }
    this.#renderCheckbox(container, this.#getHeaderCheckboxRenderState());
  };

  /**
   * Marks the row header of a selected row.
   *
   * @param {number} row Visual row index.
   * @param {HTMLTableCellElement} TH The row header cell.
   */
  #onAfterGetRowHeader = (row: number, TH: HTMLTableCellElement) => {
    if (row >= 0 && this.#getDrawRowChecks().isSelected(this.hot.toPhysicalRow(row))) {
      addClass(TH, SELECTED_ROW_CLASS);
    }
  };

  /**
   * Marks the cells of a selected row, and renders the checkbox into the first column with
   * `checkboxLocation: 'firstColumn'`.
   *
   * @param {HTMLTableCellElement} TD The cell.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   */
  #onAfterRenderer = (TD: HTMLTableCellElement, row: number, column: number) => {
    if (this.#getDrawRowChecks().isSelected(this.hot.toPhysicalRow(row))) {
      addClass(TD, SELECTED_ROW_CLASS);
    }

    // A bound column renders its own checkbox (the checkbox cell type): nothing to add.
    if (column !== this.#getCheckboxColumn() || this.getBoundColumn() !== null) {
      return;
    }

    // A row with no checkbox renders a hidden placeholder (`htRowSelectionCheckboxHidden`, which
    // the stylesheet makes `visibility: hidden`), so the cell values stay aligned across rows.
    const state = this.#getRowCheckboxState(row);
    const contentRoot = getCellContentRoot(TD);

    if (state) {
      this.#renderCheckbox(contentRoot, state);
    } else {
      this.#removeCheckbox(contentRoot);
    }
  };

  /**
   * Sizes the plugin's row header column to fit the checkbox.
   *
   * @param {number|number[]} rowHeaderWidth The width(s) resolved so far.
   * @returns {number|number[]}
   */
  #onModifyRowHeaderWidth = (rowHeaderWidth: number | number[]) => {
    const index = this.#rowHeaderRendererIndex;
    const count = this.hot.view?.getRowHeadersCount() ?? 0;

    if (index < 0 || count === 0) {
      return rowHeaderWidth;
    }

    const widths = Array.isArray(rowHeaderWidth) ?
      rowHeaderWidth.slice() : new Array<number>(count).fill(rowHeaderWidth);

    widths[index] = this.#getCheckboxCellWidth();

    return widths;
  };

  /**
   * Widens the first column by the checkbox with `checkboxLocation: 'firstColumn'`, when its width
   * came from AutoColumnSize (which measures the cells without the checkbox). A width the user set
   * is left alone.
   *
   * @param {number} width The column width.
   * @param {number} column Visual column index.
   * @returns {number}
   */
  #onModifyColWidth = (width: number, column: number) => {
    if (typeof width !== 'number' || column !== this.#getCheckboxColumn() || this.getBoundColumn() !== null) {
      return width;
    }

    const autoColumnSize = this.hot.getPlugin('autoColumnSize');

    if (autoColumnSize?.enabled && width === autoColumnSize.getColumnWidth(column)) {
      return width + this.#getCheckboxCellWidth() - this.#getCellPadding();
    }

    return width;
  };

  /**
   * The width a cell needs to fit the checkbox, from the theme's variables.
   *
   * @returns {number}
   */
  #getCheckboxCellWidth(): number {
    const checkboxSize = Number(this.hot.stylesHandler.getCSSVariableValue('checkbox-size'));
    const size = Number.isFinite(checkboxSize) && checkboxSize > 0 ? checkboxSize : DEFAULT_CHECKBOX_SIZE;

    return size + (this.#getCellPadding() * 2) + 1;
  }

  /**
   * The horizontal cell padding, from the theme's variables.
   *
   * @returns {number}
   */
  #getCellPadding(): number {
    const padding = Number(this.hot.stylesHandler.getCSSVariableValue('cell-horizontal-padding'));

    return Number.isFinite(padding) && padding >= 0 ? padding : DEFAULT_CELL_PADDING;
  }

  /**
   * Lets `beforeRowSelectionChange` veto an edit of the bound column that would select or deselect
   * rows: a click on a cell's checkbox, Space, a paste, an autofill. A vetoed change is dropped.
   *
   * @param {Array} changes The changes, `[row, prop, oldValue, newValue]`.
   * @param {string} source The change source.
   */
  #onBeforeChange = (changes: Array<unknown[] | null>, source: string) => {
    // The plugin's own writes already ran the hooks in `#applyChange()`.
    if (source === BOUND_WRITE_SOURCE) {
      return;
    }

    if (!Array.isArray(changes) || !this.#touchesBoundColumn(changes)) {
      return;
    }

    // One set of checks for the whole batch: a paste into the bound column can carry every row.
    const flips = this.#collectBoundFlips(changes, this.#createRowChecks());

    if (!flips) {
      return;
    }

    // A row `isRowSelectable` rejects is not selected by an edit of its cell either, the same way
    // `selectRows()` refuses it. Unchecking such a row stays allowed. A read-only cell is not rejected
    // here: the user cannot edit it, and an API write to it is a write to the data.
    flips.rejected.forEach((index) => {
      changes[index] = null;
    });

    if (flips.indexes.length === 0) {
      return;
    }

    const allowed = this.hot.runHooks('beforeRowSelectionChange', flips.selected, flips.deselected,
      this.#toSelectionSource(source)) !== false;

    if (!allowed) {
      flips.indexes.forEach((index) => {
        changes[index] = null;
      });
    }
  };

  /**
   * Reports an edit of the bound column that selected or deselected rows, and repaints the rows.
   *
   * @param {Array|null} changes The changes, `[row, prop, oldValue, newValue]`.
   * @param {string} source The change source.
   */
  #onAfterChange = (changes: Array<unknown[] | null> | null, source: string) => {
    if (!changes) {
      return;
    }

    if (this.#affectsSelectionState(changes)) {
      this.#invalidateHeaderSummary();
    }

    const flips = this.#collectBoundFlips(changes, null);

    if (!flips || flips.indexes.length === 0) {
      return;
    }

    if (source === BOUND_WRITE_SOURCE) {
      this.#collectOwnBoundWrite(flips);

      return;
    }

    // An undo or redo restores the data through `setSourceDataAtCell()`, which
    // `#onAfterSetSourceDataAtCell()` already reported (filtered-out rows included); UndoRedo repeats
    // the visible cells here.
    if (isUndoRedoSource(source)) {
      return;
    }

    this.#notifyChange(flips.selected, flips.deselected, this.#toSelectionSource(source));
    this.hot.markAllCellsChanged();
  };

  /**
   * Records the rows a write of the plugin's own to the bound column really changed. While the write
   * runs, `#writeBoundColumn()` collects them and reports them once; a write an asynchronous validator
   * held lands later, and is reported here with the source of the change that started it.
   *
   * @param {object} flips The rows that got selected and deselected.
   * @param {number[]} flips.selected Physical rows that got selected.
   * @param {number[]} flips.deselected Physical rows that got deselected.
   */
  #collectOwnBoundWrite(flips: { selected: number[]; deselected: number[] }) {
    const write = this.#boundWrite;

    if (write?.open) {
      // `concat`, not a spread `push()`: a paste can flip more rows than the call stack takes arguments.
      write.selected = write.selected.concat(flips.selected);
      write.deselected = write.deselected.concat(flips.deselected);

      return;
    }

    this.#notifyChange(flips.selected, flips.deselected, write?.source ?? 'api');
  }

  /**
   * Drops the "select all" state before the render an edit runs ahead of `afterChange`, and, when the
   * edit writes the bound column, marks the cells: under `renderMode: 'onChange'` the row tint
   * (`htRowSelected`) is state of this plugin's own, and an unmarked row would keep the tint of the
   * previous render until the next change.
   *
   * @param {Array|null} changes The changes, `[row, prop, oldValue, newValue]`.
   */
  #onBeforeChangeRender = (changes: Array<unknown[] | null> | null) => {
    if (!Array.isArray(changes) || !this.#affectsSelectionState(changes)) {
      return;
    }

    this.#invalidateHeaderSummary();

    if (this.#touchesBoundColumn(changes)) {
      this.hot.markAllCellsChanged();
    }
  };

  /**
   * Tells whether an edit can change which rows are selected or selectable: it writes the bound
   * column, an `isRowSelectable` function is set (it may read any value of the row), or a bound cell's
   * meta may read the row's values (see `#boundMetaMayReadData()`). Any other edit keeps the cached
   * "select all" state, which on a large grid is a full scan.
   *
   * @param {Array} changes The changes, `[row, prop, oldValue, newValue]`.
   * @returns {boolean}
   */
  #affectsSelectionState(changes: Array<unknown[] | null>): boolean {
    return isFunction(this.#getSettings().isRowSelectable) || this.#touchesBoundColumn(changes) ||
      (this.getBoundColumn() !== null && this.#boundMetaMayReadData());
  }

  /**
   * Tells whether the meta of a bound cell can depend on the data: a `cells` or `columns` function, or
   * a `beforeGetCellMeta`/`afterGetCellMeta` listener, may make the cell read-only (or not a checkbox)
   * from another column of its row, and a read-only bound cell is not selectable.
   *
   * @returns {boolean}
   */
  #boundMetaMayReadData(): boolean {
    const { cells, columns } = this.hot.getSettings();

    return isFunction(cells) || isFunction(columns) ||
      this.hot.hasHook('beforeGetCellMeta') || this.hot.hasHook('afterGetCellMeta');
  }

  /**
   * Drops the "select all" state when `setCellMeta()` or `removeCellMeta()` changes a cell's meta in
   * bound mode, or an undo or a redo may have restored one: a bound cell's `readOnly` and `type` decide
   * whether its row is selectable. Both sides of the undo are covered, as in CheckboxHeader: the render
   * inside the undo runs between them.
   */
  #onCellMetaChange = () => {
    if (this.getBoundColumn() !== null) {
      this.#invalidateHeaderSummary();
    }
  };

  /**
   * Tells whether any of the changes writes the bound column.
   *
   * @param {Array} changes The changes, `[row, prop, oldValue, newValue]`.
   * @returns {boolean}
   */
  #touchesBoundColumn(changes: Array<unknown[] | null>): boolean {
    const boundColumn = this.getBoundColumn();

    if (boundColumn === null) {
      return false;
    }

    const boundProp = this.hot.colToProp(boundColumn);

    return changes.some(change => Array.isArray(change) && change[1] === boundProp);
  }

  /**
   * Finds the changes to the bound column that flip a row's checked state.
   *
   * @param {Array} changes The changes, `[row, prop, oldValue, newValue]`.
   * @param {RowChecks|null} checksBeforeChange The checks to read the state before the change from, in
   * `beforeChange`, where the data still holds it; there the changes that would select a row
   * `isRowSelectable` rejects are marked too. `null` after the change, where the change's own old value
   * is used.
   * @param {Function} [toPhysicalRow] Resolves a change's row to a physical row. Defaults to the visual
   * to physical translation; source-data changes already carry physical rows.
   * @returns {object|null} The physical rows that get selected and deselected, the indexes of those
   * changes, and the indexes of the changes that would select a row `isRowSelectable` rejects.
   */
  #collectBoundFlips(
    changes: Array<unknown[] | null>,
    checksBeforeChange: RowChecks | null,
    toPhysicalRow: (row: number) => number | null = row => this.hot.toPhysicalRow(row),
  ) {
    const boundColumn = this.getBoundColumn();

    if (boundColumn === null || !Array.isArray(changes)) {
      return null;
    }

    const boundProp = this.hot.colToProp(boundColumn);
    const selected: number[] = [];
    const deselected: number[] = [];
    const indexes: number[] = [];
    const rejected: number[] = [];

    changes.forEach((change, index) => {
      if (!change || change[1] !== boundProp) {
        return;
      }

      const physicalRow = toPhysicalRow(change[0] as number);

      if (physicalRow === null) {
        return;
      }

      const meta = this.#getBoundMeta(physicalRow, boundColumn);
      const before = checksBeforeChange ?
        checksBeforeChange.isSelected(physicalRow) : isCheckedValue(change[2], meta);
      const after = isCheckedValue(change[3], meta);

      if (before === after) {
        return;
      }

      if (after && checksBeforeChange && this.#isRejectedByIsRowSelectable(physicalRow)) {
        rejected.push(index);
      } else {
        (after ? selected : deselected).push(physicalRow);
        indexes.push(index);
      }
    });

    return indexes.length > 0 || rejected.length > 0 ? { selected, deselected, indexes, rejected } : null;
  }

  /**
   * Tells whether the `isRowSelectable` option rejects the row.
   *
   * @param {number} physicalRow Physical row index.
   * @returns {boolean}
   */
  #isRejectedByIsRowSelectable(physicalRow: number): boolean {
    const { isRowSelectable } = this.#getSettings();

    return !!isRowSelectable && isRowSelectable(this.hot.getSourceDataAtRow(physicalRow), physicalRow) === false;
  }

  /**
   * Reports a `setSourceDataAtCell()` write to the bound column, an undo or redo of a bound selection
   * change included, as a selection change. It runs before the write's render.
   *
   * @param {Array} changes The changes, `[physicalRow, prop, oldValue, newValue]` each.
   * @param {string} [source] The change source.
   */
  #onAfterSetSourceDataAtCell = (changes: Array<unknown[] | null>, source?: string) => {
    if (!Array.isArray(changes) || !this.#affectsSelectionState(changes)) {
      return;
    }

    this.#invalidateHeaderSummary();
    this.hot.markAllCellsChanged();

    // The plugin's own write reaches the filtered-out rows this way; `#writeBoundColumn()` reports them.
    if (source === BOUND_WRITE_SOURCE) {
      return;
    }

    const rowsCount = this.hot.rowIndexMapper.getNumberOfIndexes();
    const flips = this.#collectBoundFlips(changes, null, row => (
      Number.isInteger(row) && row >= 0 && row < rowsCount ? row : null
    ));

    if (flips && flips.indexes.length > 0) {
      this.#notifyChange(flips.selected, flips.deselected, 'dataChange');
    }
  };

  /**
   * Maps a change source to the row selection source the hooks report.
   *
   * @param {string} source The change source.
   * @returns {RowSelectionSource}
   */
  #toSelectionSource(source: string): RowSelectionSource {
    return source === 'edit' ? 'checkbox' : 'dataChange';
  }

  /**
   * Drops the "select all" state when the selection map changes. The map also changes without the
   * plugin's involvement: rows are inserted and removed, and undo restores a removed row's flag.
   */
  #onMapChange = () => {
    this.#headerSummaryCache = null;
    this.#groupTree = null;
    this.#drawRowChecks = null;
  };

  /**
   * Drops the "select all" state when rows are filtered, trimmed, hidden, or reordered.
   */
  #onRowIndexCacheUpdated = () => {
    this.#headerSummaryCache = null;
    this.#groupTree = null;
    this.#drawRowChecks = null;
  };

  /**
   * Drops the "select all" state.
   */
  #invalidateHeaderSummary = () => {
    this.#headerSummaryCache = null;
    this.#groupTree = null;
    this.#drawRowChecks = null;
  };

  /**
   * Drops the resolved bound column: the columns, their settings, or the data changed.
   */
  #invalidateBoundColumn = () => {
    this.#boundColumnCache = undefined;
    this.#headerSummaryCache = null;
    this.#groupTree = null;
    this.#drawRowChecks = null;
  };

  /**
   * Forgets the row ids the server removed. A removed row would otherwise stay in the selection by row
   * id: counted in the "select all" state and the menu, and exported by `getServerSelection()`.
   * `afterRowsMutation` runs after a successful `onRowsRemove` and before the refetch, which then
   * re-reads the loaded rows' state from the pruned selection.
   *
   * @param {string} operation The mutation kind.
   * @param {object} payload The mutation payload.
   */
  #onAfterRowsMutation = (operation: string, payload: unknown) => {
    const rowIds = (payload as { rowsRemove?: unknown } | null)?.rowsRemove;

    if (operation !== 'remove' || !Array.isArray(rowIds) || !this.#isServerMode()) {
      return;
    }

    rowIds.forEach(rowId => this.#rowIdSelection.forget(rowId));
    this.#invalidateHeaderSummary();
  };

  /**
   * `loadData()` starts with no selection: the index mapper rebuilds the map with its default value.
   * `updateData()` keeps it, flag by physical row: the index mapper only fits the map to the new length,
   * as it keeps the hidden and trimmed rows. The wrappers send every new `data` prop through
   * `updateData()`, so an application that replaces the array on every edit keeps its selection.
   */
  #onAfterLoadData = () => {
    this.#anchorPhysicalRow = null;
    this.#headerSummaryCache = null;
    this.#groupTree = null;
    // New data can change the props the bound column is resolved from.
    this.#boundColumnCache = undefined;

    // A server-backed grid loads every page: the selection lives on by row id. Any other grid keeps
    // what the index mapper left in the map (nothing after `loadData()`, the same rows after `updateData()`).
    if (this.#isServerMode()) {
      this.#hydrateFromRowIds();
    } else {
      this.#rowIdSelection.setAll(false);
    }
  };

  /**
   * Keeps the number of rows matching the server query, which the "select all" checkbox counts.
   *
   * @param {object} payload The DataProvider response.
   * @param {number} payload.totalRows The number of rows matching the query.
   */
  #onAfterDataProviderFetch = (payload: { totalRows?: number }) => {
    this.#serverTotalRows = typeof payload?.totalRows === 'number' ? payload.totalRows : 0;
    this.#headerSummaryCache = null;
    this.#groupTree = null;
  };

  /**
   * Adds the bulk actions to the default context menu: remove the selected rows, and clear the
   * selection. Both are hidden while nothing is selected.
   *
   * @param {object} options The context menu options.
   */
  #onAfterContextMenuDefaultOptions = (options: Record<string, unknown>) => {
    // The menu calls an item's callbacks with the Handsontable instance as `this`, so the plugin is
    // captured here instead.
    const plugin = this;

    (options.items as unknown[]).push(
      { name: SEPARATOR },
      {
        key: 'row_selection_remove',
        // The count is what the action removes: the selected rows with a visual index. A selected
        // row the filters removed, or (with a server-backed grid) a row on another page, stays.
        name(this: HotInstance) {
          return this.getTranslatedPhrase(ROW_SELECTION_MENU_REMOVE, { count: plugin.#countRemovableRows() }) as string;
        },
        callback() {
          plugin.removeSelectedRows();
        },
        disabled: () => plugin.#countRemovableRows() === 0,
        hidden: () => plugin.getSelectedCount() === 0,
      },
      {
        key: 'row_selection_clear',
        name(this: HotInstance) {
          return this.getTranslatedPhrase(ROW_SELECTION_MENU_CLEAR) as string;
        },
        callback() {
          plugin.deselectAll();
        },
        hidden: () => plugin.getSelectedCount() === 0,
      },
    );
  };

  /**
   * Re-renders the translated labels.
   */
  #onAfterLanguageChange = () => {
    this.hot.markAllCellsChanged();
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#selectedRowsMap = null;
    this.#rowIdSelection = new RowIdSelection();
    this.#headerSummaryCache = null;
    this.#groupTree = null;
    this.#nestedRowsPlugin = undefined;

    super.destroy();
  }
}

