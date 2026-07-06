import type { WalkontableInstance } from '../types';
import type { EngineContext } from '../wire';
import type Settings from '../settings';
import type Table from '../table/baseTable';
import type EventManager from '../../../../eventManager';
import type { CalculationTypeLike, ColumnsCalculationType, RowsCalculationType } from '../calculator/viewportBase';
import { mixin, objectEach } from '../../../../helpers/object';
import {
  FullyVisibleColumnsCalculationType,
  FullyVisibleRowsCalculationType,
  PartiallyVisibleColumnsCalculationType,
  PartiallyVisibleRowsCalculationType,
  RenderedAllColumnsCalculationType,
  RenderedAllRowsCalculationType,
  RenderedColumnsCalculationType,
  RenderedRowsCalculationType,
} from '../calculator';
import { PositionCache } from '../axisSizing/positionCache';
import { DEFAULT_COLUMN_WIDTH } from '../constants';
import { workspaceSize, type WorkspaceSize } from './workspaceSize';
import { calculatorFactory, type CalculatorFactory } from './calculatorFactory';
import { createLayoutDeps, gatherLayoutInput, type LayoutDeps } from './boxLayout/gatherLayoutInput';
import { resolveLayout } from './boxLayout/resolveLayout';
import type { LayoutSnapshot } from './boxLayout/layoutSnapshot';

/**
 * Assembles the Viewport module's dependencies from the engine composition context.
 *
 * Everything the Viewport once received as separate constructor arguments (DOM bindings, settings,
 * event manager, table) now flows through this one object. The `EventManager` is created once here
 * (matching the previous per-module `this.eventManager`), and the table is resolved concretely
 * because the Viewport is constructed after the master table exists.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The Viewport dependency set.
 */
export function createViewportDeps(ctx: EngineContext) {
  return {
    wot: ctx.wot,
    rootDocument: ctx.rootDocument,
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    rowSizeSource: ctx.rowSizeSource,
    columnSizeSource: ctx.columnSizeSource,
    layoutDeps: createLayoutDeps(ctx),
    wtSettings: ctx.wtSettings,
    eventManager: ctx.makeEventManager(),
    wtTable: ctx.getWtTable(),
    getTopOverlay: ctx.getTopOverlay,
    getInlineStartOverlay: ctx.getInlineStartOverlay,
    getBottomOverlay: ctx.getBottomOverlay,
  };
}

/**
 * The Viewport module dependencies, inferred from `createViewportDeps`.
 */
export type ViewportDeps = ReturnType<typeof createViewportDeps>;

/**
 * The Viewport owns the per-draw calculator objects and the size prefix-sum caches. Its
 * workspace-size / scroll-detection queries and its calculator-creation logic are supplied by two
 * mixins (`workspaceSize`, `calculatorFactory`); the method bodies live in their own files so the
 * single-pass refactor can rework the workspace-size group in isolation. The mixin methods reach the
 * private dependency set through the public `deps` getter.
 *
 * @class Viewport
 */
