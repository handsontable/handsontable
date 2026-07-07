import type { WalkontableInstance } from '../types';
import type { EngineContext } from '../wire';
import type Settings from '../settings';
import type { RowRangeQuery, ColumnRangeQuery } from './rangeQuery/renderedRange';
import { cellAccess, type CellAccess } from './cellAccess';
import { domScaffold, type DomScaffold } from './domScaffold';
import sizeGetters, { type SizeGetters } from '../axisSizing/sizeGetters';
import viewportPredicates, { type ViewportPredicates } from './rangeQuery/viewportPredicates';
import {
  isHTMLElement,
  removeTextNodes,
} from '../../../../helpers/dom/element';
import { mixin } from '../../../../helpers/object';
import type ColumnFilter from '../filter/column';
import type RowFilter from '../filter/row';
import { Renderer } from '../render';
import ColumnUtils from '../axisSizing/columnUtils';
import RowUtils from '../axisSizing/rowUtils';
import { CLONE_BOTTOM } from '../overlay';
import { runDrawCycle } from './drawCycle';

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
    runDrawCycle(this, fastDraw);

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
mixin(Table, sizeGetters);
mixin(Table, viewportPredicates);

interface Table extends
  RowRangeQuery, ColumnRangeQuery, CellAccess, DomScaffold, SizeGetters, ViewportPredicates {}

export default Table;
