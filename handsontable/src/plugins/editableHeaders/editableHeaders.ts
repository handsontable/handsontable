import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import {
  eventTargetEl,
  HTML_CHARACTERS,
  isBottomMostColumnHeader,
  isInternalElement,
} from '../../helpers/dom/element';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import { warnOnce } from '../../helpers/console';
import { stringify } from '../../helpers/mixed';
import { announce } from '../../utils/a11yAnnouncer';
import { registerMenuEntries } from '../../utils/menu/menuEntries';
import { EDITOR_EDIT_GROUP } from '../../shortcuts/contexts';
import {
  EDITABLE_HEADERS_INPUT_LABEL,
  EDITABLE_HEADERS_RENAMED,
} from '../../i18n/constants';
import type { PhysicalIndexToValueMap } from '../../translations';
import { HeaderEditor, type HeaderEditorRect } from './headerEditor';
import renameHeaderItem from './contextMenuItem/renameHeader';
import type { HeaderAxis } from './types';
import { LICENSE } from './feature.generated';

export const PLUGIN_KEY = 'editableHeaders';
export const PLUGIN_PRIORITY = 400;

const SHORTCUTS_GROUP = PLUGIN_KEY;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;
/**
 * The class ColumnSorting puts on a header label whose click sorts the column.
 */
const SORT_ACTION_CLASS = 'sortAction';
const AXES: HeaderAxis[] = ['column', 'row'];
/**
 * Controls inside a header whose own double-click must not open the editor.
 */
const HEADER_CONTROLS_SELECTOR = 'button, input, .changeType, .collapsibleIndicator, .ht_nestingButton';

Hooks.getSingleton().register('beforeHeaderChange');
Hooks.getSingleton().register('afterHeaderChange');

/**
 * The header being renamed, by its physical index, so a render in between cannot move it.
 */
interface EditedHeader {
  axis: HeaderAxis;
  physicalIndex: number;
}

/**
 * The renames of both axes by physical index, taken before an undo or a redo.
 */
type NamesSnapshot = Record<HeaderAxis, unknown[]>;

/**
 * @plugin EditableHeaders
 * @class EditableHeaders
 *
 * @description
 * The `EditableHeaders` plugin lets users rename column headers, and optionally row headers, the way they
 * edit cells.
 *
 * To start renaming a header:
 * - Double-click it. A header whose click sorts the column does not open on a double-click; use the menu.
 * - Focus it with the keyboard (with [`navigableHeaders`](@/api/options.md#navigableheaders) on) and press
 *   <kbd>F2</kbd> or <kbd>Enter</kbd>. On a header whose <kbd>Enter</kbd> sorts the column, use <kbd>F2</kbd>.
 * - Select **Rename header** in the context menu or the column menu.
 *
 * Press <kbd>Enter</kbd> or move the focus away to save the new name, and <kbd>Escape</kbd> to cancel.
 *
 * The new names are kept by the plugin, not written into [`colHeaders`](@/api/options.md#colheaders) or
 * [`rowHeaders`](@/api/options.md#rowheaders). A renamed header stays with its column or row when it is
 * moved, sorted, or when other columns or rows are inserted or removed. [`getColHeader()`](@/api/core.md#getcolheader),
 * [`getRowHeader()`](@/api/core.md#getrowheader), copying with headers, and the exported file all return the new
 * name. One rename is one undo step. To save the new names in your application, use the
 * [`afterHeaderChange`](@/api/hooks.md#afterheaderchange) hook, and save each name by its physical index, which
 * stays with the column or row. The hook also runs for every header that an undo, a redo or
 * {@link EditableHeaders#clearHeaders} changes.
 *
 * A new name is written as plain text, even when it looks like HTML, also in copied data. An emptied input and a
 * scroll that moves the header out of view cancel the rename.
 *
 * A name belongs to a physical column or row: {@link Core#updateData} keeps it on the same position in the new data,
 * and {@link Core#loadData} drops it. An undo or a redo that also inserts or removes rows or columns runs no
 * `afterHeaderChange` for that axis.
 *
 * While the [`NestedHeaders`](@/api/nestedHeaders.md) plugin is on, column headers can't be renamed.
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   colHeaders: ['Name', 'Price'],
 *   rowHeaders: true,
 *   // rename column headers and row headers
 *   editableHeaders: { columnHeaders: true, rowHeaders: true },
 *   afterHeaderChange(axis, visualIndex, newValue) {
 *     saveHeader(axis, visualIndex, newValue);
 *   },
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   colHeaders={['Name', 'Price']}
 *   rowHeaders={true}
 *   // rename column headers and row headers
 *   editableHeaders={{ columnHeaders: true, rowHeaders: true }}
 *   afterHeaderChange={(axis, visualIndex, newValue) => {
 *     saveHeader(axis, visualIndex, newValue);
 *   }}
 * />
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   data: getData(),
 *   colHeaders: ['Name', 'Price'],
 *   rowHeaders: true,
 *   // rename column headers and row headers
 *   editableHeaders: { columnHeaders: true, rowHeaders: true },
 *   afterHeaderChange: (axis, visualIndex, newValue) => {
 *     saveHeader(axis, visualIndex, newValue);
 *   },
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings"></hot-table>
 * ```
 * :::
 *
 * ::: only-for vue
 * ```js
 * const hotSettings = {
 *   data: getData(),
 *   colHeaders: ['Name', 'Price'],
 *   rowHeaders: true,
 *   // rename column headers and row headers
 *   editableHeaders: { columnHeaders: true, rowHeaders: true },
 *   afterHeaderChange(axis, visualIndex, newValue) {
 *     saveHeader(axis, visualIndex, newValue);
 *   },
 * };
 * ```
 *
 * ```html
 * <HotTable :settings="hotSettings"></HotTable>
 * ```
 * :::
 */
