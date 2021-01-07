import {
  getScrollableElement,
  getScrollbarWidth,
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight,
  getComputedStyle,
} from './../../../helpers/dom/element';
import { arrayEach } from './../../../helpers/array';
import { isKey } from './../../../helpers/unicode';
import { isChrome } from './../../../helpers/browser';
import EventManager from './../../../eventManager';
import Overlay from './overlay/_base';
import { GRIDLINE_WIDTH } from './utils/gridline';

/**
 * @class Overlays
 */
class Overlays {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
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
     * Https://developer.mozilla.org/pl/docs/Web/CSS/line-height#Values.
     */
    const BODY_LINE_HEIGHT = parseInt(getComputedStyle(rootDocument.body, rootWindow).lineHeight, 10);
    const FALLBACK_BODY_LINE_HEIGHT = parseInt(getComputedStyle(rootDocument.body, rootWindow).fontSize, 10) * 1.2;

    this.eventManager = new EventManager(this.wot);

    this.scrollbarSize = getScrollbarWidth(rootDocument);
    this.wot.update('scrollbarWidth', this.scrollbarSize);
    this.wot.update('scrollbarHeight', this.scrollbarSize);

    const isOverflowHidden = getComputedStyle(wtTable.wtRootElement.parentNode, rootWindow).getPropertyValue('overflow') === 'hidden';

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
   */
  prepareOverlays() {
    if (this.topOverlay) {
      this.topOverlay.updateStateOfRendering();
    } else {
      this.topOverlay = Overlay.createOverlay(Overlay.CLONE_TOP, this.wot);
    }

    if (!Overlay.hasOverlay(Overlay.CLONE_BOTTOM)) {
      this.bottomOverlay = {
        needFullRender: false,
        updateStateOfRendering: () => {},
      };
    }
    if (!Overlay.hasOverlay(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      this.bottomLeftCornerOverlay = {
        needFullRender: false,
        updateStateOfRendering: () => {},
      };
    }

    if (this.bottomOverlay) {
      this.bottomOverlay.updateStateOfRendering();
    } else {
      this.bottomOverlay = Overlay.createOverlay(Overlay.CLONE_BOTTOM, this.wot);
    }

    if (this.leftOverlay) {
      this.leftOverlay.updateStateOfRendering();
    } else {
      this.leftOverlay = Overlay.createOverlay(Overlay.CLONE_LEFT, this.wot);
    }

    if (this.topOverlay.needFullRender && this.leftOverlay.needFullRender) {
      if (this.topLeftCornerOverlay) {
        this.topLeftCornerOverlay.updateStateOfRendering();
      } else {
        this.topLeftCornerOverlay = Overlay.createOverlay(Overlay.CLONE_TOP_LEFT_CORNER, this.wot);
      }
    }

    if (this.bottomOverlay.needFullRender && this.leftOverlay.needFullRender) {
      if (this.bottomLeftCornerOverlay) {
        this.bottomLeftCornerOverlay.updateStateOfRendering();
      } else {
        this.bottomLeftCornerOverlay = Overlay.createOverlay(Overlay.CLONE_BOTTOM_LEFT_CORNER, this.wot);
      }
    }
  }

  /**
   * Refresh and redraw the master table, which will include refreshing of the clones.
   */
  refreshMasterAndClones() {
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
   * Scroll listener.
   *
   * @param {Event} event The mouse event object.
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

    this.propagateMasterScrollPositionsToClones();
    this.refreshMasterAndClones();
  }

  /**
   * Wheel listener for cloned overlays.
   *
   * @param {Event} event The mouse event object.
   * @param {boolean} preventDefault If `true`, the `preventDefault` will be called on event object.
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
   * Key down listener.
   *
   * @param {Event} event The keyboard event object.
   */
  onKeyDown(event) {
    this.keyPressed = isKey(event.keyCode, 'ARROW_UP|ARROW_RIGHT|ARROW_DOWN|ARROW_LEFT');
  }

  /**
   * Key up listener.
   */
  onKeyUp() {
    this.keyPressed = false;
  }

  /**
   * Translate wheel event into scroll event and sync scroll overlays position.
   *
   * @private
   * @param {Event} event The mouse event object.
   * @returns {boolean}
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
   * @param {number} delta Relative value to scroll.
   * @returns {boolean}
   */
  scrollVertically(delta) {
    const previousScroll = this.scrollableElement.scrollTop;

    this.scrollableElement.scrollTop += delta;

    return previousScroll !== this.scrollableElement.scrollTop;
  }

  /**
   * Scrolls main scrollable element horizontally.
   *
   * @param {number} delta Relative value to scroll.
   * @returns {boolean}
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
  propagateMasterScrollPositionsToClones() {
    if (this.destroyed) {
      return;
    }

    const { rootWindow } = this.wot;
    const topHolder = this.topOverlay.clone.wtTable.holder;
    const leftHolder = this.leftOverlay.clone.wtTable.holder;
    const bottomHolder = this.bottomOverlay.clone.wtTable.holder;

    const [scrollLeft, scrollTop] = [this.scrollableElement.scrollLeft, this.scrollableElement.scrollTop];

    this.horizontalScrolling = (topHolder.scrollLeft !== scrollLeft || this.lastScrollX !== rootWindow.scrollX);
    this.verticalScrolling = (leftHolder.scrollTop !== scrollTop || this.lastScrollY !== rootWindow.scrollY);
    this.lastScrollX = rootWindow.scrollX;
    this.lastScrollY = rootWindow.scrollY;

    if (this.horizontalScrolling) {
      if (this.topOverlay.needFullRender) {
        topHolder.scrollLeft = scrollLeft;
      }

      if (this.bottomOverlay.needFullRender) {
        bottomHolder.scrollLeft = scrollLeft;
      }
    }

    if (this.verticalScrolling) {
      if (this.leftOverlay.needFullRender) {
        leftHolder.scrollTop = scrollTop;
      }
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

    if (getComputedStyle(wtTable.wtRootElement.parentNode, rootWindow).getPropertyValue('overflow') === 'hidden') {
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

    this.destroyed = true;
  }

  /**
   * Refresh (update the sizes and positions) and redraw the clones.
   *
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   */
  refreshClones(fastDraw = false) {
    if (!fastDraw) {
      this.prepareOverlays();
    }

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.redrawClone(fastDraw);
    }

    this.leftOverlay.redrawClone(fastDraw);
    this.topOverlay.redrawClone(fastDraw);

    if (this.topLeftCornerOverlay) {
      this.topLeftCornerOverlay.redrawClone(fastDraw);
    }

    if (this.bottomLeftCornerOverlay && this.bottomLeftCornerOverlay.clone) {
      this.bottomLeftCornerOverlay.redrawClone(fastDraw);
    }

    if (this.topOverlay.areElementSizesAdjusted && this.leftOverlay.areElementSizesAdjusted) {
      const container = this.wot.wtTable.wtRootElement.parentNode || this.wot.wtTable.wtRootElement;
      const width = clientWidth(container);
      const height = clientHeight(container);

      if (width !== this.spreaderLastSize.width || height !== this.spreaderLastSize.height) {
        this.spreaderLastSize.width = width;
        this.spreaderLastSize.height = height;
        this.adjustElementsSizes();
      }
    } else if (!fastDraw) {
      this.adjustElementsSizes();
    }
  }