class Viewport {
  /**
   * The Viewport module dependencies.
   *
   * @type {ViewportDeps}
   */
  #deps: ViewportDeps;
  /**
   * The layout slice's dependency set — the input-gathering seam for the single-pass snapshot.
   *
   * @type {LayoutDeps}
   */
  #layoutDeps: LayoutDeps;
  /**
   * The layout snapshot resolved at the top of the current draw, or `null` between draws / after an
   * invalidation. Computed by `beginDrawLayout()`; read through `getLayout()`.
   *
   * @type {LayoutSnapshot | null}
   */
  #layout: LayoutSnapshot | null = null;
  /**
   * @type {WalkontableInstance}
   */
  declare wot: WalkontableInstance;
  /**
   * @type {Settings}
   */
  declare wtSettings: Settings;
  /**
   * @type {Table}
   */
  declare wtTable: Table;
  /**
   * @type {Record<number, number | undefined>}
   */
  declare oversizedRows: Record<number, number | undefined>;
  /**
   * @type {Record<string, unknown>}
   */
  declare hasOversizedColumnHeadersMarked: Record<string, unknown>;
  /**
   * @type {number}
   */
  declare clientHeight: number;
  /**
   * @type {number}
   */
  declare columnHeaderHeight: number;
  /**
   * @type {number}
   */
  declare rowHeaderWidth: number;
  /**
   * @type {RowsCalculationType | null}
   */
  declare rowsVisibleCalculator: RowsCalculationType | null;
  /**
   * @type {ColumnsCalculationType | null}
   */
  declare columnsVisibleCalculator: ColumnsCalculationType | null;
  /**
   * @type {Map<string, () => CalculationTypeLike>}
   */
  declare rowsCalculatorTypes: Map<string, () => CalculationTypeLike>;
  /**
   * @type {Map<string, () => CalculationTypeLike>}
   */
  declare columnsCalculatorTypes: Map<string, () => CalculationTypeLike>;
  /**
   * @type {EventManager}
   */
  declare eventManager: EventManager;
  /**
   * @type {RowsCalculationType | null}
   */
  declare rowsRenderCalculator: RowsCalculationType | null;
  /**
   * @type {ColumnsCalculationType | null}
   */
  declare columnsRenderCalculator: ColumnsCalculationType | null;
  /**
   * @type {RowsCalculationType | null}
   */
  declare rowsPartiallyVisibleCalculator: RowsCalculationType | null;
  /**
   * @type {ColumnsCalculationType | null}
   */
  declare columnsPartiallyVisibleCalculator: ColumnsCalculationType | null;
  /**
   * @type {PositionCache}
   */
  declare rowHeightCache: PositionCache;
  /**
   * @type {PositionCache}
   */
  declare columnWidthCache: PositionCache;

  /**
   * Read-only access to the dependencies, for the `workspaceSize` / `calculatorFactory` mixins, which
   * are defined outside this class and so cannot reach the private `#deps`.
   *
   * @returns {ViewportDeps}
   */
  get deps(): ViewportDeps {
    return this.#deps;
  }

