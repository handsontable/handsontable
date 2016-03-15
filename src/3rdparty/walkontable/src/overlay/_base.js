
import {
  getScrollableElement,
  getTrimmingContainer,
} from './../../../../helpers/dom/element';
import {defineGetter} from './../../../../helpers/object';
import {eventManager as eventManagerObject} from './../../../../eventManager';

const registeredOverlays = {};

/**
 * Creates an overlay over the original Walkontable instance. The overlay renders the clone of the original Walkontable
 * and (optionally) implements behavior needed for native horizontal and vertical scrolling.
 *
 * @class WalkontableOverlay
 */
class WalkontableOverlay {
  /**
   * @type {String}
   */
  static get CLONE_TOP() {
    return 'top';
  }

  /**
   * @type {String}
   */
  static get CLONE_BOTTOM() {
    return 'bottom';
  }

  /**
   * @type {String}
   */
  static get CLONE_LEFT() {
    return 'left';
  }

  /**
   * @type {String}
   */
  static get CLONE_TOP_LEFT_CORNER() {
    return 'top_left_corner';
  }

  /**
   * @type {String}
   */
  static get CLONE_BOTTOM_LEFT_CORNER() {
    return 'bottom_left_corner';
  }

  /**
   * @type {String}
   */
  static get CLONE_DEBUG() {
    return 'debug';
  }

  /**
   * List of all availables clone types
   *
   * @type {Array}
   */
  static get CLONE_TYPES() {
    return [
      WalkontableOverlay.CLONE_TOP,
      WalkontableOverlay.CLONE_BOTTOM,
      WalkontableOverlay.CLONE_LEFT,
      WalkontableOverlay.CLONE_TOP_LEFT_CORNER,
      WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER,
      WalkontableOverlay.CLONE_DEBUG,
    ];
  }

  /**
   * Register overlay class.
   *
   * @param {String} type Overlay type, one of the CLONE_TYPES value
   * @param {WalkontableOverlay} overlayClass Overlay class extended from base overlay class {@link WalkontableOverlay}
   */
  static registerOverlay(type, overlayClass) {
    if (WalkontableOverlay.CLONE_TYPES.indexOf(type) === -1) {
      throw new Error(`Unsupported overlay (${type}).`);
    }
    registeredOverlays[type] = overlayClass;
  }

  /**
   * Create new instance of overlay type
   *
   * @param {String} type Overlay type, one of the CLONE_TYPES value
   * @param {Walkontable} wot Walkontable instance
   */
  static createOverlay(type, wot) {
    return new registeredOverlays[type](wot);
  }

  /**
   * Checks if overlay object (`overlay`) is instance of overlay type (`type`)
   *
   * @param {WalkontableOverlay} overlay Overlay object
   * @param {String} type Overlay type, one of the CLONE_TYPES value
   * @returns {Boolean}
   */
  static isOverlayTypeOf(overlay, type) {
    if (!overlay || !registeredOverlays[type]) {
      return false;
    }

    return overlay instanceof registeredOverlays[type];
  }

  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    defineGetter(this, 'wot', wotInstance, {
      writable: false,
    });

    // legacy support, deprecated in the future
    this.instance = this.wot;

    this.type = '';
    this.mainTableScrollableElement = null;
    this.TABLE = this.wot.wtTable.TABLE;
    this.hider = this.wot.wtTable.hider;
    this.spreader = this.wot.wtTable.spreader;
    this.holder = this.wot.wtTable.holder;
    this.wtRootElement = this.wot.wtTable.wtRootElement;
    this.trimmingContainer = getTrimmingContainer(this.hider.parentNode.parentNode);
    this.needFullRender = this.shouldBeRendered();
    this.areElementSizesAdjusted = false;
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return true;
  }

  /**
   * Update the trimming container.
   */
  updateTrimmingContainer() {
    this.trimmingContainer = getTrimmingContainer(this.hider.parentNode.parentNode);
  }

  /**
   * Update the main scrollable element.
   */
  updateMainScrollableElement() {
    this.mainTableScrollableElement = getScrollableElement(this.wot.wtTable.TABLE);
  }

  /**
   * Make a clone of table for overlay
   *
   * @param {String} direction Can be `WalkontableOverlay.CLONE_TOP`, `WalkontableOverlay.CLONE_LEFT`,
   *                           `WalkontableOverlay.CLONE_TOP_LEFT_CORNER`, `WalkontableOverlay.CLONE_DEBUG`
   * @returns {Walkontable}
   */
  makeClone(direction) {
    if (WalkontableOverlay.CLONE_TYPES.indexOf(direction) === -1) {
      throw new Error('Clone type "' + direction + '" is not supported.');
    }
    let clone = document.createElement('DIV');
    let clonedTable = document.createElement('TABLE');

    clone.className = 'ht_clone_' + direction + ' handsontable';
    clone.style.position = 'absolute';
    clone.style.top = 0;
    clone.style.left = 0;
    clone.style.overflow = 'hidden';

    clonedTable.className = this.wot.wtTable.TABLE.className;
    clone.appendChild(clonedTable);

    this.type = direction;
    this.wot.wtTable.wtRootElement.parentNode.appendChild(clone);

    let preventOverflow = this.wot.getSetting('preventOverflow');

    if (preventOverflow === true ||
        preventOverflow === 'horizontal' && this.type === WalkontableOverlay.CLONE_TOP ||
        preventOverflow === 'vertical' && this.type === WalkontableOverlay.CLONE_LEFT) {
      this.mainTableScrollableElement = window;

    } else {
      this.mainTableScrollableElement = getScrollableElement(this.wot.wtTable.TABLE);
    }

    return new Walkontable({
      cloneSource: this.wot,
      cloneOverlay: this,
      table: clonedTable,
    });
  }

  /**
   * Refresh/Redraw overlay
   *
   * @param {Boolean} [fastDraw=false]
   */
  refresh(fastDraw = false) {
    // When hot settings are changed we allow to refresh overlay once before blocking
    var nextCycleRenderFlag = this.shouldBeRendered();

    if (this.clone && (this.needFullRender || nextCycleRenderFlag)) {
      this.clone.draw(fastDraw);
    }
    this.needFullRender = nextCycleRenderFlag;
  }

  /**
   * Destroy overlay instance
   */
  destroy() {
    eventManagerObject(this.clone).destroy();
  }
}

export {WalkontableOverlay};

window.WalkontableOverlay = WalkontableOverlay;
