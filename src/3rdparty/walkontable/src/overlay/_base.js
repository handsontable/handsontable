
import {
  getScrollableElement,
  getTrimmingContainer,
    } from './../../../../helpers/dom/element';
import {defineGetter} from './../../../../helpers/object';
import {eventManager as eventManagerObject} from './../../../../eventManager';


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
  static get CLONE_LEFT() {
    return 'left';
  }

  /**
   * @type {String}
   */
  static get CLONE_CORNER() {
    return 'corner';
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
      WalkontableOverlay.CLONE_LEFT,
      WalkontableOverlay.CLONE_CORNER,
      WalkontableOverlay.CLONE_DEBUG
    ];
  }

  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    defineGetter(this, 'wot', wotInstance, {
      writable: false
    });

    // legacy support, deprecated in the future
    this.instance = this.wot;

    this.type = '';
    this.TABLE = this.wot.wtTable.TABLE;
    this.hider = this.wot.wtTable.hider;
    this.spreader = this.wot.wtTable.spreader;
    this.holder = this.wot.wtTable.holder;
    this.wtRootElement = this.wot.wtTable.wtRootElement;
    this.trimmingContainer = getTrimmingContainer(this.hider.parentNode.parentNode);
    this.mainTableScrollableElement = getScrollableElement(this.wot.wtTable.TABLE);
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
   * Make a clone of table for overlay
   *
   * @param {String} direction Can be `WalkontableOverlay.CLONE_TOP`, `WalkontableOverlay.CLONE_LEFT`,
   *                           `WalkontableOverlay.CLONE_CORNER`, `WalkontableOverlay.CLONE_DEBUG`
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

    return new Walkontable({
      cloneSource: this.wot,
      cloneOverlay: this,
      table: clonedTable
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
