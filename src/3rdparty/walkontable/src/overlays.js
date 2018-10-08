import {
  getScrollableElement,
  getScrollbarWidth,
} from './../../../helpers/dom/element';
import { arrayEach } from './../../../helpers/array';
import { isKey } from './../../../helpers/unicode';
import { isChrome } from './../../../helpers/browser';
import EventManager from './../../../eventManager';
import Overlay from './overlay/_base';

/**
 * @class Overlays
 */
class Overlays {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    /**
     * Sometimes `line-height` might be set to 'normal'. In that case, a default `font-size` should be multiplied by roughly 1.2.
     * https://developer.mozilla.org/pl/docs/Web/CSS/line-height#Values
     */
    const BODY_LINE_HEIGHT = parseInt(getComputedStyle(document.body).lineHeight, 10);
    const FALLBACK_BODY_LINE_HEIGHT = parseInt(getComputedStyle(document.body).fontSize, 10) * 1.2;

    this.wot = wotInstance;

    // legacy support
    this.instance = this.wot;
    this.eventManager = new EventManager(this.wot);

    this.wot.update('scrollbarWidth', getScrollbarWidth());
    this.wot.update('scrollbarHeight', getScrollbarWidth());

    this.scrollableElement = getScrollableElement(this.wot.wtTable.TABLE);

    this.prepareOverlays();

    this.destroyed = false;
    this.keyPressed = false;
    this.spreaderLastSize = {
      width: null,
      height: null,
    };
    this.overlayScrollPositions = {
      master: {
        top: 0,
        left: 0,
      },
      top: {
        top: null,
        left: 0,
      },
      bottom: {
        top: null,
        left: 0
      },
      left: {
        top: 0,
        left: null
      }
    };

    this.pendingScrollCallbacks = {
      master: {
        top: 0,
        left: 0,
      },
      top: {
        left: 0,
      },
      bottom: {
        left: 0,
      },
      left: {
        top: 0,
      }
    };

    this.verticalScrolling = false;
    this.horizontalScrolling = false;
    this.delegatedScrollCallback = false;

    this.registeredListeners = [];

    this.browserLineHeight = BODY_LINE_HEIGHT || FALLBACK_BODY_LINE_HEIGHT;

