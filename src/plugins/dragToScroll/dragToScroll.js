import BasePlugin from './../_base';
import EventManager from './../../eventManager';
import { registerPlugin } from './../../plugins';

/**
 * @description
 * Plugin used to scroll Handsontable by selecting a cell and dragging outside of the visible viewport.
 *
 *
 * @class DragToScroll
 * @plugin DragToScroll
 */
class DragToScroll extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Size of an element and its position relative to the viewport,
     * e.g. {bottom: 449, height: 441, left: 8, right: 814, top: 8, width: 806, x: 8, y:8}.
     *
     * @type {DOMRect}
     */
    this.boundaries = null;
    /**
     * Callback function.
     *
     * @private
     * @type {Function}
     */
    this.callback = null;
    /**
     * Flag indicates mouseDown/mouseUp.
     *
     * @private
     * @type {Boolean}
     */
    this.listening = false;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link DragToScroll#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().dragToScroll;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterOnCellMouseDown', () => this.setupListening());
    this.addHook('afterOnCellCornerMouseDown', () => this.setupListening());

    this.registerEvents();

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
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
   * Sets the value of the visible element.
   *
   * @param boundaries {DOMRect} An object with coordinates compatible with DOMRect.
   */
  setBoundaries(boundaries) {
    this.boundaries = boundaries;
  }

  /**
   * Changes callback function.
   *
   * @param callback {Function}
   */
  setCallback(callback) {
    this.callback = callback;
  }

  /**
   * Checks if the mouse position (X, Y) is outside of the viewport and fires a callback with calculated X an Y diffs
   * between passed boundaries.
   *
   * @param {Number} x Mouse X coordinate to check.
   * @param {Number} y Mouse Y coordinate to check.
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

    this.callback(diffX, diffY);
  }

  /**
   * Registers dom listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document, 'mouseup', () => this.onMouseUp());
    this.eventManager.addEventListener(document, 'mousemove', event => this.onMouseMove(event));
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
   * @private
   */
  setupListening() {
    const scrollHandler = this.hot.view.wt.wtTable.holder; // native scroll

    if (scrollHandler === window) {
      // not much we can do currently
      return;
    }

    this.setBoundaries(scrollHandler.getBoundingClientRect());
    this.setCallback((scrollX, scrollY) => {
      if (scrollX < 0) {
        scrollHandler.scrollLeft -= 50;

      } else if (scrollX > 0) {
        scrollHandler.scrollLeft += 50;
      }

      if (scrollY < 0) {
        scrollHandler.scrollTop -= 20;

      } else if (scrollY > 0) {
        scrollHandler.scrollTop += 20;
      }
    });

    this.listening = true;
  }

  /**
   * 'mouseMove' event callback.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
   */
  onMouseMove(event) {
    if (this.listening) {
      this.check(event.clientX, event.clientY);
    }
  }

  /**
   * `onMouseUp` hook callback.
   *
   * @private
   */
  onMouseUp() {
    this.listening = false;
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

registerPlugin('dragToScroll', DragToScroll);

export default DragToScroll;
