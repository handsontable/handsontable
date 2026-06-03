import type from './types';
import type Settings from './settings';
import {
  hasClass,
  index,
  offset,
  removeTextNodes,
  overlayContainsElement,
  closest,
  outerHeight,
  outerWidth,
  innerHeight,
  isVisible,
  setAttribute,
} from '../../../helpers/dom/element';
import from '../../../helpers/function';
import ColumnFilter from './filter/column';
import RowFilter from './filter/row';
import from './renderer';
import ColumnUtils from './utils/column';
import RowUtils from './utils/row';
import {
  CLONE_TOP,
  CLONE_BOTTOM,
  CLONE_INLINE_START,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
} from './overlay';
import from '../../../helpers/a11y';
import from '../../../helpers/errors';

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
   */
  declare wtSettings: Settings;
  /**
   * Bindings to DOM nodes shared across all table instances.
   */
  domBindings;
  /**
   * The rendered table body section element.
   */
  TBODY: HTMLTableSectionElement | null = null;
  /**
   * The rendered table header section element.
   */
  THEAD: HTMLTableSectionElement | null = null;
  /**
   * The rendered column group element that controls column widths.
   */
  COLGROUP: HTMLTableColElement | null = null;
  /**
   * Indicates if the table has height bigger than 0px.
   *
   */
  hasTableHeight = true;
  /**
   * Indicates if the table has width bigger than 0px.
   *
   */
  hasTableWidth = true;
  /**
   * Indicates if the table is visible. By visible, it means that the holder
   * element has CSS 'display' property different than 'none'.
   *
   */
  isTableVisible = false;
  /**
   * Cached offset of the TABLE element relative to the document, updated before each full redraw.
   */
  tableOffset: number | = 0;
  /**
   * Cached offset of the holder element relative to the document, updated before each full redraw.
   */
  holderOffset: number | = 0;

  /**
   * Container element for selection border overlays.
   */
  declare bordersHolder?: HTMLElement;
  /**
   * Indicates if this instance is the master table (not an overlay clone).
   */
  declare isMaster: boolean;
  /**
   * Identifies the overlay type (e.g. `'master'`, `'top'`, `'inline_start'`) or `'master'` for the main table.
   */
  declare name: string;
  /**
   * Data access object that bridges Walkontable to the core Handsontable instance.
   */
  declare dataAccessObject: DataAccessObject;
  /**
   * Function that returns the public facade instance for the current Walkontable.
   */
  declare facadeGetter: Function;
  /**
   * Reference to the Walkontable instance (legacy alias; prefer `wot`).
   */
  declare instance: WalkontableInstance;
  /**
   * Reference to the Walkontable instance.
   */
  declare wot: WalkontableInstance;
  /**
   * The root `<table>` DOM element managed by this instance.
   */
  declare TABLE: HTMLTableElement;
  /**
   * Wrapper `<div class="wtSpreader">` element that positions the table inside the hider.
   */
  declare spreader: HTMLElement;
  /**
   * Wrapper `<div class="wtHider">` element that clips overflow for the table.
   */
  declare hider: HTMLElement;
  /**
   * Scroll container `<div class="wtHolder">` element that receives scroll events.
   */
  declare holder: HTMLElement;
  /**
   * The root element of the Walkontable DOM subtree — the direct parent of the holder element.
   */
  declare wtRootElement: HTMLElement;
  /**
   * Filter that translates between source and rendered row indexes for this overlay.
   */
  declare rowFilter: RowFilter | null;
  /**
   * Filter that translates between source and rendered column indexes for this overlay.
   */
  declare columnFilter: ColumnFilter | null;
  /**
   * When true, adds 1px to the last row-header column width to compensate for a subpixel shift when the table is scrolled.
   */
  declare correctHeaderWidth: boolean;
  /**
   * Utility that provides row height information for the current viewport.
   */
  declare rowUtils: RowUtils;
  /**
   * Utility that provides column width information for the current viewport.
   */
  declare columnUtils: ColumnUtils;
  /**
   * The renderer instance responsible for building and updating the DOM table structure.
   */
  declare tableRenderer: Renderer;

  // Methods provided by mixins (calculatedRows, calculatedColumns, stickyRowsTop,
  // stickyRowsBottom, stickyColumnsStart) applied to Table subclasses at runtime.
  /**
   * Returns the index of the first rendered row in the current viewport.
   */
  declare getFirstRenderedRow: () => number;
  /**
   * Returns the index of the first fully visible row in the current viewport.
   */
  declare getFirstVisibleRow: () => number;
  /**
   * Returns the index of the first at least partially visible row in the current viewport.
   */
  declare getFirstPartiallyVisibleRow: () => number;
  /**
   * Returns the index of the last rendered row in the current viewport.
   */
  declare getLastRenderedRow: () => number;
  /**
   * Returns the index of the last fully visible row in the current viewport.
   */
  declare getLastVisibleRow: () => number;
  /**
   * Returns the index of the last at least partially visible row in the current viewport.
   */
  declare getLastPartiallyVisibleRow: () => number;
  /**
   * Returns the total number of rendered rows in the current viewport.
   */
  declare getRenderedRowsCount: () => number;
  /**
   * Returns the total number of fully visible rows in the current viewport.
   */
  declare getVisibleRowsCount: () => number;
  /**
   * Returns the number of column header rows rendered above the data area.
   */
  declare getColumnHeadersCount: () => number;
  /**
   * Returns the index of the first rendered column in the current viewport.
   */
  declare getFirstRenderedColumn: () => number;
  /**
   * Returns the index of the first fully visible column in the current viewport.
   */
  declare getFirstVisibleColumn: () => number;
  /**
   * Returns the index of the first at least partially visible column in the current viewport.
   */
  declare getFirstPartiallyVisibleColumn: () => number;
  /**
   * Returns the index of the last rendered column in the current viewport.
   */
  declare getLastRenderedColumn: () => number;
  /**
   * Returns the index of the last fully visible column in the current viewport.
   */
  declare getLastVisibleColumn: () => number;
  /**
   * Returns the index of the last at least partially visible column in the current viewport.
   */
  declare getLastPartiallyVisibleColumn: () => number;
  /**
   * Returns the total number of rendered columns in the current viewport.
   */
  declare getRenderedColumnsCount: () => number;
  /**
   * Returns the total number of fully visible columns in the current viewport.
   */
  declare getVisibleColumnsCount: () => number;
  /**
   * Returns the number of row header columns rendered to the left of the data area.
   */
  declare getRowHeadersCount: () => number;

  // Methods defined in subclass MasterTable but called from Table via `this.isMaster` guards.
  /**
   * Aligns the overlay container elements with the trimming container boundaries.
   * Overridden in MasterTable; the base implementation is intentionally empty.
   */
  alignOverlaysWithTrimmingContainer(): void { // intentionally empty
  }
  /**
   * Marks column headers whose rendered height exceeds the default row height as oversized.
   * Overridden in MasterTable; the base implementation is intentionally empty.
   */
  markOversizedColumnHeaders(): void { // intentionally empty
  }

  /**
   *
   * @abstract
   * @param dataAccessObject The data access object.
   * @param facadeGetter Function which return proper facade.
   * @param domBindings Bindings into DOM.
   * @param wtSettings The Walkontable settings.
   * @param name Overlay name.
   */
  constructor(
    dataAccessObject: DataAccessObject, facadeGetter: Function, domBindings: DomBindings,
    wtSettings: Settings, name: string) {
    this.domBindings = domBindings;
    /**
     * Indicates if this instance is of type `MasterTable` (i.e. It is NOT an overlay).
     *
     */
    this.isMaster = name === 'master';
    this.name = name;
    this.dataAccessObject = dataAccessObject;
    this.facadeGetter = facadeGetter;
    this.wtSettings = wtSettings;

    // legacy support
    this.instance = this.dataAccessObject.wot; // TODO refactoring: it might be removed here, and provides legacy support through facade.
    this.wot = this.dataAccessObject.wot;
    this.TABLE = domBindings.rootTable;

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

    this.rowUtils = new RowUtils(this.dataAccessObject, this.wtSettings); // TODO refactoring, It can be passed through IOC.
    this.columnUtils = new ColumnUtils(this.dataAccessObject, this.wtSettings); // TODO refactoring, It can be passed through IOC.

    this.tableRenderer = new Renderer({ // TODO refactoring, It can be passed through IOC.
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
   * @param overlayTypeName The overlay type.
   * @returns 
   */
  is(overlayTypeName: string) { // todo refactoring: eliminate all protected and private usages
    return this.name === overlayTypeName;
  }

  /**
   *
   */
  fixTableDomTree() {
    const rootDocument = this.domBindings.rootDocument;

    this.TBODY = this.TABLE.querySelector('tbody');

    if (!this.TBODY) {
      this.TBODY = rootDocument.createElement('tbody');
      this.TABLE.appendChild(this.TBODY);
    }
    this.THEAD = this.TABLE.querySelector('thead');

    if (!this.THEAD) {
      this.THEAD = rootDocument.createElement('thead');
      this.TABLE.insertBefore(this.THEAD, this.TBODY);
    }
    this.COLGROUP = this.TABLE.querySelector('colgroup');

    if (!this.COLGROUP) {
      this.COLGROUP = rootDocument.createElement('colgroup');
      this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
    }
  }

  /**
   * @param table An element to process.
   * @returns 
   */
  createSpreader(table: HTMLTableElement) {
    const parent = table.parentNode;
    let spreader: HTMLDivElement | undefined;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !(parent instanceof HTMLElement) || !hasClass(parent, 'wtHolder')) {
      spreader = this.domBindings.rootDocument.createElement('div');
      spreader.className = 'wtSpreader';

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        parent.insertBefore(spreader, table);
      }
      spreader.appendChild(table);
    }

    if (spreader) {
      spreader.style.position = 'relative';

      if (this.wtSettings.getSetting('ariaTags')) {
        setAttribute(spreader, [
          A11Y_PRESENTATION()
        ]);
      }
    }

    return spreader;
  }

  /**
   * @param spreader An element to the hider element is injected.
   * @returns 
   */
  createHider(spreader: HTMLElement) {
    const parent = spreader.parentNode;
    let hider: HTMLDivElement | undefined;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !(parent instanceof HTMLElement) || !hasClass(parent, 'wtHolder')) {
      hider = this.domBindings.rootDocument.createElement('div');
      hider.className = 'wtHider';

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        parent.insertBefore(hider, spreader);
      }
      hider.appendChild(spreader);
    }

    if (hider && this.wtSettings.getSetting('ariaTags')) {
      setAttribute(hider, [
        A11Y_PRESENTATION()
      ]);
    }

    return hider;
  }

  /**
   *
   * @param hider An element to the holder element is injected.
   * @returns 
   */
  createHolder(hider: HTMLElement) {
    const parent = hider.parentNode;
    let holder;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !(parent instanceof HTMLElement) || !hasClass(parent, 'wtHolder')) {
      holder = this.domBindings.rootDocument.createElement('div');
      holder.style.position = 'relative';
      holder.className = 'wtHolder';

      if (this.isMaster) {
        setAttribute(holder, [
          A11Y_TABINDEX(-1),
        ]);
      }

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        parent.insertBefore(holder, hider);
      }
      if (this.isMaster) {
        const holderParent = holder.parentNode;

        // holderParent is null when TABLE is detached (e.g. in Jasmine tests); skip class assignment in that case.
        if (holderParent instanceof HTMLElement) {
          holderParent.className += 'ht_master handsontable';
          holderParent.setAttribute('dir', this.wtSettings.getSettingPure('rtlMode') ? 'rtl' : 'ltr');

          if (this.wtSettings.getSetting('ariaTags')) {
            setAttribute(holderParent, [
              A11Y_PRESENTATION()
            ]);
          }
        }
      }
      holder.appendChild(hider);
    }

    if (holder && this.wtSettings.getSetting('ariaTags')) {
      setAttribute(holder, [
        A11Y_PRESENTATION()
      ]);
    }

    return holder;
  }

  /**
   * Redraws the table.
   *
   * @param [fastDraw=false] If TRUE, will try to avoid full redraw and only update the border positions.
   *                                   If FALSE or UNDEFINED, will perform a full redraw.
   * @returns 
   */
  draw(fastDraw = false) {
    const = this;
    const = this.dataAccessObject;
    const totalRows = wtSettings.getSetting('totalRows');
    const totalColumns = wtSettings.getSetting('totalColumns');
    const rowHeaders = wtSettings.getSetting<Function[]>('rowHeaders');
    const rowHeadersCount = rowHeaders.length;
    const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');
    const columnHeadersCount = columnHeaders.length;
    let runFastDraw = fastDraw;

    if (this.isMaster) {
      wtOverlays.beforeDraw();
      this.holderOffset = offset(this.holder);

      wtViewport.rowHeightCache.ensureBuilt();
      wtViewport.columnWidthCache.ensureBuilt();

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
      }
    } else {
      if (this.isMaster) {
        this.tableOffset = offset(this.TABLE);
      } else {
        this.tableOffset = this.dataAccessObject.parentTableOffset;
      }

      const startRow = Math.max(this.getFirstRenderedRow(), 0);
      const startColumn = Math.max(this.getFirstRenderedColumn(), 0);

      this.rowFilter = new RowFilter(startRow, wtSettings.getSetting<number>('totalRows'), columnHeadersCount);
      this.columnFilter = new ColumnFilter(startColumn, wtSettings.getSetting<number>('totalColumns'), rowHeadersCount);

      let performRedraw = true;

      // Only master table rendering can be skipped
      if (this.isMaster) {
        this.alignOverlaysWithTrimmingContainer(); // todo It calls method from child class (MasterTable).
        const skipRender: = {};

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

        if (this.isMaster) {
          this.markOversizedColumnHeaders();
        }

        this.adjustColumnHeaderHeights();

        if (this.isMaster) {
          this.syncOversizedColumnHeadersWithDOM();
        }

        if (this.isMaster || this.is(CLONE_BOTTOM)) {
          this.markOversizedRows();
        }

        if (this.isMaster) {
          if (!this.wtSettings.getSetting('externalRowCalculator')) {
            wtViewport.rowHeightCache.ensureBuilt();
            wtViewport.columnWidthCache.ensureBuilt();
            wtViewport.createVisibleCalculators();
          }

          wtOverlays.refresh(false);
          wtOverlays.applyToDOM();

          this.wtSettings.getSetting('onDraw', true);

        } else if (this.is(CLONE_BOTTOM)) {
          this.dataAccessObject.cloneSource.wtOverlays.adjustElementsSize();
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
      this.dataAccessObject.selectionManager
        .setActiveOverlay(this.facadeGetter())
        .render(runFastDraw);
    }

    if (this.isMaster) {
      wtOverlays.afterDraw();
    }

    this.dataAccessObject.drawn = true;

    return this;
  }

  /**
   * @param col The visual column index.
   */
  markIfOversizedColumnHeader(col: number) {
    const sourceColIndex = this.columnFilter!.renderedToSource(col);
    let level = this.wtSettings.getSetting<Function[]>('columnHeaders').length;
    const defaultRowHeight = this.wtSettings.getSetting('stylesHandler').getDefaultRowHeight();
    let previousColHeaderHeight;
    let currentHeader;
    let currentHeaderHeight;
    const columnHeaderHeightSetting: number | number[] =
      this.wtSettings.getSetting<number | number[]>('columnHeaderHeight') || [];

    while (level) {
      level -= 1;

      previousColHeaderHeight = this.getColumnHeaderHeight(level);
      currentHeader = this.getColumnHeader(sourceColIndex, level);

      if (!currentHeader) {
        /* eslint-disable no-continue */
        continue;
      }
      currentHeaderHeight = innerHeight(currentHeader);

      if (!previousColHeaderHeight &&
          defaultRowHeight < currentHeaderHeight || previousColHeaderHeight < currentHeaderHeight) {
        this.dataAccessObject.wtViewport.oversizedColumnHeaders[level] = currentHeaderHeight;
      }

      if (Array.isArray(columnHeaderHeightSetting)) {
        if (columnHeaderHeightSetting[level] !== null && columnHeaderHeightSetting[level] !== undefined) {
          this.dataAccessObject.wtViewport.oversizedColumnHeaders[level] = columnHeaderHeightSetting[level];
        }

      } else if (!isNaN(columnHeaderHeightSetting)) {
        this.dataAccessObject.wtViewport.oversizedColumnHeaders[level] = columnHeaderHeightSetting;
      }

      const headerHeightAtLevel: number = Array.isArray(columnHeaderHeightSetting) // eslint-disable-line max-len
        ? (columnHeaderHeightSetting[level] ?? 0)
        : columnHeaderHeightSetting;

      if ((this.dataAccessObject.wtViewport.oversizedColumnHeaders[level] ?? 0) < headerHeightAtLevel) {
        this.dataAccessObject.wtViewport.oversizedColumnHeaders[level] = headerHeightAtLevel;
      }
    }
  }

  /**
   *
   */
  adjustColumnHeaderHeights() {
    const = this;
    const children = this.THEAD!.childNodes;
    const oversizedColumnHeaders = this.dataAccessObject.wtViewport.oversizedColumnHeaders;
    const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      if (oversizedColumnHeaders[i]) {
        if (!children[i] || children[i].childNodes.length === 0) {
          return;
        }
        const firstChild = children[i].childNodes[0];

        if (firstChild instanceof HTMLElement) {
          firstChild.style.height = `${oversizedColumnHeaders[i]}px`;
        }
      }
    }
  }

  /**
   * After the master table applies `oversizedColumnHeaders` via `adjustColumnHeaderHeights`,
   * the actual THEAD row heights may exceed the stored values when header content (e.g.,
   * wrapping text) pushes cells taller than the configured `columnHeaderHeight`. This method
   * re-reads the rendered THEAD row heights and updates `oversizedColumnHeaders` so that
   * overlay tables receive the correct values during their own `adjustColumnHeaderHeights`.
   */
  syncOversizedColumnHeadersWithDOM() {
    const = this;
    const children = this.THEAD!.childNodes;
    const oversizedColumnHeaders = this.dataAccessObject.wtViewport.oversizedColumnHeaders;
    const columnHeaders = wtSettings.getSetting<unknown[]>('columnHeaders');
    const borderCompensation = 1;

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      if (!children[i] || !oversizedColumnHeaders[i]) {
        continue;
      }

      const child = children[i];
      const actualRowHeight = child instanceof HTMLElement ? innerHeight(child) : 0;

      if (actualRowHeight > (oversizedColumnHeaders[i] ?? 0) + borderCompensation) {
        oversizedColumnHeaders[i] = actualRowHeight;
      }
    }
  }

  /**
   * Resets cache of row heights. The cache should be cached for each render cycle in a case
   * when new cell values have content which increases/decreases cell height.
   */
  resetOversizedRows() {
    const = this;
    const = this.dataAccessObject;

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
   * Get cell element at coords.
   * Negative coords.row or coords.col are used to retrieve header cells. If there are multiple header levels, the
   * negative value corresponds to the distance from the working area. For example, when there are 3 levels of column
   * headers, coords.col=-1 corresponds to the most inner header element, while coords.col=-3 corresponds to the
   * outmost header element.
   *
   * In case an element for the coords is not rendered, the method returns an error code.
   * To produce the error code, the input parameters are validated in the order in which they
   * are given. Thus, if both the row and the column coords are out of the rendered bounds,
   * the method returns the error code for the row.
   *
   * @param coords The cell coordinates.
   * @returns HTMLElement on success or Number one of the exit codes on error:
   *  -1 row before viewport
   *  -2 row after viewport
   *  -3 column before viewport
   *  -4 column after viewport.
   */
  getCell(coords: { row: number | null; col: number | null }) {
    if (coords.row === null || coords.col === null) {
      return -5;
    }

    let row = coords.row;
    let column = coords.col;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const hookResult = this.wtSettings
      .getSetting('onModifyGetCellCoords', row, column, !this.isMaster, 'render');

    if (hookResult && Array.isArray(hookResult)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [row, column] = hookResult;
    }

    if (this.isRowBeforeRenderedRows(row)) {
      // row before rendered rows
      return -1;

    } else if (this.isRowAfterRenderedRows(row)) {
      // row after rendered rows
      return -2;

    } else if (this.isColumnBeforeRenderedColumns(column)) {
      // column before rendered columns
      return -3;

    } else if (this.isColumnAfterRenderedColumns(column)) {
      // column after rendered columns
      return -4;
    }

    const TR = this.getRow(row);

    if (!TR && row >= 0) {
      throwWithCause('TR was expected to be rendered but is not');
    }

    const trElement = TR !== false ? TR : null;
    const TD = trElement?.childNodes[this.columnFilter!.sourceColumnToVisibleRowHeadedColumn(column)];

    if (!TD && column >= 0) {
      throwWithCause('TD or TH was expected to be rendered but is not');
    }

    // TD is a TD/TH HTMLElement guaranteed by DOM structure. TypeScript cannot narrow ChildNode
    // to HTMLElement without instanceof, but adding a throw here would change the existing contract
    // for negative column (header) lookups where TD may be undefined.
    return TD as HTMLElement;
  }

  /**
   * Get the DOM element of the row with the provided index.
   *
   * @param rowIndex Row index.
   * @returns Return the row's DOM element or `false` if the row with the provided
   * index doesn't exist.
   */
  getRow(rowIndex: number): HTMLTableRowElement | false {
    let renderedRowIndex = null;
    let parentElement = null;

    if (rowIndex < 0) {
      renderedRowIndex = this.rowFilter?.sourceRowToVisibleColHeadedRow(rowIndex);
      parentElement = this.THEAD;

    } else {
      renderedRowIndex = this.rowFilter?.sourceToRendered(rowIndex);
      parentElement = this.TBODY;
    }

    if (renderedRowIndex !== undefined && renderedRowIndex !== null && parentElement !== null) {
      if (parentElement.childNodes.length < renderedRowIndex + 1) {
        return false;

      } else {
        return parentElement.childNodes[renderedRowIndex] as HTMLTableRowElement;
      }
    }

    return false;
  }

  /**
   * GetColumnHeader.
   *
   * @param col Column index.
   * @param [level=0] Header level (0 = most distant to the table).
   * @returns HTMLElement on success or undefined on error.
   */
  getColumnHeader(col: number, level = 0): HTMLElement | undefined {
    const TR = this.THEAD!.childNodes[level];
    const TH = TR?.childNodes[this.columnFilter!.sourceColumnToVisibleRowHeadedColumn(col)];

    return TH instanceof HTMLElement ? TH : undefined;
  }

  /**
   * Gets all columns headers (TH elements) from the table.
   *
   * @param column A source column index.
   * @returns 
   */
  getColumnHeaders(column: number) {
    const THs: HTMLTableCellElement[] = [];
    const visibleColumn = this.columnFilter!.sourceColumnToVisibleRowHeadedColumn(column);

    this.THEAD!.childNodes.forEach((TR: ChildNode) => {
      const TH = TR.childNodes[visibleColumn];

      if (TH instanceof HTMLTableCellElement) {
        THs.push(TH);
      }
    });

    return THs;
  }

  /**
   * GetRowHeader.
   *
   * @param row Row index.
   * @param [level=0] Header level (0 = most distant to the table).
   * @returns HTMLElement on success or Number one of the exit codes on error: `null table doesn't have
   *   row headers`.
   */
  getRowHeader(row: number, level = 0): HTMLElement | undefined {
    const rowHeadersCount = this.wtSettings.getSetting<Function[]>('rowHeaders').length;

    if (level >= rowHeadersCount) {
      return undefined;
    }

    const renderedRow = this.rowFilter!.sourceToRendered(row);
    const visibleRow = renderedRow < 0 ? this.rowFilter!.sourceRowToVisibleColHeadedRow(row) : renderedRow;
    const parentElement = renderedRow < 0 ? this.THEAD : this.TBODY;
    const TR = parentElement?.childNodes[visibleRow];
    const TH = TR?.childNodes[level];

    return TH instanceof HTMLElement ? TH : undefined;
  }

  /**
   * Gets all rows headers (TH elements) from the table.
   *
   * @param row A source row index.
   * @returns 
   */
  getRowHeaders(row: number) {
    const THs = [];
    const rowHeadersCount = this.wtSettings.getSetting<Function[]>('rowHeaders').length;

    for (let renderedRowIndex = 0; renderedRowIndex < rowHeadersCount; renderedRowIndex++) {
      const TR = this.TBODY!.childNodes[this.rowFilter!.sourceToRendered(row)];
      const TH = TR?.childNodes[renderedRowIndex];

      if (TH) {
        THs.push(TH);
      }
    }

    return THs;
  }

  /**
   * Returns cell coords object for a given TD (or a child element of a TD element).
   *
   * @param TD A cell DOM element (or a child of one).
   * @returns The coordinates of the provided TD element (or the closest TD element) or null, if the
   *   provided element is not applicable.
   */
  getCoords(TD: HTMLTableCellElement | HTMLElement) {
    let cellElement: HTMLElement | null = TD;

    if (cellElement.nodeName !== 'TD' && cellElement.nodeName !== 'TH') {
      cellElement = closest(cellElement, ['TD', 'TH']);
    }

    if (cellElement === null) {
      return null;
    }

    const TR = cellElement.parentNode;

    if (!TR) {
      return null;
    }

    const CONTAINER = TR.parentNode as (Node & ParentNode) | null;

    if (!CONTAINER) {
      return null;
    }

    let row = TR instanceof Element ? index(TR) : 0;
    let col = cellElement instanceof HTMLTableCellElement ? cellElement.cellIndex : 0;

    if (overlayContainsElement(CLONE_TOP_INLINE_START_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_TOP, cellElement, this.wtRootElement)) {
      if (CONTAINER.nodeName === 'THEAD') {
        row -= CONTAINER.childNodes.length;
      }

    } else if (overlayContainsElement(CLONE_BOTTOM_INLINE_START_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_BOTTOM, cellElement, this.wtRootElement)) {
      const totalRows = this.wtSettings.getSetting<number>('totalRows');

      row = totalRows - CONTAINER.childNodes.length + row;

    } else if (CONTAINER === this.THEAD) {
      row = this.rowFilter!.visibleColHeadedRowToSourceRow(row);

    } else if (this.rowFilter) {
      row = this.rowFilter!.renderedToSource(row);
    }

    if (overlayContainsElement(CLONE_TOP_INLINE_START_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_INLINE_START, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_BOTTOM_INLINE_START_CORNER, cellElement, this.wtRootElement)) {
      col = this.columnFilter!.offsettedTH(col);

    } else if (this.columnFilter) {
      col = this.columnFilter!.visibleRowHeadedColumnToSourceColumn(col);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const hookResult = this.wtSettings
      .getSetting('onModifyGetCoordsElement', row, col);

    if (hookResult && Array.isArray(hookResult)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [row, col] = hookResult;
    }

    return this.wot.createCellCoords(row, col);
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
    const actualTableHeight = innerHeight(this.TBODY!) - 1;
    const borderBoxSizing = stylesHandler.areCellsBorderBox();
    const rowHeightFn = borderBoxSizing ? outerHeight : innerHeight;
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

    const = this.dataAccessObject;
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
   * @param row The visual row index.
   * @returns 
   */
  getTrForRow(row: number): HTMLTableRowElement {
    return this.TBODY!.childNodes[this.rowFilter!.sourceToRendered(row)] as HTMLTableRowElement;
  }

  /**
   * Checks if the column index (negative value from -1 to N) is rendered.
   *
   * @param column The column index (negative value from -1 to N).
   * @returns 
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
   * @param row The row index (negative value from -1 to N).
   * @returns 
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
   * @param row The visual row index.
   * @memberof Table#
   * @function isRowBeforeRenderedRows
   * @returns 
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
  /* eslint-enable jsdoc/require-description-complete-sentence */

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
   * @param row The visual row index.
   * @memberof Table#
   * @function isRowAfterRenderedRows
   * @returns 
   */
  isRowAfterRenderedRows(row: number) {
    return row > this.getLastRenderedRow();
  }
  /* eslint-enable jsdoc/require-description-complete-sentence */

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
   * @param column The visual column index.
   * @memberof Table#
   * @function isColumnBeforeRenderedColumns
   * @returns 
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
  /* eslint-enable jsdoc/require-description-complete-sentence */

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
   * @param column The visual column index.
   * @memberof Table#
   * @function isColumnAfterRenderedColumns
   * @returns 
   */
  isColumnAfterRenderedColumns(column: number) {
    return this.columnFilter && (column > this.getLastRenderedColumn());
  }
  /* eslint-enable jsdoc/require-description-complete-sentence */

  /**
   * Checks if the column is beyond the last visible column in the current viewport.
   */
  isColumnAfterViewport(column: number) {
    return this.columnFilter && (column > this.getLastVisibleColumn());
  }

  /**
   * Checks if the row is beyond the last visible row in the current viewport.
   */
  isRowAfterViewport(row: number) {
    return this.rowFilter && (row > this.getLastVisibleRow());
  }

  /**
   * Checks if the column is before the first visible column in the current viewport.
   */
  isColumnBeforeViewport(column: number) {
    return this.columnFilter && (this.columnFilter!.sourceToRendered(column) < 0 && column >= 0);
  }

  /**
   * Checks if the last row is entirely within the visible viewport.
   */
  isLastRowFullyVisible() {
    return this.getLastVisibleRow() === this.getLastRenderedRow();
  }

  /**
   * Checks if the last column is entirely within the visible viewport.
   */
  isLastColumnFullyVisible() {
    return this.getLastVisibleColumn() === this.getLastRenderedColumn();
  }

  /**
   * Checks if all rows fit within the current viewport without scrolling.
   */
  allRowsInViewport() {
    return this.wtSettings.getSetting('totalRows') === this.getVisibleRowsCount();
  }

  /**
   * Checks if all columns fit within the current viewport without scrolling.
   */
  allColumnsInViewport() {
    return this.wtSettings.getSetting('totalColumns') === this.getVisibleColumnsCount();
  }

  /**
   * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height.
   *
   * @param sourceRow The physical row index.
   * @returns 
   */
  getRowHeight(sourceRow: number) {
    return this.rowUtils.getHeight(sourceRow);
  }

  /**
   * @param level The column level.
   * @returns 
   */
  getColumnHeaderHeight(level: number) {
    return this.columnUtils.getHeaderHeight(level);
  }

  /**
   * @param sourceColumn The physical column index.
   * @returns 
   */
  getColumnWidth(sourceColumn: number): number {
    return this.columnUtils.getWidth(sourceColumn) as number;
  }

  /**
   * Checks if the table has defined size. It returns `true` when the table has width and height
   * set bigger than `0px`.
   *
   * @returns 
   */
  hasDefinedSize() {
    return this.hasTableHeight && this.hasTableWidth;
  }

  /**
   * Gets table's width. The returned width is the width of the rendered cells that fit in the
   * current viewport. The value may change depends on the viewport position (scroll position).
   *
   * @returns 
   */
  getWidth() {
    return outerWidth(this.TABLE);
  }

  /**
   * Gets table's height. The returned height is the height of the rendered cells that fit in the
   * current viewport. The value may change depends on the viewport position (scroll position).
   *
   * @returns 
   */
  getHeight() {
    return outerHeight(this.TABLE);
  }

  /**
   * Gets table's total width. The returned width is the width of all rendered cells (including headers)
   * that can be displayed in the table.
   *
   * @returns 
   */
  getTotalWidth() {
    const width = outerWidth(this.hider);

    // when the overlay's table does not have any cells the hider returns 0, get then width from the table element
    return width !== 0 ? width : this.getWidth();
  }

  /**
   * Gets table's total height. The returned height is the height of all rendered cells (including headers)
   * that can be displayed in the table.
   *
   * @returns 
   */
  getTotalHeight() {
    const height = outerHeight(this.hider);

    // when the overlay's table does not have any cells the hider returns 0, get then height from the table element
    return height !== 0 ? height : this.getHeight();
  }

  /**
   * Checks if the table is visible. It returns `true` when the holder element (or its parents)
   * has CSS 'display' property different than 'none'.
   *
   * @returns 
   */
  isVisible() {
    return isVisible(this.TABLE);
  }

  /**
   * Modify row header widths provided by user in class contructor.
   *
   * @private
   * @param rowHeaderWidthFactory The function which can provide default width values for rows..
   * @returns 
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
   * @param width The width to process.
   * @returns 
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
  destroy() {}
}

export default Table;
