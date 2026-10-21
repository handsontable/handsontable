import type {
  FormulaBuilder as FormulaBuilderCore,
  FormulaEditor,
  HyperFormulaLike,
} from 'hyperformula-ui';
import { BasePlugin } from '../base';
import { warn } from '../../helpers/console';
import { isObject } from '../../helpers/object';
import { isRootInstance } from '../../utils/rootInstance';
import type { HotInstance } from '../../core/types';
import type { PluginTypeMap } from '../types';
import type { CellProperties } from '../../settings';
import { CellPickController } from './cellPickController';
import {
  EDITING_CELL_CLASS,
  FORMULA_EDITOR_ALIAS,
  isFormulaEditor,
  registerFormulaEditor,
  type FormulaHostEditor,
} from './formulaCellEditor';
import { HandsontableAdapter, setFormulaBuilderAdapter } from './handsontableAdapter';
import { REQUIRED_CORE_MEMBERS, type CoreModule } from './internalTypes';
import type {
  FormulaBuilderLayoutDirection,
  FormulaBuilderPluginSettings,
  FormulaBuilderPopupsOptions,
  FormulaBuilderStepDirection,
  FormulaEditorHandle,
} from './types';

export const PLUGIN_KEY = 'formulaBuilder';
export const PLUGIN_PRIORITY = 265;

type Formulas = PluginTypeMap['formulas'];

const FORMULA_BAR_SLOT_KEY = 'formulaBuilder';
const FALLBACK_SCAN_CELL_CAP = 10000;
const FORMULA_BAR_SLOT_WEIGHT = 100;
const FORMULA_BAR_CLASS = 'ht-formula-builder__formula-bar';
/**
 * The order index of the plugin's cell mouse listeners. A reference pick has to see a mousedown
 * before every other listener (NestedHeaders, ColumnSorting, DragToScroll, ...), because it
 * claims the gesture by stopping the event. Plugin priority orders only the FIRST enable: a
 * later `updatePlugin()` re-registers the hooks at the tail of each list, which is how the pick
 * used to lose to NestedHeaders after a theme switch. An order index survives re-registration.
 */
const CELL_MOUSE_HOOK_ORDER = -1;
/**
 * The attribute `hyperformula-ui` writes on a cell it marks as an error.
 */
const CELL_ERROR_ATTRIBUTE = 'data-hfe-error';

/**
 * A selection range in visual coordinates.
 */
interface VisualRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * A formula-cell selection reported to the formula bar.
 */
interface FormulaCellSelection {
  active: { row: number; col: number };
  range: VisualRange;
}

/**
 * The settings the enabled plugin was built from, compared on every `updatePlugin()` so a
 * settings update that changes none of them (a React or Angular re-render re-sends every prop
 * with a new object) keeps the built plugin, its formula bar, and any open edit.
 */
interface AppliedConfig {
  core: unknown;
  showFormulaBar: boolean;
  direction: FormulaBuilderLayoutDirection | undefined;
  popups: FormulaBuilderPopupsOptions | undefined;
  engine: unknown;
}

/**
 * A minimal listener registry with unsubscribe semantics.
 */
class ListenerSet<TArgs extends unknown[] = []> {
  /**
   * The registered listeners.
   */
  readonly #listeners = new Set<(...args: TArgs) => void>();

