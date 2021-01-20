import { BasePlugin } from '../base';
import EventManager from '../../eventManager';
import { isRightClick } from '../../helpers/dom/event';
import { getParentWindow } from '../../helpers/dom/element';

export const PLUGIN_KEY = 'dragToScroll';
export const PLUGIN_PRIORITY = 100;
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
     * @type {boolean}
     */
    this.listening = false;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link DragToScroll#enablePlugin} method is called.
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

    this.addHook('afterOnCellMouseDown', event => this.setupListening(event));
    this.addHook('afterOnCellCornerMouseDown', event => this.setupListening(event));

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
   * @param {DOMRect} boundaries An object with coordinates compatible with DOMRect.
   */
  setBoundaries(boundaries) {
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
   * Checks if the mouse position (X, Y) is outside of the viewport and fires a callback with calculated X an Y diffs
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
      this.eventManager.addEventListener(frame.document, 'mousemove', event => this.onMouseMove(event));

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
   * @private
   * @param {MouseEvent} event The mouse event object.
   */
  setupListening(event) {
    if (isRightClick(event)) {
      return;
    }

    const scrollHandler = this.hot.view.wt.wtTable.holder; // native scroll

    if (scrollHandler === this.hot.rootWindow) {
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

    this.listen();
  }

  /**
   * 'mouseMove' event callback.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
   */
  onMouseMove(event) {
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
