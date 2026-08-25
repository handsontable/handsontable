import type {
  Direction,
  EventManager,
  EventScope,
  FormulaBuilder as FormulaBuilderCore,
  FormulaEditor,
  HyperFormulaLike,
  Unsubscribe,
} from '@hfe/core';
import { BasePlugin } from '../base';
import { warn } from '../../helpers/console';
import { throwWithCause } from '../../helpers/errors';
import { isRootInstance } from '../../utils/rootInstance';
import { CellPickController } from './cellPickController';
import { EDITING_CELL_CLASS, isFormulaEditor, registerFormulaEditor } from './formulaCellEditor';
import { HandsontableAdapter } from './handsontableAdapter';
import type { CoreModule, FormulaBuilderPluginSettings } from './types';

export const PLUGIN_KEY = 'formulaBuilder';
export const PLUGIN_PRIORITY = 270;

const FORMULA_BAR_SLOT_KEY = 'formulaBuilder';
const FALLBACK_SCAN_CELL_CAP = 10000;
const FORMULA_BAR_SLOT_WEIGHT = 100;
const FORMULA_BAR_CLASS = 'ht-formula-builder__formula-bar';

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
 * The Formulas plugin surface consumed by this plugin.
 */
interface FormulasPluginLike {
  enabled: boolean;
  engine: HyperFormulaLike & {
    getCellValue(addr: { sheet: number; row: number; col: number }): unknown;
    getCellFormula(addr: { sheet: number; row: number; col: number }): string | undefined;
    getCellSerialized(addr: { sheet: number; row: number; col: number }): unknown;
    getSheetDimensions?(sheetId: number): { width: number; height: number };
  } | null;
  sheetId: number | null;
  rowAxisSyncer: {
    getHfIndexFromVisualIndex(visualIndex: number): number;
    getVisualIndexFromHfIndex(hfIndex: number): number;
  } | null;
  columnAxisSyncer: {
    getHfIndexFromVisualIndex(visualIndex: number): number;
    getVisualIndexFromHfIndex(hfIndex: number): number;
  } | null;
}

/**
 * Handsontable's active editor surface consumed by this plugin.
 */
interface HotEditorLike {
  row?: number;
  col?: number;
  _hfeHidden?: boolean;
  refreshDimensions?(force?: boolean): void;
  setValue?(value: string): void;
  finishEditing?(restoreOriginal?: boolean, ctrlDown?: boolean, callback?: () => void): void;
}

/**
 * Index mapper surface used for hidden-row/column-aware directional commit.
 */
interface IndexMapperLike {
  getRenderableFromVisualIndex(visualIndex: number): number | null;
  getVisualFromRenderableIndex(renderableIndex: number): number | null;
  getRenderableIndexesLength(): number;
}

