import { BasePlugin } from '../base';
import { isRightClick } from '../../helpers/dom/event';
import { getParentWindow } from '../../helpers/dom/element';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { AutoScroller } from './autoScroller';

export const PLUGIN_KEY = 'dragToScroll';
export const PLUGIN_PRIORITY = 100;

/**
 * Represents viewport boundaries used for drag-to-scroll detection.
 */
interface Boundaries {
  width?: number;
  height?: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @description
 * Plugin used to scroll Handsontable by selecting a cell and dragging outside of the visible viewport.
 *
 *
 * @class DragToScroll
 * @plugin DragToScroll
 */
export class DragToScroll extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    return {
      interval: {
        min: 20,
        max: 500,
      },
      rampDistance: 120,
    };
  }

  /**
   * Size of an element and its position relative to the viewport,
   * e.g. {bottom: 449, height: 441, left: 8, right: 814, top: 8, width: 806, x: 8, y:8}.
   *
   * @type {DOMRect}
   */
  boundaries: Boundaries | null = null;
  /**
   * Callback function.
   *
   * @private
   * @type {Function}
   */
  callback: ((diffX: number, diffY: number) => void) | null = null;
  /**
   * Flag indicates mouseDown/mouseUp.
   *
   * @private
   * @type {boolean}
   */
  listening = false;
  /**
   * Auto scroller for managing independent horizontal and vertical scroll timers.
   *
   * @type {AutoScroller}
   */
  #autoScroller = new AutoScroller(
    (fn: () => void, delay: number) => this.hot._registerTimeout(fn, delay) as unknown as number
  )
    .addLocalHook('scrollHorizontal', (distance: number) => this.#scrollHorizontal(distance))
    .addLocalHook('scrollVertical', (distance: number) => this.#scrollVertical(distance));
  /**
   * Flag indicates if the mouse is outside the viewport.
   *
   * @type {boolean}
   */
  #isOutsideViewport = false;
  /**
   * Kind of drag currently active: `'cell'` for a regular mouse-drag selection,
   * `'corner'` for an autofill fill-handle drag, or `null` when no drag is active.
   * Only `'cell'` drags extend the selection via `#onAfterScroll`.
   *
   * @type {('cell' | 'corner' | null)}
   */
  #activeDragKind: 'cell' | 'corner' | null = null;
  /**
   * Last observed mouse X coordinate (client space). Cached so that the viewport
   * can recompute the edge cell on each `afterScroll` tick even when the mouse
   * stays stationary outside the viewport.
   *
   * @type {number | null}
   */
  #lastClientX: number | null = null;
  /**
   * Last observed mouse Y coordinate (client space).
   *
   * @type {number | null}
   */
  #lastClientY: number | null = null;
  /**
   * Reference to the controller object from `beforeOnCellMouseDown`. The
   * object is mutated in-place by all hook handlers, so by the time
   * `#onAfterScroll` reads it the flags are fully set.
   *
   * @type {object | null}
   */
  #mouseDownController: { row?: boolean; column?: boolean } | null = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link DragToScroll#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#autoScroller.configure({
      intervalRange: this.getSetting<{ min: number; max: number }>('interval'),
      rampDistance: this.getSetting<number>('rampDistance'),
    });

    this.addHook('beforeOnCellMouseDown', (event: MouseEvent, _coords: unknown, _TD: unknown, controller: unknown) => {
      const typedController = (typeof controller === 'object' && controller !== null)
        ? controller as { row?: boolean; column?: boolean }
        : null;

      this.#setupListening('cell', event, typedController);
    });
    this.addHook('afterOnCellCornerMouseDown', (event: MouseEvent) => this.#setupListening('corner', event));
    this.addHook('afterSelection', this.#onAfterSelection);
    this.addHook('afterScroll', this.#onAfterScroll);

    this.registerEvents();

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`dragToScroll`](@/api/options.md#dragtoscroll)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.#autoScroller.stop();
    this.unregisterEvents();

    super.disablePlugin();
  }

  /**
   * Sets the boundaries/dimensions of the scrollable viewport.
   *
   * @param {DOMRect|{left: number, right: number, top: number, bottom: number}} [boundaries] An object with
   * coordinates. Contains the window boundaries by default. The object is compatible with DOMRect.
   */
  setBoundaries(boundaries: Boundaries = {
    left: 0,
    right: this.hot.rootWindow.innerWidth,
    top: 0,
    bottom: this.hot.rootWindow.innerHeight,
  }): void {
    this.boundaries = boundaries;
  }

  /**
   * Changes callback function.
   *
   * @param {Function} callback The callback function.
   */
  setCallback(callback: (diffX: number, diffY: number) => void): void {
    this.callback = callback;
  }

  /**
   * Checks if the mouse position (X, Y) is outside the viewport and fires a callback with calculated X an Y diffs
   * between passed boundaries.
   *
   * @param {number} x Mouse X coordinate to check.
   * @param {number} y Mouse Y coordinate to check.
   */
  check(x: number, y: number): void {
    let diffX = 0;
    let diffY = 0;
    const { boundaries } = this;

    if (boundaries) {
      if (y < boundaries.top) {
        // y is less than top
        diffY = y - boundaries.top;

      } else if (y > boundaries.bottom) {
        // y is more than bottom
        diffY = y - boundaries.bottom;
      }

      if (x < boundaries.left) {
        // x is less than left
        diffX = x - boundaries.left;

      } else if (x > boundaries.right) {
        // x is more than right
        diffX = x - boundaries.right;
      }
    }

    this.#isOutsideViewport = diffY !== 0 || diffX !== 0;

    if (this.callback) {
      this.callback(diffX, diffY);
    }
  }

  /**
   * Enables listening on `mousemove` event.
   *
   * @private
   */
  listen() {
    this.listening = true;
  }

  /**
   * Disables listening on `mousemove` event.
   *
   * @private
   */
  unlisten() {
    this.listening = false;
    this.#activeDragKind = null;
    this.#lastClientX = null;
    this.#lastClientY = null;
    this.#isOutsideViewport = false;
    this.#mouseDownController = null;
    this.#autoScroller.stop();
  }

  /**
   * Returns current state of listening.
   *
   * @private
   * @returns {boolean}
   */
  isListening() {
    return this.listening;
  }

  /**
   * Registers dom listeners.
   *
   * @private
   */
  registerEvents() {
    const { rootWindow } = this.hot;

    let frame: Window | null = rootWindow;

    while (frame) {
      this.eventManager.addEventListener(frame.document, 'contextmenu', () => this.unlisten());
      this.eventManager.addEventListener(frame.document, 'mouseup', () => this.unlisten());
      this.eventManager.addEventListener(frame.document, 'mousemove', (event: Event) => {
        this.#onMouseMove(event as MouseEvent);
      });

      frame = getParentWindow(frame) as Window | null;
    }
  }

  /**
   * Unbinds the events used by the plugin.
   *
   * @private
   */
  unregisterEvents() {
    this.eventManager.clear();
  }

  /**
   * On after on cell/cellCorner mouse down listener.
   *
   * @param {('cell' | 'corner')} kind Which drag started — a regular cell selection drag
   *   (`'cell'`) or an autofill fill-handle drag (`'corner'`).
   * @param {MouseEvent} event The mouse event object.
   * @param {object} [controller] The controller object from `beforeOnCellMouseDown`.
   */
  #setupListening(
    kind: 'cell' | 'corner', event: MouseEvent, controller: { row?: boolean; column?: boolean } | null = null
  ) {
    if (isRightClick(event)) {
      return;
    }

    // Regular drag-select is a no-op when selectionMode is 'single'. Autofill
    // drag is unaffected.
    if (kind === 'cell' && this.hot.getSettings().selectionMode === 'single') {
      return;
    }

    this.#activeDragKind = kind;
    this.#mouseDownController = controller;

    const scrollHandler = this.hot.view._wt.wtOverlays.topOverlay.mainTableScrollableElement;

    if (scrollHandler === this.hot.rootWindow) {
      this.setBoundaries();
    } else {
      const boundaries = (scrollHandler as HTMLElement).getBoundingClientRect();

      this.setBoundaries({
        left: boundaries.left + this.hot.view.getRowHeaderWidth(),
        right: boundaries.right,
        top: boundaries.top + this.hot.view.getColumnHeaderHeight(),
        bottom: boundaries.bottom,
      });
    }

    this.setCallback((scrollX: number, scrollY: number) => {
      const { selection } = this.hot;

      // Suppress the irrelevant scroll axis for header-based selections:
      // row header drags only need vertical scrolling, column header drags only horizontal.
      const x = selection.isSelectedByRowHeader() ? 0 : scrollX;
      const y = selection.isSelectedByColumnHeader() ? 0 : scrollY;

      // Always call update — passing (0, 0) stops the timers when the mouse
      // returns inside the viewport.
      this.#autoScroller.update({ x, y });
    });

    this.listen();
  }

  /**
   * Scrolls the viewport horizontally by one column. Stops the horizontal axis
   * of the auto-scroller when `scrollViewportTo` reports that no scroll
   * happened — meaning the viewport is already pegged against the first or
   * last column.
   *
   * Under RTL, the screen-x → column-index mapping is visually inverted:
   * a mouse past the screen-right edge wants to reveal LOWER column indexes
   * (which are visually to the right of the current viewport), and past the
   * screen-left edge wants HIGHER column indexes.
   *
   * @param {number} distance Horizontal distance from viewport edge (positive = right, negative = left).
   */
  #scrollHorizontal(distance: number) {
    const shouldAdvance = this.hot.isRtl() ? distance < 0 : distance > 0;
    // Advance (right in LTR / left in RTL): target the first column past the last fully visible one.
    // Retreat (left in LTR / right in RTL): target the column before the first partially visible one.
    // No explicit horizontalSnap — auto-snapping in scrollViewportHorizontally detects which side the
    // target column is on and snaps accordingly: off-screen right → 'end' (right edge), off-screen
    // left → 'start' (left edge). This keeps the selection stuck to whichever viewport edge the
    // mouse pushed past, and works correctly for both LTR and RTL layouts.
    const scrollColumn = shouldAdvance
      ? this.hot.getLastFullyVisibleColumn() + 1
      : this.hot.getFirstPartiallyVisibleColumn() - 1;

    // The no-op callback causes hot.scrollViewportTo to call view.render() after scrolling,
    // which ensures afterScroll fires even in environments where programmatic window.scrollTo()
    // does not emit a native `scroll` DOM event (e.g. headless Chrome without scroll-event support).
    const isScrolled = this.hot.scrollViewportTo({ col: scrollColumn }, () => {});

    if (!isScrolled) {
      this.#autoScroller.stopHorizontal();
    }
  }

  /**
   * Scrolls the viewport vertically by one row. Stops the vertical axis of the
   * auto-scroller when `scrollViewportTo` reports that no scroll happened.
   *
   * @param {number} distance Vertical distance from viewport edge (positive = down, negative = up).
   */
  #scrollVertical(distance: number) {
    const firstVisibleRow = this.hot.getFirstFullyVisibleRow();
    const lastVisibleRow = this.hot.getLastFullyVisibleRow();
    const scrollRow = distance > 0 ? lastVisibleRow + 1 : firstVisibleRow - 1;

    // See the comment in #scrollHorizontal for why a no-op callback is passed.
    const isScrolled = this.hot.scrollViewportTo({ row: scrollRow }, () => {});

    if (!isScrolled) {
      this.#autoScroller.stopVertical();
    }
  }

  /**
   * Prevents viewport scroll when the cursor is outside the viewport during
   * an active drag-scroll. Limited to the active-drag window so that ordinary
   * `selectCell` / mouse-click selections still scroll-into-view normally.
   *
   * @param {number} row Selection start visual row index.
   * @param {number} column Selection start visual column index.
   * @param {number} endRow Selection end visual row index.
   * @param {number} endColumn Selection end visual column index.
   * @param {object} preventScrolling A reference to the observable object with the `value` property.
   *                                  Property `preventScrolling.value` expects a boolean value that
   *                                  Handsontable uses to control scroll behavior after selection.
   */
  #onAfterSelection = (
    row: number, column: number, endRow: number, endColumn: number, preventScrolling: { value: boolean }
  ) => {
    if (this.listening && this.#isOutsideViewport) {
      preventScrolling.value = true;
    }
  };

  /**
   * 'mouseMove' event callback.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
   */
  #onMouseMove(event: MouseEvent) {
    if (!this.isListening()) {
      return;
    }

    this.#lastClientX = event.clientX;
    this.#lastClientY = event.clientY;

    this.check(event.clientX, event.clientY);
  }

  /**
   * Extends the regular drag-select selection to the cell at the clamped mouse position
   * after each viewport auto-scroll tick. Autofill drags are skipped — the autofill plugin
   * owns its own selection extension via its `afterScroll` hook.
   */
  #onAfterScroll = () => {
    if (this.#activeDragKind !== 'cell') {
      return;
    }

    if (!this.#isOutsideViewport) {
      return;
    }

    if (this.#lastClientX === null || this.#lastClientY === null) {
      return;
    }

    if (this.hot.getSettings().selectionMode === 'single') {
      return;
    }

    // When another plugin claimed the drag via the controller (e.g. manualRowMove
    // sets controller.row = true), skip selection extension. The controller object
    // is captured by reference in #setupListening and mutated in-place by later
    // handlers, so by now the flags reflect the final state.
    if (this.#mouseDownController?.row || this.#mouseDownController?.column) {
      return;
    }

    const { selection, view } = this.hot;
    const edgeCell = getCellCoordsFromMousePosition(this.hot, this.#lastClientX, this.#lastClientY);

    if (!edgeCell) {
      return;
    }

    let targetRow = edgeCell.row ?? 0;
    let targetCol = edgeCell.col ?? 0;

    // Clamp the target to the last fully visible row/column so that the
    // selection border stays inside the viewport. Without this, the target
    // could land on a partially visible row/column whose border is clipped
    // by the viewport edge.
    const firstFullyVisibleRow = view.getFirstFullyVisibleRow() ?? 0;
    const lastFullyVisibleRow = view.getLastFullyVisibleRow() ?? 0;
    const firstFullyVisibleColumn = view.getFirstFullyVisibleColumn() ?? 0;
    const lastFullyVisibleColumn = view.getLastFullyVisibleColumn() ?? 0;

    if (targetRow > lastFullyVisibleRow) {
      targetRow = lastFullyVisibleRow;
    } else if (targetRow < firstFullyVisibleRow) {
      targetRow = firstFullyVisibleRow;
    }

    if (targetCol > lastFullyVisibleColumn) {
      targetCol = lastFullyVisibleColumn;
    } else if (targetCol < firstFullyVisibleColumn) {
      targetCol = firstFullyVisibleColumn;
    }

    // Preserve "whole row" / "whole column" semantics for header-based selections.
    // This mirrors the logic in mouseEventHandler.js mouseOver().
    if (selection.isSelectedByRowHeader()) {
      targetCol = this.hot.countCols() - 1;
    }
    if (selection.isSelectedByColumnHeader()) {
      targetRow = this.hot.countRows() - 1;
    }

    const target = this.hot._createCellCoords(targetRow, targetCol);
    const currentRange = this.hot.getSelectedRangeLast();

    // Skip the setRangeEnd call when the edge cell matches the current
    // selection end. Avoids a redundant `afterSelection` firing and re-render
    // on each tick.
    if (currentRange && currentRange.to.row === target.row && currentRange.to.col === target.col) {
      return;
    }

    selection.setRangeEnd(target);
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#autoScroller.destroy();

    super.destroy();
  }
}
