import { BasePlugin } from '../base';
import { isRightClick } from '../../helpers/dom/event';
import { getParentWindow, getScrollbarWidth } from '../../helpers/dom/element';
import { getCellCoordsFromMousePosition } from '../../helpers/dom/cellCoords';
import { AutoScroller } from './autoScroller';

export const PLUGIN_KEY = 'dragToScroll';
export const PLUGIN_PRIORITY = 100;

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
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      autoScroll: {
        interval: {
          min: 20,
          max: 500,
        },
        rampDistance: 120,
      },
    };
  }

  /**
   * Size of an element and its position relative to the viewport,
   * e.g. {bottom: 449, height: 441, left: 8, right: 814, top: 8, width: 806, x: 8, y:8}.
   *
   * @type {DOMRect}
   */
  boundaries = null;
  /**
   * Callback function.
   *
   * @private
   * @type {Function}
   */
  callback = null;
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
  #autoScroller = new AutoScroller((...args) => this.hot._registerTimeout(...args));
  /**
   * Flag indicates if the mouse is outside the viewport.
   *
   * @type {boolean}
   */
  #isOutsideViewport = false;
  /**
   * Kind of drag currently active: `'cell'` for a regular mouse-drag selection,
   * `'corner'` for an autofill fill-handle drag, or `null` when no drag is active.
   * Used to route the auto-scroll-based selection extension only to regular drags
   * (autofill manages its own extension via its `afterScroll` hook).
   *
   * @type {('cell' | 'corner' | null)}
   */
  #activeDragKind = null;
  /**
   * Last observed mouse X coordinate (client space). Cached so that the viewport
   * can recompute the edge cell on each `afterScroll` tick even when the mouse
   * stays stationary outside the viewport.
   *
   * @type {number | null}
   */
  #lastClientX = null;
  /**
   * Last observed mouse Y coordinate (client space).
   *
   * @type {number | null}
   */
  #lastClientY = null;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link DragToScroll#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
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
      intervalRange: this.getSetting('autoScroll.interval'),
      rampDistance: this.getSetting('autoScroll.rampDistance'),
    });
    this.#autoScroller
      .addLocalHook('scrollHorizontal', distance => this.#scrollHorizontal(distance))
      .addLocalHook('scrollVertical', distance => this.#scrollVertical(distance));

    this.addHook('beforeOnCellMouseDown', event => this.#setupListening('cell', event));
    this.addHook('afterOnCellCornerMouseDown', event => this.#setupListening('corner', event));
    this.addHook('afterSelection', (...args) => this.#onAfterSelection(...args));
    this.addHook('afterScroll', () => this.#onAfterScroll());

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
  setBoundaries(boundaries = {
    left: 0,
    right: this.hot.rootWindow.innerWidth,
    top: 0,
    bottom: this.hot.rootWindow.innerHeight,
  }) {
    this.boundaries = boundaries;
  }

  /**
   * Changes callback function.
   *
   * @param {Function} callback The callback function.
   */
  setCallback(callback) {
    this.callback = callback;
  }

  /**
   * Checks if the mouse position (X, Y) is outside the viewport and fires a callback with calculated X an Y diffs
   * between passed boundaries.
   *
   * @param {number} x Mouse X coordinate to check.
   * @param {number} y Mouse Y coordinate to check.
   */
  check(x, y) {
    let diffX = 0;
    let diffY = 0;

    if (y < this.boundaries.top) {
      // y is less than top
      diffY = y - this.boundaries.top;

    } else if (y > this.boundaries.bottom) {
      // y is more than bottom
      diffY = y - this.boundaries.bottom;
    }

    if (x < this.boundaries.left) {
      // x is less than left
      diffX = x - this.boundaries.left;

    } else if (x > this.boundaries.right) {
      // x is more than right
      diffX = x - this.boundaries.right;
    }

    this.#isOutsideViewport = diffY !== 0 || diffX !== 0;

    this.callback(diffX, diffY);
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

    let frame = rootWindow;

    while (frame) {
      this.eventManager.addEventListener(frame.document, 'contextmenu', () => this.unlisten());
      this.eventManager.addEventListener(frame.document, 'mouseup', () => this.unlisten());
      this.eventManager.addEventListener(frame.document, 'mousemove', event => this.#onMouseMove(event));

      frame = getParentWindow(frame);
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
   */
  #setupListening(kind, event) {
    if (isRightClick(event)) {
      return;
    }

    // Regular drag-select is a no-op when selectionMode is 'single'. Autofill
    // drag is unaffected.
    if (kind === 'cell' && this.hot.getSettings().selectionMode === 'single') {
      return;
    }

    this.#activeDragKind = kind;

    const scrollHandler = this.hot.view._wt.wtOverlays.topOverlay.mainTableScrollableElement;

    if (scrollHandler === this.hot.rootWindow) {
      this.setBoundaries();
    } else {
      const boundaries = scrollHandler.getBoundingClientRect();

      this.setBoundaries({
        left: boundaries.left + this.hot.view.getRowHeaderWidth(),
        right: boundaries.right - getScrollbarWidth(),
        top: boundaries.top + this.hot.view.getColumnHeaderHeight(),
        bottom: boundaries.bottom - getScrollbarWidth(),
      });
    }

    this.setCallback((diffX, diffY) => {
      this.#autoScroller.update({ x: diffX, y: diffY });
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
  #scrollHorizontal(distance) {
    const firstVisibleColumn = this.hot.getFirstFullyVisibleColumn();
    const lastVisibleColumn = this.hot.getLastFullyVisibleColumn();
    const shouldAdvance = this.hot.isRtl() ? distance < 0 : distance > 0;
    const scrollColumn = shouldAdvance ? lastVisibleColumn + 1 : firstVisibleColumn - 1;

    const isScrolled = this.hot.scrollViewportTo({ col: scrollColumn });

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
  #scrollVertical(distance) {
    const firstVisibleRow = this.hot.getFirstFullyVisibleRow();
    const lastVisibleRow = this.hot.getLastFullyVisibleRow();
    const scrollRow = distance > 0 ? lastVisibleRow + 1 : firstVisibleRow - 1;

    const isScrolled = this.hot.scrollViewportTo({ row: scrollRow });

    if (!isScrolled) {
      this.#autoScroller.stopVertical();
    }
  }

  /**
   * Prevents viewport scroll when the cursor is outside the viewport.
   *
   * @param {number} row Selection start visual row index.
   * @param {number} column Selection start visual column index.
   * @param {number} endRow Selection end visual row index.
   * @param {number} endColumn Selection end visual column index.
   * @param {object} preventScrolling A reference to the observable object with the `value` property.
   *                                  Property `preventScrolling.value` expects a boolean value that
   *                                  Handsontable uses to control scroll behavior after selection.
   */
  #onAfterSelection(row, column, endRow, endColumn, preventScrolling) {
    if (this.#isOutsideViewport) {
      preventScrolling.value = true;
    }
  }

  /**
   * 'mouseMove' event callback.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
   */
  #onMouseMove(event) {
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
  #onAfterScroll() {
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

    const edgeCell = getCellCoordsFromMousePosition(this.hot, this.#lastClientX, this.#lastClientY);

    if (!edgeCell) {
      return;
    }

    const currentRange = this.hot.getSelectedRangeLast();

    // Skip the setRangeEnd call when the edge cell matches the current
    // selection end. Avoids a redundant `afterSelection` firing and re-render
    // on each tick.
    if (currentRange && currentRange.to.row === edgeCell.row && currentRange.to.col === edgeCell.col) {
      return;
    }

    this.hot.selection.setRangeEnd(edgeCell);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#autoScroller.destroy();
    this.#autoScroller = null;

    super.destroy();
  }
}
