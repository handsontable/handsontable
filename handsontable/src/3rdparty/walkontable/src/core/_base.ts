import type { DomBindings, WalkontableInstance } from '../types';
import type Settings from '../settings';
import type Table from '../table';
import type Viewport from '../viewport';
import type Overlays from '../overlays';
import type { SelectionManager } from '../selection/manager';
import type Event from '../event';
import {
  fastInnerText,
  hasZeroHeight,
} from '../../../../helpers/dom/element';
import { randomString } from '../../../../helpers/string';
import EventManager from '../../../../eventManager';
import Scroll, { createScrollDeps } from '../scroll';
import CellCoords from '../cell/coords';
import CellRange from '../cell/range';
import { LiveGeometryReader } from '../geometry/liveGeometryReader';
import { buildContext, type EngineContext } from '../wire';

/**
 * @abstract
 * @class Walkontable
 */
export default class CoreAbstract {
  /**
   * Index signature required for WalkontableInstance structural compatibility.
   */
  [key: string]: unknown;
  /**
   * The main table instance.
   *
   * @type {Table}
   */
  declare wtTable: Table;
  /**
   * The scroll handler instance.
   *
   * @type {Scroll}
   */
  declare wtScroll: Scroll;
  /**
   * The viewport calculator instance.
   *
   * @type {Viewport}
   */
  declare wtViewport: Viewport;
  /**
   * The overlays manager instance.
   *
   * @type {Overlays}
   */
  declare wtOverlays: Overlays;
  /**
   * The selection manager instance.
   *
   * @type {SelectionManager}
   */
  declare selectionManager: SelectionManager;
  /**
   * The event handler instance.
   *
   * @type {Event}
   */
  declare wtEvent: Event;
  /**
   * Reference to the source walkontable instance (used for clones).
   *
   * @type {WalkontableInstance}
   */
  declare cloneSource: WalkontableInstance;
  /**
   * The walkontable instance id.
   *
   * @public
   * @type {Readonly<string>}
   */
  guid = `wt_${randomString()}`;
  /**
   * Flag indicating whether the current drawing operation was interrupted.
   *
   * @type {boolean}
   */
  drawInterrupted = false;
  /**
   * Flag indicating whether the table has been drawn.
   *
   * @type {boolean}
   */
  drawn = false;

  /**
   * The name of the overlay that currently renders the table.
   *
   * @public
   * @type {string}
   */
  activeOverlayName = 'master';

  /**
   * The DOM bindings.
   *
   * @public
   * @type {DomBindings}
   */
  declare domBindings: DomBindings;

  /**
   * Settings.
   *
   * @public
   * @type {Settings}
   */
  declare wtSettings: Settings;

  /**
   * The engine composition context — stable references plus the late-bound dependency thunks,
   * defined once and shared by every module's dependency object.
   *
   * @public
   * @type {EngineContext}
   */
  declare engineContext: EngineContext;

  /**
   * Gets or creates the event manager instance.
   *
   * @returns {EventManager} The event manager instance.
   */
  get eventManager(): EventManager {
    return new EventManager(this);
  }

  /**
   * Gets the root document from dom bindings.
   *
   * @returns {Document} The root document.
   */
  get rootDocument(): Document {
    return this.domBindings.rootDocument;
  }

  /**
   * Gets the root window from dom bindings.
   *
   * @returns {Window} The root window.
   */
  get rootWindow(): Window {
    return this.domBindings.rootWindow;
  }

