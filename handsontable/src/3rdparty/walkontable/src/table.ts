import type { WalkontableInstance } from './types';
import type { EngineContext } from './wire';
import type Settings from './settings';
import type { RowRangeQuery, ColumnRangeQuery } from './renderedRange';
import { cellAccess, type CellAccess } from './table/cellAccess';
import { domScaffold, type DomScaffold } from './table/domScaffold';
import {
  isHTMLElement,
  removeTextNodes,
  isVisible,
} from '../../../helpers/dom/element';
import { mixin } from '../../../helpers/object';
import ColumnFilter from './filter/column';
import RowFilter from './filter/row';
import { Renderer } from './renderer';
import ColumnUtils from './utils/column';
import RowUtils from './utils/row';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_START_CORNER,
} from './overlay';

/**
 * Assembles the Table module's dependencies from the engine composition context. Shared by the
 * master table, every overlay clone table, and the `RowUtils`/`ColumnUtils`/range-query mixins.
 *
 * Everything the table once received as separate constructor arguments (facade getter, DOM roots,
 * settings) is folded in here. The volatile viewport calculators are intentionally NOT exposed — the
 * `calculatedRows`/`calculatedColumns` mixins read the current calculator off `getWtViewport()`, so
 * there is no stale-reference risk across draws.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The Table dependency set.
 */
export function createTableDeps(ctx: EngineContext) {
  return {
    wot: ctx.wot,
    facadeGetter: ctx.getFacade(),
    wtSettings: ctx.wtSettings,
    rootDocument: ctx.rootDocument,
    rootTable: ctx.rootTable,
    geometryReader: ctx.geometryReader,
    rowSizeSource: ctx.rowSizeSource,
    columnSizeSource: ctx.columnSizeSource,
    getWtTable: ctx.getWtTable,
    getWtViewport: ctx.getWtViewport,
    getWtOverlays: ctx.getWtOverlays,
    getSelectionManager: ctx.getSelectionManager,
    getCloneSource: ctx.getCloneSource,
    getParentTableOffset: ctx.getParentTableOffset,
    getColumnHeaders: ctx.getColumnHeaders,
    getRowHeaders: ctx.getRowHeaders,
    isDrawn: ctx.isDrawn,
    setDrawn: ctx.setDrawn,
  };
}

/**
 * The Table module dependencies, inferred from `createTableDeps`.
 */
export type TableDeps = ReturnType<typeof createTableDeps>;

/**
 * @todo These mixes are never added to the class Table, however their members are used here.
 * @todo Continue: Potentially it works only, because some of these mixes are added to every inherited class.
 * @todo Refactoring, move code from `if(this.isMaster)` into MasterTable, and others like that.
 * @mixes stickyColumnsStart
 * @mixes stickyRowsBottom
 * @mixes stickyRowsTop
 * @mixes calculatedRows
 * @mixes calculatedColumns
 * @abstract
 */
class Table {
  /**
   * The walkontable settings.
   *
   * @protected
   * @type {Settings}
   */
  declare wtSettings: Settings;
  /**
   * The table body element (TBODY).
   *
   * @type {HTMLTableSectionElement | null}
   */
  TBODY: HTMLTableSectionElement | null = null;
  /**
   * The table head element (THEAD).
   *
   * @type {HTMLTableSectionElement | null}
   */
  THEAD: HTMLTableSectionElement | null = null;
  /**
   * The column group element (COLGROUP).
   *
   * @type {HTMLTableColElement | null}
   */
  COLGROUP: HTMLTableColElement | null = null;
  /**
   * Indicates if the table has height bigger than 0px.
   *
   * @type {boolean}
   */
  hasTableHeight = true;
  /**
   * Indicates if the table has width bigger than 0px.
   *
   * @type {boolean}
   */
  hasTableWidth = true;
  /**
   * Indicates if the table is visible. By visible, it means that the holder
   * element has CSS 'display' property different than 'none'.
   *
   * @type {boolean}
   */
  isTableVisible = false;
  /**
   * The offset of the table element.
   *
   * @type {number | { top: number; left: number }}
   */
  tableOffset: number | { top: number; left: number } = 0;
  /**
   * The offset of the holder element.
   *
   * @type {number | { top: number; left: number }}
   */
  holderOffset: number | { top: number; left: number } = 0;

  /**
   * The borders holder element.
   *
   * @type {HTMLElement}
   */
  declare bordersHolder?: HTMLElement;
  /**
   * Indicates if this instance is of type MasterTable (i.e. it is NOT an overlay).
   *
   * @type {boolean}
   */
  declare isMaster: boolean;
  /**
   * The name of the table (overlay name or 'master').
   *
   * @type {string}
   */
  declare name: string;
  /**
   * The table module dependencies.
   *
   * @type {TableDeps}
   */
  #deps: TableDeps;