  /**
   * Registers a listener.
   *
   * @param {Function} listener The listener to add.
   * @returns {Function} Unsubscribe function.
   */
  add(listener: (...args: TArgs) => void): () => void {
    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  /**
   * Invokes every registered listener.
   *
   * @param {...unknown} args The listener arguments.
   */
  emit(...args: TArgs): void {
    for (const listener of [...this.#listeners]) {
      listener(...args);
    }
  }

  /**
   * Removes every registered listener.
   */
  clear(): void {
    this.#listeners.clear();
  }
}

/**
 * Compares two settings values: plain objects and arrays by content, everything else (an
 * element, a function, a module namespace) by identity.
 *
 * @param {unknown} first The first value.
 * @param {unknown} second The second value.
 * @returns {boolean}
 */
function isSameSettingValue(first: unknown, second: unknown): boolean {
  if (first === second) {
    return true;
  }

  if (Array.isArray(first) && Array.isArray(second)) {
    return first.length === second.length &&
      first.every((item, index) => isSameSettingValue(item, second[index]));
  }

  if (!isObject(first) || !isObject(second) || Array.isArray(first) || Array.isArray(second)) {
    return false;
  }

  const firstObject = first as Record<string, unknown>;
  const secondObject = second as Record<string, unknown>;
  const keys = Object.keys(firstObject);

  return keys.length === Object.keys(secondObject).length &&
    keys.every(key => isSameSettingValue(firstObject[key], secondObject[key]));
}

/**
 * Lists the module members the plugin needs that the given `builder` value does not provide.
 *
 * @param {unknown} core The `builder` setting value.
 * @returns {string[]}
 */
function findMissingCoreMembers(core: unknown): string[] {
  // A module namespace (`import * as`) is not a plain object, so `isObject()` would reject it.
  if (typeof core !== 'object' || core === null) {
    return [...REQUIRED_CORE_MEMBERS];
  }

  const members = core as Record<string, unknown>;

  return REQUIRED_CORE_MEMBERS.filter(name => typeof members[name] !== 'function');
}

/**
 * @plugin FormulaBuilder
 * @class FormulaBuilder
 *
 * @description
 * This plugin provides a spreadsheet-style formula editing experience on top of the
 * {@link Formulas} plugin: a formula bar, an inline formula cell editor with colored
 * references, cell/range/header reference picking by mouse or keyboard, and formula
 * error indicators rendered in the grid.
 *
 * The plugin requires the {@link Formulas} plugin to be enabled with a configured engine,
 * and the `hyperformula-ui` module to be passed in via the `builder` setting.
 *
 * Reference highlights render through the grid's own selection machinery (custom
 * selections), so they follow frozen panes, scrolling, and hidden or reordered rows
 * and columns natively, and the plugin leaves the grid root element's inline styles
 * untouched.
 *
 * Every row and column index the public methods take or return is a visual index.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * import * as FormulaBuilderModule from 'hyperformula-ui';
 * import { HyperFormula } from 'hyperformula';
 *
 * const hot = new Handsontable(container, {
 *   formulas: {
 *     engine: HyperFormula,
 *   },
 *   formulaBuilder: {
 *     builder: FormulaBuilderModule,
 *     showFormulaBar: true,
 *   },
 * });
 * ```
 * :::
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   formulas={{ engine: HyperFormula }}
 *   formulaBuilder={{ builder: FormulaBuilderModule, showFormulaBar: true }}
 * />
 * ```
 * :::
 * ::: only-for angular
 * ```ts
 * hotSettings: Handsontable.GridSettings = {
 *   formulas: { engine: HyperFormula },
 *   formulaBuilder: { builder: FormulaBuilderModule, showFormulaBar: true },
 * };
 * ```
 * :::
 */
export class FormulaBuilder extends BasePlugin {
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
   * The editor aliases the plugin provides. `validateSettings()` accepts them for a registered
   * plugin before any grid exists, while the editor registry learns them from the first instance.
   */
  static get EDITORS() {
    return [FORMULA_EDITOR_ALIAS];
  }

  /**
   * Returns the setting keys that, when present in an `updateSettings` config object, trigger
   * the plugin update. `formulas` is included because the plugin borrows the engine from the
   * Formulas plugin at enable time - a Formulas reconfiguration must re-run the enable cycle
   * so the plugin never keeps a stale engine reference.
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY, 'formulas'];
  }

  /**
   * The injected `hyperformula-ui` module namespace (set while enabled).
   */
  #core: CoreModule | null = null;
  /**
   * The grid adapter (created on enable, destroyed on disable).
   */
  #adapter: HandsontableAdapter | null = null;
  /**
   * The `hyperformula-ui` `FormulaBuilder` instance (set while enabled).
   */
  #builder: FormulaBuilderCore | null = null;
  /**
   * The Formulas plugin instance. It is stable for the instance's lifetime; its engine, sheet id,
   * and axis syncers are read per call, so a Formulas re-enable never leaves stale references.
   */
  #formulas: Formulas | null = null;
  /**
   * The settings the enabled plugin was built from (see {@link AppliedConfig}).
   */
  #appliedConfig: AppliedConfig | null = null;
  /**
   * The engine sheet id the builder was constructed with. The builder cannot be re-pointed at
   * another sheet, so it is rebuilt when the Formulas plugin binds the grid to a different one.
   */
  #builtSheetId: number | null = null;
  /**
   * The formula bar host element registered in the top layout slot, or `null`.
   */
  #formulaBarHost: HTMLElement | null = null;
  /**
   * The last selection reported through `onSelection`.
   */
  #selected = { row: 0, col: 0 };
  /**
   * The live formula editor, or `null` when not editing.
   */
  #activeEditor: FormulaEditor | null = null;
  /**
   * The active cell the formula bar edits, in visual coordinates.
   */
  #barSelected: { row: number; col: number } | null = null;
  /**
   * The selected range the formula bar tracks, in visual coordinates.
   */
  #barSelectedRange: VisualRange | null = null;
  /**
   * Dedupe key for bar selection emits (anchor + focus + active together).
   */
  #lastEmittedSelectionCoords: {
    anchorRow: number;
    anchorCol: number;
    focusRow: number;
    focusCol: number;
    activeRow: number;
    activeCol: number;
  } | null = null;
  /**
   * Click/drag reference picking controller (created on enable).
   */
  #cellPick: CellPickController | null = null;
  /**
   * Bar selection listeners.
   */
  readonly #barSelectionListeners = new ListenerSet<[FormulaCellSelection | null]>();
  /**
   * Tracked-selection listeners.
   */
  readonly #selectionListeners = new ListenerSet<[{ row: number; col: number }]>();
  /**
   * Inline edit start listeners.
   */
  readonly #editorStartListeners = new ListenerSet<[{ mount: HTMLElement; seed: string }]>();
  /**
   * Editor close listeners.
   */
  readonly #editorCloseListeners = new ListenerSet();
  /**
   * Bar-to-inline handoff listeners.
   */
  readonly #switchToInlineListeners = new ListenerSet();
  /**
   * Removes the scroll listener that re-anchors the inline editor during an edit session.
   */
  #removeInlineScrollListener: (() => void) | null = null;
  /**
   * Whether a scroll re-anchor of the inline editor is queued for the next animation frame.
   */
  #reanchorQueued = false;
  /**
   * The theme class name the builder was constructed with (compared in `afterSetTheme`).
   */
  #currentThemeClassName: string | undefined;

  /**
   * @param {HotInstance} hotInstance The Handsontable instance.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);
    // A cell configured with `editor: 'formula'` must resolve whether or not the plugin enables, so
    // the alias is registered when the instance is built, not in `enablePlugin()`. Not when the
    // module loads: importing the plugin registry must register plugins only (pinned by the
    // `registerAll*` registry tests).
    registerFormulaEditor();
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    let setUpSucceeded = false;

    try {
      setUpSucceeded = this.#setUpPlugin();
    } finally {
      if (!setUpSucceeded) {
        this.#teardownPluginState();
      }
    }

    if (setUpSucceeded) {
      super.enablePlugin();
    }
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin(): void {
    super.disablePlugin();
    this.#teardownPluginState();
  }

  /**
   * Update plugin state after Handsontable settings update. A settings update that changes
   * nothing the plugin was built from keeps the built plugin (see {@link AppliedConfig}).
   */
  updatePlugin(): void {
    if (this.enabled && this.#isConfigUnchanged()) {
      super.updatePlugin();

      return;
    }

    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Destroy plugin instance.
   */
  destroy(): void {
    if (this.enabled) {
      this.disablePlugin();
    }

    this.#selectionListeners.clear();
    this.#barSelectionListeners.clear();
    this.#editorStartListeners.clear();
    this.#editorCloseListeners.clear();
    this.#switchToInlineListeners.clear();
    super.destroy();
  }

  /**
   * Re-parents the suggestions popup into a custom host element.
   *
   * @param {HTMLElement | string} container The host element or a CSS selector.
   */
  attachSuggestionsHost(container: HTMLElement | string): void {
    this.#builder?.attachSuggestionsHost(container);
  }

  /**
   * Restores the suggestions popup to its default anchored placement.
   */
  detachSuggestionsHost(): void {
    this.#builder?.detachSuggestionsHost();
  }

  /**
   * Re-parents the function help popup into a custom host element.
   *
   * @param {HTMLElement | string} container The host element or a CSS selector.
   */
  attachFnHelpHost(container: HTMLElement | string): void {
    this.#builder?.attachFnHelpHost(container);
  }

  /**
   * Restores the function help popup to its default anchored placement.
   */
  detachFnHelpHost(): void {
    this.#builder?.detachFnHelpHost();
  }

  /**
   * Mounts the formula editor into the inline wrapper (called by the editor shim).
   *
   * @param {HTMLElement} mount The wrapper element.
   * @param {string} seed The initial editor content.
   */
  handleInlineEditStart(mount: HTMLElement, seed: string): void {
    this.#editorStartListeners.emit({ mount, seed });

    if (!this.#activeEditor && this.#builder) {
      if (!this.#builder.hasFormulaBar) {
        this.setInlineEditorVisible(true);
      }

      this.#activeEditor = this.#builder.editor;
    }

    this.#bindInlineScrollReanchor();
  }

  /**
   * Saves the given value through Handsontable's editor manager, optionally
   * moving the selection one (renderable) step in a direction.
   *
   * @param {string} value The value to save.
   * @param {string} [direction] Optional post-commit selection step direction.
   */
  commitInlineEdit(value: string, direction?: FormulaBuilderStepDirection): void {
    const editor = this.#hostEditor();

    if (!editor) {
      return;
    }

    editor.setValue?.(value);

    if (!direction) {
      editor.finishEditing?.();

      return;
    }

    const selected = this.hot.getSelectedLast();

    editor.finishEditing?.(false, false, () => {
      const row = selected?.[0];
      const col = selected?.[1];

      if (row === undefined || col === undefined || row < 0 || col < 0) {
        return;
      }

      const rowDelta = { up: -1, down: 1, left: 0, right: 0 }[direction];
      const colDelta = { up: 0, down: 0, left: -1, right: 1 }[direction];

      this.hot.selectCell(
        this.#stepVisualIndex('row', row, rowDelta),
        this.#stepVisualIndex('col', col, colDelta),
      );
    });
  }

  /**
   * Cancels the edit, restores the original value, and re-selects the cell so
   * DOM focus returns to the grid.
   */
  cancelInlineEdit(): void {
    this.#hostEditor()?.finishEditing?.(true);

    const selected = this.hot.getSelectedLast();
    const row = selected?.[0];
    const col = selected?.[1];

    if (row === undefined || col === undefined || row < 0 || col < 0) {
      return;
    }

    this.hot.selectCell(row, col);
  }

  /**
   * Tears the inline edit session down (called by the editor shim on close).
   */
  handleInlineEditClose(): void {
    this.#removeInlineScrollListener?.();
    this.#removeInlineScrollListener = null;
    this.#builder?.closeEditor();
    this.#activeEditor = null;
    this.#cellPick?.reset();
    this.#clearEditingCellMark();
    this.#editorCloseListeners.emit();
  }

  /**
   * Returns the live formula editor, or `null` when not editing.
   *
   * @returns {FormulaEditorHandle | null}
   */
  getActiveEditor(): FormulaEditorHandle | null {
    return this.#activeEditor;
  }

  /**
   * Subscribes to inline edit session starts.
   *
   * @param {Function} callback Receives the editor mount element and the typed seed.
   * @returns {Function} Unsubscribe function.
   */
  onInlineEditStart(callback: (event: { mount: HTMLElement; seed: string }) => void): () => void {
    return this.#editorStartListeners.add(callback);
  }

  /**
   * Subscribes to bar-to-inline handoff requests.
   *
   * @param {Function} callback Invoked when editing should switch to the inline editor.
   * @returns {Function} Unsubscribe function.
   */
  onSwitchToInline(callback: () => void): () => void {
    return this.#switchToInlineListeners.add(callback);
  }

  /**
   * Returns the active formula cell in visual coordinates, or `null`.
   *
   * @returns {{ row: number, col: number } | null}
   */
  getActiveFormulaCell(): { row: number; col: number } | null {
    return this.#barSelected ? { ...this.#barSelected } : null;
  }

  /**
   * Subscribes to formula-cell selection changes in visual coordinates.
   *
   * @param {Function} callback Receives the selection or `null` on deselect.
   * @returns {Function} Unsubscribe function.
   */
  onFormulaCellSelection(callback: (selection: FormulaCellSelection | null) => void): () => void {
    return this.#barSelectionListeners.add(callback);
  }

  /**
   * Selects the first cell using the formula editor: the rendered viewport is
   * scanned first, then the rest of the grid up to a fixed cell budget - an
   * uncapped scan would resolve cell meta for every cell of a large grid on the
   * UI thread before giving up.
   */
  selectFirstFormulaCell(): void {
    const firstRow = Math.max(this.hot.getFirstRenderedVisibleRow(), 0);
    const lastRow = this.hot.getLastRenderedVisibleRow();
    const firstCol = Math.max(this.hot.getFirstRenderedVisibleColumn(), 0);
    const lastCol = this.hot.getLastRenderedVisibleColumn();

    for (let row = firstRow; row <= lastRow; row++) {
      for (let col = firstCol; col <= lastCol; col++) {
        if (this.#isFormulaCell(row, col)) {
          this.hot.selectCell(row, col);

          return;
        }
      }
    }

    const rows = this.hot.countRows();
    const cols = this.hot.countCols();
    let scanBudget = FALLBACK_SCAN_CELL_CAP;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (scanBudget <= 0) {
          return;
        }

        scanBudget -= 1;

        if (this.#isFormulaCell(row, col)) {
          this.hot.selectCell(row, col);

          return;
        }
      }
    }
  }

