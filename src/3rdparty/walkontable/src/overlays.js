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
     * Walkontable instance's reference.
     *
     * @private
     * @type {Walkontable}
     */
    this.wot = wotInstance;

    const { rootDocument, rootWindow, wtTable } = this.wot;
    /**
     * Sometimes `line-height` might be set to 'normal'. In that case, a default `font-size` should be multiplied by roughly 1.2.
     * https://developer.mozilla.org/pl/docs/Web/CSS/line-height#Values
     */
    const BODY_LINE_HEIGHT = parseInt(rootWindow.getComputedStyle(rootDocument.body).lineHeight, 10);
    const FALLBACK_BODY_LINE_HEIGHT = parseInt(rootWindow.getComputedStyle(rootDocument.body).fontSize, 10) * 1.2;

    // legacy support
    this.instance = this.wot;
    this.eventManager = new EventManager(this.wot);

    this.scrollbarSize = getScrollbarWidth(rootDocument);
    this.wot.update('scrollbarWidth', this.scrollbarSize);
    this.wot.update('scrollbarHeight', this.scrollbarSize);

    const isOverflowHidden = rootWindow.getComputedStyle(wtTable.wtRootElement.parentNode).getPropertyValue('overflow') === 'hidden';

    this.scrollableElement = isOverflowHidden ? wtTable.holder : getScrollableElement(wtTable.TABLE);

    this.topOverlay = void 0;
    this.bottomOverlay = void 0;
    this.leftOverlay = void 0;
    this.topLeftCornerOverlay = void 0;
    this.bottomLeftCornerOverlay = void 0;

    this.prepareOverlays();

    this.hasScrollbarBottom = false;
    this.hasScrollbarRight = false;

    this.destroyed = false;
    this.keyPressed = false;
    this.spreaderLastSize = {
      width: null,
      height: null,
    };

    this.verticalScrolling = false;
    this.horizontalScrolling = false;

    this.browserLineHeight = BODY_LINE_HEIGHT || FALLBACK_BODY_LINE_HEIGHT;

    this.registerListeners();
    this.lastScrollX = rootWindow.scrollX;
    this.lastScrollY = rootWindow.scrollY;
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
    const { rootDocument, rootWindow } = this.wot;
    const { mainTableScrollableElement: topOverlayScrollableElement } = this.topOverlay;
    const { mainTableScrollableElement: leftOverlayScrollableElement } = this.leftOverlay;

    this.eventManager.addEventListener(rootDocument.documentElement, 'keydown', event => this.onKeyDown(event));
    this.eventManager.addEventListener(rootDocument.documentElement, 'keyup', () => this.onKeyUp());
    this.eventManager.addEventListener(rootDocument, 'visibilitychange', () => this.onKeyUp());
    this.eventManager.addEventListener(topOverlayScrollableElement, 'scroll', event => this.onTableScroll(event), { passive: true });

    if (topOverlayScrollableElement !== leftOverlayScrollableElement) {
      this.eventManager.addEventListener(leftOverlayScrollableElement, 'scroll', event => this.onTableScroll(event), { passive: true });
    }

    const isHighPixelRatio = rootWindow.devicePixelRatio && rootWindow.devicePixelRatio > 1;
    const isScrollOnWindow = this.scrollableElement === rootWindow;
    const preventWheel = this.wot.wtSettings.getSetting('preventWheel');
    const wheelEventOptions = { passive: isScrollOnWindow };

    if (preventWheel || isHighPixelRatio || !isChrome()) {
      this.eventManager.addEventListener(this.wot.wtTable.wtRootElement, 'wheel', event => this.onCloneWheel(event, preventWheel), wheelEventOptions);
    }

    const overlays = [
      this.topOverlay,
      this.bottomOverlay,
      this.leftOverlay,
      this.topLeftCornerOverlay,
      this.bottomLeftCornerOverlay,
    ];

    overlays.forEach((overlay) => {
      if (overlay && overlay.needFullRender) {
        const { holder } = overlay.clone.wtTable;
        this.eventManager.addEventListener(holder, 'wheel', event => this.onCloneWheel(event, preventWheel), wheelEventOptions);
      }
    });

    let resizeTimeout;

    this.eventManager.addEventListener(rootWindow, 'resize', () => {
      clearTimeout(resizeTimeout);

      resizeTimeout = setTimeout(() => {
        this.wot.getSetting('onWindowResize');
      }, 200);
    });
  }

  /**
   * Deregister all previously registered listeners.
   */
  deregisterListeners() {
    this.eventManager.clearEvents(true);
  }

  /**
   * Scroll listener
   *
   * @param {Event} event
   */
  onTableScroll(event) {
    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.
    const rootWindow = this.wot.rootWindow;
    const masterHorizontal = this.leftOverlay.mainTableScrollableElement;
    const masterVertical = this.topOverlay.mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    if (this.keyPressed) {
      if ((masterVertical !== rootWindow && target !== rootWindow && !event.target.contains(masterVertical)) ||
          (masterHorizontal !== rootWindow && target !== rootWindow && !event.target.contains(masterHorizontal))) {
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
  onCloneWheel(event, preventDefault) {
    const { rootWindow } = this.wot;

    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.

    const masterHorizontal = this.leftOverlay.mainTableScrollableElement;
    const masterVertical = this.topOverlay.mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    const shouldNotWheelVertically = masterVertical !== rootWindow && target !== rootWindow && !target.contains(masterVertical);
    const shouldNotWheelHorizontally = masterHorizontal !== rootWindow && target !== rootWindow && !target.contains(masterHorizontal);

    if (this.keyPressed && (shouldNotWheelVertically || shouldNotWheelHorizontally)) {
      return;
    }

    const isScrollPossible = this.translateMouseWheelToScroll(event);

    if (preventDefault || (this.scrollableElement !== rootWindow && isScrollPossible)) {
      event.preventDefault();
    }
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
   */
  translateMouseWheelToScroll(event) {
    const browserLineHeight = this.browserLineHeight;

    let deltaY = isNaN(event.deltaY) ? (-1) * event.wheelDeltaY : event.deltaY;
    let deltaX = isNaN(event.deltaX) ? (-1) * event.wheelDeltaX : event.deltaX;

    if (event.deltaMode === 1) {
      deltaX += deltaX * browserLineHeight;
      deltaY += deltaY * browserLineHeight;
    }

    const isScrollVerticallyPossible = this.scrollVertically(deltaY);
    const isScrollHorizontallyPossible = this.scrollHorizontally(deltaX);

    return isScrollVerticallyPossible || isScrollHorizontallyPossible;
  }

  /**
   * Scrolls main scrollable element horizontally.
   *
   * @param {Number} delta Relative value to scroll.
   */
  scrollVertically(delta) {
    const previousScroll = this.scrollableElement.scrollTop;

    this.scrollableElement.scrollTop += delta;

    return previousScroll !== this.scrollableElement.scrollTop;
  }

  /**
   * Scrolls main scrollable element horizontally.
   *
   * @param {Number} delta Relative value to scroll.
   */
  scrollHorizontally(delta) {
    const previousScroll = this.scrollableElement.scrollLeft;

    this.scrollableElement.scrollLeft += delta;

    return previousScroll !== this.scrollableElement.scrollLeft;
  }

  /**
   * Synchronize scroll position between master table and overlay table.
   *
   * @private
   */
  syncScrollPositions() {
    if (this.destroyed) {
      return;
    }

    const { rootWindow } = this.wot;
    const topHolder = this.topOverlay.clone.wtTable.holder;
    const leftHolder = this.leftOverlay.clone.wtTable.holder;

    const [scrollLeft, scrollTop] = [this.scrollableElement.scrollLeft, this.scrollableElement.scrollTop];

    this.horizontalScrolling = (topHolder.scrollLeft !== scrollLeft || this.lastScrollX !== rootWindow.scrollX);
    this.verticalScrolling = (leftHolder.scrollTop !== scrollTop || this.lastScrollY !== rootWindow.scrollY);
    this.lastScrollX = rootWindow.scrollX;
    this.lastScrollY = rootWindow.scrollY;

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
    const { rootWindow, wtTable } = this.wot;

    if (rootWindow.getComputedStyle(wtTable.wtRootElement.parentNode).getPropertyValue('overflow') === 'hidden') {
      this.scrollableElement = wtTable.holder;
    } else {
      this.scrollableElement = getScrollableElement(wtTable.TABLE);
    }

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
    const { wtViewport, wtTable } = this.wot;
    const totalColumns = this.wot.getSetting('totalColumns');
    const totalRows = this.wot.getSetting('totalRows');
    const headerRowSize = wtViewport.getRowHeaderWidth();
    const headerColumnSize = wtViewport.getColumnHeaderHeight();
    const hiderStyle = wtTable.hider.style;

    hiderStyle.width = `${headerRowSize + this.leftOverlay.sumCellSizes(0, totalColumns)}px`;
    hiderStyle.height = `${headerColumnSize + this.topOverlay.sumCellSizes(0, totalRows) + 1}px`;

    if (this.scrollbarSize > 0) {
      const {
        scrollHeight: rootElemScrollHeight,
        scrollWidth: rootElemScrollWidth,
      } = wtTable.wtRootElement;
      const {
        scrollHeight: holderScrollHeight,
        scrollWidth: holderScrollWidth,
      } = wtTable.holder;

      this.hasScrollbarRight = rootElemScrollHeight < holderScrollHeight;
      this.hasScrollbarBottom = rootElemScrollWidth < holderScrollWidth;

      if (this.hasScrollbarRight && wtTable.hider.scrollWidth + this.scrollbarSize > rootElemScrollWidth) {
        this.hasScrollbarBottom = true;
      } else if (this.hasScrollbarBottom && wtTable.hider.scrollHeight + this.scrollbarSize > rootElemScrollHeight) {
        this.hasScrollbarRight = true;
      }
    }

    this.topOverlay.adjustElementsSize(force);
    this.leftOverlay.adjustElementsSize(force);
    this.bottomOverlay.adjustElementsSize(force);
  }

  /**
   *
   */
  applyToDOM() {
    const { wtTable } = this.wot;

    if (!wtTable.isVisible()) {
      return;
    }

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
