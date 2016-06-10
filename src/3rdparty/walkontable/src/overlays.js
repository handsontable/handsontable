import {
  getScrollableElement,
  getScrollbarWidth,
  getScrollLeft,
  getScrollTop,
} from './../../../helpers/dom/element';
import {arrayEach} from './../../../helpers/array';
import {isKey} from './../../../helpers/unicode';
import {isMobileBrowser} from './../../../helpers/browser';
import {EventManager} from './../../../eventManager';

/**
 * @class WalkontableOverlays
 */
class WalkontableOverlays {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    this.wot = wotInstance;

    // legacy support
    this.instance = this.wot;
    this.eventManager = new EventManager(this.wot);

    this.wot.update('scrollbarWidth', getScrollbarWidth());
    this.wot.update('scrollbarHeight', getScrollbarWidth());

    this.scrollableElement = getScrollableElement(this.wot.wtTable.TABLE);

    this.topOverlay = WalkontableOverlay.createOverlay(WalkontableOverlay.CLONE_TOP, this.wot);

    if (typeof WalkontableBottomOverlay === 'undefined') {
      this.bottomOverlay = {
        needFullRender: false
      };

    } else {
      this.bottomOverlay = WalkontableOverlay.createOverlay(WalkontableOverlay.CLONE_BOTTOM, this.wot);
    }

    this.leftOverlay = WalkontableOverlay.createOverlay(WalkontableOverlay.CLONE_LEFT, this.wot);

    if (this.topOverlay.needFullRender && this.leftOverlay.needFullRender) {
      this.topLeftCornerOverlay = WalkontableOverlay.createOverlay(WalkontableOverlay.CLONE_TOP_LEFT_CORNER, this.wot);
    }

    if (this.bottomOverlay.needFullRender && this.leftOverlay.needFullRender && typeof WalkontableBottomLeftCornerOverlay !== 'undefined') {
      this.bottomLeftCornerOverlay = WalkontableOverlay.createOverlay(WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER, this.wot);
    } else {
      this.bottomLeftCornerOverlay = {
        needFullRender: false
      };
    }

    if (this.wot.getSetting('debug')) {
      this.debug = WalkontableOverlay.createOverlay(WalkontableOverlay.CLONE_DEBUG, this.wot);
    }

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

    this.registerListeners();
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

    let listenersToRegister = [];
    listenersToRegister.push([document.documentElement, 'keydown', (event) => this.onKeyDown(event)]);
    listenersToRegister.push([document.documentElement, 'keyup', () => this.onKeyUp()]);
    listenersToRegister.push([document, 'visibilitychange', () => this.onKeyUp()]);
    listenersToRegister.push([topOverlayScrollable, 'scroll', (event) => this.onTableScroll(event)]);

    if (topOverlayScrollable !== leftOverlayScrollable) {
      listenersToRegister.push([leftOverlayScrollable, 'scroll', (event) => this.onTableScroll(event)]);
    }

    if (this.topOverlay.needFullRender) {
      listenersToRegister.push([this.topOverlay.clone.wtTable.holder, 'scroll', (event) => this.onTableScroll(event)]);
      listenersToRegister.push([this.topOverlay.clone.wtTable.holder, 'wheel', (event) => this.onTableScroll(event)]);
    }

    if (this.bottomOverlay.needFullRender) {
      listenersToRegister.push([this.bottomOverlay.clone.wtTable.holder, 'scroll', (event) => this.onTableScroll(event)]);
      listenersToRegister.push([this.bottomOverlay.clone.wtTable.holder, 'wheel', (event) => this.onTableScroll(event)]);
    }

    if (this.leftOverlay.needFullRender) {
      listenersToRegister.push([this.leftOverlay.clone.wtTable.holder, 'scroll', (event) => this.onTableScroll(event)]);
      listenersToRegister.push([this.leftOverlay.clone.wtTable.holder, 'wheel', (event) => this.onTableScroll(event)]);
    }

    if (this.topOverlay.trimmingContainer !== window && this.leftOverlay.trimmingContainer !== window) {
      // This is necessary?
      //eventManager.addEventListener(window, 'scroll', (event) => this.refreshAll(event));
      listenersToRegister.push([window, 'wheel', (event) => {
        let overlay;
        let deltaY = event.wheelDeltaY || event.deltaY;
        let deltaX = event.wheelDeltaX || event.deltaX;

        if (this.topOverlay.clone.wtTable.holder.contains(event.realTarget)) {
          overlay = 'top';

        } else if (this.bottomOverlay.clone && this.bottomOverlay.clone.wtTable.holder.contains(event.realTarget)) {
          overlay = 'bottom';

        } else if (this.leftOverlay.clone.wtTable.holder.contains(event.realTarget)) {
          overlay = 'left';
        }

        if (overlay == 'top' && deltaY !== 0) {
          event.preventDefault();
        } else if (overlay == 'left' && deltaX !== 0) {
          event.preventDefault();
        } else if (overlay == 'bottom' && deltaY !== 0) {
          event.preventDefault();
        }
      }]);
    }

