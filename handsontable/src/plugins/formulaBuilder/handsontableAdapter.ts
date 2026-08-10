import type {
  CellAddress,
  CellPick,
  CellPickListener,
  CellRange,
  Direction,
  GridGeometry,
  GridSelection,
  GridSize,
  HeaderPick,
  HeaderPickListener,
  IGridAdapter,
  OutsideClickCommitMode,
  RangeHighlight,
  RangePick,
  RangePickListener,
  RangeRect,
  Unsubscribe,
} from '@hfe/core';
import type { HighlightLayer, PickEmitter } from '@hfe/core';
import type { HotInstance } from '../../core/types';
import type { CoreModule, OverlayLike, OverlayName, VisualHfIndexMapping } from './types';

const MAX_HF_INDEX_SCAN = 2000;

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
   * Highlight overlay renderer.
   */
  readonly #layer: HighlightLayer;
  /**
   * Restores the overlay host `position` style changed at construction.
   */
  readonly #restorePosition: () => void;
  /**
   * The overlay host `overflow` style value captured at construction.
   */
  readonly #prevOverflow: string;
  /**
   * Cache of per-overlay z-index probes.
   */
  readonly #overlayZIndexCache = new Map<OverlayName, number>();
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
    this.#restorePosition = this.#core.ensureRelativePosition(this.#overlayHost);
    this.#prevOverflow = this.#overlayHost.style.overflow;
    this.#overlayHost.style.overflow = 'hidden';
    this.#layer = new this.#core.HighlightLayer(this.#geometry());

    this.#colHeaderHook = (col, th) => {
      this.#colHeaderEls.set(col, th);
    };
    this.#rowHeaderHook = (row, th) => {
      this.#rowHeaderEls.set(row, th);
    };
    this.#pruneHeaderElsHook = () => {
      this.#pruneDetachedHeaderEls();
      this.#layer.rerenderHeaders();
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
   * Replaces the persistent reference highlights. Deliberately does NOT trigger a
   * host render: the highlight layer paints its own overlay elements and header
   * tint directly, and this runs on every keystroke and caret move while editing.
   *
   * @param {RangeHighlight[]} items The highlights to render.
   */
  setHighlights(items: RangeHighlight[]): void {
    this.#layer.setHighlights(items);
  }

  /**
   * Renders the ephemeral (drag preview) highlight.
   *
   * @param {CellRange} range The range to highlight.
   * @param {string} color The highlight color.
   */
  highlightRange(range: CellRange, color: string): void {
    this.#layer.setEphemeral(range, color);
  }

  /**
   * Clears the ephemeral (drag preview) highlight.
   */
  clearEphemeralHighlight(): void {
    this.#layer.setEphemeral(null);
  }

  /**
   * Clears every highlight.
   */
  clearHighlights(): void {
    this.#layer.clear();
  }

  /**
   * Sets an extra class name on the highlight overlay container.
   *
   * @param {string | null} className The class name, or `null` to remove it.
   */
  setOverlayClassName(className: string | null): void {
    this.#layer.setClassName(className);
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
    this.#layer.setEphemeral(null);
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
   * Releases hooks, overlays, and restored host styles.
   */
  destroy(): void {
    if (this.#destroyed) {
      return;
    }

    this.#destroyed = true;
    this.#hot.removeHook('afterGetColHeader', this.#colHeaderHook);
    this.#hot.removeHook('afterGetRowHeader', this.#rowHeaderHook);
    this.#hot.removeHook('afterViewRender', this.#pruneHeaderElsHook);
    this.#layer.destroy();
    this.#emitter.clear();
    this.#restorePosition();
    this.#overlayHost.style.overflow = this.#prevOverflow;
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
   * Builds the geometry contract consumed by the highlight layer.
   *
   * @returns {GridGeometry}
   */
  #geometry(): GridGeometry {
    return {
      getOverlayHost: () => this.#overlayHost,
      getRangeRects: range => this.#rangeRects(range),
      getViewportClip: () => this.#viewportClip(),
      onViewportChange: callback => this.#subscribeViewport(callback),
      getColHeaderEl: col => this.#colHeaderEls.get(col) ?? null,
      getRowHeaderEl: row => this.#rowHeaderEls.get(row) ?? null,
    };
  }

  /**
   * Subscribes a callback to every hook that signals a viewport change.
   *
   * @param {Function} callback The viewport change listener.
   * @returns {Function} Unsubscribe function.
   */
  #subscribeViewport(callback: () => void): Unsubscribe {
    const hookNames = [
      'afterViewRender',
      'afterScrollVertically',
      'afterScrollHorizontally',
      'afterRefreshDimensions',
    ] as const;
    const handler = (): void => callback();

    for (const name of hookNames) {
      this.#hot.addHook(name, handler);
    }

    return () => {
      for (const name of hookNames) {
        this.#hot.removeHook(name, handler);
      }
    };
  }

  /**
   * Computes the highlight rectangles for a range given in HyperFormula coordinates,
   * splitting it into contiguous visual runs per axis (sorting/moving/hiding can
   * fragment a source range in visual space).
   *
   * @param {CellRange} range The range in HyperFormula coordinates.
   * @returns {RangeRect[]}
   */
  #rangeRects(range: CellRange): RangeRect[] {
    const hfToVisualRow = (row: number): number => this.#mapping.hfToVisualRow(row);
    const hfToVisualCol = (col: number): number => this.#mapping.hfToVisualCol(col);
    const rowRuns = this.#visualRuns(range.start.row, range.end.row, hfToVisualRow);
    const colRuns = this.#visualRuns(range.start.col, range.end.col, hfToVisualCol);
    const rects: RangeRect[] = [];

    for (const rowRun of rowRuns) {
      for (const colRun of colRuns) {
        rects.push(
          ...this.#visualRangeRects({
            start: { ...range.start, row: rowRun.start, col: colRun.start },
            end: { ...range.end, row: rowRun.end, col: colRun.end },
          }),
        );
      }
    }

    return rects;
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
   * Computes the rectangles for a visually contiguous range, split by frozen panes.
   *
   * @param {CellRange} range The range in visual coordinates.
   * @returns {RangeRect[]}
   */
  #visualRangeRects(range: CellRange): RangeRect[] {
    const settings = this.#hot.getSettings();
    const frozenRows = settings.fixedRowsTop ?? 0;
    const frozenCols = settings.fixedColumnsStart ?? 0;
    const frozenRowsBottom = settings.fixedRowsBottom ?? 0;
    const totalRows = this.#hot.countRows();
    const bottomStart = totalRows - frozenRowsBottom;
    const rects: RangeRect[] = [];

    for (const piece of this.#core.splitRangeByFrozen(
      range,
      frozenRows,
      frozenCols,
      frozenRowsBottom,
      totalRows,
    )) {
      const frozenTop = piece.start.row < frozenRows;
      const frozenBottom = frozenRowsBottom > 0 && piece.start.row >= bottomStart;
      const frozenCol = piece.start.col < frozenCols;
      const rect = this.#pieceRect(piece, frozenTop, frozenBottom, frozenCol);

      if (rect) {
        rects.push(rect);
      }
    }

    return rects;
  }

  /**
   * Probes (and caches) the stacking z-index to paint highlights above an overlay.
   *
   * @param {string} overlayName The overlay to probe.
   * @returns {number | undefined}
   */
  #overlayZIndex(overlayName: OverlayName): number | undefined {
    const cached = this.#overlayZIndexCache.get(overlayName);

    if (cached !== undefined) {
      return cached;
    }

    const overlay = this.#hot.view.getOverlayByName(overlayName) as OverlayLike | null;
    const overlayRoot = overlay?.clone?.wtTable.wtRootElement;

    if (!overlayRoot) {
      return undefined;
    }

    const zIndex = Number.parseInt(this.#hot.rootWindow.getComputedStyle(overlayRoot).zIndex, 10);

    if (Number.isNaN(zIndex)) {
      return undefined;
    }

    this.#overlayZIndexCache.set(overlayName, zIndex + 1);

    return zIndex + 1;
  }

  /**
   * Picks the z-index for a frozen-pane range piece, or `undefined` for the master pane.
   *
   * @param {boolean} frozenTop Whether the piece lies in the top frozen rows.
   * @param {boolean} frozenBottom Whether the piece lies in the bottom frozen rows.
   * @param {boolean} frozenCol Whether the piece lies in the start frozen columns.
   * @returns {number | undefined}
   */
  #pieceZIndex(
    frozenTop: boolean,
    frozenBottom: boolean,
    frozenCol: boolean,
  ): number | undefined {
    if (frozenBottom) {
      return this.#overlayZIndex(frozenCol ? 'bottom_inline_start_corner' : 'bottom');
    }

    if (frozenTop) {
      return this.#overlayZIndex(frozenCol ? 'top_inline_start_corner' : 'top');
    }

    if (frozenCol) {
      return this.#overlayZIndex('inline_start');
    }

    return undefined;
  }

  /**
   * Computes the overlay-host-relative rectangle for one frozen-split range piece,
   * clamped to the rendered viewport for non-frozen axes.
   *
   * @param {CellRange} piece The range piece in visual coordinates.
   * @param {boolean} frozenTop Whether the piece lies in the top frozen rows.
   * @param {boolean} frozenBottom Whether the piece lies in the bottom frozen rows.
   * @param {boolean} frozenCol Whether the piece lies in the start frozen columns.
   * @returns {RangeRect | null}
   */
  #pieceRect(
    piece: CellRange,
    frozenTop: boolean,
    frozenBottom: boolean,
    frozenCol: boolean,
  ): RangeRect | null {
    let startRow = piece.start.row;
    let endRow = piece.end.row;
    let startCol = piece.start.col;
    let endCol = piece.end.col;

    if (!frozenTop && !frozenBottom) {
      startRow = Math.max(startRow, this.#hot.getFirstRenderedVisibleRow());
      endRow = Math.min(endRow, this.#hot.getLastRenderedVisibleRow());

      if (startRow > endRow) {
        return null;
      }
    }

    if (!frozenCol) {
      startCol = Math.max(startCol, this.#hot.getFirstRenderedVisibleColumn());
      endCol = Math.min(endCol, this.#hot.getLastRenderedVisibleColumn());

      if (startCol > endCol) {
        return null;
      }
    }

    const rect = this.#core.unionRectRelativeTo(
      this.#overlayHost,
      this.#hot.getCell(startRow, startCol, true),
      this.#hot.getCell(endRow, endCol, true),
    );

    if (rect) {
      const zIndex = this.#pieceZIndex(frozenTop, frozenBottom, frozenCol);

      if (zIndex !== undefined) {
        rect.zIndex = zIndex;
      }
    }

    return rect;
  }

  /**
   * Computes the visible-viewport clip rectangle relative to the overlay host.
   *
   * @returns {RangeRect | null}
   */
  #viewportClip(): RangeRect | null {
    const holder = this.getScrollHolder();

    if (!holder) {
      return null;
    }

    const hostRect = this.#overlayHost.getBoundingClientRect();
    const holderRect = holder.getBoundingClientRect();

    return {
      left: holderRect.left - hostRect.left,
      top: holderRect.top - hostRect.top,
      width: holder.clientWidth,
      height: holder.clientHeight,
    };
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
