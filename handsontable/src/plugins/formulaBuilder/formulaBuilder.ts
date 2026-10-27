import type {
  FormulaBuilder as FormulaBuilderCore,
  FormulaEditor,
  HyperFormulaLike,
} from 'hyperformula-ui';
import { BasePlugin } from '../base';
import { warnOnce } from '../../helpers/console';
import { isObject } from '../../helpers/object';
import * as C from '../../i18n/constants';
import { isRootInstance } from '../../utils/rootInstance';
import { A11Y_DESCRIPTION, A11Y_INVALID } from '../../helpers/a11y';
import { isShadowRoot, removeAttribute, setAttribute } from '../../helpers/dom/element';
import type { HotInstance } from '../../core/types';
import type { PluginTypeMap } from '../types';
import type { CellProperties } from '../../settings';
import { GRID_SCOPE } from '../../shortcuts/contexts/constants';
import { isMacOS } from '../../helpers/browser';
import { CellPickController } from './cellPickController';
import {
  EDITING_CELL_CLASS,
  FORMULA_EDITOR_ALIAS,
  isFormulaAliasForeign,
  isFormulaEditor,
  registerFormulaEditor,
  type FormulaHostEditor,
} from './formulaCellEditor';
import { HandsontableAdapter, setFormulaBuilderAdapter } from './handsontableAdapter';
import { REQUIRED_CORE_MEMBERS } from './internalTypes';

/**
 * The `hyperformula-ui` module namespace (see `internalTypes.ts` for why it is not shared).
 */
type CoreModule = typeof import('hyperformula-ui');
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
 * The class of the text field `hyperformula-ui` edits a formula in.
 */
const EDITOR_INPUT_SELECTOR = '.hfe-editor__input';
/**
 * The attribute that carries a cell's error message to assistive technology.
 */
const CELL_DESCRIPTION_ATTRIBUTE = A11Y_DESCRIPTION('')[0];

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
 * Copies a settings value: plain objects and arrays are copied level by level, and everything else (an
 * element in `container`, a function) is kept by reference. The copy is what the plugin compares a
 * later update against, so an object the application changes in place still reads as a change.
 *
 * @param {unknown} value The value to copy.
 * @returns {unknown}
 */
function copySettingValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return (value as unknown[]).map(item => copySettingValue<unknown>(item)) as T;
  }

  if (!isObject(value)) {
    return value;
  }

  const copy: Record<string, unknown> = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    copy[key] = copySettingValue(item);
  });

  return copy as T;
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
 *   // the formula editor on every cell
 *   editor: 'formula',
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
 *   hotEditor="formula"
 *   formulas={{ engine: HyperFormula }}
 *   formulaBuilder={{ builder: FormulaBuilderModule, showFormulaBar: true }}
 * />
 * ```
 * :::
 * ::: only-for angular
 * ```ts
 * hotSettings: Handsontable.GridSettings = {
 *   editor: 'formula',
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
   * The settings the enabled plugin was built from (see `AppliedConfig`).
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
   * The live formula editor, or `null` when not editing.
   */
  #activeEditor: FormulaEditor | null = null;
  /**
   * The active cell the formula bar edits, in visual coordinates.
   */
  #barSelected: { row: number; col: number } | null = null;
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
   * The suggestions host set through `attachSuggestionsHost()`, re-applied to every rebuilt builder.
   */
  #suggestionsHost: HTMLElement | string | null = null;
  /**
   * The function help host set through `attachFnHelpHost()`, re-applied to every rebuilt builder.
   */
  #fnHelpHost: HTMLElement | string | null = null;
  /**
   * Removes the listener the Formulas plugin calls before it detaches its engine.
   */
  #removeEngineDetachListener: (() => void) | null = null;
  /**
   * The error description the plugin wrote on each cell element. The grid recycles cell elements, and
   * a renderer may describe a recycled one before the plugin runs, so a description is removed only
   * while it is still the text the plugin wrote, never an application's.
   */
  readonly #describedCells = new WeakMap<HTMLElement, string>();
  /**
   * Whether the grid's init has finished (`afterInit` ran).
   */
  #initDone = false;
  /**
   * Whether the last enable attempt failed because the Formulas plugin was off, during the init.
   */
  #formulasWarningPending = false;
  /**
   * Whether a theme or language change arrived during an edit, so the builder is rebuilt when it closes.
   */
  #rebuildAfterEdit = false;

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
    this.hot.addHookOnce('afterInit', this.#onAfterInit);
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

    if (isFormulaAliasForeign()) {
      warnOnce(this.hot, 'formulaBuilder.editorAlias', 'An editor is already registered under the "formula"' +
        ' alias, so cells with `editor: \'formula\'` use that editor and not the one of the FormulaBuilder' +
        ' plugin. Register your own editor under another name to use the formula editor.');
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
   * nothing the plugin was built from keeps the built plugin (see `AppliedConfig` in the source).
   */
  updatePlugin(): void {
    if (this.enabled && this.#builder !== null && this.#isConfigUnchanged()) {
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

    this.#barSelectionListeners.clear();
    this.#editorStartListeners.clear();
    this.#editorCloseListeners.clear();
    this.#switchToInlineListeners.clear();
    this.#suggestionsHost = null;
    this.#fnHelpHost = null;
    super.destroy();
  }

  /**
   * Re-parents the suggestions popup into a custom host element.
   *
   * @param {HTMLElement | string} container The host element or a CSS selector.
   */
  attachSuggestionsHost(container: HTMLElement | string): void {
    this.#builder?.attachSuggestionsHost(container);
    this.#suggestionsHost = container;
  }

  /**
   * Restores the suggestions popup to its default anchored placement.
   */
  detachSuggestionsHost(): void {
    this.#builder?.detachSuggestionsHost();
    this.#suggestionsHost = null;
  }

  /**
   * Re-parents the function help popup into a custom host element.
   *
   * @param {HTMLElement | string} container The host element or a CSS selector.
   */
  attachFnHelpHost(container: HTMLElement | string): void {
    this.#builder?.attachFnHelpHost(container);
    this.#fnHelpHost = container;
  }

  /**
   * Restores the function help popup to its default anchored placement.
   */
  detachFnHelpHost(): void {
    this.#builder?.detachFnHelpHost();
    this.#fnHelpHost = null;
  }

  /**
   * Mounts the formula editor into the inline wrapper (called by the editor shim).
   *
   * @private
   * @param {HTMLElement} mount The wrapper element.
   * @param {string} seed The initial editor content.
   * @returns {boolean} Whether the formula editor was mounted. Without a builder (its creation failed,
   * or the Formulas plugin detached the engine) the shim mounts a plain textarea instead.
   */
  handleInlineEditStart(mount: HTMLElement, seed: string): boolean {
    if (this.#builder === null) {
      return false;
    }

    this.#editorStartListeners.emit({ mount, seed });
    this.#markEditorInputAsGridInput(mount);

    if (!this.#activeEditor) {
      if (!this.#builder.hasFormulaBar) {
        this.setInlineEditorVisible(true);
      }

      this.#activeEditor = this.#builder.editor;
    }

    this.#bindInlineScrollReanchor();

    return true;
  }

  /**
   * Saves the given value through Handsontable's editor manager and, with a direction, moves the
   * selection the way the grid's own editors do: Enter and Shift+Enter (`down`, `up`) follow
   * `enterMoves`, Tab and Shift+Tab (`right`, `left`) follow `tabMoves`, and both move within a
   * selected range instead of collapsing it. Nothing moves when the save was rejected (a validator
   * with `allowInvalid: false`), because the editor then stays open on the invalid value.
   *
   * @private
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

    editor.finishEditing?.(false, false, (dataSaved?: boolean) => {
      if (dataSaved === false || this.hot.isDestroyed) {
        return;
      }

      this.#moveSelectionAfterCommit(direction);
    });
  }

  /**
   * Saves the given value into every cell of the selected ranges through Handsontable's editor, the
   * way Ctrl/Cmd+Enter does in the grid's own editors. The ranges stay selected, and after a successful
   * save the focus moves within them by `enterMoves`, as it does there.
   *
   * @private
   * @param {string} value The value to save.
   */
  commitInlineEditToSelection(value: string): void {
    const editor = this.#hostEditor();

    if (!editor) {
      return;
    }

    editor.setValue?.(value);
    editor.finishEditing?.(false, true, (dataSaved?: boolean) => {
      if (dataSaved === false || this.hot.isDestroyed) {
        return;
      }

      // `editorCloseAndSaveByEnter` moves the focus within the filled range by `enterMoves`, with the
      // chord's event, which `enterMoves` may read.
      const KeyboardEventClass = this.hot.rootWindow.KeyboardEvent;
      const isMac = isMacOS();
      const event = new KeyboardEventClass('keydown', { key: 'Enter', ctrlKey: !isMac, metaKey: isMac });

      this.hot._getEditorManager().moveSelectionAfterEnter(event);
    });
  }

  /**
   * Cancels the edit and restores the original value. The selection is left as it is, ranges and
   * layers included, the way Escape leaves it in the grid's own editors; only the focus goes back
   * to the grid.
   *
   * @private
   */
  cancelInlineEdit(): void {
    this.#hostEditor()?.finishEditing?.(true);

    if (this.hot.isDestroyed) {
      return;
    }

    const focusManager = this.hot.getFocusManager();

    this.hot.listen();
    focusManager.focusOnHighlightedCell();
    focusManager.refocusToEditorTextarea();
  }

  /**
   * Tears the inline edit session down (called by the editor shim on close).
   *
   * @private
   */
  handleInlineEditClose(): void {
    this.#removeInlineScrollListener?.();
    this.#removeInlineScrollListener = null;
    this.#builder?.closeEditor();
    this.#activeEditor = null;
    this.#cellPick?.reset();
    this.#clearEditingCellMark();
    this.#editorCloseListeners.emit();
    // The selection hooks are ignored while an edit is open, and an edit with a validator closes a
    // microtask after the deselect or the `selectCell()` that ended it, so the bar would keep
    // showing the old cell. Re-read the selection now that the edit is over.
    this.#emitBarSelection();

    if (this.#rebuildAfterEdit) {
      // A task later: the close runs inside the builder's own commit handler, which is still on the
      // stack, and destroying the builder under it would leave that handler working on a torn-down
      // editor. A new edit opened by then defers the rebuild again.
      this.hot._registerTimeout(this.#rebuildDeferred, 0);
    }
  }

  /**
   * Returns the live formula editor, or `null` when not editing.
   *
   * @private
   * @returns {FormulaEditorHandle | null}
   */
  getActiveEditor(): FormulaEditorHandle | null {
    return this.#activeEditor;
  }

  /**
   * Subscribes to inline edit session starts.
   *
   * @private
   * @param {Function} callback Receives the editor mount element and the typed seed.
   * @returns {Function} Unsubscribe function.
   */
  onInlineEditStart(callback: (event: { mount: HTMLElement; seed: string }) => void): () => void {
    return this.#editorStartListeners.add(callback);
  }

  /**
   * Subscribes to bar-to-inline handoff requests.
   *
   * @private
   * @param {Function} callback Invoked when editing should switch to the inline editor.
   * @returns {Function} Unsubscribe function.
   */
  onSwitchToInline(callback: () => void): () => void {
    return this.#switchToInlineListeners.add(callback);
  }

  /**
   * Returns the active formula cell in visual coordinates, or `null`.
   *
   * @private
   * @returns {{ row: number, col: number } | null}
   */
  getActiveFormulaCell(): { row: number; col: number } | null {
    return this.#barSelected ? { ...this.#barSelected } : null;
  }

  /**
   * Subscribes to formula-cell selection changes in visual coordinates.
   *
   * @private
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
   *
   * @private
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
   * @private
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  selectFormulaCell(row: number, col: number): void {
    this.hot.selectCell(row, col);
  }

  /**
   * Selects a cell range in visual coordinates.
   *
   * @private
   * @param {number} startRow The visual start row index.
   * @param {number} startCol The visual start column index.
   * @param {number} endRow The visual end row index.
   * @param {number} endCol The visual end column index.
   */
  selectFormulaCells(startRow: number, startCol: number, endRow: number, endCol: number): void {
    this.hot.selectCells([[startRow, startCol, endRow, endCol]]);
  }

  /**
   * Subscribes to editor close events.
   *
   * @private
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
   * Shows or hides the inline editor overlay (formula bar handoff).
   *
   * @private
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
    const sheetId = isFormulaCell ? this.#readableSheetId() : null;

    if (hfRow < 0 || hfCol < 0 || sheetId === null) {
      // The grid recycles cell elements, so one that showed an error for another cell keeps the
      // mark until something clears it.
      if (cellEl.hasAttribute(CELL_ERROR_ATTRIBUTE)) {
        this.#builder?.markCell(cellEl, null);
        this.#keepValidatorInvalid(cellEl, cellProperties);
      }

      this.#describeCellError(cellEl);

      return;
    }

    const cellValue = this.#engine?.getCellValue({ sheet: sheetId, row: hfRow, col: hfCol });

    this.#builder?.markCell(cellEl, cellValue);

    // The grid writes its ARIA attributes only under `ariaTags`, and so does the plugin.
    if (!this.hot.getSettings().ariaTags) {
      cellEl.removeAttribute('aria-invalid');
    }

    this.#keepValidatorInvalid(cellEl, cellProperties);
    this.#describeCellError(cellEl);
  };

  /**
   * Puts back the `aria-invalid` the base renderer wrote for a cell a validator rejected. Clearing an
   * error mark removes `aria-invalid` whoever wrote it, so without this a rejected cell kept its
   * `htInvalid` look while a screen reader reported it as valid.
   *
   * @param {HTMLTableCellElement} cellEl The rendered cell element.
   * @param {CellProperties} cellProperties The cell meta.
   */
  #keepValidatorInvalid(cellEl: HTMLTableCellElement, cellProperties: CellProperties): void {
    if (cellProperties.valid === false && this.hot.getSettings().ariaTags) {
      setAttribute(cellEl, [A11Y_INVALID()]);
    }
  }

  /**
   * Gives an error cell its message as an accessible description, and removes the one the plugin gave
   * a recycled cell that no longer shows an error. The error popup also points the cell at its message
   * (`aria-errormessage`), but only while the popup is open, and screen reader support for that
   * attribute is uneven, so a user who lands on the cell would otherwise hear only the error code.
   *
   * @param {HTMLTableCellElement} cellEl The rendered cell element.
   */
  #describeCellError(cellEl: HTMLTableCellElement): void {
    const message = cellEl.getAttribute(CELL_ERROR_ATTRIBUTE);

    if (message && this.hot.getSettings().ariaTags) {
      setAttribute(cellEl, [A11Y_DESCRIPTION(message)]);
      this.#describedCells.set(cellEl, message);

      return;
    }

    const written = this.#describedCells.get(cellEl);

    if (written === undefined) {
      return;
    }

    if (cellEl.getAttribute(CELL_DESCRIPTION_ATTRIBUTE) === written) {
      removeAttribute(cellEl, CELL_DESCRIPTION_ATTRIBUTE);
    }

    this.#describedCells.delete(cellEl);
  }

  /**
   * `afterSelectionEnd` hook listener - moves the tracked selection after a
   * completed selection gesture.
   *
   * @param {number} anchorRow The anchor visual row index.
   * @param {number} anchorCol The anchor visual column index.
   * @param {number} focusRow The focus visual row index.
   * @param {number} focusCol The focus visual column index.
   */
  #onAfterSelectionEnd = (): void => {
    if (this.#isEditing()) {
      return;
    }

    this.#emitBarSelection();
  };

  /**
   * `afterDeselect` hook listener - clears the bar selection (and the dedupe key).
   */
  #onAfterDeselect = (): void => {
    if (this.#isEditing()) {
      return;
    }

    this.#clearBarSelection();
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
   * Warns that the plugin cannot enable without the Formulas plugin, once per grid.
   */
  #warnFormulasMissing(): void {
    warnOnce(this.hot, 'formulaBuilder.formulas', 'The FormulaBuilder plugin requires the Formulas' +
      ' plugin to be enabled with a configured engine.');
  }

  /**
   * `afterInit` hook listener - shows the Formulas warning an enable attempt held back during the
   * init, if the plugin is still off now that the init applied every setting.
   */
  #onAfterInit = (): void => {
    this.#initDone = true;

    if (this.#formulasWarningPending && !this.enabled) {
      this.#warnFormulasMissing();
    }

    this.#formulasWarningPending = false;
  };

  /**
   * `afterSetTheme` hook listener - rebuilds the builder when the theme class actually
   * changed, because the builder applies its theming class once, at construction.
   */
  #onAfterSetTheme = (): void => {
    if (this.#builder === null || this.#themeClassName() === this.#currentThemeClassName) {
      return;
    }

    this.#rebuildOrDefer();
  };

  /**
   * `afterLanguageChange` hook listener - rebuilds the builder, because it takes its phrases once,
   * at construction.
   */
  #onAfterLanguageChange = (): void => {
    if (this.#builder !== null) {
      this.#rebuildOrDefer();
    }
  };

  /**
   * Runs the rebuild a theme or language change held back during an edit.
   */
  #rebuildDeferred = (): void => {
    if (!this.#rebuildAfterEdit || this.#activeEditor || this.#builder === null) {
      return;
    }

    this.#rebuildAfterEdit = false;
    this.#rebuildBuilder();
  };

  /**
   * Rebuilds the builder for a new theme or language, or, while an edit is open, once it closes.
   * A rebuild cancels the open edit, and an application that follows `prefers-color-scheme` can swap
   * the theme while the user types, so the typed formula would be lost.
   */
  #rebuildOrDefer(): void {
    if (this.#activeEditor) {
      this.#rebuildAfterEdit = true;

      return;
    }

    this.#rebuildBuilder();
  }

  /**
   * Called by the Formulas plugin right before it detaches its engine (it is turned off, its engine
   * is replaced, or the grid is destroyed). The builder subscribes to the engine's events, so it is
   * destroyed here, while the engine still works: when the Formulas plugin built the engine itself it
   * destroys it right after, and a builder torn down later throws from its engine unsubscribe and
   * leaks its popup portal and live region. The plugin stays enabled without a builder until its
   * next update rebuilds or disables it; the `formula` editor opens a plain textarea meanwhile.
   */
  #onEngineDetach = (): void => {
    this.#destroyBuilder();
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
  #onAfterSelection = (): void => {
    if (this.#isEditing()) {
      this.#followStructuralShift();

      return;
    }

    this.#emitBarSelection();
  };

  /**
   * `afterSelectionFocusSet` hook listener - re-emits the bar selection when only
   * the highlight moved (Tab/Shift+Tab within a range).
   */
  #onAfterSelectionFocusSet = (): void => {
    if (this.#isEditing()) {
      return;
    }

    this.#emitBarSelection();
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
   * Moves the bar selection with the edited cell when the grid shifts the selection during an edit:
   * an `alter()` the application makes inserts or removes rows or columns before the cell, and the
   * grid moves its selection under the `shift` source. Nothing is emitted, because the edit is still
   * open; `handleInlineEditClose()` reads the selection again and reports it once the edit closes.
   * Without this, the pick controller compares a press with the cell's old coordinates. Only the
   * active cell follows: the range is read from the grid when the bar selection is emitted, and
   * under a header selection the grid keeps `from` and moves only `to`, so moving a stored range by
   * the highlight's offset would describe a range the grid does not hold.
   */
  #followStructuralShift(): void {
    const highlight = this.hot.getSelectedRangeActive()?.highlight;

    if (
      this.#barSelected === null || this.hot.selection.getSelectionSource() !== 'shift' ||
      !highlight || highlight.row === null || highlight.col === null
    ) {
      return;
    }

    this.#barSelected = { row: highlight.row, col: highlight.col };
  }

  /**
   * Clears the bar selection (and the dedupe key) and tells the listeners.
   */
  #clearBarSelection(): void {
    if (this.#lastEmittedSelectionCoords === null && this.#barSelected === null) {
      return;
    }

    this.#lastEmittedSelectionCoords = null;
    this.#barSelected = null;
    this.#barSelectionListeners.emit(null);
  }

  /**
   * Emits the bar selection from the grid's ACTIVE selection layer (deduped on anchor + focus +
   * active together). The focused cell is not always on the last layer (Tab and Enter wrap between
   * layers with `autoWrapRow`/`autoWrapCol`), and in a range it is not always the anchor, so the
   * layer comes from `getSelectedRangeActive()` and whether the bar edits a formula is decided by
   * the highlighted cell. Nothing is selected: the bar is cleared.
   */
  #emitBarSelection(): void {
    const range = this.hot.getSelectedRangeActive();
    const { from, to, highlight } = range ?? {};

    if (
      !range || from?.row === null || from?.col === null || to?.row === null || to?.col === null ||
      highlight?.row === null || highlight?.col === null
    ) {
      this.#clearBarSelection();

      return;
    }

    // A row or column header selection starts the range on the header (-1); the bar reports cells.
    const anchorRow = Math.max(from!.row, 0);
    const anchorCol = Math.max(from!.col, 0);
    const focusRow = Math.max(to!.row, 0);
    const focusCol = Math.max(to!.col, 0);
    const activeRow = highlight!.row;
    const activeCol = highlight!.col;
    const formulaCell = this.#isFormulaCell(activeRow, activeCol);
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
      return;
    }

    this.#lastEmittedSelectionCoords = { anchorRow, anchorCol, focusRow, focusCol, activeRow, activeCol };
    this.#barSelected = formulaCell ? { row: activeRow, col: activeCol } : null;

    const barSelectedRange = formulaCell ?
      {
        startRow: Math.min(anchorRow, focusRow),
        startCol: Math.min(anchorCol, focusCol),
        endRow: Math.max(anchorRow, focusRow),
        endCol: Math.max(anchorCol, focusCol),
      } :
      null;

    this.#barSelectionListeners.emit(
      this.#barSelected && barSelectedRange ?
        { active: this.#barSelected, range: barSelectedRange } :
        null,
    );
  }

  /**
   * Moves the selection after a commit in a direction, through the same code the grid runs for the
   * key: `EditorManager#moveSelectionAfterEnter()` for Enter and Shift+Enter, and the Tab commands for
   * Tab and Shift+Tab. A synthetic keyboard event carries the key, because `enterMoves` and
   * `tabMoves` may be functions of the event.
   *
   * @param {FormulaBuilderStepDirection} direction The step direction.
   */
  #moveSelectionAfterCommit(direction: FormulaBuilderStepDirection): void {
    const KeyboardEventClass = this.hot.rootWindow.KeyboardEvent;

    if (direction === 'up' || direction === 'down') {
      const event = new KeyboardEventClass('keydown', { key: 'Enter', shiftKey: direction === 'up' });

      this.hot._getEditorManager().moveSelectionAfterEnter(event);

      return;
    }

    // The package commits `right` on Tab and `left` on Shift+Tab in either layout direction. The
    // grid's own editors forward Tab to the grid context, which runs the move (applying `tabMoves`)
    // between the two halves of its Tab-navigation pair; that pair drops the selection when Tab has
    // nowhere to go, so the next Tab leaves the grid. Running only the move kept the selection.
    const keys = direction === 'left' ? ['Shift', 'Tab'] : ['Tab'];
    const event = new KeyboardEventClass('keydown', { key: 'Tab', shiftKey: direction === 'left' });
    const shortcuts = this.hot.getShortcutManager().getContext(GRID_SCOPE)?.getShortcuts(keys) ?? [];

    for (let index = 0; index < shortcuts.length; index++) {
      const { runOnlyIf, callback } = shortcuts[index];

      if (runOnlyIf?.(event) === true && callback(event, keys) === false) {
        break;
      }
    }
  }

  /**
   * Marks the formula editor's text field as one of the grid's own inputs (`data-hot-input`), the way
   * the text editor marks its `TEXTAREA`. After a selection change the focus manager moves the focus to
   * the selected cell unless the focused element is a grid input, so without the mark a row inserted or
   * removed while a formula is edited took the focus out of the open editor. The editor is shared, and
   * mounted in the cell or in the formula bar, so both places are looked in.
   *
   * @param {HTMLElement} mount The inline editor mount.
   */
  #markEditorInputAsGridInput(mount: HTMLElement): void {
    [mount, this.#formulaBarHost].forEach((root) => {
      root?.querySelectorAll<HTMLElement>(EDITOR_INPUT_SELECTOR).forEach((input) => {
        input.setAttribute('data-hot-input', '');
      });
    });
  }

  /**
   * Returns the visual columns a column header covers: a nested-header group spans several, every
   * other header one. Read through the NestedHeaders plugin, the way its own click selects the span.
   *
   * @param {{ row: number, col: number }} coords The header coordinates (a negative row).
   * @returns {{ start: number, end: number }}
   */
  #columnHeaderSpan(coords: { row: number; col: number }): { start: number; end: number } {
    const nestedHeaders = this.hot.getPlugin('nestedHeaders');
    const node = nestedHeaders?.enabled ? nestedHeaders._getHeaderTreeNodeDataByCoords(coords) : null;

    if (!node || typeof node.columnIndex !== 'number' || typeof node.origColspan !== 'number') {
      return { start: coords.col, end: coords.col };
    }

    return { start: node.columnIndex, end: node.columnIndex + node.origColspan - 1 };
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
   * The engine sheet id the plugin may read from, or `null` while no sheet is bound or after an
   * application removed the bound sheet from a shared engine. The Formulas plugin keeps the old id
   * then, and the engine throws `NoSheetWithIdError` for every read through it.
   *
   * @returns {number | null}
   */
  #readableSheetId(): number | null {
    const sheetId = this.#formulasPlugin?.sheetId ?? null;

    if (sheetId === null || this.#engine?.getSheetName(sheetId) === undefined) {
      return null;
    }

    return sheetId;
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
    const sheetId = this.#readableSheetId();

    if (!engine || !this.#core || sheetId === null || hfRow < 0 || hfCol < 0) {
      return '';
    }

    return this.#core.readCellText(
      engine as unknown as Parameters<CoreModule['readCellText']>[0],
      { sheet: sheetId, row: hfRow, col: hfCol },
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
      warnOnce(this.hot, 'formulaBuilder.showFormulaBar', 'The `showFormulaBar` option of the' +
        ' FormulaBuilder plugin takes a boolean. The formula bar is not shown.');
    }

    let validDirection: FormulaBuilderLayoutDirection | undefined;

    if (direction === 'ltr' || direction === 'rtl') {
      validDirection = direction;
    } else if (direction !== undefined) {
      warnOnce(this.hot, 'formulaBuilder.direction', 'The `direction` option of the FormulaBuilder plugin' +
        ' takes `\'ltr\'` or `\'rtl\'`. The grid\'s layout direction is used instead.');
    }

    return {
      core: object.builder,
      showFormulaBar: showFormulaBar === true,
      direction: validDirection,
      popups: isObject(popups) ? copySettingValue(popups) : undefined,
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

    // `BasePlugin` calls `enablePlugin()` again on every settings update while the plugin stays
    // disabled, and the React and Angular wrappers update on every render, so each warning is shown
    // once per grid.
    if (missingMembers.length > 0) {
      warnOnce(this.hot, 'formulaBuilder.builder', 'The `builder` key of the FormulaBuilder settings must' +
        ' be the `hyperformula-ui` module namespace (`import * as FormulaBuilderModule from' +
        ` 'hyperformula-ui'\`). It is missing ${missingMembers.map(name => `\`${name}\``).join(', ')}.` +
        ' The plugin stays disabled.');

      return false;
    }

    this.#formulasWarningPending = false;

    if (!this.#formulasPlugin?.enabled || !this.#engine) {
      // During the init the Formulas plugin may still be enabled later, from settings a plugin applies
      // in `beforeInit` (SheetsBar's per-sheet `formulas`), so the warning waits for `afterInit`.
      if (this.#initDone) {
        this.#warnFormulasMissing();
      } else {
        this.#formulasWarningPending = true;
      }

      return false;
    }

    const core = config.core as CoreModule;

    this.#core = core;
    this.#appliedConfig = config;
    this.#removeEngineDetachListener = this.#formulasPlugin?.addEngineDetachListener(this.#onEngineDetach) ?? null;
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
      getColumnHeaderSpan: coords => this.#columnHeaderSpan(coords),
    });

    this.addHook('afterRenderer', this.#onAfterRenderer);
    this.addHook('afterSelectionEnd', this.#onAfterSelectionEnd);
    this.addHook('afterDeselect', this.#onAfterDeselect);
    this.addHook('afterSetTheme', this.#onAfterSetTheme);
    this.addHook('afterLanguageChange', this.#onAfterLanguageChange);
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
          const sheetId = this.#readableSheetId();
          const dimensions = sheetId === null ? null : this.#engine?.getSheetDimensions(sheetId);

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

    if (!core || !config || !this.#adapter || !this.#engine) {
      return;
    }

    const themeClassName = this.#themeClassName();
    const popups = this.#resolvePopupContainers(config.popups);
    const shadowRoot = this.#gridShadowRoot();

    this.#currentThemeClassName = themeClassName;
    this.#builtSheetId = this.#sheetId;

    try {
      this.#builder = new core.FormulaBuilder({
        rootEl: this.hot.rootElement,
        // The grid may live in an iframe: selectors resolve there and the styles go there.
        rootDocument: this.hot.rootDocument,
        // In a shadow root the popups and the live region stay in it, so the editor's ARIA
        // references resolve and the styles reach them.
        ...(shadowRoot !== null && { portalParent: shadowRoot }),
        ...(themeClassName !== undefined && { className: themeClassName }),
        adapter: this.#adapter,
        // The Formulas plugin types its engine structurally; it is the HyperFormula instance.
        hyperformula: this.#engine as unknown as HyperFormulaLike,
        sheetId: this.#builtSheetId,
        ...(popups !== undefined && { popups }),
        direction: config.direction ?? (this.hot.isRtl() ? 'rtl' : 'ltr'),
        ...(this.#formulaBarHost !== null && { formulaBarContainer: this.#formulaBarHost }),
        phrases: this.#phrases(),
      });
    } catch (error) {
      // A rebuild runs from a hook (`afterSetTheme`, `afterLoadData`), where a throw would escape into
      // the application's call. The `formula` editor opens a plain textarea while there is no builder.
      warnOnce(this.hot, 'formulaBuilder.create', 'The FormulaBuilder plugin could not create the formula' +
        ' editor, so formula cells open a plain text editor.', error);
      this.#builder = null;

      return;
    }

    this.#reattachPopupHosts();
  }

  /**
   * Returns the formula editor's accessible names, hints and announcements in the grid's language.
   *
   * @returns {object}
   */
  #phrases() {
    const phrase = (key: string, args?: unknown): string => this.hot.getTranslatedPhrase(key, args);

    return {
      formulaEditor: phrase(C.FORMULA_BUILDER_EDITOR),
      formulaInput: phrase(C.FORMULA_BUILDER_INPUT),
      cellAddress: phrase(C.FORMULA_BUILDER_CELL_ADDRESS),
      formulaSuggestions: phrase(C.FORMULA_BUILDER_SUGGESTIONS),
      acceptSuggestionHint: phrase(C.FORMULA_BUILDER_ACCEPT_HINT),
      navigateSuggestionsHint: phrase(C.FORMULA_BUILDER_NAVIGATE_HINT),
      functionHelp: phrase(C.FORMULA_BUILDER_FUNCTION_HELP),
      functionHelpFor: (name: string) => phrase(C.FORMULA_BUILDER_FUNCTION_HELP_FOR, { name }),
      functionExample: phrase(C.FORMULA_BUILDER_FUNCTION_EXAMPLE),
      functionDescription: phrase(C.FORMULA_BUILDER_FUNCTION_DESCRIPTION),
      optionalArgument: phrase(C.FORMULA_BUILDER_OPTIONAL_ARGUMENT),
      repeatableArgument: phrase(C.FORMULA_BUILDER_REPEATABLE_ARGUMENT),
      learnMore: phrase(C.FORMULA_BUILDER_LEARN_MORE),
      close: phrase(C.FORMULA_BUILDER_CLOSE),
      invalidCellAddress: (text: string) => phrase(C.FORMULA_BUILDER_INVALID_ADDRESS, { text }),
      cellUnavailable: (text: string) => phrase(C.FORMULA_BUILDER_CELL_UNAVAILABLE, { text }),
      cellError: (cell: string, message: string) => phrase(C.FORMULA_BUILDER_CELL_ERROR, { cell, message }),
      // One key per form: the dictionary cannot pick a plural form and fill in a variable at once.
      dependentCellErrors: (count: number) =>
        phrase(count === 1 ? C.FORMULA_BUILDER_DEPENDENT_ERROR : C.FORMULA_BUILDER_DEPENDENT_ERRORS, { count }),
    };
  }

  /**
   * Returns the shadow root the grid is rendered in, or `null` when it is in a document.
   *
   * @returns {ShadowRoot | null}
   */
  #gridShadowRoot(): ShadowRoot | null {
    const rootNode = this.hot.rootElement.getRootNode();

    return isShadowRoot(rootNode) ? rootNode : null;
  }

  /**
   * Returns the `popups` options with every `container` selector that matches no element dropped, so
   * that popup floats instead. `hyperformula-ui` throws from its constructor for such a selector, and a
   * framework can unmount the container between two renders.
   *
   * @param {FormulaBuilderPopupsOptions | undefined} popups The `popups` setting.
   * @returns {FormulaBuilderPopupsOptions | undefined}
   */
  #resolvePopupContainers(
    popups: FormulaBuilderPopupsOptions | undefined,
  ): FormulaBuilderPopupsOptions | undefined {
    if (popups === undefined) {
      return undefined;
    }

    const resolved = copySettingValue(popups);

    (['suggestions', 'fnHelp'] as const).forEach((popupName) => {
      const popup = resolved[popupName];

      if (popup !== undefined && !this.#isContainerAvailable(popup.container)) {
        warnOnce(this.hot, `formulaBuilder.popups.${popupName}.container`, `The \`popups.${popupName}` +
          '.container` option of the FormulaBuilder plugin names no element in the grid\'s document or' +
          ' shadow root, so the popup floats next to the editor instead.');
        delete popup.container;
      }
    });

    return resolved;
  }

  /**
   * Whether a popup `container` value (an element or a CSS selector, looked up in the grid's shadow root
   * and in its document) can be mounted into. An omitted container is available: the popup floats.
   *
   * @param {HTMLElement | string | undefined} container The container value.
   * @returns {boolean}
   */
  #isContainerAvailable(container: HTMLElement | string | undefined): boolean {
    if (typeof container !== 'string') {
      return true;
    }

    try {
      // The package looks a selector up in the grid's shadow root first, then in the document.
      return (this.#gridShadowRoot() ?? this.hot.rootDocument).querySelector(container) !== null ||
        this.hot.rootDocument.querySelector(container) !== null;
    } catch {
      // An invalid selector.
      return false;
    }
  }

  /**
   * Re-applies the hosts set through `attachSuggestionsHost()` and `attachFnHelpHost()` to a newly
   * built builder, so a theme change or a sheet change keeps them.
   */
  #reattachPopupHosts(): void {
    const builder = this.#builder;

    if (builder === null) {
      return;
    }

    const reattach = (
      name: string,
      host: HTMLElement | string | null,
      attach: (target: HTMLElement | string) => void,
    ) => {
      if (host === null) {
        return;
      }

      if (!this.#isContainerAvailable(host)) {
        warnOnce(this.hot, `formulaBuilder.${name}`, `The host passed to \`${name}()\` names no element in` +
          ' the document anymore, so the popup floats next to the editor instead.');

        return;
      }

      attach(host);
    };

    reattach('attachSuggestionsHost', this.#suggestionsHost, host => builder.attachSuggestionsHost(host));
    reattach('attachFnHelpHost', this.#fnHelpHost, host => builder.attachFnHelpHost(host));
  }

  /**
   * Replaces the builder with a new one (a theme change or another engine sheet). An open edit
   * is cancelled first, while the old builder still exists - see `#teardownPluginState()`.
   */
  #rebuildBuilder(): void {
    // Any rebuild takes the current theme and language, so one held back for an edit is done too.
    this.#rebuildAfterEdit = false;
    this.#destroyBuilder();
    this.#createBuilder();
  }

  /**
   * Cancels an open edit and destroys the builder, if there is one.
   */
  #destroyBuilder(): void {
    this.#cancelOpenEdit();
    this.#builder?.destroy();
    this.#builder = null;
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
    this.#rebuildAfterEdit = false;
    this.#clearCellErrorMarks();
    this.#removeEngineDetachListener?.();
    this.#removeEngineDetachListener = null;
    this.#destroyBuilder();
    this.#removeInlineScrollListener?.();
    this.#removeInlineScrollListener = null;

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
    this.#lastEmittedSelectionCoords = null;
  }

  /**
   * Takes the error marks and the descriptions the plugin wrote off every rendered cell. The grid's
   * render resets classes and ARIA attributes but not `data-*`, and once the plugin is off no
   * `afterRenderer` clears the mark, so a cell element reused on scroll would carry it to other cells.
   */
  #clearCellErrorMarks(): void {
    this.hot.rootElement?.querySelectorAll<HTMLTableCellElement>(`td[${CELL_ERROR_ATTRIBUTE}]`)
      .forEach((cellEl) => {
        cellEl.removeAttribute(CELL_ERROR_ATTRIBUTE);
        this.#describeCellError(cellEl);
      });
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