  /**
   * @param {ViewportDeps} deps The Viewport module dependencies.
   */
  constructor(deps: ViewportDeps) {
    const { wtSettings, wtTable, rowSizeSource, columnSizeSource } = deps;

    this.#deps = deps;
    this.#layoutDeps = deps.layoutDeps;
    // legacy support
    this.wot = deps.wot;
    this.wtSettings = wtSettings;
    this.wtTable = wtTable;
    this.oversizedRows = {};
    this.hasOversizedColumnHeadersMarked = {};
    this.clientHeight = 0;
    this.rowHeaderWidth = NaN;
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;
    type CalcTypeFactory = () => CalculationTypeLike;

    this.rowsCalculatorTypes = new Map<string, CalcTypeFactory>([
      ['rendered', () => (this.wtSettings.getSetting('renderAllRows') ?
        new RenderedAllRowsCalculationType() : new RenderedRowsCalculationType())],
      ['fullyVisible', () => new FullyVisibleRowsCalculationType()],
      ['partiallyVisible', () => new PartiallyVisibleRowsCalculationType()],
    ]);
    this.columnsCalculatorTypes = new Map<string, CalcTypeFactory>([
      ['rendered', () => (this.wtSettings.getSetting('renderAllColumns') ?
        new RenderedAllColumnsCalculationType() : new RenderedColumnsCalculationType())],
      ['fullyVisible', () => new FullyVisibleColumnsCalculationType()],
      ['partiallyVisible', () => new PartiallyVisibleColumnsCalculationType()],
    ]);

    /**
     * Cumulative row height prefix sum cache. Enables O(log n) scroll-to-row lookups
     * when custom row heights are configured.
     *
     * @type {PositionCache}
     */
    this.rowHeightCache = new PositionCache({
      totalItemsFn: () => wtSettings.getSetting<number>('totalRows'),
      // The size must stay the MERGED value (`Math.max(provided, oversized)`), so it reads
      // `wtTable.getRowHeight` — not `rowSizeSource.getSize`, which supplies only the provided half.
      // This is the LOGICAL row height; the constant relating it to the pixel height the renderer
      // writes lives in `getBoxAdjustedRowHeight` (axisSizing/boxModel.ts). Do not box-adjust it here —
      // the calculators and `sumCellSizes` sum this value and expect the logical height.
      sizeFn: sourceRow => wtTable.getRowHeight(sourceRow) ?? NaN,
      defaultSizeFn: () => rowSizeSource.getDefaultSize(),
      // Uniform fast path: every row is the default height only when the source reports it (no per-row
      // `rowHeights`/`minRowHeights`, no `modifyRowHeight` hook) AND walkontable has measured no
      // oversized rows. Any of these invalidates the cache, so the next build re-evaluates this.
      isUniformFn: () => rowSizeSource.isUniform() &&
        Object.keys(this.oversizedRows).length === 0,
    });
    /**
     * Cumulative column width prefix sum cache. Enables O(log n) scroll-to-column lookups
     * when custom column widths are configured.
     *
     * @type {PositionCache}
     */
    this.columnWidthCache = new PositionCache({
      totalItemsFn: () => wtSettings.getSetting<number>('totalColumns'),
      sizeFn: sourceCol => wtTable.getColumnWidth(sourceCol),
      defaultSizeFn: () => DEFAULT_COLUMN_WIDTH,
      // Uniform fast path: every column is the default width only when the source reports it (no
      // per-column `colWidths`, no `modifyColWidth` hook — note `autoColumnSize` is on by default and
      // registers that hook, so this is true only when `colWidths` is set).
      isUniformFn: () => columnSizeSource.isUniform(),
    });

    this.eventManager = deps.eventManager;
    this.eventManager.addEventListener(this.#deps.rootWindow, 'resize', () => {
      this.clientHeight = this.getWorkspaceHeight();
      this.invalidateLayout();
    });
  }

  /**
   * Resolves the layout snapshot for the draw that is starting, stores it, and returns it. Called
   * once per master draw, after the size caches are built and before the calculators run, so the
   * snapshot reflects the geometry the draw will render into.
   *
   * The snapshot is not yet the source of truth for the calculators or the scroll-detection queries.
   * Consuming it is a genuine behavior change — on the first draw the snapshot predicts a scrollbar
   * from content totals while the live DOM still shows none, which shifts the rendered row/column
   * counts — so it is sequenced into the single-pass stages (S13-S16) under the maximal test gate,
   * not this behavior-preserving stage. S11 only validates that the snapshot matches the live
   * measurement (see the `getLayout()` assertions in `viewport.spec.js`) and fixes its input bugs so
   * that later consumption changes only timing, not pixels.
   *
   * @returns {LayoutSnapshot}
   */
  beginDrawLayout(): LayoutSnapshot {
    this.#layout = resolveLayout(gatherLayoutInput(this.#layoutDeps));

    return this.#layout;
  }

  /**
   * Returns the current layout snapshot. Recomputes lazily when there is none (between draws, or after
   * an invalidation) so API callers outside the draw get a fresh answer.
   *
   * @returns {LayoutSnapshot}
   */
  getLayout(): LayoutSnapshot {
    if (this.#layout === null) {
      this.#layout = resolveLayout(gatherLayoutInput(this.#layoutDeps));
    }

    return this.#layout;
  }

  /**
   * Drops the cached layout snapshot so the next `getLayout()` recomputes it. Called whenever the
   * geometry that feeds the snapshot may have changed (a resize or a size-cache invalidation).
   */
  invalidateLayout() {
    this.#layout = null;
  }

  /**
   * Marks the row height position cache as stale. The cache will be rebuilt
   * on the next viewport calculation.
   */
  invalidateRowHeightCache() {
    this.rowHeightCache.invalidate();
    this.invalidateLayout();
  }

  /**
   * Marks the column width position cache as stale. The cache will be rebuilt
   * on the next viewport calculation.
   */
  invalidateColumnWidthCache() {
    this.columnWidthCache.invalidate();
    this.invalidateLayout();
  }

  /**
   * Marks both the row height and column width position caches as stale.
   */
  invalidateAllCaches() {
    this.rowHeightCache.invalidate();
    this.columnWidthCache.invalidate();
    this.invalidateLayout();
  }

  /**
   * Resets values in keys of the hasOversizedColumnHeadersMarked object after updateSettings.
   */
  resetHasOversizedColumnHeadersMarked() {
    objectEach(this.hasOversizedColumnHeadersMarked, (value: unknown, key: string, object: Record<string, unknown>) => {
      object[key] = undefined;
    });
  }
}

// The workspace-size and calculator-creation methods are supplied by mixins; their signatures are
// merged onto the `Viewport` type through this interface declaration (same pattern as the range-query
// mixins on `Table`). A method group not mixed in would have no runtime implementation.
interface Viewport extends WorkspaceSize, CalculatorFactory {}

mixin(Viewport, workspaceSize);
mixin(Viewport, calculatorFactory);

export default Viewport;
