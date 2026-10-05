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
import { A11Y_CHECKED, A11Y_LABEL } from '../../helpers/a11y';
import { EDITOR_EDIT_GROUP as SHORTCUTS_GROUP_EDITOR } from '../../shortcuts/contexts';
import { CHECKBOX_HEADER_CHECK_ALL } from '../../i18n/constants';
import {
  collectRowsInScope,
  computeHeaderCheckboxState,
  isSelectAllScope,
  resolveHeaderToggleTarget,
  type HeaderCheckboxSummary,
  type ScopeHost,
  type SelectAllScope,
} from '../../utils/rowScope';
import { isCheckboxMeta, isCheckedValue, writeCheckboxColumn, type CheckboxMeta } from '../../utils/checkboxColumn';

export const PLUGIN_KEY = 'checkboxHeader';
export const PLUGIN_PRIORITY = 390;

const SHORTCUTS_GROUP = PLUGIN_KEY;
const CHECKBOX_CLASS = 'htCheckboxHeaderInput';
const HEADER_CELL_CLASS = 'htCheckboxHeader';
const DEFAULT_SCOPE: SelectAllScope = 'filtered';

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
   * The memoized header state per visual column. Dropped on every change that can affect it.
   */
  #summaryCache = new Map<number, HeaderCheckboxSummary>();

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
    // `beforeChangeRender`, not `afterChange`: an edit renders before `afterChange` runs, so a cache
    // dropped there would leave the header one change behind.
    this.addHook('beforeChangeRender', this.#invalidate);
    this.addHook('afterChange', this.#invalidate);
    this.addHook('afterSetSourceDataAtCell', this.#invalidate);
    this.addHook('afterLoadData', this.#invalidate);
    this.addHook('afterUpdateData', this.#invalidate);
    this.addHook('afterUpdateSettings', this.#invalidate);
    this.addHook('afterPageChange', this.#invalidate);
    this.addHook('afterSetCellMeta', this.#invalidate);
    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#invalidate);
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#invalidate);
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
  }

  /**
   * Tells whether the column shows a "check all" checkbox: it is a checkbox column with the
   * `headerCheckbox` option, and the [`RowSelection`](@/api/rowSelection.md) plugin does not use it
   * as its selection column (then that plugin owns the header).
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

    return this.hot.getPlugin('rowSelection')?.getBoundColumn?.() !== column;
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
      const meta = this.hot.getColumnMeta(column) as CheckboxMeta;
      const prop = this.hot.colToProp(column) ?? column;

      summary = computeHeaderCheckboxState(
        collectRowsInScope(this.#createScopeHost(column), this.#getScope(column)),
        physicalRow => isCheckedValue(this.hot.getSourceDataAtCell(physicalRow, prop), meta),
      );
      this.#summaryCache.set(column, summary);
    }

    return { ...summary };
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
    const columnMeta = this.hot.getColumnMeta(column) as CheckboxMeta;

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
      isRowSelectable: (physicalRow) => {
        const visualRow = this.hot.toVisualRow(physicalRow);
        const meta = (visualRow === null ?
          columnMeta : this.hot.getCellMetaTransient(visualRow, column)) as CheckboxMeta;

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

    let input = container.querySelector<HTMLInputElement>(`:scope > .${CHECKBOX_CLASS}`);

    if (!this.hasHeaderCheckbox(column) || !isBottomMostColumnHeader(TH)) {
      input?.remove();

      return;
    }

    if (!input) {
      input = this.hot.rootDocument.createElement('input');
      input.type = 'checkbox';
      input.tabIndex = -1;
      input.className = `htCheckboxRendererInput ${CHECKBOX_CLASS}`;
      container.insertBefore(input, container.firstChild);
    }

    const { state, selected, total } = this.getHeaderCheckboxState(column);

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
   * @param {MouseEvent} event The `mousedown` event.
   * @param {CellCoords} coords The coordinates of the pressed header.
   */
  #onBeforeOnCellMouseDown = (event: MouseEvent, coords: { row: number; col: number }) => {
    const target = eventTargetEl(event);

    if (!target || event.button !== 0 || !hasClass(target, CHECKBOX_CLASS)) {
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
   * Drops the memoized header states.
   */
  #invalidate = () => {
    this.#summaryCache.clear();
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#summaryCache.clear();

    super.destroy();
  }
}
