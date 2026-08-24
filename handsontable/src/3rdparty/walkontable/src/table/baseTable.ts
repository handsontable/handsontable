import type { WalkontableInstance } from '../types';
import type { EngineContext } from '../wire';
import type Settings from '../settings';
import type { RowRangeQuery, ColumnRangeQuery } from './rangeQuery/renderedRange';
import { cellAccess, type CellAccess } from './cellAccess';
import { domScaffold, type DomScaffold } from './domScaffold';
import sizeGetters, { type SizeGetters } from '../axisSizing/sizeGetters';
import viewportPredicates, { type ViewportPredicates } from './rangeQuery/viewportPredicates';
import {
  removeTextNodes,
} from '../../../../helpers/dom/element';
import { mixin } from '../../../../helpers/object';
import type ColumnFilter from '../filter/column';
import type RowFilter from '../filter/row';
import { Renderer } from '../render';
import ColumnUtils from '../axisSizing/columnUtils';
import RowUtils from '../axisSizing/rowUtils';
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
