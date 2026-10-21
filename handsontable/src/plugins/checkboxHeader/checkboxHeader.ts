import { BasePlugin } from '../base';
import { isPlainObject } from '../../helpers/object';
import {
  addClass,
  eventTargetEl,
  hasClass,
  isBottomMostColumnHeader,
  removeAttribute,
  setAttribute,
} from '../../helpers/dom/element';
import { isLeftClick, isTouchEvent } from '../../helpers/dom/event';
import { A11Y_CHECKED, A11Y_LABEL } from '../../helpers/a11y';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcuts/contexts';
import { canAccessCellContent } from '../../shortcuts/guards';
import { isUndoRedoSource } from '../../utils/undoRedoSource';
import { CHECKBOX_HEADER_CHECK_ALL } from '../../i18n/constants';
import { syncIcon } from '../../themes/engine/icons';
import {
  collectRowsInScope,
  isSelectAllScope,
  resolveHeaderToggleTarget,
  summarizeHeaderCheckbox,
  type HeaderCheckboxSummary,
  type ScopeHost,
  type SelectAllScope,
} from '../../utils/rowScope';
import {
  getCheckboxCellMeta,
  isCheckboxMeta,
  isCheckedValue,
  writeCheckboxColumn,
  type CheckboxMeta,
} from '../../utils/checkboxColumn';

export const PLUGIN_KEY = 'checkboxHeader';
export const PLUGIN_PRIORITY = 390;

const SHORTCUTS_GROUP = PLUGIN_KEY;

const CHECKBOX_CLASS = 'htCheckboxHeaderInput';
const CHECKBOX_BOX_CLASS = 'htCheckboxHeaderBox';
const CHECKBOX_ICON_CLASS = 'htCheckboxHeaderIcon';
const HEADER_CELL_CLASS = 'htCheckboxHeader';
const DEFAULT_SCOPE: SelectAllScope = 'filtered';

/**
 * A physical row outside the column's scope. A change to it cannot change the header.
 */
const ROW_OUT_OF_SCOPE = 0;
/**
 * A row in the scope whose cell is read-only or not a checkbox: neither written nor counted.
 */
const ROW_NOT_COUNTED = 1;
/**
 * A row in the scope whose editable checkbox is unchecked.
 */
const ROW_UNCHECKED = 2;
/**
 * A row in the scope whose editable checkbox is checked.
 */
const ROW_CHECKED = 3;

type RowState = typeof ROW_OUT_OF_SCOPE | typeof ROW_NOT_COUNTED | typeof ROW_UNCHECKED | typeof ROW_CHECKED;

/**
 * The memoized header state of one column, kept per physical row so a data or meta change re-reads
 * only the rows it touched.
 */
interface ColumnSummary {
  /**
   * The state of every physical row, indexed by the physical row index.
   */
  rowStates: Uint8Array;
  /**
   * The number of checked editable checkboxes in the scope.
   */
  selected: number;
  /**
   * The number of editable checkboxes in the scope.
   */
  total: number;
}

/**
 * The `headerCheckbox` column option's object form.
 */
export interface HeaderCheckboxSettings {
  /**
   * The rows the "check all" checkbox writes to. Defaults to `'filtered'`.
   */
  scope?: SelectAllScope;
}

/**
 * @plugin CheckboxHeader
 * @class CheckboxHeader
 *
 * @description
 * The `CheckboxHeader` plugin adds a "check all" checkbox to the header of every
 * [checkbox](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) column that sets the
 * [`headerCheckbox`](@/api/options.md#headercheckbox) option. A click checks every checkbox in the
 * column, or unchecks them when all are checked, and writes the values into the data in one undo step.
 *
 * The plugin is always on: it does nothing for columns without the `headerCheckbox` option.
 *
 * The header checkbox describes the rows a click on it writes to. When only some of them are
 * checked, it shows the mixed state, and a click checks all of them. Read-only cells are skipped and
 * not counted.
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   columns: [
 *     { data: 'name' },
 *     // a "check all" checkbox in the header of the `active` column
 *     { data: 'active', type: 'checkbox', headerCheckbox: true },
 *   ],
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   columns={[
 *     { data: 'name' },
 *     // a "check all" checkbox in the header of the `active` column
 *     { data: 'active', type: 'checkbox', headerCheckbox: true },
 *   ]}
 * />
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * gridSettings = {
 *   columns: [
 *     { data: 'name' },
 *     { data: 'active', type: 'checkbox', headerCheckbox: true },
 *   ],
 * };
 * ```
 * :::
 */
