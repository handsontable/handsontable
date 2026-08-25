import type {
  CellAddress,
  CellPick,
  CellPickListener,
  CellRange,
  Direction,
  GridSelection,
  GridSize,
  HeaderPick,
  HeaderPickListener,
  IGridAdapter,
  OutsideClickCommitMode,
  RangeHighlight,
  RangePick,
  RangePickListener,
  Unsubscribe,
} from '@hfe/core';
import type { PickEmitter } from '@hfe/core';
import type { HotInstance } from '../../core/types';
import type { default as VisualSelection } from '../../selection/highlight/visualSelection';
import type { CoreModule, OverlayLike, VisualHfIndexMapping } from './types';

const MAX_HF_INDEX_SCAN = 2000;

/**
 * The fallback border width (px) of a reference highlight, used when the
 * `--hfe-reference-border-width` theme variable does not resolve to a positive number.
 */
const DEFAULT_BORDER_WIDTH = 2;

/**
 * The class-name prefix of the generated per-color reference highlight classes.
 * The `-fill-N` variant also paints the translucent cell background; the
 * `-line-N` variant styles the selection border only.
 */
const REF_CLASS_PREFIX = 'ht-formula-ref';

/**
 * Mask that renders the selection border strips as dashed lines, matching the
 * dashed look of the previous absolute-rect highlight layer. The 45-degree
 * repeat produces the dash pattern on both horizontal and vertical strips.
 */
const BORDER_DASH_MASK = 'repeating-linear-gradient(45deg, #000 0 2px, transparent 2px 4px)';

/**
 * The visual (grid-space) cell range type produced by the Handsontable coordinate factory.
 */
type HotCellRange = ReturnType<HotInstance['_createCellRange']>;

/**
 * A single custom-selection request derived from a highlight: one visually contiguous
 * range with its border color and fill flag.
 */
interface SelectionSpec {
  /**
   * The visually contiguous range to select.
   */
  range: HotCellRange;
  /**
   * The border (and fill derivation) color.
   */
  color: string;
  /**
   * Whether the range cells get a translucent background fill.
   */
  fill: boolean;
}

/**
 * A contiguous run of visual indexes.
 */
interface VisualRun {
  /**
   * First visual index of the run.
   */
  start: number;
  /**
   * Last visual index of the run.
   */
  end: number;
}

/**
 * Construction options for {@link HandsontableAdapter}.
 */
export interface HandsontableAdapterOptions {
  /**
   * The Handsontable instance the adapter drives.
   */
  hot: HotInstance;
  /**
   * The element highlight overlays are appended to (the Handsontable root element).
   */
  overlayHost: HTMLElement;
  /**
   * The engine sheet name used when building cell addresses.
   */
  sheetName?: string;
  /**
   * Visual/HyperFormula index translation built from the Formulas plugin axis syncers.
   */
  indexMapping: VisualHfIndexMapping;
  /**
   * The injected `@hfe/core` module namespace.
   */
  core: CoreModule;
  /**
   * Returns the engine sheet dimensions in HyperFormula space, or `null` when unknown.
   */
  getSheetDimensions?: () => { rows: number; cols: number } | null;
}

/**
 * The surface of the FormulaBuilder plugin the adapter delegates to.
 */
export interface FormulaBuilderPluginLike {
  /**
   * Returns the currently selected (active) formula cell in visual coordinates, or `null`.
   *
   * @returns {{ row: number, col: number } | null}
   */
  getActiveFormulaCell(): { row: number; col: number } | null;
  /**
   * Subscribes to grid selection changes reported in visual coordinates.
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
  ): () => void;
  /**
   * Returns the raw cell text (formula source or stringified value) at HyperFormula coordinates.
   *
   * @param {number} row The HyperFormula row index.
   * @param {number} col The HyperFormula column index.
   * @returns {string}
   */
  getRawCellText(row: number, col: number): string;
  /**
   * Subscribes to inline edit session starts.
   *
   * @param {Function} callback Receives the editor mount element and the typed seed.
   * @returns {Function} Unsubscribe function.
   */
  onInlineEditStart(callback: (event: { mount: HTMLElement; seed: string }) => void): () => void;
  /**
   * Subscribes to editor close events.
   *
   * @param {Function} callback Invoked when the inline editor closes.
   * @returns {Function} Unsubscribe function.
   */
  onEditorClose(callback: () => void): () => void;
  /**
   * Subscribes to bar-to-inline editing handoff requests.
   *
   * @param {Function} callback Invoked when editing should switch to the inline editor.
   * @returns {Function} Unsubscribe function.
   */
  onSwitchToInline(callback: () => void): () => void;
  /**
   * Commits the inline edit with the given value, optionally moving the selection.
   *
   * @param {string} value The value to save.
   * @param {string} [direction] Optional post-commit selection step direction.
   */
  commitInlineEdit(value: string, direction?: Direction): void;
  /**
   * Cancels the inline edit and restores grid focus.
   */
  cancelInlineEdit(): void;
  /**
   * Shows or hides the inline editor overlay.
   *
   * @param {boolean} visible Whether the editor should be visible.
   */
  setInlineEditorVisible(visible: boolean): void;
  /**
   * Selects the first formula cell of the grid (viewport first, then a capped full-grid scan).
   */
  selectFirstFormulaCell(): void;
  /**
   * Selects a single cell in visual coordinates.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  selectFormulaCell(row: number, col: number): void;
  /**
   * Selects a cell range in visual coordinates.
   *
   * @param {number} startRow The visual start row index.
   * @param {number} startCol The visual start column index.
   * @param {number} endRow The visual end row index.
   * @param {number} endCol The visual end column index.
   */
  selectFormulaCells(startRow: number, startCol: number, endRow: number, endCol: number): void;
}

