import { BasePlugin } from '../base';
import { isRightClick } from '../../helpers/dom/event';
import { getParentWindow, getScrollbarWidth } from '../../helpers/dom/element';

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
          min: 50,
          max: 500,
        },
        rampDistance: 100,
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
   * Timer for scrolling the viewport looper.
   *
   * @type {number}
   */
  #timer = null;
  /**
   * Current interval value for the viewport looper.
   *
   * @type {number}
   */
  #currentInterval = null;
  /**
   * Coords of the cell that is being dragged.
   *
   * @type {CellCoords}
   */
  #autofillBorderCoords = null;
  /**
   * Flag indicates if the mouse is outside the viewport.
   *
   * @type {boolean}
   */
  #isOutsideViewport = false;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link DragToScroll#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
    // return false;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('beforeOnCellMouseDown', (...args) => this.#setupListening(...args));
    this.addHook('afterOnCellCornerMouseDown', (...args) => this.#setupListening(...args));
    this.addHook('afterSelection', (...args) => this.#onAfterSelection(...args));
    this.addHook('beforeAutofillRedrawBorders', (...args) => this.#onBeforeAutofillRedrawBorders(...args));

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
    this.#stopScrollViewportLooper();
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
   * @param {MouseEvent} event The mouse event object.
   */
  #setupListening(event) {
    if (isRightClick(event)) {
      return;
    }

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
      const horizontalScrollValue = scrollHandler.scrollLeft ?? scrollHandler.scrollX;
      const verticalScrollValue = scrollHandler.scrollTop ?? scrollHandler.scrollY;

      scrollHandler.scroll(
        horizontalScrollValue + (Math.sign(diffX) * 50),
        verticalScrollValue + (Math.sign(diffY) * 20)
      );

      // if (diffX === 0 && diffY === 0) {
      //   this.#stopScrollViewportLooper();

      //   return;
      // }

      // const intervalRange = this.getSetting('autoScroll.interval');
      // const rampDistance = this.getSetting('autoScroll.rampDistance');
      // const diff = Math.min(diffX === 0 ? Infinity : diffX, diffY === 0 ? Infinity : diffY);
      // const interval = calculateScrollInterval(diff, intervalRange, rampDistance);

      // this.#runScrollViewportLooper(interval, {
      //   diffX: () => diffX,
      //   diffY: () => diffY,
      // });
    });

    this.listen();
  }

  #runScrollViewportLooper(interval, { diffX, diffY }) {
    this.#currentInterval = interval;

    if (this.#timer !== null) {
      return;
    }

    const scrollViewport = () => {
      let coords;

      if (!this.hot.selection.highlight.getFill().isEmpty()) {
        coords = this.hot.selection.highlight.getFill().visualCellRange.to.clone();

        if (diffX()) {
          coords.col = diffX() > 0 ? coords.col + 1 : coords.col - 1;
        }

        if (diffY()) {
          coords.row = diffY() > 0 ? coords.row + 1 : coords.row - 1;
        }

        this.hot.selection.highlight.getFill()
          .clear()
          .add(this.hot.getSelectedRangeLast().from)
          .add(coords)
          .commit();

      } else {
        coords = this.hot.getSelectedRangeActive().to.clone();

        if (diffX()) {
          coords.col = diffX() > 0 ? coords.col + 1 : coords.col - 1;
        }

        if (diffY()) {
          coords.row = diffY() > 0 ? coords.row + 1 : coords.row - 1;
        }

        this.hot.selection.setRangeEnd(coords);
      }

      // this.hot.scrollViewportTo({
      //   row: coords.row,
      //   col: coords.col,
      //   verticalSnap: diffY() !== 0 ? (diffY() > 0 ? 'bottom' : 'top') : undefined,
      //   horizontalSnap: diffX() !== 0 ? (diffX() > 0 ? 'end' : 'start') : undefined,
      // });

      this.#timer = this.hot._registerTimeout(scrollViewport, this.#currentInterval);
    };

    scrollViewport();
  }

  #stopScrollViewportLooper() {
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
      this.#currentInterval = null;
    }
  }

  #onAfterSelection(row, column, endRow, endColumn, preventScrolling) {
    if (this.#isOutsideViewport) {
      preventScrolling.value = true;
    }
  }

  #onBeforeAutofillRedrawBorders(coords) {
    this.#autofillBorderCoords = coords;
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

    this.check(event.clientX, event.clientY);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