/**
 * @plugin FormulaBuilder
 * @class FormulaBuilder
 *
 * @description
 * This plugin provides a spreadsheet-grade formula editing experience on top of the
 * {@link Formulas} plugin: a formula bar, an inline formula cell editor with colored
 * references, cell/range/header reference picking by mouse or keyboard, and formula
 * error indicators rendered in the grid.
 *
 * The plugin requires the {@link Formulas} plugin to be enabled with a configured engine,
 * and the `@hfe/core` module to be passed in via the `builder` setting.
 *
 * Reference highlights render through the grid's own selection machinery (custom
 * selections), so they follow frozen panes, scrolling, and hidden or reordered rows
 * and columns natively, and the plugin leaves the grid root element's inline styles
 * untouched.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * import * as FormulaBuilderModule from '@hfe/core';
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
   * Returns the setting keys that, when present in an `updateSettings` config object, trigger
   * the plugin update. `formulas` is included because the plugin borrows the engine from the
   * Formulas plugin at enable time - a Formulas reconfiguration must re-run the enable cycle
   * so the plugin never keeps a stale engine reference.
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY, 'formulas'];
  }

  /**
   * The injected `@hfe/core` module namespace (set while enabled).
   */
  #core: CoreModule | null = null;
  /**
   * The grid adapter (created lazily, destroyed on disable).
   */
  #adapter: HandsontableAdapter | null = null;
  /**
   * The core `FormulaBuilder` facade instance (set while enabled).
   */
  #builder: FormulaBuilderCore | null = null;
  /**
   * The engine borrowed from the Formulas plugin (set while enabled).
   */
  #engine: NonNullable<FormulasPluginLike['engine']> | null = null;
  /**
   * The Formulas plugin instance, resolved once per enable cycle. The instance is
   * stable for the Handsontable lifetime; its syncer/sheetId FIELDS are read per
   * call so a Formulas re-enable never leaves stale references here.
   */
  #formulas: FormulasPluginLike | null = null;
  /**
   * The formula bar host element registered in the top layout slot, or `null`.
   */
  #formulaBarHost: HTMLElement | null = null;
  /**
   * The last selection reported through `onSelection`.
   */
  #selected = { row: 0, col: 0 };
  /**
   * The live core formula editor, or `null` when not editing.
   */
  #activeEditor: FormulaEditor | null = null;
  /**
   * The active cell the formula bar edits, in visual coordinates.
   */
  #barSelected: { row: number; col: number } | null = null;
  /**
   * The selected range the formula bar tracks, in visual coordinates.
   */
  #barSelectedRange: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null = null;
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
   * Whether the DragToScroll plugin was suspended for a reference drag.
   */
  #dragToScrollSuspended = false;
  /**
   * Click/drag reference picking controller (created on enable).
   */
  #cellPick: CellPickController | null = null;
  /**
   * Bar selection listeners.
   */
  readonly #barSelectionListeners = new ListenerSet<
    [
      {
        active: { row: number; col: number };
        range: { startRow: number; startCol: number; endRow: number; endCol: number };
      } | null,
    ]
  >();
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
   * The plugin's DOM event manager (created from the injected core module on enable).
   */
  #events: EventManager | null = null;
  /**
   * Scroll listener scope active while an inline edit session runs.
   */
  #inlineScrollScope: EventScope | null = null;
  /**
   * The theme class name captured at enable time (compared in `afterSetTheme`).
   */
  #currentThemeClassName: string | undefined;

  /**
   * `afterRenderer` hook listener - marks the edited cell and renders error indicators.
   *
   * @param {HTMLTableCellElement} cellEl The rendered cell element.
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  #onAfterRenderer = (cellEl: HTMLTableCellElement, row: number, col: number): void => {
    if (this.#activeEditor) {
      const hostEditor = this.#hostEditor();

      if (
        hostEditor &&
        !hostEditor._hfeHidden &&
        hostEditor.row === row &&
        hostEditor.col === col
      ) {
        cellEl.classList.add(EDITING_CELL_CLASS);
      }
    }

    if (row < 0 || col < 0 || !this.#engine || !this.#isFormulaCell(row, col)) {
      return;
    }

    const hfRow = this.#visualToHfRow(row);
    const hfCol = this.#visualToHfCol(col);

    if (hfRow < 0 || hfCol < 0) {
      return;
    }

    const cellValue = this.#engine.getCellValue({ sheet: this.#sheetId, row: hfRow, col: hfCol });

    this.#builder?.markCell(cellEl, cellValue);
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

    const formulaCell = this.#emitBarSelection(anchorRow, anchorCol, focusRow, focusCol);

    if (!formulaCell) {
      return;
    }

    this.setSelected(anchorRow, anchorCol);
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
   * `afterSetTheme` hook listener - re-initializes the plugin when the theme
   * class actually changed.
   */
  #onAfterSetTheme = (): void => {
    if (this.#builder === null) {
      return;
    }

    if (this.#themeClassName() === this.#currentThemeClassName) {
      return;
    }

    this.updatePlugin();
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
    if (this.#activeEditor === null) {
      return;
    }

    this.#hostEditor()?.refreshDimensions?.(true);
  };

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
    } catch (error) {
      this.#teardownPluginState();

      throw error;
    }

    if (!setUpSucceeded) {
      this.#teardownPluginState();

      return;
    }

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin(): void {
    this.#teardownPluginState();
    super.disablePlugin();
  }

  /**
   * Update plugin state after Handsontable settings update.
   */
  updatePlugin(): void {
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

    this.#events?.disposeAll();
    this.#events = null;
    this.#selectionListeners.clear();
    this.#barSelectionListeners.clear();
    this.#editorStartListeners.clear();
    this.#editorCloseListeners.clear();
    this.#switchToInlineListeners.clear();
    super.destroy();
  }

  /**
   * The plugin's DOM event manager, `null` while the plugin is disabled.
   *
   * @returns {EventManager | null}
   */
  get events(): EventManager | null {
    return this.#events;
  }

  /**
   * The grid adapter backing the core editor.
   *
   * @returns {HandsontableAdapter}
   */
  get adapter(): HandsontableAdapter {
    return this.#ensureAdapter();
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
   * Mounts the core formula editor into the inline wrapper (called by the editor shim).
   *
   * @param {HTMLElement} mount The wrapper element.
   * @param {string} seed The initial editor content.
   */
  handleInlineEditStart(mount: HTMLElement, seed: string): void {
    this.#editorStartListeners.emit({ mount, seed });

    if (!this.#activeEditor && this.#engine) {
      if (!this.#builder) {
        throwWithCause('FormulaBuilder: builder not initialized');
      }

      if (!this.#builder.hasFormulaBar) {
        this.setInlineEditorVisible(true);
      }

      this.#activeEditor = this.#builder.editor;
    }

    this.#bindInlineScrollReanchor();
  }

  /**
   * Binds (or clears) the live core editor reference.
   *
   * @param {FormulaEditor | null} editor The editor, or `null` to unbind.
   */
  bindInlineEditor(editor: FormulaEditor | null): void {
    this.#activeEditor = editor;

    if (editor) {
      this.#adapter?.enterRefSelectionMode();
    }
  }

  /**
   * Saves the given value through Handsontable's editor manager, optionally
   * moving the selection one (renderable) step in a direction.
   *
   * @param {string} value The value to save.
   * @param {string} [direction] Optional post-commit selection step direction.
   */
  commitInlineEdit(value: string, direction?: Direction): void {
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
      if (!selected) {
        return;
      }

      const row = selected[0];
      const col = selected[1];

      if (row === undefined || col === undefined || row < 0 || col < 0) {
        return;
      }

      let rowDelta = 0;
      let colDelta = 0;

      if (direction === 'up') {
        rowDelta = -1;
      } else if (direction === 'down') {
        rowDelta = 1;
      } else if (direction === 'left') {
        colDelta = -1;
      } else if (direction === 'right') {
        colDelta = 1;
      }

      const mappers = this.hot as unknown as {
        rowIndexMapper?: IndexMapperLike;
        columnIndexMapper?: IndexMapperLike;
      };

      this.hot.selectCell(
        this.#stepVisualIndex(mappers.rowIndexMapper, row, rowDelta, this.hot.countRows()),
        this.#stepVisualIndex(mappers.columnIndexMapper, col, colDelta, this.hot.countCols()),
      );
    });
  }

  /**
   * Steps a visual index by one renderable position so hidden rows/columns are skipped.
   *
   * @param {IndexMapperLike | undefined} mapper The axis index mapper.
   * @param {number} visualIndex The current visual index.
   * @param {number} delta The step delta (-1, 0, or 1).
   * @param {number} totalCount The axis length.
   * @returns {number}
   */
  #stepVisualIndex(
    mapper: IndexMapperLike | undefined,
    visualIndex: number,
    delta: number,
    totalCount: number,
  ): number {
    if (delta === 0) {
      return visualIndex;
    }

    const clamped = Math.min(Math.max(visualIndex + delta, 0), totalCount - 1);

    if (!mapper) {
      return clamped;
    }

    const renderable = mapper.getRenderableFromVisualIndex(visualIndex);

    if (renderable === null) {
      return clamped;
    }

    const lastRenderable = mapper.getRenderableIndexesLength() - 1;
    const nextRenderable = Math.min(Math.max(renderable + delta, 0), lastRenderable);

    return mapper.getVisualFromRenderableIndex(nextRenderable) ?? visualIndex;
  }

  /**
   * Cancels the edit, restores the original value, and re-selects the cell so
   * DOM focus returns to the grid.
   */
  cancelInlineEdit(): void {
    this.#hostEditor()?.finishEditing?.(true);

    const selected = this.hot.getSelectedLast();

    if (!selected) {
      return;
    }

    const row = selected[0];
    const col = selected[1];

    if (row === undefined || col === undefined || row < 0 || col < 0) {
      return;
    }

    this.hot.selectCell(row, col);
  }

  /**
   * Tears the inline edit session down (called by the editor shim on close).
   */
  handleInlineEditClose(): void {
    this.#inlineScrollScope?.dispose();
    this.#inlineScrollScope = null;
    this.#builder?.closeEditor();
    this.#activeEditor = null;
    this.#cellPick?.reset();
    this.#clearEditingCellMark();
    this.#editorCloseListeners.emit();
  }

  /**
   * Returns the live core formula editor, or `null` when not editing.
   *
   * @returns {FormulaEditor | null}
   */
  getActiveEditor(): FormulaEditor | null {
    return this.#activeEditor;
  }

  /**
   * Subscribes to inline edit session starts.
   *
   * @param {Function} callback Receives the editor mount element and the typed seed.
   * @returns {Function} Unsubscribe function.
   */
  onInlineEditStart(callback: (event: { mount: HTMLElement; seed: string }) => void): Unsubscribe {
    return this.#editorStartListeners.add(callback);
  }

  /**
   * Subscribes to bar-to-inline handoff requests.
   *
   * @param {Function} callback Invoked when editing should switch to the inline editor.
   * @returns {Function} Unsubscribe function.
   */
  onSwitchToInline(callback: () => void): Unsubscribe {
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
  onFormulaCellSelection(
    callback: (
      selection: {
        active: { row: number; col: number };
        range: { startRow: number; startCol: number; endRow: number; endCol: number };
      } | null,
    ) => void,
  ): Unsubscribe {
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
  onSelection(callback: (selection: { row: number; col: number }) => void): Unsubscribe {
    return this.#selectionListeners.add(callback);
  }

  /**
   * Subscribes to editor close events.
   *
   * @param {Function} callback Invoked when the inline editor closes.
   * @returns {Function} Unsubscribe function.
   */
  onEditorClose(callback: () => void): Unsubscribe {
    return this.#editorCloseListeners.add(callback);
  }

  /**
   * Returns the raw cell text (formula source or stringified value) at
   * HyperFormula coordinates.
   *
   * @param {number} row The HyperFormula row index.
   * @param {number} col The HyperFormula column index.
   * @returns {string}
   */
  getRawCellText(row: number, col: number): string {
    if (!this.#engine || !this.#core) {
      return '';
    }

    return this.#core.readCellText(this.#engine, { sheet: this.#sheetId, row, col });
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

    editor._hfeHidden = !visible;
    editor.refreshDimensions?.();

    if (!visible) {
      this.#clearEditingCellMark();
    }
  }

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
    const formulaCell =
      anchorRow >= 0 && anchorCol >= 0 && this.#isFormulaCell(anchorRow, anchorCol);
    const highlight = this.hot.getSelectedRangeLast()?.highlight;
    const activeRow = highlight?.row ?? anchorRow;
    const activeCol = highlight?.col ?? anchorCol;
    const coords = { anchorRow, anchorCol, focusRow, focusCol, activeRow, activeCol };
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

    this.#lastEmittedSelectionCoords = coords;

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
   * Returns the Formulas plugin instance.
   *
   * @returns {FormulasPluginLike | undefined}
   */
  #formulasPlugin(): FormulasPluginLike | undefined {
    if (!this.#formulas) {
      this.#formulas = (this.hot.getPlugin('formulas') as unknown as FormulasPluginLike) ?? null;
    }

    return this.#formulas ?? undefined;
  }

  /**
   * Returns Handsontable's active editor.
   *
   * @returns {HotEditorLike | undefined}
   */
  #hostEditor(): HotEditorLike | undefined {
    return this.hot.getActiveEditor() as HotEditorLike | undefined;
  }

  /**
   * The engine sheet id backing this grid.
   *
   * @returns {number}
   */
  get #sheetId(): number {
    return this.#formulasPlugin()?.sheetId ?? 0;
  }

  /**
   * Maps a visual row index to its HyperFormula row index.
   *
   * @param {number} visualRow The visual row index.
   * @returns {number}
   */
  #visualToHfRow(visualRow: number): number {
    return this.#formulasPlugin()?.rowAxisSyncer?.getHfIndexFromVisualIndex(visualRow) ?? -1;
  }

  /**
   * Maps a visual column index to its HyperFormula column index.
   *
   * @param {number} visualCol The visual column index.
   * @returns {number}
   */
  #visualToHfCol(visualCol: number): number {
    return this.#formulasPlugin()?.columnAxisSyncer?.getHfIndexFromVisualIndex(visualCol) ?? -1;
  }

  /**
   * Maps a HyperFormula row index to its visual row index.
   *
   * @param {number} hfRow The HyperFormula row index.
   * @returns {number}
   */
  #hfToVisualRow(hfRow: number): number {
    return this.#formulasPlugin()?.rowAxisSyncer?.getVisualIndexFromHfIndex(hfRow) ?? -1;
  }

  /**
   * Maps a HyperFormula column index to its visual column index.
   *
   * @param {number} hfCol The HyperFormula column index.
   * @returns {number}
   */
  #hfToVisualCol(hfCol: number): number {
    return this.#formulasPlugin()?.columnAxisSyncer?.getVisualIndexFromHfIndex(hfCol) ?? -1;
  }

  /**
   * Maps visual coordinates to HyperFormula coordinates.
   *
   * @param {{ row: number, col: number }} coords The visual coordinates.
   * @returns {{ row: number, col: number }}
   */
  #toHfCoords(coords: { row: number; col: number }): { row: number; col: number } {
    return { row: this.#visualToHfRow(coords.row), col: this.#visualToHfCol(coords.col) };
  }

  /**
   * Suspends the DragToScroll plugin for the duration of a reference drag.
   */
  #suspendDragToScroll(): void {
    const dragToScroll = this.hot.getPlugin('dragToScroll');

    if (dragToScroll?.enabled) {
      dragToScroll.disablePlugin();
      dragToScroll.unlisten();
      this.#dragToScrollSuspended = true;
    }
  }

  /**
   * Resumes the DragToScroll plugin after a reference drag ends.
   */
  #resumeDragToScroll(): void {
    if (this.#dragToScrollSuspended) {
      this.hot.getPlugin('dragToScroll')?.enablePlugin();
      this.#dragToScrollSuspended = false;
    }
  }

  /**
   * Returns the adapter, creating it on first use.
   *
   * @returns {HandsontableAdapter}
   */
  #ensureAdapter(): HandsontableAdapter {
    if (this.#adapter) {
      return this.#adapter;
    }

    if (!this.#engine || !this.#core) {
      throwWithCause('FormulaBuilder is disabled');
    }

    this.#adapter = new HandsontableAdapter(
      {
        hot: this.hot,
        overlayHost: this.hot.rootElement,
        sheetName: '',
        core: this.#core,
        indexMapping: {
          visualToHfRow: row => this.#visualToHfRow(row),
          visualToHfCol: col => this.#visualToHfCol(col),
          hfToVisualRow: row => this.#hfToVisualRow(row),
          hfToVisualCol: col => this.#hfToVisualCol(col),
        },
        getSheetDimensions: () => {
          const dimensions = this.#engine?.getSheetDimensions?.(this.#sheetId);

          return dimensions ? { rows: dimensions.height, cols: dimensions.width } : null;
        },
      },
      this,
    );

    return this.#adapter;
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
   * Releases every enable-time resource.
   */
  #teardownPluginState(): void {
    if (this.#activeEditor) {
      // Close the host editor while the core editor still exists - destroying the
      // builder under an open session leaves Handsontable's editor in EDITING state
      // over a torn-down mount, and its eventual close commits the stale original.
      this.#hostEditor()?.finishEditing?.(true);
    }

    this.#events?.disposeAll();
    this.#events = null;
    this.#inlineScrollScope = null;
    this.#builder?.destroy();
    this.#builder = null;

    if (this.#formulaBarHost) {
      this.hot.getLayoutManager().unregister(FORMULA_BAR_SLOT_KEY, 'top');
      this.#formulaBarHost = null;
    }

    this.#adapter?.destroy();
    this.#adapter = null;
    this.#engine = null;
    this.#formulas = null;
    this.#activeEditor = null;
    this.#cellPick?.reset();
    this.#cellPick = null;
    this.#barSelected = null;
    this.#barSelectedRange = null;
    this.#lastEmittedSelectionCoords = null;
  }

  /**
   * Validates dependencies and builds the enable-time object graph.
   *
   * @returns {boolean} Whether the plugin set up successfully.
   */
  #setUpPlugin(): boolean {
    const pluginSettings = this.hot.getSettings()[PLUGIN_KEY] as
      | boolean
      | FormulaBuilderPluginSettings
      | undefined;
    const core = typeof pluginSettings === 'object' ?
      pluginSettings.builder as CoreModule | undefined :
      undefined;

    if (!core || typeof core.FormulaBuilder !== 'function') {
      warn('Missing the required `builder` key in the FormulaBuilder settings. Please fill it' +
        ' with the module namespace of the formula-builder package (its `FormulaBuilder` class' +
        ' and utilities).');

      return false;
    }

    const formulas = this.#formulasPlugin();

    if (!formulas?.enabled || !formulas.engine) {
      warn('The FormulaBuilder plugin requires the Formulas plugin to be enabled with a' +
        ' configured engine.');

      return false;
    }

    this.#core = core;
    this.#engine = formulas.engine;
    this.#events = new core.EventManager();

    const rootEl = this.hot.rootElement;
    const themeClassName = this.#themeClassName();

    this.#currentThemeClassName = themeClassName;

    const adapter = this.#ensureAdapter();
    const popups = typeof pluginSettings === 'object' ? pluginSettings.popups : undefined;
    const showFormulaBar =
      typeof pluginSettings === 'object' && pluginSettings.showFormulaBar === true;
    const direction = (typeof pluginSettings === 'object' ? pluginSettings.direction : undefined) ??
      (this.hot.isRtl() ? 'rtl' : 'ltr');

    if (showFormulaBar && !this.#formulaBarHost && isRootInstance(this.hot)) {
      const barHost = this.hot.rootDocument.createElement('div');

      barHost.className = FORMULA_BAR_CLASS;
      this.hot.getLayoutManager().register(FORMULA_BAR_SLOT_KEY, barHost, {
        side: 'top',
        weight: FORMULA_BAR_SLOT_WEIGHT,
      });
      this.#formulaBarHost = barHost;
    }

    this.#builder = new core.FormulaBuilder({
      rootEl,
      ...(themeClassName !== undefined && { className: themeClassName }),
      adapter,
      hyperformula: this.#engine,
      sheetId: this.#sheetId,
      ...(popups !== undefined && { popups }),
      ...(direction !== undefined && { direction }),
      ...(this.#formulaBarHost !== null && { formulaBarContainer: this.#formulaBarHost }),
    });

    registerFormulaEditor();

    this.#cellPick = new CellPickController({
      core,
      getAdapter: () => this.#adapter,
      getActiveEditor: () => this.#activeEditor,
      getBarSelected: () => this.#barSelected,
      toHfCoords: coords => this.#toHfCoords(coords),
      emitSwitchToInline: () => this.#switchToInlineListeners.emit(),
      getHostActiveEditor: () => this.hot.getActiveEditor(),
      getScrollHolder: () => this.#adapter?.getScrollHolder() ?? null,
      getRootDocument: () => this.hot.rootDocument,
      suspendDragToScroll: () => this.#suspendDragToScroll(),
      resumeDragToScroll: () => this.#resumeDragToScroll(),
    });

    const hostScope = this.#events.createScope('host-bindings');

    hostScope.listen(this.hot.rootDocument, 'mouseup', this.#cellPick.onDocMouseUp);
    hostScope.listen(this.hot.rootDocument, 'mousemove', this.#cellPick.onDocMouseMove);
    hostScope.listen(this.hot.rootDocument, 'scroll', this.#cellPick.onDocScroll, { capture: true });
    hostScope.listen(this.hot.rootWindow, 'blur', this.#cellPick.onWindowBlur);
    hostScope.activate();

    this.addHook('afterRenderer', this.#onAfterRenderer);
    this.addHook('afterSelectionEnd', this.#onAfterSelectionEnd);
    this.addHook('afterDeselect', this.#onAfterDeselect);
    this.addHook('afterSetTheme', this.#onAfterSetTheme);
    this.addHook('afterSelection', this.#onAfterSelection);
    this.addHook('afterSelectionFocusSet', this.#onAfterSelectionFocusSet);
    this.addHook('beforeOnCellMouseDown', this.#cellPick.onBeforeMouseDown);
    this.addHook('beforeOnCellMouseOver', this.#cellPick.onBeforeMouseOver);
    this.addHook('beforeOnCellMouseOverOutside', this.#cellPick.onBeforeMouseOverOutside);
    this.addHook('beforeColumnSort', this.#onBeforeColumnSort);
    this.addHook('afterColumnResize', this.#onAfterSizeChange);
    this.addHook('afterRowResize', this.#onAfterSizeChange);

    return true;
  }

  /**
   * Re-anchors the inline editor on scroll for the duration of an edit session.
   */
  #bindInlineScrollReanchor(): void {
    this.#inlineScrollScope?.dispose();
    this.#inlineScrollScope = null;

    const holder = this.#adapter?.getScrollHolder();

    if (!holder || !this.#events) {
      return;
    }

    const scope = this.#events.createScope('inline-scroll-reanchor');

    scope.listen(holder, 'scroll', () => {
      this.#hostEditor()?.refreshDimensions?.(true);
    });
    scope.activate();
    this.#inlineScrollScope = scope;
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
