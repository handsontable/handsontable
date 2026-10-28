// Only the `#` fields use the package's types (they emit as `#private`); every signature uses the
// local mirror in `gridContract.ts`, because no emitted declaration may name the package.
import type { PickEmitter } from 'hyperformula-ui';
import { warn } from '../../helpers/console';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { isHTMLElement } from '../../helpers/dom/element';
import type { HotInstance } from '../../core/types';
import type { default as VisualSelection } from '../../selection/highlight/visualSelection';
import type { VisualHfIndexMapping } from './internalTypes';
import type {
  CellAddress,
  CellPick,
  CellPickListener,
  CellRange,
  GridDirection as Direction,
  GridSelection,
  GridSize,
  HeaderPick,
  HeaderPickListener,
  OutsideClickCommitMode,
  RangeHighlight,
  RangePick,
  RangePickListener,
  Unsubscribe,
} from './gridContract';

/**
 * The `hyperformula-ui` module namespace (see `internalTypes.ts` for why it is not shared).
 */
type CoreModule = typeof import('hyperformula-ui');

/**
 * The widest HyperFormula span (in indexes) the adapter maps index by index into visual runs.
 * A wider span (a whole-column reference such as `A:A`) maps only its two ends, as one run, so
 * a sheet-wide reference never walks every row of the sheet on each keystroke.
 */
const MAX_HF_INDEX_SCAN = 2000;

/**
 * The most custom selections one highlight may produce. Under a sort or a move, one reference range
 * maps to one selection per contiguous visual run, and a 2D range multiplies the row runs by the
 * column runs; past this many, the highlight falls back to its visual bounding box, drawn as a border
 * only (a fill would tint cells the reference does not cover).
 */
const MAX_SELECTIONS_PER_HIGHLIGHT = 50;

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
 * Character allowlist for highlight color strings before they reach the generated
 * stylesheet. Blocks every character able to break out of a CSS declaration
 * (braces, semicolons, quotes, angle brackets) while keeping the color syntaxes
 * the palette uses expressible: `var(--x)`, `hsl(210 80% 55% / 0.9)`, hex,
 * `color-mix(in srgb, ...)`.
 */
const SAFE_COLOR_PATTERN = /^[\w#%(),./*+\s-]+$/;

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
  /**
   * Set when the run is only the span between two mapped endpoints, and the endpoints came back in
   * reverse order: the indexes between them are not the referenced ones, so the run gets no fill.
   */
  approximate?: boolean;
}

/**
 * One whole-axis highlight span in HyperFormula space with its resolved tint.
 */
interface TintSpan {
  /**
   * First HyperFormula index of the span.
   */
  start: number;
  /**
   * Last HyperFormula index of the span.
   */
  end: number;
  /**
   * The resolved translucent tint color.
   */
  backgroundColor: string;
}

/**
 * Construction options for `HandsontableAdapter`.
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
   * The injected `hyperformula-ui` module namespace. Typed `unknown` so this declaration does not
   * name the package; the plugin validated it before building the adapter.
   */
  core: unknown;
  /**
   * Returns the engine sheet dimensions in HyperFormula space, or `null` when unknown.
   */
  getSheetDimensions?: () => { rows: number; cols: number } | null;
  /**
   * Returns the raw cell text (formula source or stringified value) at HyperFormula coordinates.
   */
  readCellText: (hfRow: number, hfCol: number) => string;
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
   * Saves the value into every cell of the selected ranges, as Ctrl/Cmd+Enter does in the grid's
   * own editors.
   *
   * @param {string} value The value to save.
   */
  commitInlineEditToSelection(value: string): void;
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
 * The adapter of each enabled plugin instance, keyed by the plugin. The adapter is not a public
 * member of the plugin: its methods take `hyperformula-ui` types, and a public declaration that
 * named the package would not resolve where it is not installed (see `types.ts`).
 */
const adaptersByPlugin = new WeakMap<object, HandsontableAdapter>();

/**
 * Records (or clears, with `null`) the adapter of a plugin instance.
 *
 * @param {object} plugin The plugin instance.
 * @param {HandsontableAdapter | null} adapter The adapter, or `null` on teardown.
 */
export function setFormulaBuilderAdapter(plugin: object, adapter: HandsontableAdapter | null): void {
  if (adapter === null) {
    adaptersByPlugin.delete(plugin);
  } else {
    adaptersByPlugin.set(plugin, adapter);
  }
}

/**
 * Returns the adapter of an enabled plugin instance, or `null` while it is disabled.
 *
 * @param {object} plugin The plugin instance.
 * @returns {HandsontableAdapter | null}
 */
export function getFormulaBuilderAdapter(plugin: object): HandsontableAdapter | null {
  return adaptersByPlugin.get(plugin) ?? null;
}

/**
 * Implements the `hyperformula-ui` `IGridAdapter` contract against a live Handsontable
 * instance: geometry and highlight rendering, visual/HyperFormula index translation,
 * pick event brokering, and editor lifecycle delegation back to the plugin.
 */