export class EditableHeaders extends BasePlugin {
  /**
   * The plugin's key in the settings.
   *
   * @returns {string}
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * The plugin's enable order.
   *
   * @returns {number}
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * The plugin's license token.
   *
   * @returns {object}
   */
  static get LICENSE() {
    return LICENSE;
  }

  /**
   * The settings keys that reach `updatePlugin()`: the plugin's own, and `nestedHeaders`, which turns column
   * renaming off.
   *
   * @returns {string[]}
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY, 'nestedHeaders'];
  }

  /**
   * The defaults of the object form of the plugin's settings.
   *
   * @returns {object}
   */
  static get DEFAULT_SETTINGS() {
    return {
      columnHeaders: true,
      rowHeaders: false,
    };
  }

  /**
   * The validators of the object form of the plugin's settings.
   *
   * @returns {object}
   */
  static get SETTINGS_VALIDATORS() {
    return {
      columnHeaders: (value: unknown) => typeof value === 'boolean',
      rowHeaders: (value: unknown) => typeof value === 'boolean',
    };
  }

  /**
   * The renamed column headers, by physical column index (`null` for a header not renamed).
   */
  #columnNames: PhysicalIndexToValueMap | null = null;
  /**
   * The renamed row headers, by physical row index (`null` for a header not renamed).
   */
  #rowNames: PhysicalIndexToValueMap | null = null;
  /**
   * The input laid over the header being renamed. Built on the first enable, kept until `destroy()`.
   */
  #editor: HeaderEditor | null = null;
  /**
   * The header the editor is open on, or `null`.
   */
  #edited: EditedHeader | null = null;
  /**
   * The text the input opened with. A save of the same text, or of an emptied input, changes nothing.
   */
  #initialValue = '';
  /**
   * Whether the NestedHeaders plugin runs, read on every enable and update. The value hooks run on every header
   * read, so they read this flag instead of the plugin registry.
   */
  #nestedHeadersOn = false;
  /**
   * While `true`, the value hooks return the configured header, so the plugin can read it under a rename.
   */
  #readingConfigured = false;
  /**
   * The renames before the undo or redo in progress, or `null`. Taken only when `afterHeaderChange` has a listener.
   */
  #namesBeforeRestore: NamesSnapshot | null = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link EditableHeaders#enablePlugin} method is called.
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

    this.#columnNames = this.hot.columnIndexMapper
      .createAndRegisterIndexMap(`${this.pluginName}.column`, 'physicalIndexToValue', null);
    this.#rowNames = this.hot.rowIndexMapper
      .createAndRegisterIndexMap(`${this.pluginName}.row`, 'physicalIndexToValue', null);