  /**
   * Delegates to wtSettings.getSetting.
   *
   * @param {string} key The settings key.
   * @param {...unknown} args Additional arguments.
   * @returns {unknown}
   */
  getSetting(key: string, ...args: unknown[]): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.wtSettings.getSetting(key as any, ...(args as [any, unknown?, unknown?, unknown?]));
  }

  /**
   * Delegates to wtSettings.update.
   *
   * @param {string} key The settings key.
   * @param {unknown} value The value to set.
   */
  update(key: string, value: unknown): void {
    this.wtSettings.update(key, value);
  }

  /**
   * @param {HTMLTableElement} table Main table.
   * @param {Settings} settings The Walkontable settings.
   */
  constructor(table: HTMLTableElement, settings: Settings) {
    this.domBindings = {
      rootTable: table,
      rootDocument: table.ownerDocument,
      rootWindow: table.ownerDocument.defaultView as Window,
      geometryReader: new LiveGeometryReader(table.ownerDocument.defaultView as Window),
      // `rootElement` is intentionally assigned later (see TableView); the cast defers it as the
      // original literal did. `unknown` is required because `LiveGeometryReader`'s `#`-private field
      // makes it nominal, which narrows the direct `as DomBindings` overlap check.
    } as unknown as DomBindings;

    this.wtSettings = settings;

    // The engine context is the single composition surface: it holds the stable references and
    // defines every late-bound/cyclic thunk ONCE. Built here because settings and DOM bindings now
    // exist; the thunks resolve the table/viewport/overlays lazily, at call time, exactly as before.
    this.engineContext = buildContext(this as WalkontableInstance);

    // `Scroll` is created before the table/viewport/overlays exist, so its dependency set is assembled
    // from the context (the late-bound engine objects come through as thunks resolved at call time).
    this.wtScroll = new Scroll(createScrollDeps(this.engineContext));
  }

  /**
   * Finds and stores original table headers, setting up column header rendering callbacks if not already configured.
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
   * @param {*} row The row index.
   * @param {*} column The column index.
   * @returns {CellCoords}
   */
  createCellCoords(row: number, column: number) {
    return new CellCoords(row, column, this.wtSettings.getSetting<boolean>('rtlMode'));
  }

  /**
   * Creates and returns the CellRange object.
   *
   * @param {CellCoords} highlight The highlight coordinates.
   * @param {CellCoords} from The from coordinates.
   * @param {CellCoords} to The to coordinates.
   * @returns {CellRange}
   */
  createCellRange(highlight: CellCoords, from: CellCoords, to: CellCoords) {
    return new CellRange(highlight, from, to, this.wtSettings.getSetting<boolean>('rtlMode'));
  }

  /**
   * Force rerender of Walkontable.
   *
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   * @returns {Walkontable}
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
   * @param {CellCoords} coords The cell coordinates.
   * @param {boolean} [topmost=false] If set to `true`, it returns the TD element from the topmost overlay. For example,
   *                                  if the wanted cell is in the range of fixed rows, it will return a TD element
   *                                  from the top overlay.
   * @returns {HTMLElement}
   */
  getCell(coords: { row: number | null; col: number | null }, topmost = false) {
    if (coords.row === null || coords.col === null) {
      return undefined;
    }

    if (!topmost) {
      return this.wtTable.getCell(coords);
    }

    const totalRows = this.wtSettings.getSetting<number>('totalRows');
    const fixedRowsTop = this.wtSettings.getSetting<number>('fixedRowsTop');
    const fixedRowsBottom = this.wtSettings.getSetting<number>('fixedRowsBottom');
    const fixedColumnsStart = this.wtSettings.getSetting<number>('fixedColumnsStart');

    if (coords.row < fixedRowsTop && coords.col < fixedColumnsStart) {
      return this.wtOverlays.topInlineStartCornerOverlay.clone?.wtTable.getCell(coords);

    } else if (coords.row < fixedRowsTop) {
      return this.wtOverlays.topOverlay.clone?.wtTable.getCell(coords);

    } else if (coords.col < fixedColumnsStart && coords.row >= totalRows - fixedRowsBottom) {
      return this.wtOverlays.bottomInlineStartCornerOverlay?.clone?.wtTable.getCell(coords);

    } else if (coords.col < fixedColumnsStart) {
      return this.wtOverlays.inlineStartOverlay.clone?.wtTable.getCell(coords);

    } else if (coords.row < totalRows && coords.row >= totalRows - fixedRowsBottom) {
      return this.wtOverlays.bottomOverlay?.clone?.wtTable.getCell(coords);

    }

    return this.wtTable.getCell(coords);
  }

  /**
   * Scrolls the viewport to a cell (rerenders if needed).
   *
   * @param {CellCoords} coords The cell coordinates to scroll to.
   * @param {'auto' | 'start' | 'end'} [horizontalSnap='auto'] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @param {'auto' | 'top' | 'bottom'} [verticalSnap='auto'] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on the bottom of
   * the table. When `'auto'`, the viewport is scrolled only when the row is outside of the viewport.
   * @returns {boolean}
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
   * @param {number} column Visual column index.
   * @param {'auto' | 'start' | 'end'} [snapping='auto'] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @returns {boolean}
   */
  scrollViewportHorizontally(column: number, snapping: string) {
    return this.wtScroll.scrollViewportHorizontally(column, snapping);
  }

  /**
   * Scrolls the viewport to a row (rerenders if needed).
   *
   * @param {number} row Visual row index.
   * @param {'auto' | 'top' | 'bottom'} [snapping='auto'] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on
   * the bottom of the table. When `'auto'`, the viewport is scrolled only when the row is outside of
   * the viewport.
   * @returns {boolean}
   */
  scrollViewportVertically(row: number, snapping: string) {
    return this.wtScroll.scrollViewportVertically(row, snapping);
  }

  /**
   * @returns {Array}
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
   * Gets the overlay instance by its name. Returns null in the base implementation.
   *
   * @param {string} _overlayName The overlay name.
   * @returns {object | null}
   */
  getOverlayByName(_overlayName: string): object | null {
    return null;
  }

  /**
   * Exports settings as CSS class names. No-op in the base implementation.
   */
  exportSettingsAsClassNames(): void {
    // no-op; overridden in Walkontable (master table)
  }

  /**
   * Destroy instance.
   */
  destroy() {
    this.wtOverlays.destroy();
    this.wtEvent.destroy();
  }
}