export class CheckboxHeader extends BasePlugin {
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
   * The plugin reacts to the column-level `headerCheckbox` option, which no grid-level key carries,
   * so no settings update needs to reach `updatePlugin()`.
   */
  static get SETTING_KEYS() {
    return false;
  }

  /**
   * The memoized header state per visual column. A data or meta change re-reads only the rows it
   * touched; a change to the scope (indexes, pages, settings, a data load) drops the whole cache.
   */
  #summaryCache = new Map<number, ColumnSummary>();

  /**
   * `true` while the plugin reads cell meta. A `beforeGetCellMeta`/`afterGetCellMeta` listener that
   * calls `setCellMeta()` would otherwise re-enter the read it is part of, without end.
   */
  #isReadingMeta = false;

  /**
   * `true` while the `afterSetSourceDataAtCell` listener is registered (`#syncSourceDataListener()`).
   */
  #hasSourceDataListener = false;

  /**
   * Checks if the plugin is enabled. It always is: a column opts in through its own
   * `headerCheckbox` option.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return true;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterGetColHeader', this.#onAfterGetColHeader);
    this.addHook('beforeOnCellMouseDown', this.#onBeforeOnCellMouseDown);
    // `beforeChangeRender`: an edit renders before `afterChange` runs, so a cache updated only there
    // would leave the header one change behind. `afterChange` is still needed for the changes that
    // fire nothing else (an undo, a data replace); re-reading a row twice is harmless.
    this.addHook('beforeChangeRender', this.#onDataChange);
    this.addHook('afterChange', this.#onDataChange);
    this.addHook('afterSetCellMeta', this.#onCellMetaChange);
    this.addHook('afterRemoveCellMeta', this.#onCellMetaChange);
    // An undo or redo puts cell meta back without `afterSetCellMeta`, and renders before it ends, so
    // the cache is dropped before the restore (for its render) and after it (for the API).
    this.addHook('beforeUndo', this.#invalidate);
    this.addHook('beforeRedo', this.#invalidate);
    this.addHook('afterUndo', this.#invalidate);
    this.addHook('afterRedo', this.#invalidate);
    this.addHook('afterLoadData', this.#invalidate);
    this.addHook('afterUpdateData', this.#invalidate);
    this.addHook('afterUpdateSettings', this.#invalidate);
    this.addHook('afterPageChange', this.#invalidate);
    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#invalidate);
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#invalidate);
    this.eventManager.addEventListener(this.hot.rootElement, 'mousedown', this.#onRootMouseDown);
    this.eventManager.addEventListener(this.hot.rootElement, 'click', this.#onRootClick);
    this.#registerShortcuts();

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();

    this.hot.getShortcutManager().getContext('grid')?.removeShortcutsByGroup(SHORTCUTS_GROUP);
    this.hot.rowIndexMapper.removeLocalHook('cacheUpdated', this.#invalidate);
    this.hot.columnIndexMapper.removeLocalHook('cacheUpdated', this.#invalidate);
    this.#summaryCache.clear();
    this.#syncSourceDataListener();
  }

  /**
   * Tells whether the column shows a "check all" checkbox: it is a checkbox column with the
   * `headerCheckbox` option, and the [`RowSelection`](@/api/rowSelection.md) plugin does not render
   * its checkboxes in it (its bound column, or the first column with `checkboxLocation: 'firstColumn'`;
   * then that plugin owns the header).
   *
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  hasHeaderCheckbox(column: number): boolean {
    if (!Number.isInteger(column) || column < 0 || column >= this.hot.countCols()) {
      return false;
    }

    const meta = this.hot.getColumnMeta(column);

    if (!meta.headerCheckbox || !isCheckboxMeta(meta as CheckboxMeta)) {
      return false;
    }

    return !this.#isRowSelectionColumn(column);
  }

  /**
   * Tells whether the [`RowSelection`](@/api/rowSelection.md) plugin renders its checkboxes in the
   * column: its bound column, or the first visible column with `checkboxLocation: 'firstColumn'`. That
   * plugin owns the column's header then.
   *
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  #isRowSelectionColumn(column: number): boolean {
    const rowSelection = this.hot.getPlugin('rowSelection');

    if (!rowSelection?.enabled) {
      return false;
    }

    if (rowSelection.getBoundColumn() === column) {
      return true;
    }

    const settings = this.hot.getSettings().rowSelection;

    return isPlainObject(settings) && settings.checkboxLocation === 'firstColumn' &&
      this.hot.columnIndexMapper.getVisualFromRenderableIndex(0) === column;
  }

  /**
   * Returns the state of a column's "check all" checkbox: `'checked'`, `'unchecked'`, `'mixed'`, or
   * `'disabled'` (no editable checkbox in the scope), with the number of checked and editable cells.
   *
   * @param {number} column Visual column index.
   * @returns {{ state: string, selected: number, total: number }}
   */
  getHeaderCheckboxState(column: number): HeaderCheckboxSummary {
    let summary = this.#summaryCache.get(column);

    if (!summary) {
      summary = this.#scanColumn(column);
      this.#summaryCache.set(column, summary);
      this.#syncSourceDataListener();
    }

    return summarizeHeaderCheckbox(summary.selected, summary.total);
  }

