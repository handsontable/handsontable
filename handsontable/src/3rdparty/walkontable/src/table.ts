import type { DataAccessObject, WalkontableInstance, DomBindings } from './types';
import type Settings from './settings';
import {
  hasClass,
  index,
  isHTMLElement,
  isHTMLTableCellElement,
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
import { isFunction } from '../../../helpers/function';
import ColumnFilter from './filter/column';
import RowFilter from './filter/row';
import { Renderer } from './renderer';
import ColumnUtils from './utils/column';
import RowUtils from './utils/row';
import {
  CLONE_TOP,
  CLONE_BOTTOM,
  CLONE_INLINE_START,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
} from './overlay';
import { A11Y_PRESENTATION, A11Y_TABINDEX } from '../../../helpers/a11y';
import { throwWithCause } from '../../../helpers/errors';

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
   * The DOM bindings for the table.
   *
   * @type {DomBindings}
   */
  domBindings;
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
   * The data access object.
   *
   * @type {DataAccessObject}
   */
  declare dataAccessObject: DataAccessObject;
  /**
   * Function which returns the proper facade.
   *
   * @type {Function}
   */
  declare facadeGetter: Function;
  /**
   * The Walkontable instance.
   *
   * @type {WalkontableInstance}
   */
  declare instance: WalkontableInstance;
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

  // Methods provided by mixins (calculatedRows, calculatedColumns, stickyRowsTop,
  // stickyRowsBottom, stickyColumnsStart) applied to Table subclasses at runtime.
  /**
   * Gets the index of the first rendered row.
   *
   * @type {() => number}
   */
  declare getFirstRenderedRow: () => number;
  /**
   * Gets the index of the first visible row.
   *
   * @type {() => number}
   */
  declare getFirstVisibleRow: () => number;
  /**
   * Gets the index of the first partially visible row.
   *
   * @type {() => number}
   */
  declare getFirstPartiallyVisibleRow: () => number;
  /**
   * Gets the index of the last rendered row.
   *
   * @type {() => number}
   */
  declare getLastRenderedRow: () => number;
  /**
   * Gets the index of the last visible row.
   *
   * @type {() => number}
   */
  declare getLastVisibleRow: () => number;
  /**
   * Gets the index of the last partially visible row.
   *
   * @type {() => number}
   */
  declare getLastPartiallyVisibleRow: () => number;
  /**
   * Gets the count of rendered rows.
   *
   * @type {() => number}
   */
  declare getRenderedRowsCount: () => number;
  /**
   * Gets the count of visible rows.
   *
   * @type {() => number}
   */
  declare getVisibleRowsCount: () => number;
  /**
   * Gets the count of column headers.
   *
   * @type {() => number}
   */
  declare getColumnHeadersCount: () => number;
  /**
   * Gets the index of the first rendered column.
   *
   * @type {() => number}
   */
  declare getFirstRenderedColumn: () => number;
  /**
   * Gets the index of the first visible column.
   *
   * @type {() => number}
   */
  declare getFirstVisibleColumn: () => number;
  /**
   * Gets the index of the first partially visible column.
   *
   * @type {() => number}
   */
  declare getFirstPartiallyVisibleColumn: () => number;
  /**
   * Gets the index of the last rendered column.
   *
   * @type {() => number}
   */
  declare getLastRenderedColumn: () => number;
  /**
   * Gets the index of the last visible column.
   *
   * @type {() => number}
   */
  declare getLastVisibleColumn: () => number;
  /**
   * Gets the index of the last partially visible column.
   *
   * @type {() => number}
   */
  declare getLastPartiallyVisibleColumn: () => number;
  /**
   * Gets the count of rendered columns.
   *
   * @type {() => number}
   */
  declare getRenderedColumnsCount: () => number;
  /**
   * Gets the count of visible columns.
   *
   * @type {() => number}
   */
  declare getVisibleColumnsCount: () => number;
  /**
   * Gets the count of row headers.
   *
   * @type {() => number}
   */
  declare getRowHeadersCount: () => number;

  // Methods defined in subclass MasterTable but called from Table via `this.isMaster` guards.
  /**
   * Aligns overlays with the trimming container.
   *
   * @returns {void}
   */
  alignOverlaysWithTrimmingContainer(): void { // intentionally empty
  }
  /**
   * Updates the per-axis overscroll containment on the master holder.
   *
   * @returns {void}
   */
  updateOverscrollContainment(): void { // intentionally empty
  }
  /**
   * Marks oversized column headers.
   *
   * @returns {void}
   */
  markOversizedColumnHeaders(): void { // intentionally empty
  }

  /**
   *
   * @abstract
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {'master'|CLONE_TYPES_ENUM} name Overlay name.
   */
  constructor(
    dataAccessObject: DataAccessObject, facadeGetter: Function, domBindings: DomBindings,
    wtSettings: Settings, name: string) {
    this.domBindings = domBindings;
    /**
     * Indicates if this instance is of type `MasterTable` (i.e. It is NOT an overlay).
     *
     * @type {boolean}
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
   * @param {string} overlayTypeName The overlay type.
   * @returns {boolean}
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
   * @param {HTMLTableElement} table An element to process.
   * @returns {HTMLElement}
   */
  createSpreader(table: HTMLTableElement) {
    const parent = table.parentNode;
    let spreader: HTMLDivElement | undefined;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !isHTMLElement(parent) || !hasClass(parent, 'wtHolder')) {
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
   * @param {HTMLElement} spreader An element to the hider element is injected.
   * @returns {HTMLElement}
   */
  createHider(spreader: HTMLElement) {
    const parent = spreader.parentNode;
    let hider: HTMLDivElement | undefined;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !isHTMLElement(parent) || !hasClass(parent, 'wtHolder')) {
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
   * @param {HTMLElement} hider An element to the holder element is injected.
   * @returns {HTMLElement}
   */
  createHolder(hider: HTMLElement) {
    const parent = hider.parentNode;
    let holder;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE ||
        !isHTMLElement(parent) || !hasClass(parent, 'wtHolder')) {
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
        // isHTMLElement() is used instead of `instanceof HTMLElement` because the latter fails in
        // cross-frame contexts (e.g. when HoT is mounted inside an <iframe> via React portals):
        // the iframe's HTMLElement constructor !== the parent frame's HTMLElement.
        if (isHTMLElement(holderParent)) {
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
   * @param {boolean} [fastDraw=false] If TRUE, will try to avoid full redraw and only update the border positions.
   *                                   If FALSE or UNDEFINED, will perform a full redraw.
   * @returns {Table}
   */
  draw(fastDraw = false) {
    const { wtSettings } = this;
    const { wtOverlays, wtViewport } = this.dataAccessObject;
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

          // Runs after render() so the holder reflects the freshly rendered
          // content; only on full draws, so pure-scroll redraws add no reflow.
          this.updateOverscrollContainment();

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
   * @param {number} col The visual column index.
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
    const { wtSettings } = this;
    const children = this.THEAD!.childNodes;
    const oversizedColumnHeaders = this.dataAccessObject.wtViewport.oversizedColumnHeaders;
    const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      if (oversizedColumnHeaders[i]) {
        if (!children[i] || children[i].childNodes.length === 0) {
          return;
        }
        const firstChild = children[i].childNodes[0];

        if (isHTMLElement(firstChild)) {
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
    const { wtSettings } = this;
    const children = this.THEAD!.childNodes;
    const oversizedColumnHeaders = this.dataAccessObject.wtViewport.oversizedColumnHeaders;
    const columnHeaders = wtSettings.getSetting<unknown[]>('columnHeaders');
    const borderCompensation = 1;

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      if (!children[i] || !oversizedColumnHeaders[i]) {
        continue;
      }

      const child = children[i];
      const actualRowHeight = isHTMLElement(child) ? innerHeight(child) : 0;

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
    const { wtSettings } = this;
    const { wtViewport } = this.dataAccessObject;

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
   * @param {CellCoords} coords The cell coordinates.
   * @returns {HTMLElement|number} HTMLElement on success or Number one of the exit codes on error:
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
   * @param {number} rowIndex Row index.
   * @returns {HTMLTableRowElement|boolean} Return the row's DOM element or `false` if the row with the provided
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
   * @param {number} col Column index.
   * @param {number} [level=0] Header level (0 = most distant to the table).
   * @returns {object} HTMLElement on success or undefined on error.
   */
  getColumnHeader(col: number, level = 0): HTMLElement | undefined {
    const TR = this.THEAD!.childNodes[level];
    const TH = TR?.childNodes[this.columnFilter!.sourceColumnToVisibleRowHeadedColumn(col)];

    return isHTMLElement(TH) ? TH : undefined;
  }

  /**
   * Gets all columns headers (TH elements) from the table.
   *
   * @param {number} column A source column index.
   * @returns {HTMLTableCellElement[]}
   */
  getColumnHeaders(column: number) {
    const THs: HTMLTableCellElement[] = [];
    const visibleColumn = this.columnFilter!.sourceColumnToVisibleRowHeadedColumn(column);

    this.THEAD!.childNodes.forEach((TR: ChildNode) => {
      const TH = TR.childNodes[visibleColumn];

      if (isHTMLTableCellElement(TH)) {
        THs.push(TH);
      }
    });

    return THs;
  }

  /**
   * GetRowHeader.
   *
   * @param {number} row Row index.
   * @param {number} [level=0] Header level (0 = most distant to the table).
   * @returns {HTMLElement} HTMLElement on success or Number one of the exit codes on error: `null table doesn't have
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

    return isHTMLElement(TH) ? TH : undefined;
  }

  /**
   * Gets all rows headers (TH elements) from the table.
   *
   * @param {number} row A source row index.
   * @returns {HTMLTableCellElement[]}
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
   * @param {HTMLTableCellElement} TD A cell DOM element (or a child of one).
   * @returns {CellCoords|null} The coordinates of the provided TD element (or the closest TD element) or null, if the
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

    let row = isHTMLElement(TR) ? index(TR) : 0;
    let col = isHTMLTableCellElement(cellElement) ? cellElement.cellIndex : 0;

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

    const { wtViewport } = this.dataAccessObject;
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
   * @param {number} row The visual row index.
   * @returns {HTMLTableRowElement}
   */
  getTrForRow(row: number): HTMLTableRowElement {
    return this.TBODY!.childNodes[this.rowFilter!.sourceToRendered(row)] as HTMLTableRowElement;
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
    return outerWidth(this.TABLE);
  }

  /**
   * Gets table's height. The returned height is the height of the rendered cells that fit in the
   * current viewport. The value may change depends on the viewport position (scroll position).
   *
   * @returns {number}
   */
  getHeight() {
    return outerHeight(this.TABLE);
  }

  /**
   * Gets table's total width. The returned width is the width of all rendered cells (including headers)
   * that can be displayed in the table.
   *
   * @returns {number}
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
   * @returns {number}
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
  destroy() {}
}

export default Table;