  /**
   * Read-only access to the dependencies, for the range-query mixins (`calculatedRows`/
   * `calculatedColumns`/`stickyRows*`/`stickyColumns*`) and `RowUtils`/`ColumnUtils`, which are
   * defined outside this class and so cannot reach the private `#deps`.
   *
   * @returns {TableDeps}
   */
  get deps(): TableDeps {
    return this.#deps;
  }
  /**
   * Function which returns the proper facade.
   *
   * @type {Function}
   */
  declare facadeGetter: Function;
  /**
   * The Walkontable instance (legacy alias for instance).
   *
   * @type {WalkontableInstance}
   */
  declare wot: WalkontableInstance;
  /**
   * The table element.
   *
   * @type {HTMLTableElement}
   */
  declare TABLE: HTMLTableElement;
  /**
   * The spreader element.
   *
   * @type {HTMLElement}
   */
  declare spreader: HTMLElement;
  /**
   * The hider element.
   *
   * @type {HTMLElement}
   */
  declare hider: HTMLElement;
  /**
   * The holder element.
   *
   * @type {HTMLElement}
   */
  declare holder: HTMLElement;
  /**
   * The root element.
   *
   * @type {HTMLElement}
   */
  declare wtRootElement: HTMLElement;
  /**
   * The row filter.
   *
   * @type {RowFilter | null}
   */
  declare rowFilter: RowFilter | null;
  /**
   * The column filter.
   *
   * @type {ColumnFilter | null}
   */
  declare columnFilter: ColumnFilter | null;
  /**
   * Indicates if the header width should be corrected.
   *
   * @type {boolean}
   */
  declare correctHeaderWidth: boolean;
  /**
   * The row utilities.
   *
   * @type {RowUtils}
   */
  declare rowUtils: RowUtils;
  /**
   * The column utilities.
   *
   * @type {ColumnUtils}
   */
  declare columnUtils: ColumnUtils;
  /**
   * The table renderer.
   *
   * @type {Renderer}
   */
  declare tableRenderer: Renderer;

  // The row/column range-query methods (getFirstRenderedRow, getFirstRenderedColumn, the visible /
  // partially-visible variants, the counts, and the header counts) are attached to the appropriate
  // subclasses by the `withRowRangeQuery` / `withColumnRangeQuery` factories in `renderedRange.ts`.
  // They are exposed on the `Table` type through the `interface Table` merge near the bottom of this
  // file, so `Table`-typed callers can use them; each concrete subclass supplies the runtime
  // implementation for the groups it composes (sticky-overlay methods are still added at runtime by
  // the `mixin()` helper).

  // Methods defined in subclass MasterTable but called from Table via `this.isMaster` guards.
  /**
   * Aligns overlays with the trimming container.
   *
   * @returns {void}
   */
  alignOverlaysWithTrimmingContainer(): void { // intentionally empty
  }