  /**
   * Adjust overlays elements size and master table size.
   *
   * @param {boolean} [force=false] When `true`, it adjust the DOM nodes sizes for all overlays.
   */
  adjustElementsSizes(force = false) {
    const { wtViewport, wtTable } = this.wot;
    const totalColumns = this.wot.getSetting('totalColumns');
    const totalRows = this.wot.getSetting('totalRows');
    const headerRowSize = wtViewport.getRowHeaderWidth();
    const headerColumnSize = wtViewport.getColumnHeaderHeight();
    const hiderStyle = wtTable.hider.style;

    const widthBeforeColumns = headerRowSize || GRIDLINE_WIDTH;
    const heightBeforeRows = headerColumnSize || GRIDLINE_WIDTH;

    hiderStyle.width = `${widthBeforeColumns + this.leftOverlay.sumCellSizes(0, totalColumns)}px`;
    hiderStyle.height = `${heightBeforeRows + this.topOverlay.sumCellSizes(0, totalRows)}px`;

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

      if (this.hasScrollbarRight && scrollWidth(wtTable.hider) + this.scrollbarSize > rootElemScrollWidth) {
        this.hasScrollbarBottom = true;
      } else if (this.hasScrollbarBottom && scrollHeight(wtTable.hider) + this.scrollbarSize > rootElemScrollHeight) {
        this.hasScrollbarRight = true;
      }
    }

    this.topOverlay.adjustElementsSize(force);
    this.leftOverlay.adjustElementsSize(force);
    this.bottomOverlay.adjustElementsSize(force);

    if (this.topLeftCornerOverlay) {
      this.topLeftCornerOverlay.adjustElementsSize(force);
    }
    if (this.bottomLeftCornerOverlay) {
      this.bottomLeftCornerOverlay.adjustElementsSize(force);
    }
  }

  /**
   * Get the parent overlay of the provided element.
   *
   * @param {HTMLElement} element An element to process.
   * @returns {object|null}
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

  /**
   * Synchronize the class names between the main overlay table and the tables on the other overlays.
   *
   */
  syncOverlayTableClassNames() {
    const masterTable = this.wot.wtTable.TABLE;
    const overlays = [
      this.topOverlay,
      this.leftOverlay,
      this.bottomOverlay,
      this.topLeftCornerOverlay,
      this.bottomLeftCornerOverlay
    ];

    arrayEach(overlays, (elem) => {
      if (!elem) {
        return;
      }

      elem.clone.wtTable.TABLE.className = masterTable.className;
    });
  }
}

export default Overlays;