export class HandsontableAdapter {
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
   * The injected `hyperformula-ui` module namespace.
   */
  readonly #core: CoreModule;
  /**
   * Returns the engine sheet dimensions in HyperFormula space, or `null` when unknown.
   */
  readonly #getSheetDimensions: (() => { rows: number; cols: number } | null) | null;
  /**
   * Reads the raw cell text at HyperFormula coordinates.
   */
  readonly #readCellText: (hfRow: number, hfCol: number) => string;
  /**
   * Pick event fan-out.
   */
  readonly #emitter: PickEmitter;
  /**
   * The persistent reference highlights last passed to `setHighlights()`,
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
   * The custom-selection specs the ephemeral highlight currently renders as.
   */
  #ephemeralSpecs: SelectionSpec[] = [];
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
   * The consumer theming class applied through `setOverlayClassName()`.
   */
  #overlayClassName: string | null = null;
  /**
   * The resolved reference-highlight border width, probed lazily from the
   * `--hfe-reference-border-width` theme variable.
   */
  #borderWidth: number | null = null;
  /**
   * Column header elements tracked via the `afterGetColHeader` hook, keyed by visual index. A column
   * renders its header in the master table and in every overlay clone, so each index keeps all of its
   * copies. With nested headers only the bottom level is kept: an upper level spans a group of
   * columns, and a reference to one of them must not tint the whole group.
   */
  readonly #colHeaderEls = new Map<number, Set<HTMLElement>>();
  /**
   * The header level the tracked column headers belong to (the lowest one rendered).
   */
  #colHeaderLevel = -1;
  /**
   * Row header elements tracked via the `afterGetRowHeader` hook, keyed by visual index, every copy.
   */
  readonly #rowHeaderEls = new Map<number, Set<HTMLElement>>();
  /**
   * The visual index each tracked header element was last rendered for. Walkontable reuses its `<th>`
   * elements in place on scroll, so an element tracked again under another index has to leave the set
   * of its old one, or the old index's tint lands on it.
   */
  readonly #trackedHeaderIndex = new WeakMap<HTMLElement, number>();
  /**
   * Bound `afterGetColHeader` listener (removed in `destroy`).
   */
  readonly #colHeaderHook: (col: number, th: HTMLElement, headerLevel?: number) => void;
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
   * Marks the highlights stale when an index mapper rebuilt its cache: a sort, a move, hiding,
   * trimming (Filters, TrimRows, a NestedRows collapse), a row or column insert or removal, a page
   * change, or a data load can each remap the visual coordinates the highlights were derived with.
   * The cache update can run in the middle of a batch, so the highlights are re-derived before the
   * next draw (`beforeViewRender`), not here.
   */
  readonly #onIndexCacheUpdated = (): void => {
    if (this.#persistentItems.length > 0) {
      this.#persistentItemsStale = true;
    }
  };
  /**
   * Re-derives stale highlights right before a draw, so the draw paints them on their new cells.
   */
  readonly #beforeViewRenderHook = (): void => {
    if (this.#persistentItemsStale) {
      this.#persistentItemsStale = false;
      this.#applyPersistentItems(false);
    }
  };
  /**
   * Whether an index change happened since the highlights were last derived.
   */
  #persistentItemsStale = false;
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
    this.#core = options.core as CoreModule;
    this.#getSheetDimensions = options.getSheetDimensions ?? null;
    this.#readCellText = options.readCellText;
    this.#plugin = plugin;
    this.#emitter = new this.#core.PickEmitter();

    this.#colHeaderHook = (col, th, headerLevel = 0) => {
      const bottomLevel = this.#bottomColHeaderLevel(headerLevel);

      if (bottomLevel !== this.#colHeaderLevel) {
        this.#colHeaderLevel = bottomLevel;
        this.#colHeaderEls.clear();
      }

      if (headerLevel === bottomLevel) {
        this.#trackHeader(this.#colHeaderEls, col, th);
      }
    };
    this.#rowHeaderHook = (row, th) => {
      this.#trackHeader(this.#rowHeaderEls, row, th);
    };
    this.#pruneHeaderElsHook = () => {
      this.#pruneDetachedHeaderEls();
      this.#renderHeaderTints();
    };
    this.#hot.addHook('afterGetColHeader', this.#colHeaderHook);
    this.#hot.addHook('afterGetRowHeader', this.#rowHeaderHook);
    this.#hot.addHook('afterViewRender', this.#pruneHeaderElsHook);
    this.#hot.addHook('beforeViewRender', this.#beforeViewRenderHook);
    this.#hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#onIndexCacheUpdated);
    this.#hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#onIndexCacheUpdated);
  }

  /**
   * Returns the element that scrolls the grid: the master holder, or a scrolling ancestor of the
   * grid. The element that scrolls the rows wins; with the window scrolling the rows, the element
   * that scrolls the columns. Returns `null` when the window owns both axes, because a page scroll
   * needs no element to follow: the editor moves with the page.
   *
   * @returns {HTMLElement | null}
   */
  getScrollHolder(): HTMLElement | null {
    const overlays = this.#hot.view?._wt?.wtOverlays;
    // The vertical owner first. With no `height` and a pixel `width` the window scrolls the rows
    // while the holder still scrolls the columns, so the horizontal owner is asked too.
    const scrollable = [
      overlays?.topOverlay?.mainTableScrollableElement,
      overlays?.inlineStartOverlay?.mainTableScrollableElement,
    ].find(element => isHTMLElement(element));

    // `isHTMLElement()` rather than `instanceof HTMLElement`: a grid in an iframe driven from the
    // parent page has elements of the iframe's realm.
    return isHTMLElement(scrollable) ? scrollable : null;
  }

  /**
   * Resolves the cell address at the given viewport coordinates. The reference drag calls this
   * while it auto-scrolls, with the pointer held past the viewport edge, so the position is
   * resolved with `getCellCoordsFromMousePosition()`, which clamps to the nearest rendered cell -
   * `elementFromPoint()` finds the scrollbar or the page out there, and the range would stop
   * growing at the last rendered cell.
   *
   * @param {number} x The horizontal viewport coordinate.
   * @param {number} y The vertical viewport coordinate.
   * @returns {CellAddress | null}
   */
  getCellAddressAt(x: number, y: number): CellAddress | null {
    if (!this.#hot.view) {
      return null;
    }

    const coords = getCellCoordsFromMousePosition(this.#hot, x, y);

    if (!coords || coords.row === null || coords.col === null || coords.row < 0 || coords.col < 0) {
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
    const unchanged = this.#sameItems(this.#persistentItems, items);

    this.#persistentItems = items;

    if (unchanged) {
      return;
    }

    this.#applyPersistentItems();
  }

  /**
   * Renders the ephemeral (drag preview) highlight.
   *
   * @param {CellRange} range The range to highlight.
   * @param {string} color The highlight color.
   */
  highlightRange(range: CellRange, color: string): void {
    const specs = this.#selectionSpecs([{ range, color, fill: true }], true);

    this.#replaceSelections(this.#ephemeralSelections, specs, this.#ephemeralSpecs);
    this.#ephemeralSpecs = specs;
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
    this.#ephemeralSpecs = [];
    this.#redraw();
  }

  /**
   * Clears every highlight.
   */
  clearHighlights(): void {
    this.#persistentItems = [];
    this.#persistentSpecs = [];
    this.#ephemeralSpecs = [];
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
    // The engine's sheet dimensions are its OCCUPIED extent, not the grid: a 100-row grid whose
    // data stops at row 3 reports 3 rows, and the formula bar refuses to navigate past an index
    // at or beyond this size. Every grid row has a HyperFormula index (trimmed rows included), so
    // the physical index count is the size, and the engine extent only widens it when the sheet
    // holds more than the grid shows.
    const sheetSize = this.#getSheetDimensions?.();
    const rows = this.#hot.rowIndexMapper.getNumberOfIndexes();
    const cols = this.#hot.columnIndexMapper.getNumberOfIndexes();

    return {
      rows: Math.max(rows, sheetSize?.rows ?? 0),
      cols: Math.max(cols, sheetSize?.cols ?? 0),
    };
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
    // A hidden cell counts as empty, so the jump stops at the edge of the data the user can see.
    const found = this.#core.findDataEdge(visualFrom, this.#toVisualDirection(direction), size, (row, col) => {
      if (!this.#isVisualCellRenderable(row, col)) {
        return false;
      }

      const value = this.#hot.getDataAtCell(row, col);

      return value !== null && value !== '' && value !== undefined;
    });
    const edge = this.#nearestRenderableToward(found, visualFrom);
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
    const visualDirection = this.#toVisualDirection(direction);
    let stepped = this.#core.stepCell(
      { sheet: from.sheet, col: startCol, row: startRow },
      visualDirection,
      size,
    );

    while (!this.#isVisualCellRenderable(stepped.row, stepped.col)) {
      const next = this.#core.stepCell(stepped, visualDirection, size);

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
    // The getters answer `null` (not `-1`) when no row or column is fully visible, for example a row
    // taller than the viewport, and `null >= 0` is `true`.
    const isIndex = (value: number | null): value is number => Number.isInteger(value) && (value as number) >= 0;
    const hasBounds = isIndex(firstRow) && isIndex(lastRow) && isIndex(firstCol) && isIndex(lastCol);

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

    // A cell in a frozen band is always in view. Forcing a snap there bypasses Walkontable's
    // frozen-band guard and scrolls the master viewport to its first (or last) track.
    if (!this.#isInFrozenRowBand(visualRow)) {
      if (visualRow > lastRow) {
        target.row = visualRow;
        target.verticalSnap = 'bottom';
      } else if (visualRow < firstRow) {
        target.row = visualRow;
        target.verticalSnap = 'top';
      }
    }

    if (!this.#isInFrozenColumnBand(visualCol)) {
      if (visualCol > lastCol) {
        target.col = visualCol;
        target.horizontalSnap = 'end';
      } else if (visualCol < firstCol) {
        target.col = visualCol;
        target.horizontalSnap = 'start';
      }
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
    return this.#readCellText(address.row, address.col);
  }

  /**
   * Opens the inline editor on the active cell, optionally seeding it, through Handsontable's editor
   * manager, the way a key or a double-click opens it: the `beforeBeginEditing` veto, the read-only,
   * header, and hidden-cell checks, and a fresh prepare after `loadData()`/`updateData()` all apply.
   * Returns whether an editor actually opened, so the formula bar never believes an edit session
   * started on a cell that cannot be edited.
   *
   * @param {CellAddress} _address Unused; Handsontable always edits the active cell.
   * @param {string} [seed] Initial editor content.
   * @returns {boolean} Whether the editor opened.
   */
  beginEdit(_address: CellAddress, seed?: string): boolean {
    // `openEditor()` takes the event that opened the editor and passes it to `beforeBeginEditing`.
    // The formula bar opens it from its own focus or click, which the grid never saw, so there is
    // no grid event to pass.
    this.#hot._getEditorManager().openEditor(seed ?? null, undefined as unknown as Event, true);

    const editor = this.#hot.getActiveEditor() as { isOpened?(): boolean } | undefined;

    return editor?.isOpened?.() === true;
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
   * @returns {boolean | void} `false` when the grid shows no row or column to move to, which the
   * address box announces as unavailable.
   */
  setActiveCell(address: CellAddress): boolean | void {
    // A trimmed row (Filters, TrimRows) has no visual index. The address box already accepted the
    // address, so the selection moves to the nearest row or column the grid shows instead of staying
    // put while the box names a cell that is not selected.
    const visualRow = this.#nearestVisual(address.row, 'row');
    const visualCol = this.#nearestVisual(address.col, 'col');

    if (visualRow < 0 || visualCol < 0) {
      return false;
    }

    this.#plugin.selectFormulaCell(visualRow, visualCol);
  }

  /**
   * Moves the grid selection to a range.
   *
   * @param {CellRange} range The target range in HyperFormula coordinates.
   * @returns {boolean | void} `false` when the range holds no index the grid shows, which the
   * address box announces as unavailable.
   */
  setSelection(range: CellRange): boolean | void {
    // A corner on a trimmed index moves inward to the nearest index the grid shows, so `A2:A5` with
    // row 2 trimmed selects `A3:A5`. A range that holds no shown index selects nothing.
    const rowToVisual = (index: number) => this.#mapping.hfToVisualRow(index);
    const colToVisual = (index: number) => this.#mapping.hfToVisualCol(index);
    const startRow = this.#firstVisualIn(range.start.row, range.end.row, rowToVisual);
    const startCol = this.#firstVisualIn(range.start.col, range.end.col, colToVisual);
    const endRow = this.#firstVisualIn(range.end.row, range.start.row, rowToVisual);
    const endCol = this.#firstVisualIn(range.end.col, range.start.col, colToVisual);

    if (startRow < 0 || startCol < 0 || endRow < 0 || endCol < 0) {
      return false;
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
   * Commits the current edit into every selected cell (Ctrl/Cmd+Enter).
   *
   * @param {string} value The value to save.
   */
  commitFill(value: string): void {
    this.#plugin.commitInlineEditToSelection(value);
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
    this.#hot.removeHook('beforeViewRender', this.#beforeViewRenderHook);
    this.#hot.rowIndexMapper.removeLocalHook('cacheUpdated', this.#onIndexCacheUpdated);
    this.#hot.columnIndexMapper.removeLocalHook('cacheUpdated', this.#onIndexCacheUpdated);

    this.clearHighlights();
    this.setOverlayClassName(null);
    this.#fillStyleEl?.remove();
    this.#fillStyleEl = null;
    this.#refClassByKey.clear();
    this.#emitter.clear();
  }

  /**
   * Turns the direction of an arrow key into a direction in visual column order. The package reports
   * the key (`left` for ArrowLeft); in a right-to-left grid the columns run from right to left, so
   * ArrowLeft points at the next visual column, the way the grid's own selection moves.
   *
   * @param {Direction} direction The arrow key's direction.
   * @returns {Direction}
   */
  #toVisualDirection(direction: Direction): Direction {
    if (!this.#hot.isRtl()) {
      return direction;
    }

    if (direction === 'left') {
      return 'right';
    }

    return direction === 'right' ? 'left' : direction;
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
   * Walks a cell back toward a start cell, one step at a time on the axis it moved along, until it is
   * rendered. Returns the start cell when every cell in between is hidden.
   *
   * @param {CellAddress} cell The cell in visual coordinates.
   * @param {CellAddress} start The start cell in visual coordinates.
   * @returns {CellAddress}
   */
  #nearestRenderableToward(cell: CellAddress, start: CellAddress): CellAddress {
    const rowStep = Math.sign(start.row - cell.row);
    const colStep = Math.sign(start.col - cell.col);
    let { row, col } = cell;

    while (!this.#isVisualCellRenderable(row, col)) {
      if (row === start.row && col === start.col) {
        return start;
      }

      row += rowStep;
      col += colStep;
    }

    return { ...cell, row, col };
  }

  /**
   * Returns the visual index of a HyperFormula index, or of the nearest index that has one (the
   * following one first), searching the grid's indexes; `-1` when the axis shows nothing.
   *
   * @param {number} hfIndex The HyperFormula index.
   * @param {'row' | 'col'} axis The axis.
   * @returns {number}
   */
  #nearestVisual(hfIndex: number, axis: 'row' | 'col'): number {
    const hfToVisual = axis === 'row' ?
      (index: number) => this.#mapping.hfToVisualRow(index) :
      (index: number) => this.#mapping.hfToVisualCol(index);
    const lastIndex = (axis === 'row' ? this.#hot.rowIndexMapper : this.#hot.columnIndexMapper)
      .getNumberOfIndexes() - 1;
    const exact = hfToVisual(hfIndex);

    if (exact >= 0 || hfIndex < 0 || hfIndex > lastIndex) {
      return exact;
    }

    for (let distance = 1; hfIndex + distance <= lastIndex || hfIndex - distance >= 0; distance++) {
      const after = hfIndex + distance <= lastIndex ? hfToVisual(hfIndex + distance) : -1;

      if (after >= 0) {
        return after;
      }

      const before = hfIndex - distance >= 0 ? hfToVisual(hfIndex - distance) : -1;

      if (before >= 0) {
        return before;
      }
    }

    return -1;
  }

  /**
   * Returns the visual index of the first HyperFormula index from `from` toward `to` (inclusive) that
   * has one, or `-1`.
   *
   * @param {number} from The HyperFormula index to start at.
   * @param {number} to The HyperFormula index to stop at.
   * @param {Function} hfToVisual The axis translation.
   * @returns {number}
   */
  #firstVisualIn(from: number, to: number, hfToVisual: (index: number) => number): number {
    const step = from <= to ? 1 : -1;

    for (let index = from; step > 0 ? index <= to : index >= to; index += step) {
      const visual = hfToVisual(index);

      if (visual >= 0) {
        return visual;
      }
    }

    return -1;
  }

  /**
   * Whether a visual row is in the top or bottom frozen band.
   *
   * @param {number} visualRow The visual row index.
   * @returns {boolean}
   */
  #isInFrozenRowBand(visualRow: number): boolean {
    const view = this.#hot.view;
    const bottomCount = view.countFixedRowsBottom();

    return visualRow < view.countFixedRowsTop() ||
      (bottomCount > 0 && visualRow >= this.#hot.countRows() - bottomCount);
  }

  /**
   * Whether a visual column is in the start or end frozen band.
   *
   * @param {number} visualCol The visual column index.
   * @returns {boolean}
   */
  #isInFrozenColumnBand(visualCol: number): boolean {
    const view = this.#hot.view;
    const endCount = view.countFixedColumnsEnd();

    return visualCol < view.countFixedColumnsStart() ||
      (endCount > 0 && visualCol >= this.#hot.countCols() - endCount);
  }

  /**
   * Returns the column header level whose headers are tracked: the bottom one the grid renders
   * (the levels are counted on every draw, so the level follows a `nestedHeaders` change). A view
   * that does not count them falls back to the deepest level seen so far.
   */
  #bottomColHeaderLevel(headerLevel: number): number {
    const levels = this.#hot.view?.getColumnHeadersCount?.();

    if (typeof levels === 'number' && levels > 0) {
      return levels - 1;
    }

    return Math.max(headerLevel, this.#colHeaderLevel);
  }

  /**
   * Records a rendered header element under its visual index.
   *
   * @param {Map<number, Set<HTMLElement>>} headerEls The tracked headers of one axis.
   * @param {number} visualIndex The visual index.
   * @param {HTMLElement} headerEl The header element.
   */
  #trackHeader(headerEls: Map<number, Set<HTMLElement>>, visualIndex: number, headerEl: HTMLElement): void {
    const previousIndex = this.#trackedHeaderIndex.get(headerEl);

    if (previousIndex !== undefined && previousIndex !== visualIndex) {
      const previousCopies = headerEls.get(previousIndex);

      previousCopies?.delete(headerEl);

      if (previousCopies?.size === 0) {
        headerEls.delete(previousIndex);
      }
    }

    this.#trackedHeaderIndex.set(headerEl, visualIndex);

    let copies = headerEls.get(visualIndex);

    if (copies === undefined) {
      copies = new Set();
      headerEls.set(visualIndex, copies);
    }

    copies.add(headerEl);
  }

  /**
   * Drops header elements that Handsontable discarded on its last render pass;
   * headers render only for the visible window, so stale entries would pin
   * detached `<th>` subtrees for every index ever scrolled past.
   */
  #pruneDetachedHeaderEls(): void {
    [this.#colHeaderEls, this.#rowHeaderEls].forEach((headerEls) => {
      headerEls.forEach((copies, visualIndex) => {
        copies.forEach((headerEl) => {
          if (!headerEl.isConnected) {
            copies.delete(headerEl);
          }
        });

        if (copies.size === 0) {
          headerEls.delete(visualIndex);
        }
      });
    });
  }

  /**
   * Re-renders the grid so the custom-selection changes reach the DOM. A fast
   * (reposition-only) draw is enough: the Walkontable selection manager re-scans
   * every selection on each draw, fast or full, on the master table and every
   * overlay clone. During grid initialization the view does not exist yet (the
   * `hyperformula-ui` builder resets highlights while the plugin enables), and the
   * initial draw renders the registered selections anyway.
   */
  #redraw(): void {
    this.#hot.view?.render();
  }

  /**
   * Derives specs from the stored persistent highlights and syncs the grid's
   * custom selections and header tints to them, redrawing only when the derived
   * specs actually changed. Shared by `setHighlights()` and the structural
   * change listener (sort/move/hide can remap visual coordinates while the
   * source highlights stay the same).
   */
  #applyPersistentItems(redraw = true): void {
    this.#persistentItemsStale = false;

    const specs = this.#selectionSpecs(this.#persistentItems, false);

    if (this.#sameSpecs(this.#persistentSpecs, specs)) {
      this.#renderHeaderTints();

      return;
    }

    const previousSpecs = this.#persistentSpecs;

    this.#persistentSpecs = specs;
    this.#replaceSelections(this.#persistentSelections, specs, previousSpecs);
    this.#moveEphemeralToTail();
    this.#renderHeaderTints();

    if (redraw) {
      this.#redraw();
    }
  }

  /**
   * Whether two highlight sets are identical in HyperFormula space. Checked
   * before any spec derivation, so an unchanged set (the common case for
   * keystrokes and caret moves inside one token) costs no index translation.
   *
   * @param {RangeHighlight[]} previous The currently stored highlights.
   * @param {RangeHighlight[]} next The incoming highlights.
   * @returns {boolean}
   */
  #sameItems(previous: RangeHighlight[], next: RangeHighlight[]): boolean {
    if (previous.length !== next.length) {
      return false;
    }

    return previous.every((prev, index) => {
      const item = next[index];

      return prev.color === item.color &&
        (prev.fill ?? false) === (item.fill ?? false) &&
        (prev.whole ?? null) === (item.whole ?? null) &&
        prev.range.start.row === item.range.start.row &&
        prev.range.start.col === item.range.start.col &&
        prev.range.end.row === item.range.end.row &&
        prev.range.end.col === item.range.end.col;
    });
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
        prev.range.isEqual(spec.range);
    });
  }

  /**
   * Moves the ephemeral (drag preview) selections to the tail of the grid's
   * custom-selection collection so the preview keeps painting above freshly
   * re-registered persistent highlights (border DOM is created in collection
   * order; the previous highlight layer always drew the ephemeral on top).
   */
  #moveEphemeralToTail(): void {
    if (this.#ephemeralSelections.length === 0) {
      return;
    }

    const { customSelections } = this.#hot.selection.highlight;
    const ephemeralSet = new Set(this.#ephemeralSelections);

    // Compacts the collection in place (a spread `push` overflows the stack on a large collection,
    // and CustomBorders keeps one entry per bordered cell range there).
    let kept = 0;

    for (let index = 0; index < customSelections.length; index++) {
      if (!ephemeralSet.has(customSelections[index])) {
        customSelections[kept] = customSelections[index];
        kept += 1;
      }
    }

    if (kept === customSelections.length) {
      return;
    }

    customSelections.length = kept;
    this.#ephemeralSelections.forEach((selection) => {
      customSelections.push(selection);
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
      if (!this.#isSafeColor(item.color)) {
        warn(`FormulaBuilder: ignored a highlight with the unsupported color "${item.color}".`);
        continue;
      }

      // The lexer keeps a range as typed, so `=SUM(B5:A1)` arrives reversed.
      const { start, end } = item.range;
      let rowRuns = this.#visualRuns(
        Math.min(start.row, end.row), Math.max(start.row, end.row), hfToVisualRow, 'row',
      );
      let colRuns = this.#visualRuns(
        Math.min(start.col, end.col), Math.max(start.col, end.col), hfToVisualCol, 'col',
      );
      let fill = (item.fill ?? fillDefault) && ![...rowRuns, ...colRuns].some(run => run.approximate);

      if (rowRuns.length * colRuns.length > MAX_SELECTIONS_PER_HIGHLIGHT) {
        rowRuns = this.#boundingRun(rowRuns);
        colRuns = this.#boundingRun(colRuns);
        fill = false;
      }

      for (const rowRun of rowRuns) {
        for (const colRun of colRuns) {
          const from = this.#hot._createCellCoords(rowRun.start, colRun.start);
          const to = this.#hot._createCellCoords(rowRun.end, colRun.end);

          specs.push({
            range: this.#hot._createCellRange(from, from, to),
            color: item.color,
            fill,
          });
        }
      }
    }

    return specs;
  }

  /**
   * Syncs one owned custom-selection group to the given specs. When only ranges
   * changed (same count, same per-position color and fill - the common case while
   * typing extends one reference), the existing selections are updated in place,
   * avoiding border DOM teardown on the master table and every overlay clone.
   * Otherwise the previous instances are destroyed and removed from the grid's
   * custom-selection collection (foreign custom selections, e.g. the CustomBorders
   * plugin's, are left untouched) and one new selection is registered per spec.
   *
   * @param {VisualSelection[]} owned The owned selection group, mutated in place.
   * @param {SelectionSpec[]} specs The selections to create.
   * @param {SelectionSpec[]} [previousSpecs] The specs the group currently renders,
   * enabling the in-place fast path.
   */
  #replaceSelections(
    owned: VisualSelection[],
    specs: SelectionSpec[],
    previousSpecs: SelectionSpec[] = [],
  ): void {
    if (owned.length === 0 && specs.length === 0) {
      return;
    }

    if (
      owned.length === specs.length &&
      previousSpecs.length === specs.length &&
      specs.every((spec, index) =>
        spec.color === previousSpecs[index].color && spec.fill === previousSpecs[index].fill)
    ) {
      specs.forEach((spec, index) => {
        if (!spec.range.isEqual(previousSpecs[index].range)) {
          owned[index].visualCellRange = spec.range;
          owned[index].commit();
        }
      });

      return;
    }

    const { highlight } = this.#hot.selection;
    const { customSelections } = highlight;
    const ownedSet = new Set(owned);
    let kept = 0;

    // One pass that compacts the collection in place, instead of a `splice` per owned entry.
    for (let index = 0; index < customSelections.length; index++) {
      const selection = customSelections[index];

      if (ownedSet.has(selection)) {
        selection.destroy();
      } else {
        customSelections[kept] = selection;
        kept += 1;
      }
    }

    customSelections.length = kept;
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
    // The grid GUID scopes the class name per instance: the rules are document
    // level, so two grids minting the same counter value must not share a class
    // bound to different colors.
    const className = `${REF_CLASS_PREFIX}-${fill ? 'fill' : 'line'}-${this.#hot.guid}-${index}`;

    if (this.#fillStyleEl === null) {
      this.#fillStyleEl = this.#hot.rootDocument.createElement('style');
      this.#fillStyleEl.setAttribute('data-hot-formula-ref-fills', '');
      // In the grid's own wrapper, not the document head: a grid inside a shadow root reads no
      // document stylesheet, and the rules here draw its highlights (as `importFile` mounts its own).
      this.#hot.rootWrapperElement.appendChild(this.#fillStyleEl);
    }

    // Written as text, not through `insertRule()`: rules added to the CSSOM are lost when the element
    // leaves the document and comes back (a framework moving the grid between tabs or portals), while
    // the text is parsed again on every insertion.
    this.#fillStyleEl.appendChild(this.#hot.rootDocument.createTextNode(
      `.handsontable .wtBorder.${className}{` +
      `-webkit-mask-image:${BORDER_DASH_MASK};mask-image:${BORDER_DASH_MASK};}\n`,
    ));

    if (fill) {
      const tint = this.#core.fillColor(color);

      this.#fillStyleEl.appendChild(this.#hot.rootDocument.createTextNode(
        `.handsontable td.${className}{background-image:linear-gradient(${tint},${tint});}\n`,
      ));
    }

    this.#refClassByKey.set(key, className);

    return className;
  }

  /**
   * Whether a highlight color string is safe to interpolate into the generated
   * stylesheet. A strict `var()` reference is always accepted; anything else must
   * pass the character allowlist (no way to break out of a declaration) and, where
   * the environment implements it, `CSS.supports('color', ...)`.
   *
   * @param {string} color The color string to validate.
   * @returns {boolean}
   */
  #isSafeColor(color: string): boolean {
    if (/^var\(--[\w-]+\)$/.test(color)) {
      return true;
    }

    // `/` and `*` stay allowed for `hsl(... / 0.9)` and `calc()`, but together they open a comment:
    // `CSS.supports()` drops the comment before it parses the value and accepts it, while in the
    // generated stylesheet it swallows the rest of the rule and every rule added after it.
    if (!SAFE_COLOR_PATTERN.test(color) || color.includes('/*')) {
      return false;
    }

    const cssApi = this.#hot.rootWindow.CSS;

    if (typeof cssApi?.supports === 'function') {
      return cssApi.supports('color', color);
    }

    return true;
  }

  /**
   * Drops the cached reference-highlight border width, so the next highlight reads it from the
   * theme again. Called on a theme change, which keeps this adapter.
   */
  resetBorderWidth(): void {
    this.#borderWidth = null;
  }

  /**
   * Resolves (and caches) the reference-highlight border width from the
   * `--hfe-reference-border-width` theme variable, falling back to
   * `DEFAULT_BORDER_WIDTH` when it does not resolve to a positive number.
   *
   * @returns {number}
   */
  #resolveBorderWidth(): number {
    if (this.#borderWidth !== null) {
      return this.#borderWidth;
    }

    const rawWidth = this.#hot.rootWindow
      .getComputedStyle(this.#overlayHost)
      .getPropertyValue('--hfe-reference-border-width');
    const parsedWidth = Number.parseFloat(rawWidth);

    if (Number.isFinite(parsedWidth) && parsedWidth > 0) {
      this.#borderWidth = parsedWidth;

      return parsedWidth;
    }

    // Not cached: an unresolved variable usually means the theme stylesheet has
    // not loaded yet, so the next highlight re-probes instead of locking in the
    // fallback for the adapter's lifetime.
    return DEFAULT_BORDER_WIDTH;
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

    const columnSpans: TintSpan[] = [];
    const rowSpans: TintSpan[] = [];

    for (const item of this.#persistentItems) {
      if (item.whole === 'column') {
        columnSpans.push({
          start: item.range.start.col,
          end: item.range.end.col,
          backgroundColor: this.#core.fillColor(item.color),
        });
      } else if (item.whole === 'row') {
        rowSpans.push({
          start: item.range.start.row,
          end: item.range.end.row,
          backgroundColor: this.#core.fillColor(item.color),
        });
      }
    }

    this.#tintTrackedHeaders(this.#colHeaderEls, columnSpans,
      visualIndex => this.#mapping.visualToHfCol(visualIndex));
    this.#tintTrackedHeaders(this.#rowHeaderEls, rowSpans,
      visualIndex => this.#mapping.visualToHfRow(visualIndex));
  }

  /**
   * Tints the tracked (rendered) header elements of one axis against the given
   * whole-axis highlight spans. Iterates the tracked headers - bounded by the
   * viewport - rather than the HyperFormula spans, which a whole-column reference
   * makes as large as the sheet. The last matching span wins, mirroring the
   * source highlight order.
   *
   * @param {Map<number, Set<HTMLElement>>} headerEls Tracked header elements keyed by visual index.
   * @param {TintSpan[]} spans The whole-axis highlight spans in HyperFormula space.
   * @param {Function} visualToHf Visual-to-HyperFormula index translation for the axis.
   */
  #tintTrackedHeaders(
    headerEls: Map<number, Set<HTMLElement>>,
    spans: TintSpan[],
    visualToHf: (visualIndex: number) => number,
  ): void {
    if (spans.length === 0) {
      return;
    }

    for (const [visualIndex, copies] of headerEls) {
      const hfIndex = visualToHf(visualIndex);

      if (hfIndex < 0) {
        continue;
      }

      let backgroundColor: string | null = null;

      for (const span of spans) {
        if (hfIndex >= span.start && hfIndex <= span.end) {
          backgroundColor = span.backgroundColor;
        }
      }

      if (backgroundColor !== null) {
        const color = backgroundColor;

        copies.forEach((headerEl) => {
          headerEl.style.backgroundColor = color;
          this.#styledHeaderEls.add(headerEl);
        });
      }
    }
  }

  /**
   * Collapses runs into the one run that spans them all.
   *
   * @param {VisualRun[]} runs The runs, sorted.
   * @returns {VisualRun[]}
   */
  #boundingRun(runs: VisualRun[]): VisualRun[] {
    if (runs.length <= 1) {
      return runs;
    }

    return [{ start: runs[0].start, end: runs[runs.length - 1].end }];
  }

  /**
   * Maps an inclusive HyperFormula index span to sorted contiguous visual runs. A span that covers
   * every index of the axis (a whole-column or whole-row reference) is the whole visual axis,
   * whatever the order. Other spans wider than `MAX_HF_INDEX_SCAN` map only their endpoints as one run.
   *
   * @param {number} startHf The first HyperFormula index.
   * @param {number} endHf The last HyperFormula index.
   * @param {Function} hfToVisual Per-axis HyperFormula-to-visual translation.
   * @param {'row' | 'col'} axis The axis the span is on.
   * @returns {VisualRun[]}
   */
  #visualRuns(
    startHf: number,
    endHf: number,
    hfToVisual: (hfIndex: number) => number,
    axis: 'row' | 'col',
  ): VisualRun[] {
    if (endHf - startHf > MAX_HF_INDEX_SCAN) {
      // Every grid index has a HyperFormula index (trimmed ones included), so a span over all of them
      // covers every visual index, in any order.
      const hfCount = axis === 'row' ?
        this.#hot.rowIndexMapper.getNumberOfIndexes() : this.#hot.columnIndexMapper.getNumberOfIndexes();
      const visualCount = axis === 'row' ? this.#hot.countRows() : this.#hot.countCols();

      if (startHf <= 0 && endHf >= hfCount - 1 && visualCount > 0) {
        return [{ start: 0, end: visualCount - 1 }];
      }
    }

    if (endHf - startHf > MAX_HF_INDEX_SCAN) {
      // Walk inward past trimmed ends: a whole-column reference ends on the last sheet row,
      // which a filter may have trimmed, and dropping the whole run would highlight nothing.
      let first = startHf;
      let last = endHf;

      while (first <= last && hfToVisual(first) < 0) {
        first += 1;
      }

      while (last >= first && hfToVisual(last) < 0) {
        last -= 1;
      }

      if (first > last) {
        return [];
      }

      const startVisual = hfToVisual(first);
      const endVisual = hfToVisual(last);

      // The Formulas plugin hands every sort and move to the engine, so its order follows the grid and
      // the span maps onto the band between the endpoints. Reversed endpoints prove it does not here.
      return [{
        start: Math.min(startVisual, endVisual),
        end: Math.max(startVisual, endVisual),
        ...(startVisual > endVisual && { approximate: true }),
      }];
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