/**
 * Implements the `@hfe/core` `IGridAdapter` contract against a live Handsontable
 * instance: geometry and highlight rendering, visual/HyperFormula index translation,
 * pick event brokering, and editor lifecycle delegation back to the plugin.
 */
export class HandsontableAdapter implements IGridAdapter {
  /**
   * Outside-click commits are handled natively by Handsontable's editor manager.
   */
  readonly outsideClickCommitMode: OutsideClickCommitMode = 'native';
  /**
   * The Handsontable instance.
   */
  readonly #hot: HotInstance;
  /**
   * Host element for highlight overlays.
   */
  readonly #overlayHost: HTMLElement;
  /**
   * Engine sheet name used in produced cell addresses.
   */
  readonly #sheetName: string;
  /**
   * Visual/HyperFormula index translation.
   */
  readonly #mapping: VisualHfIndexMapping;
  /**
   * The plugin surface the adapter delegates editing and selection to.
   */
  readonly #plugin: FormulaBuilderPluginLike;
  /**
   * The injected `@hfe/core` module namespace.
   */
  readonly #core: CoreModule;
  /**
   * Returns the engine sheet dimensions in HyperFormula space, or `null` when unknown.
   */
  readonly #getSheetDimensions: (() => { rows: number; cols: number } | null) | null;
  /**
   * Pick event fan-out.
   */
  readonly #emitter: PickEmitter;
  /**
   * The persistent reference highlights last passed to {@link setHighlights},
   * kept for header tinting and change detection.
   */
  #persistentItems: RangeHighlight[] = [];
  /**
   * The custom-selection specs the persistent highlights currently render as.
   */
  #persistentSpecs: SelectionSpec[] = [];
  /**
   * The grid custom-selection instances owned by the persistent highlights.
   */
  readonly #persistentSelections: VisualSelection[] = [];
  /**
   * The grid custom-selection instances owned by the ephemeral (drag preview) highlight.
   */
  readonly #ephemeralSelections: VisualSelection[] = [];
  /**
   * Header elements currently tinted by whole-row/whole-column highlights.
   */
  readonly #styledHeaderEls = new Set<HTMLElement>();
  /**
   * Generated highlight class names keyed by `<fill|line>|<color>`.
   */
  readonly #refClassByKey = new Map<string, string>();
  /**
   * The adapter-owned style element holding the generated per-color fill rules.
   */
  #fillStyleEl: HTMLStyleElement | null = null;
  /**
   * The consumer theming class applied through {@link setOverlayClassName}.
   */
  #overlayClassName: string | null = null;
  /**
   * The resolved reference-highlight border width, probed lazily from the
   * `--hfe-reference-border-width` theme variable.
   */
  #borderWidth: number | null = null;
  /**
   * Column header elements tracked via the `afterGetColHeader` hook.
   */
  readonly #colHeaderEls = new Map<number, HTMLElement>();
  /**
   * Row header elements tracked via the `afterGetRowHeader` hook.
   */
  readonly #rowHeaderEls = new Map<number, HTMLElement>();
  /**
   * Bound `afterGetColHeader` listener (removed in `destroy`).
   */
  readonly #colHeaderHook: (col: number, th: HTMLElement) => void;
  /**
   * Bound `afterGetRowHeader` listener (removed in `destroy`).
   */
  readonly #rowHeaderHook: (row: number, th: HTMLElement) => void;
  /**
   * Bound `afterViewRender` listener: prunes detached header elements, then
   * re-applies the header tint ONCE per render pass. The per-header hooks only
   * record elements - repainting there would run the full header pass once per
   * header cell per render (O(headers x highlights) instead of O(highlights)).
   */
  readonly #pruneHeaderElsHook: () => void;
  /**
   * Guards double destruction.
   */
  #destroyed = false;