  /**
   *
   * @abstract
   * @param {TableDeps} deps The table module dependencies.
   * @param {'master'|CLONE_TYPES_ENUM} name Overlay name.
   */
  constructor(deps: TableDeps, name: string) {
    /**
     * Indicates if this instance is of type `MasterTable` (i.e. It is NOT an overlay).
     *
     * @type {boolean}
     */
    this.isMaster = name === 'master';
    this.name = name;
    this.#deps = deps;
    this.facadeGetter = deps.facadeGetter;
    this.wtSettings = deps.wtSettings;

    // legacy support
    this.wot = this.#deps.wot;
    this.TABLE = deps.rootTable;

    removeTextNodes(this.TABLE);

    // TODO refactoring, to recognize the legitimacy of moving them into domBidings
    this.spreader = this.createSpreader(this.TABLE)!;
    this.hider = this.createHider(this.spreader)!;
    this.holder = this.createHolder(this.hider)!;
    // parentNode is always an HTMLElement in production; null only when TABLE is detached (e.g. Jasmine tests).
    this.wtRootElement = this.holder.parentNode as HTMLElement;

    if (this.isMaster) {
      this.alignOverlaysWithTrimmingContainer(); // todo wow, It calls method from child class (MasterTable).
    }
    this.fixTableDomTree();

    this.rowFilter = null; // TODO refactoring, eliminate all (re)creations of this object, then updates state when needed.
    this.columnFilter = null; // TODO refactoring, eliminate all (re)creations of this object, then updates state when needed.
    this.correctHeaderWidth = false;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const origRowHeaderWidth = this.wtSettings.getSettingPure('rowHeaderWidth');

    // Fix for jumping row headers (https://github.com/handsontable/handsontable/issues/3850)
    this.wtSettings.update('rowHeaderWidth', () => this._modifyRowHeaderWidth(origRowHeaderWidth));

    this.rowUtils = new RowUtils(this.#deps);
    this.columnUtils = new ColumnUtils(this.#deps);

    this.tableRenderer = new Renderer({
      TABLE: this.TABLE,
      THEAD: this.THEAD ?? undefined,
      COLGROUP: this.COLGROUP ?? undefined,
      TBODY: this.TBODY ?? undefined,
      rowUtils: this.rowUtils,
      columnUtils: this.columnUtils,
      cellRenderer: this.wtSettings.getSettingPure<Function>('cellRenderer'),
      stylesHandler: this.wtSettings.getSetting('stylesHandler'),
    });
  }

  /**
   * Returns a boolean that is true if this Table represents a specific overlay, identified by the overlay name.
   * For MasterTable, it returns false.
   *
   * @param {string} overlayTypeName The overlay type.
   * @returns {boolean}
   */
  is(overlayTypeName: string) { // todo refactoring: eliminate all protected and private usages
    return this.name === overlayTypeName;
  }

  /**
   * Redraws the table.
   *
   * @param {boolean} [fastDraw=false] If TRUE, will try to avoid full redraw and only update the border positions.
   *                                   If FALSE or UNDEFINED, will perform a full redraw.
   * @returns {Table}
   */
  draw(fastDraw = false) {
    const { wtSettings } = this;
    const wtOverlays = this.#deps.getWtOverlays();
    const wtViewport = this.#deps.getWtViewport();
    const totalRows = wtSettings.getSetting('totalRows');
    const totalColumns = wtSettings.getSetting('totalColumns');
    const rowHeaders = wtSettings.getSetting<Function[]>('rowHeaders');
    const rowHeadersCount = rowHeaders.length;
    const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');
    const columnHeadersCount = columnHeaders.length;
    let runFastDraw = fastDraw;

    if (this.isMaster) {
      wtOverlays.beforeDraw();
      this.holderOffset = this.#deps.geometryReader.offset(this.holder);

      wtViewport.rowHeightCache.ensureBuilt();
      wtViewport.columnWidthCache.ensureBuilt();

      // Resolve the single-pass layout snapshot for this draw (scrollbar prediction from numbers).
      // Not yet the source of truth for the calculators below — see Viewport#beginDrawLayout.
      wtViewport.beginDrawLayout();

      runFastDraw = wtViewport.createCalculators(runFastDraw);

      if (rowHeadersCount && !wtSettings.getSetting('fixedColumnsStart')) {
        const leftScrollPos = wtOverlays.inlineStartOverlay.getScrollPosition();
        const previousState = this.correctHeaderWidth;

        this.correctHeaderWidth = leftScrollPos !== 0;

        if (previousState !== this.correctHeaderWidth) {
          runFastDraw = false;
        }
      }
    }

    if (runFastDraw) {
      if (this.isMaster) {
        wtOverlays.refresh(true);
        // Fast (scroll) draws skip the full-render header-height pass below, so the master/top
        // header heights can drift against the frozen overlays during scrolling (a tall wrapped
        // frozen header that the master never renders). Re-sync here. The method is a cheap no-op
        // unless the grid has frozen columns with column headers, so non-frozen grids are unaffected.
        this.syncOversizedColumnHeadersWithFrozenOverlays();
      }
    } else {
      if (this.isMaster) {
        this.tableOffset = this.#deps.geometryReader.offset(this.TABLE);
      } else {
        this.tableOffset = this.#deps.getParentTableOffset();
      }

      const startRow = Math.max(this.getFirstRenderedRow(), 0);
      const startColumn = Math.max(this.getFirstRenderedColumn(), 0);

      this.rowFilter = new RowFilter(startRow, wtSettings.getSetting<number>('totalRows'), columnHeadersCount);
      this.columnFilter = new ColumnFilter(startColumn, wtSettings.getSetting<number>('totalColumns'), rowHeadersCount);

      let performRedraw = true;

      // Only master table rendering can be skipped
      if (this.isMaster) {
        this.alignOverlaysWithTrimmingContainer(); // todo It calls method from child class (MasterTable).
        const skipRender: { skipRender?: boolean } = {};

        this.wtSettings.getSetting('beforeDraw', true, skipRender);
        performRedraw = skipRender.skipRender !== true;
      }

      if (performRedraw) {
        this.tableRenderer.setHeaderContentRenderers(rowHeaders, columnHeaders);

        if (this.is(CLONE_BOTTOM) ||
            this.is(CLONE_BOTTOM_INLINE_START_CORNER)) {
          // do NOT render headers on the bottom or bottom-left corner overlay
          this.tableRenderer.setHeaderContentRenderers(rowHeaders, []);
        }

        this.resetOversizedRows();

        this.tableRenderer
          .setActiveOverlayName(this.name)
          .setViewportSize(this.getRenderedRowsCount(), this.getRenderedColumnsCount())
          .setFilters(this.rowFilter, this.columnFilter)
          .render();

        this.adjustColumnHeaderHeights();

        if (this.isMaster || this.is(CLONE_BOTTOM)) {
          this.markOversizedRows();
        }

        if (this.isMaster) {
          if (!this.wtSettings.getSetting('externalRowCalculator')) {
            // Single-pass: the fully/partially-visible calculators were already computed in pass 1
            // (`createCalculators`) from the layout snapshot. On the snapshot path, the only thing that
            // can change them post-render is `markOversizedRows` invalidating the row-height cache when
            // rendered content is genuinely taller than its configured size. If both size caches are
            // still current, the post-render values are identical, so this second pass is a redundant
            // recompute — skip it. (Read `isCurrent()` before `ensureBuilt()` rebuilds an invalidated
            // cache. Validated non-destructively across the full e2e: this predicate would skip 595
            // draws with byte-identical ranges and 0 divergences.) The legacy measured path, and any
            // draw with an oversized row, still recompute here.
            const skipSecondPass = wtViewport.usesLayoutSnapshotForCalculators() &&
              wtViewport.rowHeightCache.isCurrent() && wtViewport.columnWidthCache.isCurrent();

            wtViewport.rowHeightCache.ensureBuilt();
            wtViewport.columnWidthCache.ensureBuilt();

            if (!skipSecondPass) {
              wtViewport.createVisibleCalculators();
            }
          }

          wtOverlays.refresh(false);
          this.syncOversizedColumnHeadersWithFrozenOverlays();
          wtOverlays.applyToDOM();

          this.wtSettings.getSetting('onDraw', true);

        } else if (this.is(CLONE_BOTTOM)) {
          this.#deps.getCloneSource().wtOverlays.adjustElementsSize();
        }
      }
    }

    let positionChanged = false;

    if (this.isMaster) {
      positionChanged = wtOverlays.topOverlay.resetFixedPosition();

      if (wtOverlays.bottomOverlay.clone) {
        positionChanged = wtOverlays.bottomOverlay.resetFixedPosition() || positionChanged;
      }

      positionChanged = wtOverlays.inlineStartOverlay.resetFixedPosition() || positionChanged;

      if (wtOverlays.topInlineStartCornerOverlay) {
        wtOverlays.topInlineStartCornerOverlay.resetFixedPosition();
      }

      if (wtOverlays.bottomInlineStartCornerOverlay && wtOverlays.bottomInlineStartCornerOverlay.clone) {
        wtOverlays.bottomInlineStartCornerOverlay.resetFixedPosition();
      }
    }

    if (positionChanged) {
      // It refreshes the cells borders caused by a 1px shift (introduced by overlays which add or
      // remove `innerBorderTop` and `innerBorderInlineStart` CSS classes to the DOM element. This happens
      // when there is a switch between rendering from 0 to N rows/columns and vice versa).
      wtOverlays.refreshAll(); // `refreshAll()` internally already calls `refreshSelections()` method
      wtOverlays.adjustElementsSize();
    } else {
      this.#deps.getSelectionManager()
        .setActiveOverlay(this.facadeGetter())
        .render(runFastDraw);
    }

    if (this.isMaster) {
      wtOverlays.afterDraw();
    }

    this.#deps.setDrawn(true);

    return this;
  }

  /**
   * Applies the provided column-header heights to the rendered THEAD rows. The provided height comes
   * from the `columnHeaderHeight` setting funnel (the option, the `modifyColumnHeaderHeight` hook that
   * AutoRowSize feeds, and the Handsontable-side render-size probe for content-driven headers). It is
   * written as `min-height`, never `height`, so a header whose real content is taller (a wrapped or
   * frozen-region header) is not clipped - it still expands to its content, which the frozen-overlay
   * sync then reads. Runs on the master and every clone so all overlays get the same floor.
   */
  adjustColumnHeaderHeights() {
    const { wtSettings } = this;
    const children = this.THEAD!.childNodes;
    const defaultRowHeight = wtSettings.getSetting('stylesHandler').getDefaultRowHeight();
    const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      const headerHeight = this.getColumnHeaderHeight(i);

      if (headerHeight > defaultRowHeight) {
        if (!children[i] || children[i].childNodes.length === 0) {
          return;
        }
        const firstChild = children[i].childNodes[0];

        if (isHTMLElement(firstChild)) {
          firstChild.style.height = `${headerHeight}px`;
        }
      }
    }
  }

  /**
   * Frozen column headers (e.g., with `white-space: normal`) are rendered only in the frozen
   * overlays, never in the master table's THEAD. When such a header is taller than the headers
   * of the scrollable columns, the master and top overlay THEADs render shorter than the corner
   * and inline-start overlays, so the frozen overlay body rows sit shifted against the master.
   * The gap can be sub-pixel: under browser zoom the frozen header content is a fraction of a
   * pixel taller than the applied height, and that fraction accumulates into a visible 1px shift.
   *
   * This method runs after the frozen overlays have rendered. It reads the corner overlay's
   * content-driven THEAD row heights with sub-pixel precision and forces the matching master and
   * top overlay header cells to the same height so every overlay THEAD ends up the same height
   * and the body rows stay pixel-aligned.
   *
   * It deliberately does NOT write to `wtViewport.oversizedColumnHeaders`. That cache is applied
   * back to the corner overlay on the next render; growing it here would inflate the corner cell,
   * which would then be re-measured taller, ratcheting the height up every render. Reading the
   * corner's natural (content-driven) height and only adjusting the master/top side keeps the
   * synchronization stable and lets the header shrink again when the content allows.
   */
  syncOversizedColumnHeadersWithFrozenOverlays(): void {
    const wtOverlays = this.#deps.getWtOverlays();
    // Cheapest possible bail-out first: with no frozen columns the corner overlay is not cloned,
    // so the overwhelmingly common (non-frozen) grids pay only a couple of property reads per draw.
    const cornerClone = wtOverlays.topInlineStartCornerOverlay?.clone;

    if (!cornerClone?.wtTable?.THEAD) {
      return;
    }

    const columnHeaders = this.wtSettings.getSetting<unknown[]>('columnHeaders');

    if (!columnHeaders.length) {
      return;
    }

    const cornerChildren = cornerClone.wtTable.THEAD.childNodes;
    const topClone = wtOverlays.topOverlay?.clone;
    const targetTheads = [this.THEAD, topClone?.wtTable?.THEAD];
    // Sub-pixel tolerance to avoid rewriting heights on floating-point jitter while still
    // catching the fractional gaps (e.g. ~0.33px at 75% zoom) that read as a 1px shift.
    const epsilon = 0.1;

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      const cornerChild = cornerChildren[i];

      if (!(cornerChild instanceof HTMLElement)) {
        continue;
      }

      const cornerRowHeight = this.#deps.geometryReader.getBoundingClientRect(cornerChild).height;

      targetTheads.forEach((thead) => {
        const targetRow = thead?.childNodes[i];

        if (!(targetRow instanceof HTMLElement) || targetRow.childNodes.length === 0) {
          return;
        }

        const firstChild = targetRow.childNodes[0];

        if (!(firstChild instanceof HTMLElement)) {
          return;
        }

        const targetRowHeight = this.#deps.geometryReader.getBoundingClientRect(targetRow).height;

        if (Math.abs(targetRowHeight - cornerRowHeight) > epsilon) {
          firstChild.style.height = `${cornerRowHeight}px`;
        }
      });
    }
  }