  /**
   * Checks every editable checkbox in the column's scope, or unchecks them when all are checked,
   * the way a click on the "check all" checkbox does. It is one undo step.
   *
   * @param {number} column Visual column index.
   * @returns {boolean} `true` if any value changed.
   */
  toggleColumn(column: number): boolean {
    if (!this.hasHeaderCheckbox(column)) {
      return false;
    }

    const target = resolveHeaderToggleTarget(this.getHeaderCheckboxState(column).state);

    if (target === null) {
      return false;
    }

    return this.setColumnChecked(column, target);
  }

  /**
   * Checks or unchecks every editable checkbox in the column's scope. It is one undo step.
   *
   * @param {number} column Visual column index.
   * @param {boolean} checked `true` to check, `false` to uncheck.
   * @returns {boolean} `true` if any value changed.
   */
  setColumnChecked(column: number, checked: boolean): boolean {
    if (!this.hasHeaderCheckbox(column)) {
      return false;
    }

    const rows = collectRowsInScope(this.#createScopeHost(column), this.#getScope(column));
    let written = 0;

    this.runOperation('checkbox_header_toggle', () => {
      written = writeCheckboxColumn(this.hot, column, rows, checked, 'CheckboxHeader.toggle');
    });

    return written > 0;
  }

  /**
   * Reads the state of every row in the column's scope. It is the only full pass over the rows;
   * later data and meta changes go through `#refreshRows()`.
   *
   * @param {number} column Visual column index.
   * @returns {object}
   */
  #scanColumn(column: number): ColumnSummary {
    const summary: ColumnSummary = {
      rowStates: new Uint8Array(this.hot.rowIndexMapper.getNumberOfIndexes()),
      selected: 0,
      total: 0,
    };
    // Every row in the scope, whatever its cell: a row whose cell turns editable later must be
    // re-read on that change, so the scope is recorded apart from what the cell holds.
    const rowsInScope = collectRowsInScope({
      ...this.#createScopeHost(column),
      isRowSelectable: () => true,
    }, this.#getScope(column));

    rowsInScope.forEach((physicalRow) => {
      this.#setRowState(summary, physicalRow, this.#readRowState(column, physicalRow));
    });

    return summary;
  }

  /**
   * Reads what a row in the scope contributes to the column's header.
   *
   * @param {number} column Visual column index.
   * @param {number} physicalRow Physical row index.
   * @returns {number}
   */
  #readRowState(column: number, physicalRow: number): RowState {
    const wasReadingMeta = this.#isReadingMeta;

    this.#isReadingMeta = true;

    let meta: CheckboxMeta;

    try {
      meta = getCheckboxCellMeta(this.hot, physicalRow, column);
    } finally {
      this.#isReadingMeta = wasReadingMeta;
    }

    if (meta.readOnly || !isCheckboxMeta(meta)) {
      return ROW_NOT_COUNTED;
    }

    const value = this.hot.getSourceDataAtCell(physicalRow, this.hot.colToProp(column) ?? column);

    return isCheckedValue(value, meta) ? ROW_CHECKED : ROW_UNCHECKED;
  }

