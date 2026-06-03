import type from '../types';
import type Settings from '../settings';
import type Table from '../table';
import type Viewport from '../viewport';
import type Overlays from '../overlays';
import type from '../selection/manager';
import type Event from '../event';
import {
  fastInnerText,
  hasZeroHeight,
} from '../../../../helpers/dom/element';
import from '../../../../helpers/string';
import EventManager from '../../../../eventManager';
import Scroll from '../scroll';
import CellCoords from '../cell/coords';
import CellRange from '../cell/range';

/**
 * @abstract
 * @class Walkontable
 */
export default class CoreAbstract {
  /**
   * The table renderer instance.
   */
  declare wtTable: Table;
  /**
   * The scroll controller instance.
   */
  declare wtScroll: Scroll;
  /**
   * The viewport calculator instance.
   */
  declare wtViewport: Viewport;
  /**
   * The overlay manager instance.
   */
  declare wtOverlays: Overlays;
  /**
   * The selection manager instance that tracks highlighted cells.
   */
  declare selectionManager: SelectionManager;
  /**
   * The event handler instance.
   */
  declare wtEvent: Event;
  /**
   * The source Walkontable instance that this clone is based on.
   */
  declare cloneSource: CoreAbstract;
  /**
   * The walkontable instance id.
   *
   * @public
   */
  guid = `wt_${randomString()}`;
  /**
   * Indicates whether the last draw call was interrupted because the table was not visible.
   */
  drawInterrupted = false;
  /**
   * Indicates whether the table has been rendered at least once.
   */
  drawn = false;

  /**
   * The name of the overlay that currently renders the table.
   *
   * @public
   */
  activeOverlayName = 'master';

  /**
   * The DOM bindings.
   *
   * @public
   */
  declare domBindings: DomBindings;

  /**
   * Settings.
   *
   * @public
   */
  declare wtSettings: Settings;

  /**
   * Creates and returns a new EventManager bound to this instance.
   */
  get eventManager(): EventManager {
    return new EventManager(this);
  }

  /**
   * @param table Main table.
   * @param settings The Walkontable settings.
   */
  constructor(table: HTMLTableElement, settings: Settings) {
    this.domBindings = {
      rootTable: table,
      rootDocument: table.ownerDocument,
      rootWindow: table.ownerDocument.defaultView,
    } as unknown as DomBindings;

    this.wtSettings = settings;
    this.wtScroll = new Scroll(this.createScrollDao());
  }

  /**
   * Reads header content from the existing DOM and registers a column header renderer
   * that restores the original HTML if none has been explicitly configured.
   */
  findOriginalHeaders() {
    const originalHeaders: string[] = [];

    // find original headers
    if (this.wtTable.THEAD && this.wtTable.THEAD.childNodes.length &&
        this.wtTable.THEAD.childNodes[0].childNodes.length) {
      for (let c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
        originalHeaders.push((this.wtTable.THEAD.childNodes[0].childNodes[c] as HTMLElement).innerHTML);
      }
      if (!this.wtSettings.getSetting<Function[]>('columnHeaders').length) {
        this.wtSettings.update('columnHeaders', [
          function(column: number, TH: HTMLTableCellElement) {
            fastInnerText(TH, originalHeaders[column]);
          }
        ]);
      }
    }
  }

  /**
   * Creates and returns the CellCoords object.
   *
   * @param row The row index.
   * @param column The column index.
   * @returns 
   */
  createCellCoords(row: number, column: number) {
    return new CellCoords(row, column, this.wtSettings.getSetting<boolean>('rtlMode'));
  }