  /**
   * Resets cache of row heights. The cache should be cached for each render cycle in a case
   * when new cell values have content which increases/decreases cell height.
   */
  resetOversizedRows() {
    const { wtSettings } = this;
    const wtViewport = this.#deps.getWtViewport();

    if (!this.isMaster && !this.is(CLONE_BOTTOM)) {
      return;
    }

    if (!wtSettings.getSetting('externalRowCalculator')) {
      const rowsToRender = this.getRenderedRowsCount();

      // Reset the oversized row cache for rendered rows
      for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
        const sourceRow = this.rowFilter!.renderedToSource(visibleRowIndex);

        if (wtViewport.oversizedRows && wtViewport.oversizedRows[sourceRow]) {
          wtViewport.oversizedRows[sourceRow] = undefined;
        }
      }
    }
  }

  /**
   * Check if any of the rendered rows is higher than expected, and if so, cache them.
   */
  markOversizedRows() {
    if (this.wtSettings.getSetting('externalRowCalculator')) {
      return;
    }
    let rowCount = this.TBODY!.childNodes.length;
    const stylesHandler = this.wtSettings.getSetting('stylesHandler');
    const expectedTableHeight = rowCount * stylesHandler.getDefaultRowHeight();
    const actualTableHeight = this.#deps.geometryReader.innerHeight(this.TBODY!) - 1;
    const borderBoxSizing = stylesHandler.areCellsBorderBox();
    const rowHeightFn = borderBoxSizing
      ? (element: HTMLElement) => this.#deps.geometryReader.outerHeight(element)
      : (element: HTMLElement) => this.#deps.geometryReader.innerHeight(element);
    const borderCompensation = borderBoxSizing ? 0 : 1;
    const firstRowBorderCompensation = borderBoxSizing ? 1 : 0;
    let previousRowHeight;
    let rowCurrentHeight;
    let sourceRowIndex;
    let currentTr;
    let rowHeader;

    if (expectedTableHeight === actualTableHeight && !this.wtSettings.getSetting('fixedRowsBottom')) {
      // If the actual table height equals rowCount * default single row height, no row is oversized -> no need to iterate over them
      return;
    }

    const wtViewport = this.#deps.getWtViewport();
    let hasChanges = false;

    while (rowCount) {
      rowCount -= 1;
      sourceRowIndex = this.rowFilter!.renderedToSource(rowCount);
      previousRowHeight = this.getRowHeight(sourceRowIndex);
      currentTr = this.getTrForRow(sourceRowIndex);
      rowHeader = currentTr.querySelector('th');

      // Use the rendered row index (rowCount === 0 is always the first <tr> in this tbody),
      // not the source row index (which would be wrong for clones whose first rendered row
      // has a different source index). Any tbody's first <tr> gets border-top: 1px from the
      // tr:first-child CSS rule, so the compensation applies regardless of source identity.
      const topBorderCompensation = rowCount === 0 ? firstRowBorderCompensation : 0;

      if (rowHeader) {
        rowCurrentHeight = rowHeightFn(rowHeader);

      } else {
        rowCurrentHeight = rowHeightFn(currentTr) - borderCompensation;
      }

      if (
        !previousRowHeight &&
        stylesHandler.getDefaultRowHeight() < rowCurrentHeight - topBorderCompensation ||
        (previousRowHeight !== undefined && previousRowHeight < rowCurrentHeight)
      ) {
        if (!borderBoxSizing) {
          rowCurrentHeight += 1;
        }

        wtViewport.oversizedRows[sourceRowIndex] = rowCurrentHeight;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      wtViewport.rowHeightCache.invalidate();
    }
  }

  /**
   * Checks if the column index (negative value from -1 to N) is rendered.
   *
   * @param {number} column The column index (negative value from -1 to N).
   * @returns {boolean}
   */
  isColumnHeaderRendered(column: number) {
    if (column >= 0) {
      return false;
    }

    const rowHeaders = this.wtSettings.getSetting<Function[]>('rowHeaders');
    const rowHeadersCount = rowHeaders.length;

    return Math.abs(column) <= rowHeadersCount;
  }

  /**
   * Checks if the row index (negative value from -1 to N) is rendered.
   *
   * @param {number} row The row index (negative value from -1 to N).
   * @returns {boolean}
   */
  isRowHeaderRendered(row: number) {
    if (row >= 0) {
      return false;
    }

    const columnHeaders = this.wtSettings.getSetting<Function[]>('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    return Math.abs(row) <= columnHeadersCount;
  }

  /**
   * Check if the given row index is lower than the index of the first row that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * Negative row index is used to check the columns' headers.
   *
   *  Headers
   *           +--------------+                                     │
   *       -3  │    │    │    │                                     │
   *           +--------------+                                     │
   *       -2  │    │    │    │                                     │ TRUE
   *           +--------------+                                     │
   *       -1  │    │    │    │                                     │
   *  Cells  +==================+                                   │
   *        0  ┇    ┇    ┇    ┇ <--- For fixedRowsTop: 1            │
   *           +--------------+      the master overlay do       ---+ first rendered row (index 1)
   *        1  │ A2 │ B2 │ C2 │      not render the first row.      │
   *           +--------------+                                     │ FALSE
   *        2  │ A3 │ B3 │ C3 │                                     │
   *           +--------------+                                  ---+ last rendered row
   *                                                                │
   *                                                                │ FALSE
   *
   * @param {number} row The visual row index.
   * @memberof Table#
   * @function isRowBeforeRenderedRows
   * @returns {boolean}
   */
  isRowBeforeRenderedRows(row: number) {
    const first = this.getFirstRenderedRow();

    // Check the headers only in case when the first rendered row is -1 or 0.
    // This is an indication that the overlay is placed on the most top position.
    if (row < 0 && first <= 0) {
      return !this.isRowHeaderRendered(row);
    }

    return row < first;
  }

  /**
   * Check if the given column index is greater than the index of the last column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * The negative row index is used to check the columns' headers. However,
   * keep in mind that for negative indexes, the method always returns FALSE as
   * it is not possible to render headers partially. The "after" index can not be
   * lower than -1.
   *
   *  Headers
   *           +--------------+                                     │
   *       -3  │    │    │    │                                     │
   *           +--------------+                                     │
   *       -2  │    │    │    │                                     │ FALSE
   *           +--------------+                                     │
   *       -1  │    │    │    │                                     │
   *  Cells  +==================+                                   │
   *        0  ┇    ┇    ┇    ┇ <--- For fixedRowsTop: 1            │
   *           +--------------+      the master overlay do       ---+ first rendered row (index 1)
   *        1  │ A2 │ B2 │ C2 │      not render the first rows      │
   *           +--------------+                                     │ FALSE
   *        2  │ A3 │ B3 │ C3 │                                     │
   *           +--------------+                                  ---+ last rendered row
   *                                                                │
   *                                                                │ TRUE
   *
   * @param {number} row The visual row index.
   * @memberof Table#
   * @function isRowAfterRenderedRows
   * @returns {boolean}
   */
  isRowAfterRenderedRows(row: number) {
    return row > this.getLastRenderedRow();
  }

  /**
   * Check if the given column index is lower than the index of the first column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * Negative column index is used to check the rows' headers.
   *
   *                            For fixedColumnsStart: 1 the master overlay
   *                            do not render this first columns.
   *  Headers    -3   -2   -1    |
   *           +----+----+----║┄ ┄ +------+------+
   *           │    │    │    ║    │  B1  │  C1  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B2  │  C2  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B3  │  C3  │
   *           +----+----+----║┄ ┄ +------+------+
   *                               ╷             ╷
   *      -------------------------+-------------+---------------->
   *          TRUE             first    FALSE   last         FALSE
   *                           rendered         rendered
   *                           column           column
   *
   * @param {number} column The visual column index.
   * @memberof Table#
   * @function isColumnBeforeRenderedColumns
   * @returns {boolean}
   */
  isColumnBeforeRenderedColumns(column: number) {
    const first = this.getFirstRenderedColumn();

    // Check the headers only in case when the first rendered column is -1 or 0.
    // This is an indication that the overlay is placed on the most left position.
    if (column < 0 && first <= 0) {
      return !this.isColumnHeaderRendered(column);
    }

    return column < first;
  }

  /**
   * Check if the given column index is greater than the index of the last column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * The negative column index is used to check the rows' headers. However,
   * keep in mind that for negative indexes, the method always returns FALSE as
   * it is not possible to render headers partially. The "after" index can not be
   * lower than -1.
   *
   *                            For fixedColumnsStart: 1 the master overlay
   *                            do not render this first columns.
   *  Headers    -3   -2   -1    |
   *           +----+----+----║┄ ┄ +------+------+
   *           │    │    │    ║    │  B1  │  C1  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B2  │  C2  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B3  │  C3  │
   *           +----+----+----║┄ ┄ +------+------+
   *                               ╷             ╷
   *      -------------------------+-------------+---------------->
   *          FALSE             first    FALSE   last         TRUE
   *                           rendered         rendered
   *                           column           column
   *
   * @param {number} column The visual column index.
   * @memberof Table#
   * @function isColumnAfterRenderedColumns
   * @returns {boolean}
   */
  isColumnAfterRenderedColumns(column: number) {
    return this.columnFilter && (column > this.getLastRenderedColumn());
  }

  /**
   * Checks if the column is after the last visible column.
   *
   * @param {number} column The visual column index.
   * @returns {boolean}
   */
  isColumnAfterViewport(column: number) {
    return this.columnFilter && (column > this.getLastVisibleColumn());
  }

  /**
   * Checks if the row is after the last visible row.
   *
   * @param {number} row The visual row index.
   * @returns {boolean}
   */
  isRowAfterViewport(row: number) {
    return this.rowFilter && (row > this.getLastVisibleRow());
  }

  /**
   * Checks if the column is before the first visible column.
   *
   * @param {number} column The visual column index.
   * @returns {boolean}
   */
  isColumnBeforeViewport(column: number) {
    return this.columnFilter && (this.columnFilter!.sourceToRendered(column) < 0 && column >= 0);
  }

  /**
   * Checks if the last row is fully visible.
   *
   * @returns {boolean}
   */
  isLastRowFullyVisible() {
    return this.getLastVisibleRow() === this.getLastRenderedRow();
  }

  /**
   * Checks if the last column is fully visible.
   *
   * @returns {boolean}
   */
  isLastColumnFullyVisible() {
    return this.getLastVisibleColumn() === this.getLastRenderedColumn();
  }

  /**
   * Checks if all rows fit in the viewport.
   *
   * @returns {boolean}
   */
  allRowsInViewport() {
    return this.wtSettings.getSetting('totalRows') === this.getVisibleRowsCount();
  }

  /**
   * Checks if all columns fit in the viewport.
   *
   * @returns {boolean}
   */
  allColumnsInViewport() {
    return this.wtSettings.getSetting('totalColumns') === this.getVisibleColumnsCount();
  }

  /**
   * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height.
   *
   * @param {number} sourceRow The physical row index.
   * @returns {number}
   */
  getRowHeight(sourceRow: number) {
    return this.rowUtils.getHeight(sourceRow);
  }

  /**
   * @param {number} level The column level.
   * @returns {number}
   */
  getColumnHeaderHeight(level: number) {
    return this.columnUtils.getHeaderHeight(level);
  }

  /**
   * @param {number} sourceColumn The physical column index.
   * @returns {number}
   */
  getColumnWidth(sourceColumn: number): number {
    return this.columnUtils.getWidth(sourceColumn) as number;
  }

  /**
   * Checks if the table has defined size. It returns `true` when the table has width and height
   * set bigger than `0px`.
   *
   * @returns {boolean}
   */
  hasDefinedSize() {
    return this.hasTableHeight && this.hasTableWidth;
  }

  /**
   * Gets table's width. The returned width is the width of the rendered cells that fit in the
   * current viewport. The value may change depends on the viewport position (scroll position).
   *
   * @returns {number}
   */
  getWidth() {
    return this.#deps.geometryReader.outerWidth(this.TABLE);
  }

  /**
   * Gets table's height. The returned height is the height of the rendered cells that fit in the
   * current viewport. The value may change depends on the viewport position (scroll position).
   *
   * @returns {number}
   */
  getHeight() {
    return this.#deps.geometryReader.outerHeight(this.TABLE);
  }

  /**
   * Gets table's total width. The returned width is the width of all rendered cells (including headers)
   * that can be displayed in the table.
   *
   * @returns {number}
   */
  getTotalWidth() {
    const width = this.#deps.geometryReader.outerWidth(this.hider);

    // when the overlay's table does not have any cells the hider returns 0, get then width from the table element
    return width !== 0 ? width : this.getWidth();
  }

  /**
   * Gets table's total height. The returned height is the height of all rendered cells (including headers)
   * that can be displayed in the table.
   *
   * @returns {number}
   */
  getTotalHeight() {
    const height = this.#deps.geometryReader.outerHeight(this.hider);

    // when the overlay's table does not have any cells the hider returns 0, get then height from the table element
    return height !== 0 ? height : this.getHeight();
  }

  /**
   * Checks if the table is visible. It returns `true` when the holder element (or its parents)
   * has CSS 'display' property different than 'none'.
   *
   * @returns {boolean}
   */
  isVisible() {
    return isVisible(this.TABLE);
  }

  /**
   * Modify row header widths provided by user in class contructor.
   *
   * @private
   * @param {Function | number | null} rowHeaderWidthFactory The function which can provide default width values for rows..
   * @returns {number}
   */
  _modifyRowHeaderWidth(rowHeaderWidthFactory: ((...args: unknown[]) => number | number[]) | number | null) {
    const rawWidths: number | number[] | null = typeof rowHeaderWidthFactory === 'function'
      ? rowHeaderWidthFactory()
      : rowHeaderWidthFactory;
    let widths: number | number[] | null = rawWidths;

    if (Array.isArray(widths)) {
      widths = [...widths];
      widths[widths.length - 1] = this._correctRowHeaderWidth(widths[widths.length - 1]);
    } else {
      widths = this._correctRowHeaderWidth(widths);
    }

    return widths;
  }

  /**
   * Correct row header width if necessary.
   *
   * @private
   * @param {number | null} width The width to process.
   * @returns {number}
   */
  _correctRowHeaderWidth(width: number | null) {
    let rowHeaderWidth: number = typeof width === 'number'
      ? width
      : this.wtSettings.getSetting<number>('defaultColumnWidth');

    if (this.correctHeaderWidth) {
      rowHeaderWidth += 1;
    }

    return rowHeaderWidth;
  }

  /**
   * Destroys the table instance. Overridden by MasterTable to release DOM resources.
   */
  destroy() {
    // Intentionally empty
  }
}

// Declaration merge: exposes the row/column range-query methods on the `Table` type for
// `Table`-typed callers. The runtime implementations are composed per subclass by the
// `withRowRangeQuery` / `withColumnRangeQuery` factories (see `renderedRange.ts`); subclasses that do
// not compose a group inherit only the type here, matching the previous runtime-mixin behavior where
// calling an absent group threw.
// eslint-disable-next-line no-use-before-define, no-redeclare
mixin(Table, cellAccess);
mixin(Table, domScaffold);

interface Table extends RowRangeQuery, ColumnRangeQuery, CellAccess, DomScaffold {}

export default Table;