    while (listenersToRegister.length) {
      let listener = listenersToRegister.pop();
      this.eventManager.addEventListener(listener[0], listener[1], listener[2]);

      this.registeredListeners.push(listener);
    }
  }

  /**
   * Deregister all previously registered listeners.
   */
  deregisterListeners() {
    while (this.registeredListeners.length) {
      let listener = this.registeredListeners.pop();
      this.eventManager.removeEventListener(listener[0], listener[1], listener[2]);
    }
  }

  /**
   * Scroll listener
   *
   * @param {Event} event
   */
  onTableScroll(event) {
    // if mobile browser, do not update scroll positions, as the overlays are hidden during the scroll
    if (isMobileBrowser()) {
      return;
    }
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

    if (event.type === 'scroll') {
      this.syncScrollPositions(event);

    } else {
      this.translateMouseWheelToScroll(event);
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
   * @param {Event} event
   * @returns {Boolean}
   */
  translateMouseWheelToScroll(event) {
    let topOverlay = this.topOverlay.clone.wtTable.holder;
    let bottomOverlay = this.bottomOverlay.clone ? this.bottomOverlay.clone.wtTable.holder : null;
    let leftOverlay = this.leftOverlay.clone.wtTable.holder;
    let eventMockup = {type: 'wheel'};
    let tempElem = event.target;
    let deltaY = event.wheelDeltaY || (-1) * event.deltaY;
    let deltaX = event.wheelDeltaX || (-1) * event.deltaX;
    let parentHolder;

    // Fix for extremely slow header scrolling with a mousewheel on Firefox
    if (event.deltaMode === 1) {
      deltaY = deltaY * 120;
      deltaX = deltaX * 120;
    }

    while (tempElem != document && tempElem != null) {
      if (tempElem.className.indexOf('wtHolder') > -1) {
        parentHolder = tempElem;
        break;
      }
      tempElem = tempElem.parentNode;
    }
    eventMockup.target = parentHolder;

    if (parentHolder == topOverlay) {
      this.syncScrollPositions(eventMockup, (-0.2) * deltaY);

    } else if (parentHolder == bottomOverlay) {
      this.syncScrollPositions(eventMockup, (-0.2) * deltaY);

    } else if (parentHolder == leftOverlay) {
      this.syncScrollPositions(eventMockup, (-0.2) * deltaX);
    }

    return false;
  }

  /**
   * Synchronize scroll position between master table and overlay table.
   *
   * @param {Event|Object} event
   * @param {Number} [fakeScrollValue=null]
   */
  syncScrollPositions(event, fakeScrollValue = null) {
    if (this.destroyed) {
      return;
    }
    if (arguments.length === 0) {
      this.syncScrollWithMaster();

      return;
    }
    let masterHorizontal = this.leftOverlay.mainTableScrollableElement;
    let masterVertical = this.topOverlay.mainTableScrollableElement;
    let target = event.target;
    let tempScrollValue = 0;
    let scrollValueChanged = false;
    let topOverlay;
    let leftOverlay;
    let bottomOverlay;
    let delegatedScroll = false;
    let preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.topOverlay.needFullRender) {
      topOverlay = this.topOverlay.clone.wtTable.holder;
    }

    if (this.bottomOverlay.needFullRender) {
      bottomOverlay = this.bottomOverlay.clone.wtTable.holder;
    }

    if (this.leftOverlay.needFullRender) {
      leftOverlay = this.leftOverlay.clone.wtTable.holder;
    }

    if (target === document) {
      target = window;
    }

    if (target === masterHorizontal || target === masterVertical) {
      if (preventOverflow) {
        tempScrollValue = getScrollLeft(this.scrollableElement);
      } else {
        tempScrollValue = getScrollLeft(target);
      }

      // if scrolling the master table - populate the scroll values to both top and left overlays
      this.horizontalScrolling = true;
      this.overlayScrollPositions.master.left = tempScrollValue;
      scrollValueChanged = true;

      if (this.pendingScrollCallbacks.master.left > 0) {
        this.pendingScrollCallbacks.master.left--;

      } else {
        if (topOverlay && topOverlay.scrollLeft !== tempScrollValue) {

          if (fakeScrollValue == null) {
            this.pendingScrollCallbacks.top.left++;
          }

          topOverlay.scrollLeft = tempScrollValue;
          delegatedScroll = (masterHorizontal !== window);
        }

        if (bottomOverlay && bottomOverlay.scrollLeft !== tempScrollValue) {

          if (fakeScrollValue == null) {
            this.pendingScrollCallbacks.bottom.left++;
          }

          bottomOverlay.scrollLeft = tempScrollValue;
          delegatedScroll = (masterHorizontal !== window);
        }
      }

      tempScrollValue = getScrollTop(target);

      this.verticalScrolling = true;
      this.overlayScrollPositions.master.top = tempScrollValue;
      scrollValueChanged = true;

      if (this.pendingScrollCallbacks.master.top > 0) {
        this.pendingScrollCallbacks.master.top--;

      } else {
        if (leftOverlay && leftOverlay.scrollTop !== tempScrollValue) {

          if (fakeScrollValue == null) {
            this.pendingScrollCallbacks.left.top++;
          }

          leftOverlay.scrollTop = tempScrollValue;
          delegatedScroll = (masterVertical !== window);
        }
      }

    } else if (target === bottomOverlay) {
      tempScrollValue = getScrollLeft(target);

      // if scrolling the bottom overlay - populate the horizontal scroll to the master table
      this.horizontalScrolling = true;
      this.overlayScrollPositions.bottom.left = tempScrollValue;
      scrollValueChanged = true;

      if (this.pendingScrollCallbacks.bottom.left > 0) {
        this.pendingScrollCallbacks.bottom.left--;

      } else {
        if (fakeScrollValue == null) {
          this.pendingScrollCallbacks.master.left++;
        }

        masterHorizontal.scrollLeft = tempScrollValue;

        if (topOverlay && topOverlay.scrollLeft !== tempScrollValue) {
          if (fakeScrollValue == null) {
            this.pendingScrollCallbacks.top.left++;
          }

          topOverlay.scrollLeft = tempScrollValue;
          delegatedScroll = (masterVertical !== window);
        }

      }

      // "fake" scroll value calculated from the mousewheel event
      if (fakeScrollValue !== null) {
        scrollValueChanged = true;
        masterVertical.scrollTop += fakeScrollValue;
      }

    } else if (target === topOverlay) {
      tempScrollValue = getScrollLeft(target);

      // if scrolling the top overlay - populate the horizontal scroll to the master table
      this.horizontalScrolling = true;
      this.overlayScrollPositions.top.left = tempScrollValue;
      scrollValueChanged = true;

      if (this.pendingScrollCallbacks.top.left > 0) {
        this.pendingScrollCallbacks.top.left--;

      } else {

        if (fakeScrollValue == null) {
          this.pendingScrollCallbacks.master.left++;
        }

        masterHorizontal.scrollLeft = tempScrollValue;
      }

      // "fake" scroll value calculated from the mousewheel event
      if (fakeScrollValue !== null) {
        scrollValueChanged = true;
        masterVertical.scrollTop += fakeScrollValue;
      }

      if (bottomOverlay && bottomOverlay.scrollLeft !== tempScrollValue) {
        if (fakeScrollValue == null) {
          this.pendingScrollCallbacks.bottom.left++;
        }

        bottomOverlay.scrollLeft = tempScrollValue;
        delegatedScroll = (masterVertical !== window);
      }

    } else if (target === leftOverlay) {
      tempScrollValue = getScrollTop(target);

      // if scrolling the left overlay - populate the vertical scroll to the master table
      if (this.overlayScrollPositions.left.top !== tempScrollValue) {
        this.verticalScrolling = true;
        this.overlayScrollPositions.left.top = tempScrollValue;
        scrollValueChanged = true;

        if (this.pendingScrollCallbacks.left.top > 0) {
          this.pendingScrollCallbacks.left.top--;

        } else {
          if (fakeScrollValue == null) {
            this.pendingScrollCallbacks.master.top++;
          }

          masterVertical.scrollTop = tempScrollValue;
        }
      }

      // "fake" scroll value calculated from the mousewheel event
      if (fakeScrollValue !== null) {
        scrollValueChanged = true;
        masterVertical.scrollLeft += fakeScrollValue;
      }
    }

    if (!this.keyPressed && scrollValueChanged && event.type === 'scroll') {
      if (this.delegatedScrollCallback) {
        this.delegatedScrollCallback = false;
      } else {
        this.refreshAll();
      }

      if (delegatedScroll) {
        this.delegatedScrollCallback = true;
      }
    }
  }

  /**
   * Synchronize overlay scrollbars with the master scrollbar
   */
  syncScrollWithMaster() {
    var master = this.topOverlay.mainTableScrollableElement;

    if (this.topOverlay.needFullRender) {
      this.topOverlay.clone.wtTable.holder.scrollLeft = master.scrollLeft;
    }
    if (this.leftOverlay.needFullRender) {
      this.leftOverlay.clone.wtTable.holder.scrollTop = master.scrollTop;
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
      let container = this.wot.wtTable.wtRootElement.parentNode || this.wot.wtTable.wtRootElement;
      let width = container.clientWidth;
      let height = container.clientHeight;

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
    let totalColumns = this.wot.getSetting('totalColumns');
    let totalRows = this.wot.getSetting('totalRows');
    let headerRowSize = this.wot.wtViewport.getRowHeaderWidth();
    let headerColumnSize = this.wot.wtViewport.getColumnHeaderHeight();
    let hiderStyle = this.wot.wtTable.hider.style;

    hiderStyle.width = (headerRowSize + this.leftOverlay.sumCellSizes(0, totalColumns)) + 'px';
    hiderStyle.height = (headerColumnSize + this.topOverlay.sumCellSizes(0, totalRows) + 1) + 'px';

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

    let overlays = [
      this.topOverlay,
      this.leftOverlay,
      this.bottomOverlay,
      this.topLeftCornerOverlay,
      this.bottomLeftCornerOverlay
    ];
    let result = null;

    arrayEach(overlays, (elem, i) => {
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

export {WalkontableOverlays};

window.WalkontableOverlays = WalkontableOverlays;