  /**
   * Selects a single cell in visual coordinates.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  selectFormulaCell(row: number, col: number): void {
    this.hot.selectCell(row, col);
  }

  /**
   * Selects a cell range in visual coordinates.
   *
   * @param {number} startRow The visual start row index.
   * @param {number} startCol The visual start column index.
   * @param {number} endRow The visual end row index.
   * @param {number} endCol The visual end column index.
   */
  selectFormulaCells(startRow: number, startCol: number, endRow: number, endCol: number): void {
    this.hot.selectCells([[startRow, startCol, endRow, endCol]]);
  }

  /**
   * Returns the last tracked single-cell selection in visual coordinates.
   *
   * @returns {{ row: number, col: number }}
   */
  getSelected(): { row: number; col: number } {
    return { ...this.#selected };
  }

  /**
   * Updates the tracked single-cell selection and notifies listeners on change.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  setSelected(row: number, col: number): void {
    if (this.#selected.row === row && this.#selected.col === col) {
      return;
    }

    this.#selected = { row, col };
    this.#selectionListeners.emit({ row, col });
  }

  /**
   * Subscribes to tracked single-cell selection changes.
   *
   * @param {Function} callback Receives the visual coordinates.
   * @returns {Function} Unsubscribe function.
   */
  onSelection(callback: (selection: { row: number; col: number }) => void): () => void {
    return this.#selectionListeners.add(callback);
  }

  /**
   * Subscribes to editor close events.
   *
   * @param {Function} callback Invoked when the inline editor closes.
   * @returns {Function} Unsubscribe function.
   */
  onEditorClose(callback: () => void): () => void {
    return this.#editorCloseListeners.add(callback);
  }

  /**
   * Returns the raw cell text: the formula source of a formula cell, or the stringified value.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {string}
   */
  getRawCellText(row: number, col: number): string {
    return this.#readCellText(this.#visualToHfRow(row), this.#visualToHfCol(col));
  }

  /**
   * Saves raw cell input through Handsontable, parsing numbers and booleans.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} raw The raw input text.
   */
  commitCellRaw(row: number, col: number, raw: string): void {
    if (!this.#core) {
      return;
    }

    this.hot.setDataAtCell(row, col, this.#core.parseCellInput(raw));
  }

  /**
   * Shows or hides the inline editor overlay (formula bar handoff).
   *
   * @param {boolean} visible Whether the editor should be visible.
   */
  setInlineEditorVisible(visible: boolean): void {
    const editor = this.#hostEditor();

    if (!editor) {
      return;
    }

    editor._hiddenByFormulaBar = !visible;
    editor.refreshDimensions?.();

    if (!visible) {
      this.#clearEditingCellMark();
    }
  }

  /**
   * `afterRenderer` hook listener - marks the edited cell and renders error indicators. Reads
   * the editor from the `cellProperties` the hook already passes: this runs for every rendered
   * cell on every draw, and resolving the meta again would double its cost.
   *
   * @param {HTMLTableCellElement} cellEl The rendered cell element.
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string|number} prop The column property.
   * @param {unknown} value The rendered value.
   * @param {CellProperties} cellProperties The cell meta.
   */
  #onAfterRenderer = (
    cellEl: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: unknown,
    cellProperties: CellProperties,
  ): void => {
    if (this.#activeEditor) {
      const hostEditor = this.#hostEditor();

      if (
        hostEditor &&
        !hostEditor._hiddenByFormulaBar &&
        hostEditor.row === row &&
        hostEditor.col === col
      ) {
        cellEl.classList.add(EDITING_CELL_CLASS);
      }
    }

    const isFormulaCell = row >= 0 && col >= 0 && isFormulaEditor(cellProperties.editor);
    const hfRow = isFormulaCell ? this.#visualToHfRow(row) : -1;
    const hfCol = isFormulaCell ? this.#visualToHfCol(col) : -1;

    if (hfRow < 0 || hfCol < 0) {
      // The grid recycles cell elements, so one that showed an error for another cell keeps the
      // mark until something clears it.
      if (cellEl.hasAttribute(CELL_ERROR_ATTRIBUTE)) {
        this.#builder?.markCell(cellEl, null);
      }

      return;
    }

    const cellValue = this.#engine?.getCellValue({ sheet: this.#sheetId, row: hfRow, col: hfCol });

    this.#builder?.markCell(cellEl, cellValue);

    // The grid writes its ARIA attributes only under `ariaTags`, and so does the plugin.
    if (!this.hot.getSettings().ariaTags) {
      cellEl.removeAttribute('aria-invalid');
    }
  };

  /**
   * `afterSelectionEnd` hook listener - moves the tracked selection after a
   * completed selection gesture.
   *
   * @param {number} anchorRow The anchor visual row index.
   * @param {number} anchorCol The anchor visual column index.
   * @param {number} focusRow The focus visual row index.
   * @param {number} focusCol The focus visual column index.
   */
  #onAfterSelectionEnd = (
    anchorRow: number,
    anchorCol: number,
    focusRow: number,
    focusCol: number,
  ): void => {
    if (this.#isEditing()) {
      return;
    }

    if (this.#emitBarSelection(anchorRow, anchorCol, focusRow, focusCol)) {
      this.setSelected(anchorRow, anchorCol);
    }
  };