  /**
   * @param {HandsontableAdapterOptions} options Construction options.
   * @param {FormulaBuilderPluginLike} plugin The owning plugin surface.
   */
  constructor(options: HandsontableAdapterOptions, plugin: FormulaBuilderPluginLike) {
    this.#hot = options.hot;
    this.#overlayHost = options.overlayHost;
    this.#sheetName = options.sheetName ?? '';
    this.#mapping = options.indexMapping;
    this.#core = options.core;
    this.#getSheetDimensions = options.getSheetDimensions ?? null;
    this.#plugin = plugin;
    this.#emitter = new this.#core.PickEmitter();

    this.#colHeaderHook = (col, th) => {
      this.#colHeaderEls.set(col, th);
    };
    this.#rowHeaderHook = (row, th) => {
      this.#rowHeaderEls.set(row, th);
    };
    this.#pruneHeaderElsHook = () => {
      this.#pruneDetachedHeaderEls();
      this.#renderHeaderTints();
    };
    this.#hot.addHook('afterGetColHeader', this.#colHeaderHook);
    this.#hot.addHook('afterGetRowHeader', this.#rowHeaderHook);
    this.#hot.addHook('afterViewRender', this.#pruneHeaderElsHook);
  }

  /**
   * Returns the master overlay scroll holder element, or `null` for window-scrolled grids.
   *
   * @returns {HTMLElement | null}
   */
  getScrollHolder(): HTMLElement | null {
    const holder = (this.#hot.view.getOverlayByName('top') as OverlayLike | null)?.holder;

    return holder instanceof HTMLElement ? holder : null;
  }

  /**
   * Resolves the cell address rendered at the given viewport coordinates.
   *
   * @param {number} x The horizontal viewport coordinate.
   * @param {number} y The vertical viewport coordinate.
   * @returns {CellAddress | null}
   */
  getCellAddressAt(x: number, y: number): CellAddress | null {
    const elementAtPoint = this.#hot.rootDocument.elementFromPoint(x, y) as HTMLElement | null;

    if (!elementAtPoint) {
      return null;
    }

    const cellEl = elementAtPoint.closest('td') as HTMLElement | null;

    if (!cellEl || !this.#overlayHost.contains(cellEl)) {
      return null;
    }

    const coords = this.#hot.getCoords(cellEl);

    if (!coords || coords.row === null || coords.col === null) {
      return null;
    }

    const hfRow = this.#mapping.visualToHfRow(coords.row);
    const hfCol = this.#mapping.visualToHfCol(coords.col);

    if (hfRow < 0 || hfCol < 0) {
      return null;
    }

    return { sheet: this.#sheetName, col: hfCol, row: hfRow };
  }

  /**
   * Formats a cell address or range as an A1-style reference string.
   *
   * @param {CellAddress | CellRange} ref The reference to format.
   * @returns {string}
   */
  formatRef(ref: CellAddress | CellRange): string {
    return this.#core.formatRef(ref);
  }

  /**
   * Replaces the persistent reference highlights, rendered as the grid's own custom
   * selections. This runs on every keystroke and caret move while editing, so an
   * unchanged highlight set is detected and skipped without touching the grid, and a
   * changed one triggers only a fast (reposition-only) view render.
   *
   * @param {RangeHighlight[]} items The highlights to render.
   */
  setHighlights(items: RangeHighlight[]): void {
    const specs = this.#selectionSpecs(items, false);

    this.#persistentItems = items;

    if (this.#sameSpecs(this.#persistentSpecs, specs)) {
      this.#renderHeaderTints();

      return;
    }

    this.#persistentSpecs = specs;
    this.#replaceSelections(this.#persistentSelections, specs);
    this.#renderHeaderTints();
    this.#redraw();
  }

  /**
   * Renders the ephemeral (drag preview) highlight.
   *
   * @param {CellRange} range The range to highlight.
   * @param {string} color The highlight color.
   */
  highlightRange(range: CellRange, color: string): void {
    this.#replaceSelections(
      this.#ephemeralSelections,
      this.#selectionSpecs([{ range, color, fill: true }], true),
    );
    this.#redraw();
  }

  /**
   * Clears the ephemeral (drag preview) highlight.
   */
  clearEphemeralHighlight(): void {
    if (this.#ephemeralSelections.length === 0) {
      return;
    }

    this.#replaceSelections(this.#ephemeralSelections, []);
    this.#redraw();
  }

  /**
   * Clears every highlight.
   */
  clearHighlights(): void {
    this.#persistentItems = [];
    this.#persistentSpecs = [];
    this.#replaceSelections(this.#persistentSelections, []);
    this.#replaceSelections(this.#ephemeralSelections, []);
    this.#renderHeaderTints();
    this.#redraw();
  }

  /**
   * Applies the consumer's theming class to the grid root element so CSS variables
   * scoped under it (e.g. reference palette overrides) cascade to the highlighted
   * cells and their selection borders.
   *
   * @param {string | null} className The class name, or `null` to remove it.
   */
  setOverlayClassName(className: string | null): void {
    if (this.#overlayClassName === className) {
      return;
    }

    if (this.#overlayClassName !== null) {
      this.#overlayHost.classList.remove(this.#overlayClassName);
    }

    if (className !== null) {
      this.#overlayHost.classList.add(className);
    }

    this.#overlayClassName = className;
  }

  /**
   * Subscribes to single-cell picks.
   *
   * @param {Function} callback The pick listener.
   * @returns {Function} Unsubscribe function.
   */
  onCellPick(callback: CellPickListener): Unsubscribe {
    return this.#emitter.onCellPick(callback);
  }

  /**
   * Subscribes to range picks.
   *
   * @param {Function} callback The pick listener.
   * @returns {Function} Unsubscribe function.
   */
  onRangePick(callback: RangePickListener): Unsubscribe {
    return this.#emitter.onRangePick(callback);
  }

  /**
   * Emits a single-cell pick (called by the plugin's pick controller).
   *
   * @param {CellPick} pick The pick payload.
   */
  emitCellPick(pick: CellPick): void {
    this.#emitter.emitCell(pick);
  }

  /**
   * Emits a range pick (called by the plugin's pick controller).
   *
   * @param {RangePick} pick The pick payload.
   */
  emitRangePick(pick: RangePick): void {
    this.#emitter.emitRange(pick);
  }

  /**
   * Subscribes to header picks.
   *
   * @param {Function} callback The pick listener.
   * @returns {Function} Unsubscribe function.
   */
  onHeaderPick(callback: HeaderPickListener): Unsubscribe {
    return this.#emitter.onHeaderPick(callback);
  }

  /**
   * Emits a header pick (called by the plugin's pick controller).
   *
   * @param {HeaderPick} pick The pick payload.
   */
  emitHeaderPick(pick: HeaderPick): void {
    this.#emitter.emitHeader(pick);
  }

  /**
   * No-op: outside clicks commit natively (see `outsideClickCommitMode`).
   *
   * @returns {Function} Unsubscribe function.
   */
  onOutsideCellClick(): Unsubscribe {
    return () => {};
  }

  /**
   * No-op: reference selection needs no adapter-side arming.
   */
  enterRefSelectionMode(): void {}

  /**
   * Clears the drag preview when reference selection mode ends.
   */
  exitRefSelectionMode(): void {
    this.clearEphemeralHighlight();
  }

  /**
   * Returns the grid size in HyperFormula (sheet) space - the space of every address
   * the core consumes it against (`FormulaBar` navigation bounds, `expandHeaderSpan`
   * whole-axis refs). Falls back to the visual counts when the engine dimensions are
   * unavailable; with trimmed rows the two spaces differ.
   *
   * @returns {GridSize}
   */
  getGridSize(): GridSize {
    const sheetSize = this.#getSheetDimensions?.();

    if (sheetSize && sheetSize.rows > 0 && sheetSize.cols > 0) {
      return { rows: sheetSize.rows, cols: sheetSize.cols };
    }

    return this.#visualGridSize();
  }

  /**
   * Returns the address of the data edge from a start cell in a direction (Ctrl+Arrow semantics).
   *
   * @param {CellAddress} from The start address in HyperFormula coordinates.
   * @param {string} direction The step direction.
   * @returns {CellAddress}
   */
  getDataEdge(from: CellAddress, direction: Direction): CellAddress {
    const size = this.#visualGridSize();
    const startRow = this.#mapping.hfToVisualRow(from.row);
    const startCol = this.#mapping.hfToVisualCol(from.col);

    if (startRow < 0 || startCol < 0) {
      return from;
    }

    const visualFrom = { sheet: from.sheet, row: startRow, col: startCol };
    const edge = this.#core.findDataEdge(visualFrom, direction, size, (row, col) => {
      const value = this.#hot.getDataAtCell(row, col);

      return value !== null && value !== '' && value !== undefined;
    });
    const hfRow = this.#mapping.visualToHfRow(edge.row);
    const hfCol = this.#mapping.visualToHfCol(edge.col);

    return { sheet: from.sheet, col: hfCol, row: hfRow };
  }

  /**
   * Returns the address one step away from a start cell in a direction, clamped to the grid.
   *
   * @param {CellAddress} from The start address in HyperFormula coordinates.
   * @param {string} direction The step direction.
   * @returns {CellAddress}
   */
  stepCell(from: CellAddress, direction: Direction): CellAddress {
    const startRow = this.#mapping.hfToVisualRow(from.row);
    const startCol = this.#mapping.hfToVisualCol(from.col);

    if (startRow < 0 || startCol < 0) {
      return from;
    }

    const size = this.#visualGridSize();
    let stepped = this.#core.stepCell(
      { sheet: from.sheet, col: startCol, row: startRow },
      direction,
      size,
    );

    while (!this.#isVisualCellRenderable(stepped.row, stepped.col)) {
      const next = this.#core.stepCell(stepped, direction, size);

      if (next.row === stepped.row && next.col === stepped.col) {
        return from;
      }

      stepped = next;
    }

    const hfRow = this.#mapping.visualToHfRow(stepped.row);
    const hfCol = this.#mapping.visualToHfCol(stepped.col);

    return { sheet: from.sheet, col: hfCol, row: hfRow };
  }

  /**
   * Scrolls the viewport the minimal distance needed to reveal the given cell.
   *
   * @param {CellAddress} address The cell address in HyperFormula coordinates.
   */
  scrollCellIntoView(address: CellAddress): void {
    const visualRow = this.#mapping.hfToVisualRow(address.row);
    const visualCol = this.#mapping.hfToVisualCol(address.col);

    if (visualRow < 0 || visualCol < 0) {
      return;
    }

    const firstRow = this.#hot.getFirstFullyVisibleRow();
    const lastRow = this.#hot.getLastFullyVisibleRow();
    const firstCol = this.#hot.getFirstFullyVisibleColumn();
    const lastCol = this.#hot.getLastFullyVisibleColumn();

    const hasBounds = firstRow >= 0 && lastRow >= 0 && firstCol >= 0 && lastCol >= 0;

    if (!hasBounds) {
      this.#hot.scrollViewportTo({ row: visualRow, col: visualCol });

      return;
    }

    const target: {
      row?: number;
      col?: number;
      verticalSnap?: 'top' | 'bottom';
      horizontalSnap?: 'start' | 'end';
    } = {};

    if (visualRow > lastRow) {
      target.row = visualRow;
      target.verticalSnap = 'bottom';
    } else if (visualRow < firstRow) {
      target.row = visualRow;
      target.verticalSnap = 'top';
    }

    if (visualCol > lastCol) {
      target.col = visualCol;
      target.horizontalSnap = 'end';
    } else if (visualCol < firstCol) {
      target.col = visualCol;
      target.horizontalSnap = 'start';
    }

    if (target.row !== undefined || target.col !== undefined) {
      this.#hot.scrollViewportTo(target);
    }
  }

  /**
   * Returns the active cell address, or `null` when nothing is selected.
   *
   * @returns {CellAddress | null}
   */
  getActiveCell(): CellAddress | null {
    const selected = this.#plugin.getActiveFormulaCell();

    if (!selected) {
      return null;
    }

    return this.#toHfAddress(selected.row, selected.col);
  }

  /**
   * Subscribes to selection changes, reported in HyperFormula coordinates.
   *
   * @param {Function} callback Receives the normalized selection or `null`.
   * @returns {Function} Unsubscribe function.
   */
  onSelectionChange(callback: (selection: GridSelection | null) => void): Unsubscribe {
    return this.#plugin.onFormulaCellSelection((selected) => {
      if (!selected) {
        callback(null);

        return;
      }

      const active = this.#toHfAddress(selected.active.row, selected.active.col);
      const cornerA = this.#toHfAddress(selected.range.startRow, selected.range.startCol);
      const cornerB = this.#toHfAddress(selected.range.endRow, selected.range.endCol);

      if (!active || !cornerA || !cornerB) {
        callback(null);

        return;
      }

      callback({ active, range: this.#core.normalizeRange(cornerA, cornerB) });
    });
  }

  /**
   * Returns the raw formula text of a cell.
   *
   * @param {CellAddress} address The cell address in HyperFormula coordinates.
   * @returns {string}
   */
  getCellFormula(address: CellAddress): string {
    return this.#plugin.getRawCellText(address.row, address.col);
  }

  /**
   * Opens the inline editor on the active cell, optionally seeding it. Returns
   * `false` without opening when the active cell is read-only, since Handsontable's
   * own editor manager silently no-ops there and would otherwise leave the caller
   * believing an edit session started.
   *
   * @param {CellAddress} _address Unused; Handsontable always edits the active cell.
   * @param {string} [seed] Initial editor content.
   * @returns {boolean} Whether an editor was available to open.
   */
  beginEdit(_address: CellAddress, seed?: string): boolean {
    const highlight = this.#hot.getSelectedRangeLast()?.highlight;

    if (
      highlight !== undefined &&
      highlight.row !== null &&
      highlight.col !== null &&
      this.#hot.getCellMetaTransient(highlight.row, highlight.col).readOnly
    ) {
      return false;
    }

    const editor = this.#hot.getActiveEditor() as
      | { beginEditing(value?: string): void; enableFullEditMode?(): void }
      | undefined;

    if (!editor) {
      return false;
    }

    editor.enableFullEditMode?.();
    editor.beginEditing(seed);

    return true;
  }

  /**
   * Selects the first formula cell of the grid (the `IGridAdapter` `selectFirstCell` contract).
   */
  selectFirstCell(): void {
    this.#plugin.selectFirstFormulaCell();
  }

  /**
   * Moves the grid selection to a single cell.
   *
   * @param {CellAddress} address The target address in HyperFormula coordinates.
   */
  setActiveCell(address: CellAddress): void {
    const visualRow = this.#mapping.hfToVisualRow(address.row);
    const visualCol = this.#mapping.hfToVisualCol(address.col);

    if (visualRow < 0 || visualCol < 0) {
      return;
    }

    this.#plugin.selectFormulaCell(visualRow, visualCol);
  }

  /**
   * Moves the grid selection to a range.
   *
   * @param {CellRange} range The target range in HyperFormula coordinates.
   */
  setSelection(range: CellRange): void {
    const startRow = this.#mapping.hfToVisualRow(range.start.row);
    const startCol = this.#mapping.hfToVisualCol(range.start.col);
    const endRow = this.#mapping.hfToVisualRow(range.end.row);
    const endCol = this.#mapping.hfToVisualCol(range.end.col);

    if (startRow < 0 || startCol < 0 || endRow < 0 || endCol < 0) {
      return;
    }

    this.#plugin.selectFormulaCells(startRow, startCol, endRow, endCol);
  }

  /**
   * Subscribes to inline edit session starts.
   *
   * @param {Function} callback Receives the editor mount element and the typed seed.
   * @returns {Function} Unsubscribe function.
   */
  onInlineEditStart(callback: (mount: HTMLElement, seed: string) => void): Unsubscribe {
    return this.#plugin.onInlineEditStart(({ mount, seed }) => callback(mount, seed));
  }

  /**
   * Subscribes to inline editor close events.
   *
   * @param {Function} callback Invoked when the inline editor closes.
   * @returns {Function} Unsubscribe function.
   */
  onInlineEditClose(callback: () => void): Unsubscribe {
    return this.#plugin.onEditorClose(callback);
  }

  /**
   * Subscribes to bar-to-inline handoff requests.
   *
   * @param {Function} callback Invoked when editing should switch to the inline editor.
   * @returns {Function} Unsubscribe function.
   */
  onSwitchToInline(callback: () => void): Unsubscribe {
    return this.#plugin.onSwitchToInline(callback);
  }

  /**
   * Commits the current edit with the given value.
   *
   * @param {string} value The value to save.
   * @param {string} [direction] Optional post-commit selection step direction.
   */
  commit(value: string, direction?: Direction): void {
    this.#plugin.commitInlineEdit(value, direction);
  }

  /**
   * Cancels the current edit.
   */
  cancel(): void {
    this.#plugin.cancelInlineEdit();
  }

  /**
   * Shows or hides the inline editor overlay.
   *
   * @param {boolean} visible Whether the editor should be visible.
   */
  setInlineEditorVisible(visible: boolean): void {
    this.#plugin.setInlineEditorVisible(visible);
  }

  /**
   * Releases hooks, owned custom selections, header tints, and generated styles.
   */
  destroy(): void {
    if (this.#destroyed) {
      return;
    }

    this.#destroyed = true;
    this.#hot.removeHook('afterGetColHeader', this.#colHeaderHook);
    this.#hot.removeHook('afterGetRowHeader', this.#rowHeaderHook);
    this.#hot.removeHook('afterViewRender', this.#pruneHeaderElsHook);
    this.#persistentItems = [];
    this.#persistentSpecs = [];
    this.#replaceSelections(this.#persistentSelections, []);
    this.#replaceSelections(this.#ephemeralSelections, []);
    this.#renderHeaderTints();
    this.setOverlayClassName(null);
    this.#fillStyleEl?.remove();
    this.#fillStyleEl = null;
    this.#refClassByKey.clear();
    this.#emitter.clear();
  }

  /**
   * Whether the given visual cell is renderable (not hidden on either axis).
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {boolean}
   */
  #isVisualCellRenderable(row: number, col: number): boolean {
    return this.#hot.rowIndexMapper.getRenderableFromVisualIndex(row) !== null &&
      this.#hot.columnIndexMapper.getRenderableFromVisualIndex(col) !== null;
  }

  /**
   * Drops header elements that Handsontable discarded on its last render pass;
   * headers render only for the visible window, so stale entries would pin
   * detached `<th>` subtrees for every index ever scrolled past.
   */
  #pruneDetachedHeaderEls(): void {
    for (const [col, headerEl] of this.#colHeaderEls) {
      if (!headerEl.isConnected) {
        this.#colHeaderEls.delete(col);
      }
    }

    for (const [row, headerEl] of this.#rowHeaderEls) {
      if (!headerEl.isConnected) {
        this.#rowHeaderEls.delete(row);
      }
    }
  }

  /**
   * Re-renders the grid so the custom-selection changes reach the DOM. A fast
   * (reposition-only) draw is enough: the Walkontable selection manager re-scans
   * every selection on each draw, fast or full, on the master table and every
   * overlay clone. During grid initialization the view does not exist yet (the
   * `@hfe/core` builder resets highlights while the plugin enables), and the
   * initial draw renders the registered selections anyway.
   */
  #redraw(): void {
    this.#hot.view?.render();
  }

  /**
   * Whether two custom-selection spec sets describe the same visual result.
   *
   * @param {SelectionSpec[]} previous The currently rendered specs.
   * @param {SelectionSpec[]} next The freshly derived specs.
   * @returns {boolean}
   */
  #sameSpecs(previous: SelectionSpec[], next: SelectionSpec[]): boolean {
    if (previous.length !== next.length) {
      return false;
    }

    return previous.every((prev, index) => {
      const spec = next[index];

      return prev.color === spec.color &&
        prev.fill === spec.fill &&
        prev.range.from.row === spec.range.from.row &&
        prev.range.from.col === spec.range.from.col &&
        prev.range.to.row === spec.range.to.row &&
        prev.range.to.col === spec.range.to.col;
    });
  }

  /**
   * Derives the custom-selection specs for a highlight set, splitting each range
   * given in HyperFormula coordinates into visually contiguous runs per axis
   * (sorting/moving/hiding can fragment a source range in visual space).
   *
   * @param {RangeHighlight[]} items The highlights in HyperFormula coordinates.
   * @param {boolean} fillDefault The fill flag applied when an item does not set one.
   * @returns {SelectionSpec[]}
   */
  #selectionSpecs(items: RangeHighlight[], fillDefault: boolean): SelectionSpec[] {
    const hfToVisualRow = (row: number): number => this.#mapping.hfToVisualRow(row);
    const hfToVisualCol = (col: number): number => this.#mapping.hfToVisualCol(col);
    const specs: SelectionSpec[] = [];

    for (const item of items) {
      const rowRuns = this.#visualRuns(item.range.start.row, item.range.end.row, hfToVisualRow);
      const colRuns = this.#visualRuns(item.range.start.col, item.range.end.col, hfToVisualCol);

      for (const rowRun of rowRuns) {
        for (const colRun of colRuns) {
          const from = this.#hot._createCellCoords(rowRun.start, colRun.start);
          const to = this.#hot._createCellCoords(rowRun.end, colRun.end);

          specs.push({
            range: this.#hot._createCellRange(from, from, to),
            color: item.color,
            fill: item.fill ?? fillDefault,
          });
        }
      }
    }

    return specs;
  }

  /**
   * Replaces one owned custom-selection group with freshly created selections: the
   * previous instances are destroyed and removed from the grid's custom-selection
   * collection (foreign custom selections, e.g. the CustomBorders plugin's, are left
   * untouched), and one new selection is registered per spec.
   *
   * @param {VisualSelection[]} owned The owned selection group, mutated in place.
   * @param {SelectionSpec[]} specs The selections to create.
   */
  #replaceSelections(owned: VisualSelection[], specs: SelectionSpec[]): void {
    if (owned.length === 0 && specs.length === 0) {
      return;
    }

    const { highlight } = this.#hot.selection;
    const { customSelections } = highlight;
    const ownedSet = new Set(owned);

    for (let index = customSelections.length - 1; index >= 0; index--) {
      if (ownedSet.has(customSelections[index])) {
        customSelections[index].destroy();
        customSelections.splice(index, 1);
      }
    }

    owned.length = 0;

    for (const spec of specs) {
      highlight.addCustomSelection({
        // The custom-selection factory spreads the `border` param's own keys into
        // the selection settings, while the Border renderer reads its config from
        // `settings.border` - so the actual border config sits one level deeper
        // (the CustomBorders plugin's border model carries the same nested key).
        border: {
          border: {
            width: this.#resolveBorderWidth(),
            color: spec.color,
            cornerVisible: false,
          },
        },
        className: this.#refClassFor(spec.color, spec.fill),
        visualCellRange: spec.range,
      });
      owned.push(customSelections[customSelections.length - 1]);
    }
  }

  /**
   * Returns (creating on first sight of a color/fill pair) the generated class
   * name that styles one reference highlight. The class lands on both the
   * highlighted cells and the selection's border strips: the border rule masks
   * the strips into dashes, and the fill variant additionally layers the
   * translucent tint over the cell background (as a background image, so row
   * striping stays visible underneath, like the previous overlay rects). The
   * rules live in one adapter-owned style element, so arbitrary palette colors
   * (CSS variables included) stay expressible while the grid applies plain
   * class names.
   *
   * @param {string} color The highlight border color.
   * @param {boolean} fill Whether the cells also get the translucent tint.
   * @returns {string}
   */
  #refClassFor(color: string, fill: boolean): string {
    const key = `${fill ? 'fill' : 'line'}|${color}`;
    const existing = this.#refClassByKey.get(key);

    if (existing !== undefined) {
      return existing;
    }

    const index = this.#refClassByKey.size + 1;
    const className = `${REF_CLASS_PREFIX}-${fill ? 'fill' : 'line'}-${index}`;

    if (this.#fillStyleEl === null) {
      this.#fillStyleEl = this.#hot.rootDocument.createElement('style');
      this.#fillStyleEl.setAttribute('data-hot-formula-ref-fills', '');
      this.#hot.rootDocument.head.appendChild(this.#fillStyleEl);
    }

    let rules =
      `.handsontable .wtBorder.${className}{` +
      `-webkit-mask-image:${BORDER_DASH_MASK};mask-image:${BORDER_DASH_MASK};}`;

    if (fill) {
      const tint = this.#core.fillColor(color);

      rules += `.handsontable td.${className}{background-image:linear-gradient(${tint},${tint});}`;
    }

    this.#fillStyleEl.textContent += rules;
    this.#refClassByKey.set(key, className);

    return className;
  }

  /**
   * Resolves (and caches) the reference-highlight border width from the
   * `--hfe-reference-border-width` theme variable, falling back to
   * {@link DEFAULT_BORDER_WIDTH} when it does not resolve to a positive number.
   *
   * @returns {number}
   */
  #resolveBorderWidth(): number {
    if (this.#borderWidth === null) {
      const rawWidth = this.#hot.rootWindow
        .getComputedStyle(this.#overlayHost)
        .getPropertyValue('--hfe-reference-border-width');
      const parsedWidth = Number.parseFloat(rawWidth);

      this.#borderWidth = Number.isFinite(parsedWidth) && parsedWidth > 0 ?
        parsedWidth : DEFAULT_BORDER_WIDTH;
    }

    return this.#borderWidth;
  }

  /**
   * Repaints the header tint of whole-row/whole-column persistent highlights on the
   * tracked header elements, clearing the previously tinted ones first. Runs after
   * every view render (headers are recreated per render pass) and after every
   * persistent highlight change.
   */
  #renderHeaderTints(): void {
    for (const headerEl of this.#styledHeaderEls) {
      headerEl.style.backgroundColor = '';
    }

    this.#styledHeaderEls.clear();

    for (const item of this.#persistentItems) {
      if (item.whole === 'column') {
        this.#tintHeaderRun(item.range.start.col, item.range.end.col, item.color, 'column');
      } else if (item.whole === 'row') {
        this.#tintHeaderRun(item.range.start.row, item.range.end.row, item.color, 'row');
      }
    }
  }

  /**
   * Tints the tracked header elements of one whole-axis highlight, translating each
   * HyperFormula index of the span to its visual counterpart.
   *
   * @param {number} startHf The first HyperFormula index of the span.
   * @param {number} endHf The last HyperFormula index of the span.
   * @param {string} color The highlight color the tint derives from.
   * @param {'row' | 'column'} axis The header axis to tint.
   */
  #tintHeaderRun(startHf: number, endHf: number, color: string, axis: 'row' | 'column'): void {
    if (endHf - startHf > MAX_HF_INDEX_SCAN) {
      return;
    }

    const backgroundColor = this.#core.fillColor(color);

    for (let hfIndex = startHf; hfIndex <= endHf; hfIndex++) {
      const visualIndex = axis === 'column' ?
        this.#mapping.hfToVisualCol(hfIndex) : this.#mapping.hfToVisualRow(hfIndex);

      if (visualIndex < 0) {
        continue; // eslint-disable-line no-continue
      }

      const headerEl = axis === 'column' ?
        this.#colHeaderEls.get(visualIndex) : this.#rowHeaderEls.get(visualIndex);

      if (headerEl) {
        headerEl.style.backgroundColor = backgroundColor;
        this.#styledHeaderEls.add(headerEl);
      }
    }
  }

  /**
   * Maps an inclusive HyperFormula index span to sorted contiguous visual runs.
   * Spans wider than `MAX_HF_INDEX_SCAN` map only their endpoints as one run.
   *
   * @param {number} startHf The first HyperFormula index.
   * @param {number} endHf The last HyperFormula index.
   * @param {Function} hfToVisual Per-axis HyperFormula-to-visual translation.
   * @returns {VisualRun[]}
   */
  #visualRuns(
    startHf: number,
    endHf: number,
    hfToVisual: (hfIndex: number) => number,
  ): VisualRun[] {
    if (endHf - startHf > MAX_HF_INDEX_SCAN) {
      const startVisual = hfToVisual(startHf);
      const endVisual = hfToVisual(endHf);

      if (startVisual < 0 || endVisual < 0) {
        return [];
      }

      return [{ start: Math.min(startVisual, endVisual), end: Math.max(startVisual, endVisual) }];
    }

    const visuals: number[] = [];

    for (let hfIndex = startHf; hfIndex <= endHf; hfIndex++) {
      const visual = hfToVisual(hfIndex);

      if (visual >= 0) {
        visuals.push(visual);
      }
    }

    visuals.sort((first, second) => first - second);

    const runs: VisualRun[] = [];

    for (const visual of visuals) {
      const lastRun = runs[runs.length - 1];

      if (lastRun && visual <= lastRun.end + 1) {
        lastRun.end = Math.max(lastRun.end, visual);
      } else {
        runs.push({ start: visual, end: visual });
      }
    }

    return runs;
  }

  /**
   * Translates visual coordinates to a HyperFormula-space cell address, or `null`
   * when the mapping cannot resolve them - a `-1` component reaching `formatRef`
   * would produce a malformed reference.
   *
   * @param {number} visualRow The visual row index.
   * @param {number} visualCol The visual column index.
   * @returns {CellAddress | null}
   */
  #toHfAddress(visualRow: number, visualCol: number): CellAddress | null {
    const hfRow = this.#mapping.visualToHfRow(visualRow);
    const hfCol = this.#mapping.visualToHfCol(visualCol);

    if (hfRow < 0 || hfCol < 0) {
      return null;
    }

    return { sheet: this.#sheetName, col: hfCol, row: hfRow };
  }

  /**
   * Returns the grid size in visual (rendered-data) space, for the adapter-internal
   * navigation helpers that walk visual cells.
   *
   * @returns {GridSize}
   */
  #visualGridSize(): GridSize {
    return { rows: this.#hot.countRows(), cols: this.#hot.countCols() };
  }
}