    this.registerListeners();
  }

  /**
   * Prepare overlays based on user settings.
   *
   * @returns {Boolean} Returns `true` if changes applied to overlay needs scroll synchronization.
   */
  prepareOverlays() {
    let syncScroll = false;

    if (this.topOverlay) {
      syncScroll = this.topOverlay.updateStateOfRendering() || syncScroll;
    } else {
      this.topOverlay = Overlay.createOverlay(Overlay.CLONE_TOP, this.wot);
    }

    if (!Overlay.hasOverlay(Overlay.CLONE_BOTTOM)) {
      this.bottomOverlay = {
        needFullRender: false,
        updateStateOfRendering: () => false,
      };
    }
    if (!Overlay.hasOverlay(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      this.bottomLeftCornerOverlay = {
        needFullRender: false,
        updateStateOfRendering: () => false,
      };
    }

    if (this.bottomOverlay) {
      syncScroll = this.bottomOverlay.updateStateOfRendering() || syncScroll;
    } else {
      this.bottomOverlay = Overlay.createOverlay(Overlay.CLONE_BOTTOM, this.wot);
    }

    if (this.leftOverlay) {
      syncScroll = this.leftOverlay.updateStateOfRendering() || syncScroll;
    } else {
      this.leftOverlay = Overlay.createOverlay(Overlay.CLONE_LEFT, this.wot);
    }

    if (this.topOverlay.needFullRender && this.leftOverlay.needFullRender) {
      if (this.topLeftCornerOverlay) {
        syncScroll = this.topLeftCornerOverlay.updateStateOfRendering() || syncScroll;
      } else {
        this.topLeftCornerOverlay = Overlay.createOverlay(Overlay.CLONE_TOP_LEFT_CORNER, this.wot);
      }
    }

    if (this.bottomOverlay.needFullRender && this.leftOverlay.needFullRender) {
      if (this.bottomLeftCornerOverlay) {
        syncScroll = this.bottomLeftCornerOverlay.updateStateOfRendering() || syncScroll;
      } else {
        this.bottomLeftCornerOverlay = Overlay.createOverlay(Overlay.CLONE_BOTTOM_LEFT_CORNER, this.wot);
      }
    }

    if (this.wot.getSetting('debug') && !this.debug) {
      this.debug = Overlay.createOverlay(Overlay.CLONE_DEBUG, this.wot);
    }

    return syncScroll;
  }

  /**
   * Refresh and redraw table
   */
  refreshAll() {
    if (!this.wot.drawn) {
      return;
    }
    if (!this.wot.wtTable.holder.parentNode) {
      // Walkontable was detached from DOM, but this handler was not removed
      this.destroy();

      return;
    }
    this.wot.draw(true);

    if (this.verticalScrolling) {
      this.leftOverlay.onScroll();
    }

    if (this.horizontalScrolling) {
      this.topOverlay.onScroll();
    }

    this.verticalScrolling = false;
    this.horizontalScrolling = false;
  }

  /**
   * Register all necessary event listeners.
   */
  registerListeners() {
    const topOverlayScrollable = this.topOverlay.mainTableScrollableElement;
    const leftOverlayScrollable = this.leftOverlay.mainTableScrollableElement;

    const listenersToRegister = [];
    listenersToRegister.push([document.documentElement, 'keydown', event => this.onKeyDown(event)]);
    listenersToRegister.push([document.documentElement, 'keyup', () => this.onKeyUp()]);
    listenersToRegister.push([document, 'visibilitychange', () => this.onKeyUp()]);
    listenersToRegister.push([topOverlayScrollable, 'scroll', event => this.onTableScroll(event)]);

    if (topOverlayScrollable !== leftOverlayScrollable) {
      listenersToRegister.push([leftOverlayScrollable, 'scroll', event => this.onTableScroll(event)]);
    }

    const isHighPixelRatio = window.devicePixelRatio && window.devicePixelRatio > 1;

    if (isHighPixelRatio || !isChrome()) {
      listenersToRegister.push([this.instance.wtTable.wtRootElement.parentNode, 'wheel', event => this.onCloneWheel(event)]);

    } else {
      if (this.topOverlay.needFullRender) {
        listenersToRegister.push([this.topOverlay.clone.wtTable.holder, 'wheel', event => this.onCloneWheel(event)]);
      }

      if (this.bottomOverlay.needFullRender) {
        listenersToRegister.push([this.bottomOverlay.clone.wtTable.holder, 'wheel', event => this.onCloneWheel(event)]);
      }

      if (this.leftOverlay.needFullRender) {
        listenersToRegister.push([this.leftOverlay.clone.wtTable.holder, 'wheel', event => this.onCloneWheel(event)]);
      }

      if (this.topLeftCornerOverlay && this.topLeftCornerOverlay.needFullRender) {
        listenersToRegister.push([this.topLeftCornerOverlay.clone.wtTable.holder, 'wheel', event => this.onCloneWheel(event)]);
      }

      if (this.bottomLeftCornerOverlay && this.bottomLeftCornerOverlay.needFullRender) {
        listenersToRegister.push([this.bottomLeftCornerOverlay.clone.wtTable.holder, 'wheel', event => this.onCloneWheel(event)]);
      }
    }

    if (this.topOverlay.trimmingContainer !== window && this.leftOverlay.trimmingContainer !== window) {
      // This is necessary?
      // eventManager.addEventListener(window, 'scroll', (event) => this.refreshAll(event));
      listenersToRegister.push([window, 'wheel', (event) => {
        let overlay;
        const deltaY = event.wheelDeltaY || event.deltaY;
        const deltaX = event.wheelDeltaX || event.deltaX;

        if (this.topOverlay.clone.wtTable.holder.contains(event.realTarget)) {
          overlay = 'top';

        } else if (this.bottomOverlay.clone && this.bottomOverlay.clone.wtTable.holder.contains(event.realTarget)) {
          overlay = 'bottom';

        } else if (this.leftOverlay.clone.wtTable.holder.contains(event.realTarget)) {
          overlay = 'left';

        } else if (this.topLeftCornerOverlay && this.topLeftCornerOverlay.clone && this.topLeftCornerOverlay.clone.wtTable.holder.contains(event.realTarget)) {
          overlay = 'topLeft';

        } else if (this.bottomLeftCornerOverlay && this.bottomLeftCornerOverlay.clone && this.bottomLeftCornerOverlay.clone.wtTable.holder.contains(event.realTarget)) {
          overlay = 'bottomLeft';
        }

        if ((overlay === 'top' && deltaY !== 0) ||
          (overlay === 'left' && deltaX !== 0) ||
          (overlay === 'bottom' && deltaY !== 0) ||
          ((overlay === 'topLeft' || overlay === 'bottomLeft') && (deltaY !== 0 || deltaX !== 0))) {

          event.preventDefault();
        }
      }]);
    }

    while (listenersToRegister.length) {
      const listener = listenersToRegister.pop();
      this.eventManager.addEventListener(listener[0], listener[1], listener[2]);

      this.registeredListeners.push(listener);
    }
  }

  /**
   * Deregister all previously registered listeners.
   */
  deregisterListeners() {
    while (this.registeredListeners.length) {
      const listener = this.registeredListeners.pop();
      this.eventManager.removeEventListener(listener[0], listener[1], listener[2]);
    }
  }

  /**
   * Scroll listener
   *
   * @param {Event} event
   */
  onTableScroll(event) {
    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.

    const masterHorizontal = this.leftOverlay.mainTableScrollableElement;
    const masterVertical = this.topOverlay.mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    if (this.keyPressed) {
      if ((masterVertical !== window && target !== window && !event.target.contains(masterVertical)) ||
          (masterHorizontal !== window && target !== window && !event.target.contains(masterHorizontal))) {
        return;
      }
    }

    this.syncScrollPositions(event);
  }

  /**
   * Wheel listener for cloned overlays.
   *
   * @param {Event} event
   */
  onCloneWheel(event) {
    if (this.scrollableElement !== window) {
      event.preventDefault();
    }
    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.

    const masterHorizontal = this.leftOverlay.mainTableScrollableElement;
    const masterVertical = this.topOverlay.mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    const shouldNotWheelVertically = masterVertical !== window && target !== window && !event.target.contains(masterVertical);
    const shouldNotWheelHorizontally = masterHorizontal !== window && target !== window && !event.target.contains(masterHorizontal);

    if (this.keyPressed && (shouldNotWheelVertically || shouldNotWheelHorizontally)) {
      return;
    }

    this.translateMouseWheelToScroll(event);
  }

  /**
   * Key down listener
   */
  onKeyDown(event) {
    this.keyPressed = isKey(event.keyCode, 'ARROW_UP|ARROW_RIGHT|ARROW_DOWN|ARROW_LEFT');
  }

  /**
   * Key up listener
   */
  onKeyUp() {
    this.keyPressed = false;
  }

  /**
   * Translate wheel event into scroll event and sync scroll overlays position
   *
   * @private
   * @param {Event} event
   * @returns {Boolean}
   */
  translateMouseWheelToScroll(event) {
    let deltaY = isNaN(event.deltaY) ? (-1) * event.wheelDeltaY : event.deltaY;
    let deltaX = isNaN(event.deltaX) ? (-1) * event.wheelDeltaX : event.deltaX;

    if (event.deltaMode === 1) {
      deltaX += deltaX * this.browserLineHeight;
      deltaY += deltaY * this.browserLineHeight;
    }

    this.scrollVertically(deltaY);
    this.scrollHorizontally(deltaX);

    return false;
  }

  scrollVertically(distance) {
    if (distance === 0) {
      return 0;
    }
    this.scrollableElement.scrollTop += distance;
  }

  scrollHorizontally(distance) {
    if (distance === 0) {
      return 0;
    }
    this.scrollableElement.scrollLeft += distance;
  }

  /**
   * Synchronize scroll position between master table and overlay table.
   *
   * @private
   * @param {Event|Object} event
   */
  syncScrollPositions() {
    if (this.destroyed) {
      return;
    }

    const topHolder = this.topOverlay.clone.wtTable.holder;
    const leftHolder = this.leftOverlay.clone.wtTable.holder;

    const [scrollLeft, scrollTop] = [this.scrollableElement.scrollLeft, this.scrollableElement.scrollTop];

    this.horizontalScrolling = topHolder.scrollLeft !== scrollLeft;
    this.verticalScrolling = leftHolder.scrollTop !== scrollTop;

    if (this.horizontalScrolling) {
      topHolder.scrollLeft = scrollLeft;

      const bottomHolder = this.bottomOverlay.needFullRender ? this.bottomOverlay.clone.wtTable.holder : null;

      if (bottomHolder) {
        bottomHolder.scrollLeft = scrollLeft;
      }
    }

    if (this.verticalScrolling) {
      leftHolder.scrollTop = scrollTop;
    }

    this.refreshAll();
  }

  /**
   * Synchronize overlay scrollbars with the master scrollbar
   */
  syncScrollWithMaster() {
    const master = this.topOverlay.mainTableScrollableElement;
    const { scrollLeft, scrollTop } = master;

    if (this.topOverlay.needFullRender) {
      this.topOverlay.clone.wtTable.holder.scrollLeft = scrollLeft;
    }
    if (this.bottomOverlay.needFullRender) {
      this.bottomOverlay.clone.wtTable.holder.scrollLeft = scrollLeft;
    }
    if (this.leftOverlay.needFullRender) {
      this.leftOverlay.clone.wtTable.holder.scrollTop = scrollTop;
    }
  }

  /**
   * Update the main scrollable elements for all the overlays.
   */
  updateMainScrollableElements() {
    this.deregisterListeners();

    this.leftOverlay.updateMainScrollableElement();
    this.topOverlay.updateMainScrollableElement();

    if (this.bottomOverlay.needFullRender) {
      this.bottomOverlay.updateMainScrollableElement();
    }

    this.scrollableElement = getScrollableElement(this.wot.wtTable.TABLE);

    this.registerListeners();
  }

  /**
   *
   */
  destroy() {
    this.eventManager.destroy();
    this.topOverlay.destroy();

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.destroy();
    }
    this.leftOverlay.destroy();

    if (this.topLeftCornerOverlay) {
      this.topLeftCornerOverlay.destroy();
    }

    if (this.bottomLeftCornerOverlay && this.bottomLeftCornerOverlay.clone) {
      this.bottomLeftCornerOverlay.destroy();
    }

    if (this.debug) {
      this.debug.destroy();
    }
    this.destroyed = true;
  }

  /**
   * @param {Boolean} [fastDraw=false]
   */
  refresh(fastDraw = false) {
    if (this.topOverlay.areElementSizesAdjusted && this.leftOverlay.areElementSizesAdjusted) {
      const container = this.wot.wtTable.wtRootElement.parentNode || this.wot.wtTable.wtRootElement;
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width !== this.spreaderLastSize.width || height !== this.spreaderLastSize.height) {
        this.spreaderLastSize.width = width;
        this.spreaderLastSize.height = height;
        this.adjustElementsSize();
      }
    }

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.refresh(fastDraw);
    }

    this.leftOverlay.refresh(fastDraw);
    this.topOverlay.refresh(fastDraw);

    if (this.topLeftCornerOverlay) {
      this.topLeftCornerOverlay.refresh(fastDraw);
    }

    if (this.bottomLeftCornerOverlay && this.bottomLeftCornerOverlay.clone) {
      this.bottomLeftCornerOverlay.refresh(fastDraw);
    }

    if (this.debug) {
      this.debug.refresh(fastDraw);
    }
  }

  /**
   * Adjust overlays elements size and master table size
   *
   * @param {Boolean} [force=false]
   */
  adjustElementsSize(force = false) {
    const totalColumns = this.wot.getSetting('totalColumns');
    const totalRows = this.wot.getSetting('totalRows');
    const headerRowSize = this.wot.wtViewport.getRowHeaderWidth();
    const headerColumnSize = this.wot.wtViewport.getColumnHeaderHeight();
    const hiderStyle = this.wot.wtTable.hider.style;

    hiderStyle.width = `${headerRowSize + this.leftOverlay.sumCellSizes(0, totalColumns)}px`;
    hiderStyle.height = `${headerColumnSize + this.topOverlay.sumCellSizes(0, totalRows) + 1}px`;

    this.topOverlay.adjustElementsSize(force);
    this.leftOverlay.adjustElementsSize(force);

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.adjustElementsSize(force);
    }
  }

  /**
   *
   */
  applyToDOM() {
    if (!this.topOverlay.areElementSizesAdjusted || !this.leftOverlay.areElementSizesAdjusted) {
      this.adjustElementsSize();
    }
    this.topOverlay.applyToDOM();

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.applyToDOM();
    }

    this.leftOverlay.applyToDOM();
  }

  /**
   * Get the parent overlay of the provided element.
   *
   * @param {HTMLElement} element
   * @returns {Object|null}
   */
  getParentOverlay(element) {
    if (!element) {
      return null;
    }

    const overlays = [
      this.topOverlay,
      this.leftOverlay,
      this.bottomOverlay,
      this.topLeftCornerOverlay,
      this.bottomLeftCornerOverlay
    ];
    let result = null;

    arrayEach(overlays, (elem) => {
      if (!elem) {
        return;
      }

      if (elem.clone && elem.clone.wtTable.TABLE.contains(element)) {
        result = elem.clone;
      }
    });

    return result;
  }
}

export default Overlays;