  /**
   * Stores a row's state and moves the counts by the difference from its previous one.
   *
   * @param {object} summary The column's memoized state.
   * @param {number} physicalRow Physical row index.
   * @param {number} state The row's new state.
   */
  #setRowState(summary: ColumnSummary, physicalRow: number, state: RowState) {
    const previous = summary.rowStates[physicalRow];

    summary.total += Number(state >= ROW_UNCHECKED) - Number(previous >= ROW_UNCHECKED);
    summary.selected += Number(state === ROW_CHECKED) - Number(previous === ROW_CHECKED);
    summary.rowStates[physicalRow] = state;
  }

  /**
   * Re-reads the given rows of every memoized column. A row outside a column's scope is skipped, as
   * a change to it cannot move that header. The cost is the number of rows times the number of
   * memoized columns, never the number of rows in the grid.
   *
   * Every column is re-read, not only the changed one: a cell's meta can follow the other values of
   * its row (a `cells` function that makes a checkbox read-only by another column's value).
   *
   * @param {Iterable<number|null>} physicalRows Physical row indexes.
   */
  #refreshRows(physicalRows: Iterable<number | null>) {
    if (this.#summaryCache.size === 0) {
      return;
    }

    const rows = new Set(physicalRows);

    this.#summaryCache.forEach((summary, column) => {
      for (const physicalRow of rows) {
        if (physicalRow === null || physicalRow < 0 || physicalRow >= summary.rowStates.length) {
          // A row the scan did not see: read the whole column again.
          this.#summaryCache.delete(column);
          this.#syncSourceDataListener();

          return;
        }

        if (summary.rowStates[physicalRow] !== ROW_OUT_OF_SCOPE) {
          this.#setRowState(summary, physicalRow, this.#readRowState(column, physicalRow));
        }
      }
    });
  }

  /**
   * The scope set on the column, or the default.
   *
   * @param {number} column Visual column index.
   * @returns {string}
   */
  #getScope(column: number): SelectAllScope {
    const setting = this.hot.getColumnMeta(column).headerCheckbox;
    const scope = isPlainObject(setting) ? (setting as HeaderCheckboxSettings).scope : undefined;

    return isSelectAllScope(scope) ? scope : DEFAULT_SCOPE;
  }

  /**
   * The grid adapter the scope rules read for a column. A row counts when its cell is an editable
   * checkbox: a read-only cell is never written, so it is not counted either.
   *
   * @param {number} column Visual column index.
   * @returns {object}
   */
  #createScopeHost(column: number): ScopeHost {
    const { rowIndexMapper } = this.hot;
    const isFlaggedBy = (mapName: string, physicalRow: number) => {
      const map = rowIndexMapper.trimmingMapsCollection.get(mapName) ??
        rowIndexMapper.hidingMapsCollection.get(mapName);

      return map?.getValueAtIndex(physicalRow) === true;
    };

    return {
      countPhysicalRows: () => rowIndexMapper.getNumberOfIndexes(),
      countVisualRows: () => this.hot.countRows(),
      toPhysicalRow: visualRow => this.hot.toPhysicalRow(visualRow),
      getCurrentPageRange: () => {
        const pagination = this.hot.getPlugin('pagination');

        if (!pagination?.enabled) {
          return null;
        }

        const { firstVisibleRowIndex, lastVisibleRowIndex } = pagination.getPaginationData();

        return [firstVisibleRowIndex, lastVisibleRowIndex];
      },
      isExcludedByTrimRows: physicalRow => isFlaggedBy('trimRows', physicalRow),
      isExcludedByHiddenRows: physicalRow => isFlaggedBy('HiddenRows', physicalRow),
      // Resolved by the physical row, so a row the filters removed keeps its own meta (a read-only
      // cell stays read-only while it is filtered out).
      isRowSelectable: (physicalRow) => {
        const meta = getCheckboxCellMeta(this.hot, physicalRow, column);

        return !meta.readOnly && isCheckboxMeta(meta);
      },
    };
  }

  /**
   * Registers the Space shortcut that toggles the column from its focused header.
   */
  #registerShortcuts() {
    this.hot.getShortcutManager().getContext('grid')?.addShortcut({
      keys: [['Space']],
      callback: () => {
        const highlight = this.hot.getSelectedRangeActive()?.highlight;

        if (highlight?.col !== null && highlight?.col !== undefined) {
          this.toggleColumn(highlight.col);
        }

        return false;
      },
      runOnlyIf: () => {
        // Space rewrites the whole column: not while the cells are hidden or covered by an overlay.
        if (!canAccessCellContent(this.hot)) {
          return false;
        }

        const range = this.hot.getSelectedRangeActive();
        const highlight = range?.highlight;

        if (!range?.isSingle() || !highlight || highlight.row === null || highlight.col === null ||
          highlight.row >= 0 || !this.hasHeaderCheckbox(highlight.col)) {
          return false;
        }

        const header = this.hot.getCell(highlight.row, highlight.col, true);

        return !!header && isBottomMostColumnHeader(header as HTMLTableCellElement);
      },
      relativeToGroup: SHORTCUTS_GROUP_EDITOR,
      position: 'before',
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Renders the "check all" checkbox into a column header, and removes a stale one from a header
   * cell that no longer needs it (header cells are reused).
   *
   * @param {number} column Visual column index.
   * @param {HTMLTableCellElement} TH The header cell.
   */
  #onAfterGetColHeader = (column: number, TH: HTMLTableCellElement) => {
    const container = TH.firstChild as HTMLElement | null;

    if (!container) {
      return;
    }

    let box = container.querySelector<HTMLElement>(`:scope > .${CHECKBOX_BOX_CLASS}`);
    let input = box?.querySelector<HTMLInputElement>(`:scope > .${CHECKBOX_CLASS}`) ?? null;

    if (!this.hasHeaderCheckbox(column) || !isBottomMostColumnHeader(TH)) {
      box?.remove();

      return;
    }

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
      container.insertBefore(box, container.firstChild);
    }

    const { state, selected, total } = this.getHeaderCheckboxState(column);

    syncIcon(this.hot, box, CHECKBOX_ICON_CLASS, state === 'mixed' ? 'collapseOff' : 'checkbox');

    addClass(TH, HEADER_CELL_CLASS);
    input.checked = state === 'checked';
    input.indeterminate = state === 'mixed';
    input.disabled = state === 'disabled';

    if (this.hot.getSettings().ariaTags) {
      setAttribute(input, [
        A11Y_LABEL(this.hot.getTranslatedPhrase(CHECKBOX_HEADER_CHECK_ALL, { checked: selected, total }) as string),
        A11Y_CHECKED(state === 'mixed' ? 'mixed' : state === 'checked'),
      ]);
    } else {
      removeAttribute(input, ['aria-label', 'aria-checked']);
    }
  };

  /**
   * Toggles the column on a press on its header checkbox, and keeps the press from selecting the
   * column or sorting it.
   *
   * On a touch device Walkontable calls this with the `touchend` event, which has no `button`, and
   * the browser's own `mousedown` that follows a tap never reaches it, so a touch counts as a press.
   *
   * @param {MouseEvent|TouchEvent} event The `mousedown` event, or the `touchend` event of a tap.
   * @param {CellCoords} coords The coordinates of the pressed header.
   */
  #onBeforeOnCellMouseDown = (event: MouseEvent, coords: { row: number; col: number }) => {
    const target = eventTargetEl(event);

    if (!target || !(isLeftClick(event) || isTouchEvent(event)) || !hasClass(target, CHECKBOX_CLASS)) {
      return;
    }

    this.toggleColumn(coords.col);

    // The grid's own flag, not `stopImmediatePropagation()` (DEV-214, see `../collapsibleColumns/`).
    (event as MouseEvent & { isImmediatePropagationEnabled: boolean }).isImmediatePropagationEnabled = false;
    // Keeps the browser focus off the checkbox, so the keyboard stays with the grid.
    event.preventDefault();
    this.eventManager.fireEvent(target, 'mouseup');
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
   * Keeps a click from flipping the header checkbox on its own: the state was applied on
   * `mousedown` and rendered.
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
   * Re-reads the rows a `setDataAtCell()`-style change wrote (visual rows). A change without a list
   * (a data replace) and an undo or redo drop the whole cache: an undo restores cell meta without
   * `afterSetCellMeta`, so its changes do not name every cell it touched.
   *
   * @param {Array|null} changes The changes, `[visualRow, prop, oldValue, newValue]` each.
   * @param {string} source The change source.
   */
  #onDataChange = (changes: Array<[number, ...unknown[]]> | null, source?: string) => {
    if (!changes || isUndoRedoSource(source)) {
      this.#invalidate();

      return;
    }

    // This runs twice per edit in every grid; with no header checkbox there is nothing to re-read, so
    // a large paste skips mapping every change.
    if (this.#summaryCache.size === 0) {
      return;
    }

    this.#refreshRows(changes.map(([visualRow]) => this.hot.toPhysicalRow(visualRow)));
  };

  /**
   * Re-reads the rows a `setSourceDataAtCell()` change wrote (physical rows).
   *
   * @param {Array} changes The changes, `[physicalRow, prop, oldValue, newValue]` each.
   * @param {string} source The change source.
   */
  #onSourceDataChange = (changes: Array<[number, ...unknown[]]>, source?: string) => {
    if (isUndoRedoSource(source)) {
      this.#invalidate();

      return;
    }

    this.#refreshRows(changes.map(([physicalRow]) => physicalRow));
  };

  /**
   * Re-reads the row whose cell meta `setCellMeta()` or `removeCellMeta()` changed (a `readOnly` or
   * `type` change moves the cell in or out of the count).
   *
   * @param {number} visualRow Visual row index.
   */
  #onCellMetaChange = (visualRow: number) => {
    if (this.#isReadingMeta) {
      return;
    }

    this.#refreshRows([this.hot.toPhysicalRow(visualRow)]);
  };

  /**
   * Drops the memoized header states.
   */
  #invalidate = () => {
    this.#summaryCache.clear();
    this.#syncSourceDataListener();
  };

  /**
   * Registers the `afterSetSourceDataAtCell` listener only while a column's header state is cached.
   * The listener only re-reads cached columns, and the plugin is on in every grid: a listener on a
   * grid with no "check all" checkbox would cost every `setSourceDataAtCell()` call the hook's payload
   * for nothing. Not through the tracked `addHook()`, which keeps every callback it ever registered;
   * `disablePlugin()` and `destroy()` drop the cache, which removes it.
   */
  #syncSourceDataListener() {
    // The index mappers' `cacheUpdated` can run after `destroy()` has detached the instance; its
    // hooks are gone with it.
    if (!this.hot) {
      this.#hasSourceDataListener = false;

      return;
    }

    const isNeeded = this.enabled && this.#summaryCache.size > 0;

    if (isNeeded === this.#hasSourceDataListener) {
      return;
    }

    if (isNeeded) {
      this.hot.addHook('afterSetSourceDataAtCell', this.#onSourceDataChange);
    } else {
      this.hot.removeHook('afterSetSourceDataAtCell', this.#onSourceDataChange);
    }

    this.#hasSourceDataListener = isNeeded;
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#summaryCache.clear();
    this.#syncSourceDataListener();

    super.destroy();
  }
}