    this.#editor ??= new HeaderEditor({
      rootDocument: this.hot.rootDocument,
      container: this.hot.rootElement,
      onBlur: this.#onEditorBlur,
    });

    this.addHook('modifyColumnHeaderValue', this.#onModifyColumnHeaderValue);
    this.addHook('modifyRowHeaderValue', this.#onModifyRowHeaderValue);
    this.addHook('afterRender', this.#syncEditor);
    this.addHook('afterScroll', this.#syncEditor);
    this.addHook('afterDocumentKeyDown', this.#onAfterDocumentKeyDown);
    this.addHook('beforeCompositionStart', this.#onAfterDocumentKeyDown);
    this.addHook('beforeUndo', this.#onBeforeRestore);
    this.addHook('beforeRedo', this.#onBeforeRestore);
    this.addHook('afterUndo', this.#onAfterRestore);
    this.addHook('afterRedo', this.#onAfterRestore);
    this.eventManager.addEventListener(this.hot.rootElement, 'dblclick', this.#onRootDoubleClick);

    registerMenuEntries(this, () => [renameHeaderItem(this)], {
      contextMenu: {},
      dropdownMenu: {},
    });

    this.#registerShortcuts();
    this.#readNestedHeaders();

    super.enablePlugin();
  }

  /**
   * Tells the view to write the renamed headers as text. Runs once the view exists, after every enable and
   * update.
   *
   * @private
   */
  onGridReady() {
    this.hot.view.setPlainTextHeaderResolver(this.#isRenamedHeader);
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the
   * following configuration options:
   *  - [`editableHeaders`](@/api/options.md#editableheaders)
   *  - [`nestedHeaders`](@/api/options.md#nestedheaders)
   *
   * The renamed headers are kept, and so is an open input whose header can still be renamed: the framework
   * wrappers send the options again on a render.
   */
  updatePlugin() {
    this.#readNestedHeaders();

    const edited = this.#edited;

    if (edited !== null) {
      const visualIndex = this.#toVisual(edited.axis, edited.physicalIndex);

      if (visualIndex === null || !this.isEditable(edited.axis, visualIndex)) {
        this.closeEditor(false);
      }
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance. The renamed headers are dropped.
   */
  disablePlugin() {
    super.disablePlugin();

    this.closeEditor(false);
    this.#unregisterShortcuts();
    // The view does not exist yet when a plugin is turned off during the first settings pass.
    this.hot.view?.setPlainTextHeaderResolver(null);
    this.hot.columnIndexMapper.unregisterMap(`${this.pluginName}.column`);
    this.hot.rowIndexMapper.unregisterMap(`${this.pluginName}.row`);
    this.#columnNames = null;
    this.#rowNames = null;
  }

  /**
   * Checks whether users can rename a header.
   *
   * @param {string} axis `'column'` for a column header, `'row'` for a row header.
   * @param {number} visualIndex The visual index of the column or row.
   * @returns {boolean}
   */
  isEditable(axis: HeaderAxis, visualIndex: number): boolean {
    if (!this.enabled || !Number.isInteger(visualIndex) || visualIndex < 0) {
      return false;
    }

    if (axis === 'row') {
      return this.getSetting<boolean>('rowHeaders') === true && visualIndex < this.hot.countRows() &&
        this.hot.hasRowHeaders();
    }

    return this.getSetting<boolean>('columnHeaders') === true && visualIndex < this.hot.countCols() &&
      !this.#nestedHeadersOn &&
      this.hot.getColumnMeta(visualIndex)[PLUGIN_KEY] !== false &&
      this.hot.hasColHeaders();
  }

  /**
   * Returns the name a user gave a header, or `undefined` when the header was not renamed.
   *
   * @param {string} axis `'column'` for a column header, `'row'` for a row header.
   * @param {number} visualIndex The visual index of the column or row.
   * @returns {string|undefined}
   */
  getHeader(axis: HeaderAxis, visualIndex: number): string | undefined {
    const names = this.#getNames(axis);
    const physicalIndex = this.#toPhysical(axis, visualIndex);

    if (names === null || physicalIndex === null) {
      return undefined;
    }

    const value = names.getValueAtIndex<string | null>(physicalIndex);

    return value === null || value === undefined ? undefined : value;
  }

  /**
   * Renames a header, as one undo step. Fires {@link Hooks#beforeHeaderChange}, which can cancel the change, and
   * {@link Hooks#afterHeaderChange}.
   *
   * @param {string} axis `'column'` for a column header, `'row'` for a row header.
   * @param {number} visualIndex The visual index of the column or row.
   * @param {string} value The new header name. Stored as text.
   * @returns {boolean} `true` when the header was renamed.
   */
  setHeader(axis: HeaderAxis, visualIndex: number, value: string): boolean {
    if (!this.isEditable(axis, visualIndex)) {
      return false;
    }

    const names = this.#getNames(axis);
    const physicalIndex = this.#toPhysical(axis, visualIndex);

    if (names === null || physicalIndex === null) {
      return false;
    }

    const newValue = stringify(value);
    const oldValue = this.#readHeader(axis, visualIndex);

    // The header shows that name already: no hooks, and no undo step that changes nothing. A configured label that
    // looks like markup is drawn as HTML, so typing its source is a change: the rename is drawn as text.
    const renamed = names.getValueAtIndex<string | null>(physicalIndex) ?? null;
    const unchanged = renamed === null ?
      newValue === stringify(oldValue) && !HTML_CHARACTERS.test(newValue) :
      newValue === renamed;

    if (unchanged) {
      return true;
    }

    if (this.hot.runHooks('beforeHeaderChange', axis, visualIndex, newValue, oldValue) === false) {
      return false;
    }

    this.runOperation('header_rename', () => {
      names.setValueAtIndex(physicalIndex, newValue);
    });

    this.hot.render();
    this.hot.runHooks('afterHeaderChange', axis, visualIndex, newValue, oldValue);

    return true;
  }

  /**
   * Drops the names users gave headers, so the headers show the configured values again. One undo step.
   * Fires {@link Hooks#afterHeaderChange} for every header it changes, and never {@link Hooks#beforeHeaderChange}.
   *
   * @param {string} [axis] `'column'` or `'row'`. Both when left out.
   */
  clearHeaders(axis?: HeaderAxis) {
    if (!this.enabled) {
      return;
    }

    const before = this.#takeNamesSnapshot();

    this.runOperation('header_rename_clear', () => {
      if (axis !== 'row') {
        this.#columnNames?.clear();
      }

      if (axis !== 'column') {
        this.#rowNames?.clear();
      }
    });
    this.hot.render();
    this.#reportChangedNames(before);
  }

  /**
   * Opens the input over a header, scrolling the header into view first.
   *
   * @param {string} axis `'column'` for a column header, `'row'` for a row header.
   * @param {number} visualIndex The visual index of the column or row.
   * @returns {boolean} `true` when the input opened.
   */
  openEditor(axis: HeaderAxis, visualIndex: number): boolean {
    if (!this.isEditable(axis, visualIndex) || this.#editor === null) {
      return false;
    }

    this.closeEditor(true);
    this.hot.scrollViewportTo(axis === 'column' ? { col: visualIndex } : { row: visualIndex });

    const physicalIndex = this.#toPhysical(axis, visualIndex);
    const rect = this.#getHeaderRect(axis, visualIndex);

    if (physicalIndex === null || rect === null) {
      return false;
    }

    this.#edited = { axis, physicalIndex };
    this.#initialValue = this.#readShownText(axis, visualIndex);
    this.#editor.open(rect, this.#initialValue, {
      label: this.hot.getTranslatedPhrase(EDITABLE_HEADERS_INPUT_LABEL) as string,
      dir: this.hot.isRtl() ? 'rtl' : 'ltr',
    });
    this.hot.listen();
    this.hot.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT_NAME);

    return true;
  }

  /**
   * Closes the input, if open.
   *
   * @param {boolean} [save=true] `true` to rename the header to the text in the input, `false` to cancel.
   */
  closeEditor(save = true) {
    this.#closeEditor(save, false);
  }

  /**
   * Checks whether the input is open.
   *
   * @returns {boolean}
   */
  isEditorOpened(): boolean {
    return this.#edited !== null;
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#editor?.destroy();
    this.#editor = null;
    this.#edited = null;

    super.destroy();
  }

  /**
   * Closes the input, saves when asked, and gives the keyboard back to the grid.
   *
   * @param {boolean} save Whether to rename the header to the text in the input.
   * @param {boolean} restoreFocus Whether to put the focus back on the grid's highlighted header.
   */
  #closeEditor(save: boolean, restoreFocus: boolean) {
    const edited = this.#edited;
    const editor = this.#editor;

    if (edited === null || editor === null) {
      return;
    }

    const value = editor.getValue();

    // Cleared first: the focus move below blurs the input, and the blur must find nothing to save.
    this.#edited = null;
    editor.close();

    const shortcutManager = this.hot.getShortcutManager();

    if (shortcutManager.getActiveContextName() === SHORTCUTS_CONTEXT_NAME) {
      shortcutManager.setActiveContextName('grid');
    }

    if (restoreFocus) {
      this.hot.getFocusManager().focusOnHighlightedCell();
    }

    if (!save || !this.enabled) {
      return;
    }

    const visualIndex = this.#toVisual(edited.axis, edited.physicalIndex);

    // An emptied input is a cancel: a header with no text has no accessible name.
    if (visualIndex === null || value === this.#initialValue || value.trim() === '') {
      return;
    }

    if (this.setHeader(edited.axis, visualIndex, value)) {
      announce(this.hot.getTranslatedPhrase(EDITABLE_HEADERS_RENAMED, { value }) as string, 'polite');
    }
  }

  /**
   * Returns the text a header shows: its rename, or the text of its configured label (a label written as HTML
   * opens as the text the user sees, not as its markup).
   *
   * @param {string} axis The header axis.
   * @param {number} visualIndex The visual index.
   * @returns {string}
   */
  #readShownText(axis: HeaderAxis, visualIndex: number): string {
    const name = this.getHeader(axis, visualIndex);

    if (name !== undefined) {
      return name;
    }

    const label = this.#getHeaderElement(axis, visualIndex)
      ?.querySelector<HTMLElement>(axis === 'column' ? '.colHeader' : '.rowHeader');

    return label?.textContent ?? stringify(this.#readHeader(axis, visualIndex));
  }

  /**
   * Copies the renames of both axes, by physical index, when something listens to `afterHeaderChange`.
   *
   * @returns {NamesSnapshot|null}
   */
  #takeNamesSnapshot(): NamesSnapshot | null {
    if (!this.hot.hasHook('afterHeaderChange')) {
      return null;
    }

    return {
      column: [...(this.#columnNames?.getValues() ?? [])],
      row: [...(this.#rowNames?.getValues() ?? [])],
    };
  }

  /**
   * Fires `afterHeaderChange` for every header whose rename differs from `before`. An undo, a redo and
   * `clearHeaders()` change the maps with no rename of their own, and an application that saves names from the hook
   * would otherwise keep the names they replaced.
   *
   * @param {NamesSnapshot|null} before The renames before the change, or `null` when nothing listens.
   */
  #reportChangedNames(before: NamesSnapshot | null) {
    if (before === null) {
      return;
    }

    AXES.forEach((axis) => {
      const after = this.#getNames(axis)?.getValues() ?? [];

      // An undo of a row or column insert or removal renumbers the physical indexes, so a comparison by index would
      // pair one record's name with another's. Such a step reports nothing for that axis.
      if (after.length !== before[axis].length) {
        return;
      }

      for (let physicalIndex = 0; physicalIndex < after.length; physicalIndex++) {
        const oldName = before[axis][physicalIndex] ?? null;
        const newName = after[physicalIndex] ?? null;
        const visualIndex = this.#toVisual(axis, physicalIndex);

        if (oldName !== newName && visualIndex !== null && this.hot) {
          const configured = this.#readConfiguredHeader(axis, visualIndex);

          this.hot.runHooks('afterHeaderChange', axis, visualIndex, stringify(newName ?? configured),
            oldName ?? configured);
        }
      }
    });
  }

  /**
   * Returns the header a column or row would show with no rename.
   *
   * @param {string} axis The header axis.
   * @param {number} visualIndex The visual index.
   * @returns {*}
   */
  #readConfiguredHeader(axis: HeaderAxis, visualIndex: number): unknown {
    this.#readingConfigured = true;

    try {
      return this.#readHeader(axis, visualIndex);
    } finally {
      this.#readingConfigured = false;
    }
  }

  /**
   * Reads whether the NestedHeaders plugin runs, and warns once per grid that column headers can't be renamed
   * then. It enables before this plugin (priority 280), so its state is settled here.
   */
  #readNestedHeaders() {
    this.#nestedHeadersOn = this.hot.getPlugin('nestedHeaders')?.enabled === true;

    if (this.#nestedHeadersOn && this.getSetting<boolean>('columnHeaders') === true) {
      warnOnce(this.hot, `${PLUGIN_KEY}.nestedHeaders`,
        'The EditableHeaders plugin does not rename column headers while the NestedHeaders plugin is on.');
    }
  }

  /**
   * Returns the header value shown now, through the core getters (so the renames apply).
   *
   * @param {string} axis The header axis.
   * @param {number} visualIndex The visual index.
   * @returns {*}
   */
  #readHeader(axis: HeaderAxis, visualIndex: number): unknown {
    return axis === 'column' ? this.hot.getColHeader(visualIndex) : this.hot.getRowHeader(visualIndex);
  }

  /**
   * @param {string} axis The header axis.
   * @returns {PhysicalIndexToValueMap|null}
   */
  #getNames(axis: HeaderAxis): PhysicalIndexToValueMap | null {
    return axis === 'column' ? this.#columnNames : this.#rowNames;
  }

  /**
   * @param {string} axis The header axis.
   * @param {number} visualIndex The visual index.
   * @returns {number|null}
   */
  #toPhysical(axis: HeaderAxis, visualIndex: number): number | null {
    const mapper = axis === 'column' ? this.hot.columnIndexMapper : this.hot.rowIndexMapper;

    return mapper.getPhysicalFromVisualIndex(visualIndex);
  }

  /**
   * @param {string} axis The header axis.
   * @param {number} physicalIndex The physical index.
   * @returns {number|null}
   */
  #toVisual(axis: HeaderAxis, physicalIndex: number): number | null {
    const mapper = axis === 'column' ? this.hot.columnIndexMapper : this.hot.rowIndexMapper;

    return mapper.getVisualFromPhysicalIndex(physicalIndex);
  }

  /**
   * Returns the header cell drawn on top (a frozen overlay's copy when there is one).
   *
   * @param {string} axis The header axis.
   * @param {number} visualIndex The visual index.
   * @returns {HTMLTableCellElement|null}
   */
  #getHeaderElement(axis: HeaderAxis, visualIndex: number): HTMLTableCellElement | null {
    return axis === 'column' ?
      this.hot.getCell(-1, visualIndex, true) :
      this.hot.getCell(visualIndex, -1, true);
  }

  /**
   * Returns the box of a rendered header, relative to the grid's root element.
   *
   * @param {string} axis The header axis.
   * @param {number} visualIndex The visual index.
   * @returns {HeaderEditorRect|null}
   */
  #getHeaderRect(axis: HeaderAxis, visualIndex: number): HeaderEditorRect | null {
    const header = this.#getHeaderElement(axis, visualIndex);

    if (header === null) {
      return null;
    }

    const { rootElement } = this.hot;
    const headerBox = header.getBoundingClientRect();
    const rootBox = rootElement.getBoundingClientRect();

    return {
      top: headerBox.top - rootBox.top - rootElement.clientTop + rootElement.scrollTop,
      left: headerBox.left - rootBox.left - rootElement.clientLeft + rootElement.scrollLeft,
      width: headerBox.width,
      height: headerBox.height,
    };
  }

  /**
   * Checks whether a header has an action of its own on a click or `Enter` (sorting, collapsing a row group),
   * which the plugin must not take over.
   *
   * @param {string} axis The header axis.
   * @param {HTMLTableCellElement} header The header cell.
   * @returns {boolean}
   */
  #hasHeaderAction(axis: HeaderAxis, header: HTMLTableCellElement): boolean {
    if (axis === 'row') {
      return this.hot.getPlugin('nestedRows')?.enabled === true;
    }

    return header.querySelector(`.${SORT_ACTION_CLASS}`) !== null;
  }

  /**
   * Returns the header the keyboard focus is on, when it can be renamed.
   *
   * @returns {{ axis: HeaderAxis, visualIndex: number, header: HTMLTableCellElement }|null}
   */
  #getFocusedHeader(): { axis: HeaderAxis; visualIndex: number; header: HTMLTableCellElement } | null {
    const range = this.hot.getSelectedRangeActive();

    if (!range?.isSingleHeader()) {
      return null;
    }

    const { row, col } = range.highlight;

    if (row === null || col === null) {
      return null;
    }

    let axis: HeaderAxis;
    let visualIndex: number;

    if (row < 0 && col >= 0) {
      axis = 'column';
      visualIndex = col;
    } else if (col === -1 && row >= 0) {
      axis = 'row';
      visualIndex = row;
    } else {
      return null;
    }

    const header = this.#getHeaderElement(axis, visualIndex);

    if (header === null || !this.isEditable(axis, visualIndex) ||
        (axis === 'column' && !isBottomMostColumnHeader(header))) {
      return null;
    }

    return { axis, visualIndex, header };
  }

  /**
   * Registers F2 and Enter on a focused header in the grid context, and the editor's keys in the plugin's own
   * context, which is active while the input is open.
   */
  #registerShortcuts() {
    const manager = this.hot.getShortcutManager();
    const gridContext = manager.getContext('grid');
    const pluginContext = manager.getOrCreateContext(SHORTCUTS_CONTEXT_NAME);
    const openFromKeyboard = () => {
      const focused = this.#getFocusedHeader();

      if (focused !== null) {
        this.openEditor(focused.axis, focused.visualIndex);
      }

      return false;
    };

    gridContext?.addShortcut({
      keys: [['F2']],
      callback: openFromKeyboard,
      runOnlyIf: () => this.#getFocusedHeader() !== null,
      relativeToGroup: EDITOR_EDIT_GROUP,
      position: 'before',
      group: SHORTCUTS_GROUP,
    });
    gridContext?.addShortcut({
      keys: [['Enter']],
      callback: openFromKeyboard,
      runOnlyIf: () => {
        const focused = this.#getFocusedHeader();

        return focused !== null && !this.#hasHeaderAction(focused.axis, focused.header);
      },
      relativeToGroup: EDITOR_EDIT_GROUP,
      position: 'before',
      group: SHORTCUTS_GROUP,
    });

    const isTyping = (event?: KeyboardEvent) => this.isEditorOpened() &&
      !(this.#editor?.isComposing() || event?.isComposing || event?.keyCode === 229);

    pluginContext.addShortcuts([{
      keys: [['Enter']],
      callback: () => this.#closeEditor(true, true),
    }, {
      keys: [['Escape']],
      callback: () => this.#closeEditor(false, true),
    }, {
      keys: [['Tab'], ['Shift', 'Tab']],
      callback: () => this.#closeEditor(true, true),
      forwardToContext: gridContext,
    }], {
      runOnlyIf: isTyping,
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Removes the plugin's shortcuts from both contexts. The plugin context itself cannot be removed.
   */
  #unregisterShortcuts() {
    const manager = this.hot.getShortcutManager();

    manager.getContext('grid')?.removeShortcutsByGroup(SHORTCUTS_GROUP);
    manager.getContext(SHORTCUTS_CONTEXT_NAME)?.removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Shows a renamed column header in place of the configured one.
   *
   * @param {*} value The column header value.
   * @param {number} visualColumn The visual column index.
   * @returns {*}
   */
  #onModifyColumnHeaderValue = (value: unknown, visualColumn: number): unknown => {
    // `colHeaders: false` hides the headers, and core reports `null` for them then.
    if (this.#readingConfigured || this.#nestedHeadersOn || this.hot.getSettings().colHeaders === false) {
      return value;
    }

    return this.#readName('column', visualColumn) ?? value;
  };

  /**
   * Shows a renamed row header in place of the configured one.
   *
   * @param {*} value The row header value.
   * @param {number} visualRow The visual row index.
   * @returns {*}
   */
  #onModifyRowHeaderValue = (value: unknown, visualRow: number): unknown => {
    if (this.#readingConfigured || !this.hot.hasRowHeaders()) {
      return value;
    }

    return this.#readName('row', visualRow) ?? value;
  };

  /**
   * Answers the view whether a header's label is a rename, which it then writes as text.
   *
   * @param {string} axis The header axis.
   * @param {number} visualIndex The visual index.
   * @returns {boolean}
   */
  #isRenamedHeader = (axis: HeaderAxis, visualIndex: number): boolean => {
    if (axis === 'column' && this.#nestedHeadersOn) {
      return false;
    }

    return this.#readName(axis, visualIndex) !== null;
  };

  /**
   * Returns a header's rename, or `null`, by the visual index. Cheap enough for every header read.
   *
   * @param {string} axis The header axis.
   * @param {number} visualIndex The visual index.
   * @returns {string|null}
   */
  #readName(axis: HeaderAxis, visualIndex: number): string | null {
    const names = this.#getNames(axis);

    if (names === null || visualIndex < 0) {
      return null;
    }

    const physicalIndex = this.#toPhysical(axis, visualIndex);

    return physicalIndex === null ? null : names.getValueAtIndex<string | null>(physicalIndex) ?? null;
  }

  /**
   * Keeps the open input over its header after a render or a scroll, and closes it without saving when the header
   * is no longer drawn: a scroll is no confirmation of a half-typed name. A scroll inside the drawn band moves the
   * overlays with no render, so both hooks call it. The close is deferred, because this can run inside a render.
   */
  #syncEditor = () => {
    const edited = this.#edited;

    if (edited === null || this.#editor === null) {
      return;
    }

    const visualIndex = this.#toVisual(edited.axis, edited.physicalIndex);
    const rect = visualIndex === null ? null : this.#getHeaderRect(edited.axis, visualIndex);

    if (rect === null) {
      this.hot._registerTimeout(() => {
        if (this.#edited === edited) {
          this.#closeEditor(false, false);
        }
      });

      return;
    }

    this.#editor.reposition(rect);
  };

  /**
   * Takes the renames before an undo or a redo, so the change can be reported after it.
   */
  #onBeforeRestore = () => {
    this.#namesBeforeRestore = this.#takeNamesSnapshot();
  };

  /**
   * Reports the headers an undo or a redo renamed.
   */
  #onAfterRestore = () => {
    const before = this.#namesBeforeRestore;

    this.#namesBeforeRestore = null;
    this.#reportChangedNames(before);
  };

  /**
   * Keeps a key pressed in the input from reaching the cell editor: with the highlight on a cell (headers that
   * are not navigable), a printable key would otherwise open that cell's editor and type into it.
   *
   * @param {Event} event The `keydown` or `compositionstart` event.
   */
  #onAfterDocumentKeyDown = (event: Event) => {
    if (this.isEditorOpened()) {
      stopImmediatePropagation(event);
    }
  };

  /**
   * Opens the input on a double-clicked header, unless a click on it has an action of its own.
   *
   * @param {MouseEvent} event The `dblclick` event.
   */
  #onRootDoubleClick = (event: MouseEvent) => {
    const target = eventTargetEl(event);
    const header = target?.closest('th') ?? null;

    // A header of a grid nested in this one (an editor's list) belongs to that grid.
    if (header === null || target?.closest(HEADER_CONTROLS_SELECTOR) ||
        !isInternalElement(header, this.hot.rootElement)) {
      return;
    }

    const coords = this.hot.getCoords(header);

    if (coords === null) {
      return;
    }

    const { row, col } = coords;

    if (row === null || col === null) {
      return;
    }

    let axis: HeaderAxis;
    let visualIndex: number;

    if (row < 0 && col >= 0 && isBottomMostColumnHeader(header)) {
      axis = 'column';
      visualIndex = col;
    } else if (col === -1 && row >= 0) {
      axis = 'row';
      visualIndex = row;
    } else {
      return;
    }

    if (!this.#hasHeaderAction(axis, header)) {
      this.openEditor(axis, visualIndex);
    }
  };

  /**
   * Saves the rename when the input loses the focus to something else.
   */
  #onEditorBlur = () => {
    this.#closeEditor(true, false);
  };
}