  /**
   * `afterDeselect` hook listener - clears the bar selection (and the dedupe key).
   */
  #onAfterDeselect = (): void => {
    if (this.#isEditing()) {
      return;
    }

    this.#lastEmittedSelectionCoords = null;
    this.#barSelected = null;
    this.#barSelectedRange = null;
    this.#barSelectionListeners.emit(null);
  };

  /**
   * `beforeColumnSort` hook listener - blocks the sort caused by the mousedown
   * that began a header pick.
   *
   * @returns {boolean | undefined}
   */
  #onBeforeColumnSort = (): boolean | undefined =>
    (this.#cellPick?.isHeaderPickActive() ? false : undefined);

  /**
   * `afterSetTheme` hook listener - rebuilds the builder when the theme class actually
   * changed, because the builder applies its theming class once, at construction.
   */
  #onAfterSetTheme = (): void => {
    if (this.#builder === null || this.#themeClassName() === this.#currentThemeClassName) {
      return;
    }

    this.#rebuildBuilder();
  };

  /**
   * `afterLoadData`/`afterUpdateData` hook listener - rebuilds the builder when the data load
   * bound the grid to another engine sheet. The plugin enables before the first data load, while
   * the Formulas plugin has no sheet id yet, and `Formulas#switchSheet()` reloads the data too.
   */
  #onAfterDataLoad = (): void => {
    if (this.#builder !== null && this.#sheetId !== this.#builtSheetId) {
      this.#rebuildBuilder();
    }
  };

  /**
   * `afterSelection` hook listener - mirrors the bar live during a drag or
   * keyboard step without moving the tracked selection.
   *
   * @param {number} anchorRow The anchor visual row index.
   * @param {number} anchorCol The anchor visual column index.
   * @param {number} focusRow The focus visual row index.
   * @param {number} focusCol The focus visual column index.
   */
  #onAfterSelection = (
    anchorRow: number,
    anchorCol: number,
    focusRow: number,
    focusCol: number,
  ): void => {
    if (this.#isEditing()) {
      return;
    }

    this.#emitBarSelection(anchorRow, anchorCol, focusRow, focusCol);
  };

  /**
   * `afterSelectionFocusSet` hook listener - re-emits the bar selection when only
   * the highlight moved (Tab/Shift+Tab within a range).
   */
  #onAfterSelectionFocusSet = (): void => {
    if (this.#isEditing()) {
      return;
    }

    const range = this.hot.getSelectedRangeLast();

    if (!range) {
      return;
    }

    const { from, to } = range;

    if (from.row === null || from.col === null || to.row === null || to.col === null) {
      return;
    }

    this.#emitBarSelection(from.row, from.col, to.row, to.col);
  };

  /**
   * `afterColumnResize`/`afterRowResize` hook listener - re-anchors the inline
   * editor overlay after a manual resize relayouts the grid mid-session (scroll
   * and window-resize already re-anchor; header-handle resizes do not emit either).
   */
  #onAfterSizeChange = (): void => {
    if (this.#activeEditor !== null) {
      this.#hostEditor()?.refreshDimensions?.(true);
    }
  };

  /**
   * Emits the bar selection (deduped on anchor + focus + active together).
   *
   * @param {number} anchorRow The anchor visual row index.
   * @param {number} anchorCol The anchor visual column index.
   * @param {number} focusRow The focus visual row index.
   * @param {number} focusCol The focus visual column index.
   * @returns {boolean} Whether the anchor is a formula cell.
   */
  #emitBarSelection(
    anchorRow: number,
    anchorCol: number,
    focusRow: number,
    focusCol: number,
  ): boolean {
    const formulaCell = this.#isFormulaCell(anchorRow, anchorCol);
    const highlight = this.hot.getSelectedRangeLast()?.highlight;
    const activeRow = highlight?.row ?? anchorRow;
    const activeCol = highlight?.col ?? anchorCol;
    const last = this.#lastEmittedSelectionCoords;

    if (
      last &&
      last.anchorRow === anchorRow &&
      last.anchorCol === anchorCol &&
      last.focusRow === focusRow &&
      last.focusCol === focusCol &&
      last.activeRow === activeRow &&
      last.activeCol === activeCol
    ) {
      return formulaCell;
    }

    this.#lastEmittedSelectionCoords = { anchorRow, anchorCol, focusRow, focusCol, activeRow, activeCol };
    this.#barSelected = formulaCell ? { row: activeRow, col: activeCol } : null;
    this.#barSelectedRange = formulaCell ?
      {
        startRow: Math.min(anchorRow, focusRow),
        startCol: Math.min(anchorCol, focusCol),
        endRow: Math.max(anchorRow, focusRow),
        endCol: Math.max(anchorCol, focusCol),
      } :
      null;
    this.#barSelectionListeners.emit(
      this.#barSelected && this.#barSelectedRange ?
        { active: this.#barSelected, range: this.#barSelectedRange } :
        null,
    );

    return formulaCell;
  }

  /**
   * Steps a visual index by one renderable position so hidden rows/columns are skipped.
   *
   * @param {'row' | 'col'} axis The axis to step on.
   * @param {number} visualIndex The current visual index.
   * @param {number} delta The step delta (-1, 0, or 1).
   * @returns {number}
   */
  #stepVisualIndex(axis: 'row' | 'col', visualIndex: number, delta: number): number {
    if (delta === 0) {
      return visualIndex;
    }

    const mapper = axis === 'row' ? this.hot.rowIndexMapper : this.hot.columnIndexMapper;
    const renderable = mapper.getRenderableFromVisualIndex(visualIndex);

    if (renderable === null) {
      const count = axis === 'row' ? this.hot.countRows() : this.hot.countCols();

      return Math.min(Math.max(visualIndex + delta, 0), count - 1);
    }

    const lastRenderable = mapper.getRenderableIndexesLength() - 1;
    const nextRenderable = Math.min(Math.max(renderable + delta, 0), lastRenderable);

    return mapper.getVisualFromRenderableIndex(nextRenderable) ?? visualIndex;
  }

  /**
   * Returns Handsontable's active editor.
   *
   * @returns {FormulaHostEditor | undefined}
   */
  #hostEditor(): FormulaHostEditor | undefined {
    return this.hot.getActiveEditor() as FormulaHostEditor | undefined;
  }

  /**
   * The Formulas plugin instance, looked up once.
   *
   * @returns {Formulas | null}
   */
  get #formulasPlugin(): Formulas | null {
    this.#formulas ??= this.hot.getPlugin('formulas') ?? null;

    return this.#formulas;
  }

  /**
   * The Formulas plugin's engine, or `null` when it has none.
   *
   * @returns {object | null}
   */
  get #engine() {
    return this.#formulasPlugin?.engine ?? null;
  }

  /**
   * The engine sheet id backing this grid (`0` before the Formulas plugin binds one).
   *
   * @returns {number}
   */
  get #sheetId(): number {
    return this.#formulasPlugin?.sheetId ?? 0;
  }

  /**
   * Maps a visual row index to its HyperFormula row index.
   *
   * @param {number} visualRow The visual row index.
   * @returns {number}
   */
  #visualToHfRow(visualRow: number): number {
    return this.#formulasPlugin?.rowAxisSyncer?.getHfIndexFromVisualIndex(visualRow) ?? -1;
  }

  /**
   * Maps a visual column index to its HyperFormula column index.
   *
   * @param {number} visualCol The visual column index.
   * @returns {number}
   */
  #visualToHfCol(visualCol: number): number {
    return this.#formulasPlugin?.columnAxisSyncer?.getHfIndexFromVisualIndex(visualCol) ?? -1;
  }

  /**
   * Maps a HyperFormula row index to its visual row index.
   *
   * @param {number} hfRow The HyperFormula row index.
   * @returns {number}
   */
  #hfToVisualRow(hfRow: number): number {
    return this.#formulasPlugin?.rowAxisSyncer?.getVisualIndexFromHfIndex(hfRow) ?? -1;
  }

  /**
   * Maps a HyperFormula column index to its visual column index.
   *
   * @param {number} hfCol The HyperFormula column index.
   * @returns {number}
   */
  #hfToVisualCol(hfCol: number): number {
    return this.#formulasPlugin?.columnAxisSyncer?.getVisualIndexFromHfIndex(hfCol) ?? -1;
  }

  /**
   * Reads the raw cell text at HyperFormula coordinates (`''` for an unresolvable cell).
   *
   * @param {number} hfRow The HyperFormula row index.
   * @param {number} hfCol The HyperFormula column index.
   * @returns {string}
   */
  #readCellText(hfRow: number, hfCol: number): string {
    const engine = this.#engine;

    if (!engine || !this.#core || hfRow < 0 || hfCol < 0) {
      return '';
    }

    return this.#core.readCellText(
      engine as unknown as Parameters<CoreModule['readCellText']>[0],
      { sheet: this.#sheetId, row: hfRow, col: hfCol },
    );
  }

  /**
   * Resolves the grid's current theme class name. `themeManager` exists only when a
   * `ThemeBuilder` object drives the grid; string themes (`themeName: 'ht-theme-main'`
   * or a root-element class) leave it `null`, so fall back to the styles-handler name.
   * Without this class the body-mounted popup portal cannot inherit the grid's
   * `color-scheme` and `light-dark()` tokens resolve against the OS scheme instead.
   *
   * @returns {string | undefined}
   */
  #themeClassName(): string | undefined {
    return this.hot.themeManager?.getClassName() ?? this.hot.getCurrentThemeName() ?? undefined;
  }

  /**
   * Whether the cell at visual coordinates uses the formula editor. Reads the cell
   * meta transiently so scan loops (e.g. `selectFirstFormulaCell`) never materialize
   * a stored meta object per visited cell.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {boolean}
   */
  #isFormulaCell(row: number, col: number): boolean {
    if (row < 0 || col < 0) {
      return false;
    }

    return isFormulaEditor(this.hot.getCellMetaTransient(row, col).editor);
  }

  /**
   * Whether an inline edit session is active.
   *
   * @returns {boolean}
   */
  #isEditing(): boolean {
    return this.#activeEditor !== null;
  }

  /**
   * Reads the settings the plugin is built from, warning about and dropping invalid values.
   *
   * @returns {AppliedConfig}
   */
  #readConfig(): AppliedConfig {
    const settings = this.hot.getSettings()[PLUGIN_KEY] as
      | boolean
      | Partial<FormulaBuilderPluginSettings>
      | undefined;
    const object = typeof settings === 'object' && settings !== null ? settings : {};
    const { showFormulaBar, direction, popups } = object;

    if (showFormulaBar !== undefined && typeof showFormulaBar !== 'boolean') {
      warn('The `showFormulaBar` option of the FormulaBuilder plugin takes a boolean. The formula bar' +
        ' is not shown.');
    }

    let validDirection: FormulaBuilderLayoutDirection | undefined;

    if (direction === 'ltr' || direction === 'rtl') {
      validDirection = direction;
    } else if (direction !== undefined) {
      warn('The `direction` option of the FormulaBuilder plugin takes `\'ltr\'` or `\'rtl\'`. The' +
        ' grid\'s layout direction is used instead.');
    }

    return {
      core: object.builder,
      showFormulaBar: showFormulaBar === true,
      direction: validDirection,
      popups: isObject(popups) ? popups : undefined,
      engine: this.#engine,
    };
  }

  /**
   * Whether the current settings match the ones the enabled plugin was built from.
   *
   * @returns {boolean}
   */
  #isConfigUnchanged(): boolean {
    const applied = this.#appliedConfig;

    if (applied === null || !this.#formulasPlugin?.enabled) {
      return false;
    }

    const current = this.#readConfig();

    return applied.core === current.core &&
      applied.engine === current.engine &&
      applied.showFormulaBar === current.showFormulaBar &&
      applied.direction === current.direction &&
      isSameSettingValue(applied.popups, current.popups);
  }

  /**
   * Validates dependencies and builds the enable-time object graph.
   *
   * @returns {boolean} Whether the plugin set up successfully.
   */
  #setUpPlugin(): boolean {
    const config = this.#readConfig();
    const missingMembers = findMissingCoreMembers(config.core);

    if (missingMembers.length > 0) {
      warn('The `builder` key of the FormulaBuilder settings must be the `hyperformula-ui` module' +
        ' namespace (`import * as FormulaBuilderModule from \'hyperformula-ui\'`). It is missing' +
        ` ${missingMembers.map(name => `\`${name}\``).join(', ')}. The plugin stays disabled.`);

      return false;
    }

    if (!this.#formulasPlugin?.enabled || !this.#engine) {
      warn('The FormulaBuilder plugin requires the Formulas plugin to be enabled with a' +
        ' configured engine.');

      return false;
    }

    const core = config.core as CoreModule;

    this.#core = core;
    this.#appliedConfig = config;
    this.#adapter = this.#createAdapter(core);
    setFormulaBuilderAdapter(this, this.#adapter);

    if (config.showFormulaBar && isRootInstance(this.hot)) {
      const barHost = this.hot.rootDocument.createElement('div');

      barHost.className = FORMULA_BAR_CLASS;
      this.hot.getLayoutManager().register(FORMULA_BAR_SLOT_KEY, barHost, {
        side: 'top',
        weight: FORMULA_BAR_SLOT_WEIGHT,
      });
      this.#formulaBarHost = barHost;
    }

    this.#createBuilder();
    this.#cellPick = new CellPickController({
      core,
      getAdapter: () => this.#adapter,
      getActiveEditor: () => this.#activeEditor,
      getBarSelected: () => this.#barSelected,
      toHfCoords: coords => ({ row: this.#visualToHfRow(coords.row), col: this.#visualToHfCol(coords.col) }),
      emitSwitchToInline: () => this.#switchToInlineListeners.emit(),
      getHostActiveEditor: () => this.hot.getActiveEditor(),
      getScrollHolder: () => this.#adapter?.getScrollHolder() ?? null,
      getRootDocument: () => this.hot.rootDocument,
    });

    this.addHook('afterRenderer', this.#onAfterRenderer);
    this.addHook('afterSelectionEnd', this.#onAfterSelectionEnd);
    this.addHook('afterDeselect', this.#onAfterDeselect);
    this.addHook('afterSetTheme', this.#onAfterSetTheme);
    this.addHook('afterLoadData', this.#onAfterDataLoad);
    this.addHook('afterUpdateData', this.#onAfterDataLoad);
    this.addHook('afterSelection', this.#onAfterSelection);
    this.addHook('afterSelectionFocusSet', this.#onAfterSelectionFocusSet);
    this.addHook('beforeOnCellMouseDown', this.#cellPick.onBeforeMouseDown, CELL_MOUSE_HOOK_ORDER);
    this.addHook('beforeOnCellMouseOver', this.#cellPick.onBeforeMouseOver, CELL_MOUSE_HOOK_ORDER);
    this.addHook('beforeOnCellMouseOverOutside', this.#cellPick.onBeforeMouseOver, CELL_MOUSE_HOOK_ORDER);
    this.addHook('beforeColumnSort', this.#onBeforeColumnSort);
    this.addHook('afterColumnResize', this.#onAfterSizeChange);
    this.addHook('afterRowResize', this.#onAfterSizeChange);

    return true;
  }

  /**
   * Creates the grid adapter the builder drives.
   *
   * @param {CoreModule} core The `hyperformula-ui` module namespace.
   * @returns {HandsontableAdapter}
   */
  #createAdapter(core: CoreModule): HandsontableAdapter {
    return new HandsontableAdapter(
      {
        hot: this.hot,
        overlayHost: this.hot.rootElement,
        sheetName: '',
        core,
        indexMapping: {
          visualToHfRow: row => this.#visualToHfRow(row),
          visualToHfCol: col => this.#visualToHfCol(col),
          hfToVisualRow: row => this.#hfToVisualRow(row),
          hfToVisualCol: col => this.#hfToVisualCol(col),
        },
        getSheetDimensions: () => {
          const dimensions = this.#engine?.getSheetDimensions(this.#sheetId);

          return dimensions ? { rows: dimensions.height, cols: dimensions.width } : null;
        },
        readCellText: (hfRow, hfCol) => this.#readCellText(hfRow, hfCol),
      },
      this,
    );
  }

  /**
   * Constructs the `hyperformula-ui` builder against the current theme and engine sheet.
   */
  #createBuilder(): void {
    const core = this.#core;
    const config = this.#appliedConfig;

    if (!core || !config || !this.#adapter) {
      return;
    }

    const themeClassName = this.#themeClassName();

    this.#currentThemeClassName = themeClassName;
    this.#builtSheetId = this.#sheetId;
    this.#builder = new core.FormulaBuilder({
      rootEl: this.hot.rootElement,
      ...(themeClassName !== undefined && { className: themeClassName }),
      adapter: this.#adapter,
      // The Formulas plugin types its engine structurally; it is the HyperFormula instance.
      hyperformula: this.#engine as unknown as HyperFormulaLike,
      sheetId: this.#builtSheetId,
      ...(config.popups !== undefined && { popups: config.popups }),
      direction: config.direction ?? (this.hot.isRtl() ? 'rtl' : 'ltr'),
      ...(this.#formulaBarHost !== null && { formulaBarContainer: this.#formulaBarHost }),
    });
  }

  /**
   * Replaces the builder with a new one (a theme change or another engine sheet). An open edit
   * is cancelled first, while the old builder still exists - see `#teardownPluginState()`.
   */
  #rebuildBuilder(): void {
    this.#cancelOpenEdit();
    this.#builder?.destroy();
    this.#builder = null;
    this.#createBuilder();
  }

  /**
   * Cancels an open inline edit through Handsontable's editor, which closes the formula editor.
   */
  #cancelOpenEdit(): void {
    if (this.#activeEditor) {
      // Destroying the builder under an open session would leave Handsontable's editor in the
      // EDITING state over a torn-down mount, and its eventual close would commit the stale
      // original.
      this.#hostEditor()?.finishEditing?.(true);
    }
  }

  /**
   * Releases every enable-time resource.
   */
  #teardownPluginState(): void {
    this.#cancelOpenEdit();
    this.#removeInlineScrollListener?.();
    this.#removeInlineScrollListener = null;
    this.#builder?.destroy();
    this.#builder = null;

    if (this.#formulaBarHost) {
      this.hot.getLayoutManager().unregister(FORMULA_BAR_SLOT_KEY, 'top');
      this.#formulaBarHost = null;
    }

    this.#adapter?.destroy();
    this.#adapter = null;
    setFormulaBuilderAdapter(this, null);
    this.#core = null;
    this.#appliedConfig = null;
    this.#builtSheetId = null;
    this.#activeEditor = null;
    this.#cellPick?.reset();
    this.#cellPick = null;
    this.#barSelected = null;
    this.#barSelectedRange = null;
    this.#lastEmittedSelectionCoords = null;
  }

  /**
   * Re-anchors the inline editor on scroll for the duration of an edit session, once per
   * animation frame: a scroll fires many events per frame, and each re-anchor measures layout.
   */
  #bindInlineScrollReanchor(): void {
    this.#removeInlineScrollListener?.();
    this.#removeInlineScrollListener = null;

    const holder = this.#adapter?.getScrollHolder();

    if (!holder) {
      return;
    }

    const onScroll = () => {
      if (this.#reanchorQueued) {
        return;
      }

      this.#reanchorQueued = true;
      this.hot.rootWindow.requestAnimationFrame(() => {
        this.#reanchorQueued = false;

        if (this.#activeEditor !== null && !this.hot.isDestroyed) {
          this.#hostEditor()?.refreshDimensions?.(true);
        }
      });
    };

    holder.addEventListener('scroll', onScroll);
    this.#removeInlineScrollListener = () => holder.removeEventListener('scroll', onScroll);
  }

  /**
   * Removes the editing-cell mark from every cell carrying it.
   */
  #clearEditingCellMark(): void {
    for (const markedCell of this.hot.rootElement.querySelectorAll(`.${EDITING_CELL_CLASS}`)) {
      markedCell.classList.remove(EDITING_CELL_CLASS);
    }
  }
}