  /**
   * Creates and returns the CellRange object.
   *
   * @param highlight The highlight coordinates.
   * @param from The from coordinates.
   * @param to The to coordinates.
   * @returns 
   */
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords) {
    return new CellRange(highlight, from, to, this.wtSettings.getSetting<boolean>('rtlMode'));
  }

  /**
   * Force rerender of Walkontable.
   *
   * @param [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   * @returns 
   */
  draw(fastDraw = false) {
    this.drawInterrupted = false;

    if (!this.wtTable.isVisible() ||
        hasZeroHeight((this.wtTable.wtRootElement as HTMLElement).parentNode as HTMLElement)) {
      // draw interrupted because TABLE is not visible or has the height set to 0
      this.drawInterrupted = true;
    } else {
      this.wtTable.draw(fastDraw);
    }

    return this;
  }

  /**
   * Returns the TD at coords. If topmost is set to true, returns TD from the topmost overlay layer,
   * if not set or set to false, returns TD from the master table.
   *
   * @param coords The cell coordinates.
   * @param [topmost=false] If set to `true`, it returns the TD element from the topmost overlay. For example,
   *                                  if the wanted cell is in the range of fixed rows, it will return a TD element
   *                                  from the top overlay.
   * @returns 
   */
  getCell(coords: { row: number | null; col: number | null }, topmost = false) {
    if (coords.row === null || coords.col === null) {
      return undefined;
    }

    const cellCoords = coords as unknown as CellCoords;

    if (!topmost) {
      return this.wtTable.getCell(cellCoords);
    }

    const totalRows = this.wtSettings.getSetting<number>('totalRows');
    const fixedRowsTop = this.wtSettings.getSetting<number>('fixedRowsTop');
    const fixedRowsBottom = this.wtSettings.getSetting<number>('fixedRowsBottom');
    const fixedColumnsStart = this.wtSettings.getSetting<number>('fixedColumnsStart');

    if (coords.row < fixedRowsTop && coords.col < fixedColumnsStart) {
      return this.wtOverlays.topInlineStartCornerOverlay.clone?.wtTable.getCell(cellCoords);

    } else if (coords.row < fixedRowsTop) {
      return this.wtOverlays.topOverlay.clone?.wtTable.getCell(cellCoords);

    } else if (coords.col < fixedColumnsStart && coords.row >= totalRows - fixedRowsBottom) {
      return this.wtOverlays.bottomInlineStartCornerOverlay?.clone?.wtTable.getCell(cellCoords);

    } else if (coords.col < fixedColumnsStart) {
      return this.wtOverlays.inlineStartOverlay.clone?.wtTable.getCell(cellCoords);

    } else if (coords.row < totalRows && coords.row >= totalRows - fixedRowsBottom) {
      return this.wtOverlays.bottomOverlay?.clone?.wtTable.getCell(cellCoords);

    }

    return this.wtTable.getCell(cellCoords);
  }

  /**
   * Scrolls the viewport to a cell (rerenders if needed).
   *
   * @param coords The cell coordinates to scroll to.
   * @param [horizontalSnap='auto'] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @param [verticalSnap='auto'] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on the bottom of
   * the table. When `'auto'`, the viewport is scrolled only when the row is outside of the viewport.
   * @returns 
   */
  scrollViewport(coords: { row: number | null; col: number | null }, horizontalSnap: string, verticalSnap: string) {
    if (coords.row === null || coords.col === null) {
      return false;
    }

    return this.wtScroll.scrollViewport(coords as { row: number; col: number }, horizontalSnap, verticalSnap);
  }

  /**
   * Scrolls the viewport to a column (rerenders if needed).
   *
   * @param column Visual column index.
   * @param [snapping='auto'] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @returns 
   */
  scrollViewportHorizontally(column: number, snapping: string) {
    return this.wtScroll.scrollViewportHorizontally(column, snapping);
  }

  /**
   * Scrolls the viewport to a row (rerenders if needed).
   *
   * @param row Visual row index.
   * @param [snapping='auto'] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on
   * the bottom of the table. When `'auto'`, the viewport is scrolled only when the row is outside of
   * the viewport.
   * @returns 
   */
  scrollViewportVertically(row: number, snapping: string) {
    return this.wtScroll.scrollViewportVertically(row, snapping);
  }

  /**
   * @returns 
   */
  getViewport() {
    return [
      this.wtTable.getFirstVisibleRow(),
      this.wtTable.getFirstVisibleColumn(),
      this.wtTable.getLastVisibleRow(),
      this.wtTable.getLastVisibleColumn()
    ];
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.wtOverlays.destroy();
    this.wtEvent.destroy();
  }

  /**
   * Create data access object for scroll.
   *
   * @protected
   * @returns 
   */
  createScrollDao() {
    const wot = this;

    return {
      get drawn() {
        return wot.drawn; // TODO refactoring: consider about injecting `isDrawn` function : ()=>return wot.drawn. (it'll enables remove dao layer)
      },
      get topOverlay() {
        return wot.wtOverlays.topOverlay; // TODO refactoring: move outside dao, use IOC
      },
      get inlineStartOverlay() {
        return wot.wtOverlays.inlineStartOverlay; // TODO refactoring: move outside dao, use IOC
      },
      get wtTable() {
        return wot.wtTable; // TODO refactoring: move outside dao, use IOC
      },
      get wtViewport() {
        return wot.wtViewport; // TODO refactoring: move outside dao, use IOC
      },
      get wtSettings() {
        return wot.wtSettings;
      },
      get rootWindow() {
        return wot.domBindings.rootWindow; // TODO refactoring: move outside dao
      },
      // TODO refactoring, consider about using injecting wtSettings into scroll (it'll enables remove dao layer)
      get totalRows() {
        return wot.wtSettings.getSetting<number>('totalRows');
      },
      get totalColumns() {
        return wot.wtSettings.getSetting<number>('totalColumns');
      },
      get fixedRowsTop() {
        return wot.wtSettings.getSetting<number>('fixedRowsTop');
      },
      get fixedRowsBottom() {
        return wot.wtSettings.getSetting<number>('fixedRowsBottom');
      },
      get fixedColumnsStart() {
        return wot.wtSettings.getSetting<number>('fixedColumnsStart');
      },
    } as unknown as ScrollDao;
  }
  // TODO refactoring: it will be much better to not use DAO objects. They are needed for now to provide
  // dynamically access to related objects
  /**
   * Create data access object for wtTable.
   *
   * @protected
   * @returns 
   */
  getTableDao(): Record<string, unknown> {
    const wot = this;

    return {
      get wot() {
        return wot;
      },
      get parentTableOffset() {
        return wot.cloneSource.wtTable.tableOffset; // TODO rethink: cloneSource exists only in Clone type.
      },
      get cloneSource() {
        return wot.cloneSource; // TODO rethink: cloneSource exists only in Clone type.
      },
      get workspaceWidth() {
        return wot.wtViewport.getWorkspaceWidth();
      },
      get wtViewport() {
        return wot.wtViewport; // TODO refactoring: move outside dao, use IOC
      },
      get wtOverlays() {
        return wot.wtOverlays; // TODO refactoring: move outside dao, use IOC
      },
      get selectionManager() {
        return wot.selectionManager; // TODO refactoring: move outside dao, use IOC
      },
      get drawn() {
        return wot.drawn;
      },
      set drawn(v) { // TODO rethink: this breaks assumes of data access object, however it is required until invent better way to handle WOT state.
        wot.drawn = v;
      },
      get wtTable() {
        return wot.wtTable; // TODO refactoring: it provides itself
      },
      get startColumnRendered() {
        return wot.wtViewport.columnsRenderCalculator?.startColumn ?? null;
      },
      get startColumnVisible() {
        return wot.wtViewport.columnsVisibleCalculator?.startColumn ?? null;
      },
      get startColumnPartiallyVisible() {
        return wot.wtViewport.columnsPartiallyVisibleCalculator?.startColumn ?? null;
      },
      get endColumnRendered() {
        return wot.wtViewport.columnsRenderCalculator?.endColumn ?? null;
      },
      get endColumnVisible() {
        return wot.wtViewport.columnsVisibleCalculator?.endColumn ?? null;
      },
      get endColumnPartiallyVisible() {
        return wot.wtViewport.columnsPartiallyVisibleCalculator?.endColumn ?? null;
      },
      get countColumnsRendered() {
        return wot.wtViewport.columnsRenderCalculator?.count ?? 0;
      },
      get countColumnsVisible() {
        return wot.wtViewport.columnsVisibleCalculator?.count ?? 0;
      },
      get startRowRendered() {
        return wot.wtViewport.rowsRenderCalculator?.startRow ?? null;
      },
      get startRowVisible() {
        return wot.wtViewport.rowsVisibleCalculator?.startRow ?? null;
      },
      get startRowPartiallyVisible() {
        return wot.wtViewport.rowsPartiallyVisibleCalculator?.startRow ?? null;
      },
      get endRowRendered() {
        return wot.wtViewport.rowsRenderCalculator?.endRow ?? null;
      },
      get endRowVisible() {
        return wot.wtViewport.rowsVisibleCalculator?.endRow ?? null;
      },
      get endRowPartiallyVisible() {
        return wot.wtViewport.rowsPartiallyVisibleCalculator?.endRow ?? null;
      },
      get countRowsRendered() {
        return wot.wtViewport.rowsRenderCalculator?.count ?? 0;
      },
      get countRowsVisible() {
        return wot.wtViewport.rowsVisibleCalculator?.count ?? 0;
      },
      get columnHeaders() {
        return wot.wtSettings.getSetting<Function[]>('columnHeaders');
      },
      get rowHeaders() {
        return wot.wtSettings.getSetting<Function[]>('rowHeaders');
      },
    };
  }
}
