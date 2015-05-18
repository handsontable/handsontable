import * as dom from './../../../dom.js';
import {eventManager as eventManagerObject} from './../../../eventManager.js';
import {WalkontableCornerOverlay} from './overlay/corner.js';
import {WalkontableDebugOverlay} from './overlay/debug.js';
import {WalkontableLeftOverlay} from './overlay/left.js';
import {WalkontableTopOverlay} from './overlay/top.js';


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

    this.wot.update('scrollbarWidth', dom.getScrollbarWidth());
    this.wot.update('scrollbarHeight', dom.getScrollbarWidth());

    this.mainTableScrollableElement = dom.getScrollableElement(this.wot.wtTable.TABLE);

    this.topOverlay = new WalkontableTopOverlay(this.wot);
    this.leftOverlay = new WalkontableLeftOverlay(this.wot);

    if (this.topOverlay.needFullRender && this.leftOverlay.needFullRender) {
      this.topLeftCornerOverlay = new WalkontableCornerOverlay(this.wot);
    }
    if (this.wot.getSetting('debug')) {
      this.debug = new WalkontableDebugOverlay(this.wot);
    }

    this.destroyed = false;
    this.overlayScrollPositions = {
      'master': {
        top: 0,
        left: 0
      },
      'top': {
        top: null,
        left: 0
      },
      'left': {
        top: 0,
        left: null
      }
    };
    this.scrollCallbacksPending = 0;
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

    this.topOverlay.onScroll();
    this.leftOverlay.onScroll();
  }

  /**
   * Register all necessary event listeners
   */
  registerListeners() {
    const eventManager = eventManagerObject(this.wot);
    let _this = this;

    eventManager.addEventListener(this.mainTableScrollableElement, 'scroll', function(event) {
      // if mobile browser, do not update scroll positions, as the overlays are hidden during the scroll
      if (Handsontable.mobileBrowser) {
        return;
      } else {
        _this.syncScrollPositions(event);
      }
    });

    if (this.topOverlay.needFullRender) {
      eventManager.addEventListener(this.topOverlay.clone.wtTable.holder, 'scroll', function(event) {
        // if mobile browser, do not update scroll positions, as the overlays are hidden during the scroll
        if (Handsontable.mobileBrowser && _this.scrollCallbacksPending > 1) {
          return;
        } else {
          _this.syncScrollPositions(event);
        }
      });
      eventManager.addEventListener(this.topOverlay.clone.wtTable.holder, 'wheel', function(event) {
        // if mobile browser, do not update scroll positions, as the overlays are hidden during the scroll
        if (Handsontable.mobileBrowser && _this.scrollCallbacksPending > 1) {
          return;
        } else {
          _this.translateMouseWheelToScroll(event);
        }
      });
    }

    if (this.leftOverlay.needFullRender) {
      eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'scroll', function(event) {
        // if mobile browser, do not update scroll positions, as the overlays are hidden during the scroll
        if (Handsontable.mobileBrowser && _this.scrollCallbacksPending > 1) {
          return;
        } else {
          _this.syncScrollPositions(event);
        }
      });
      eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'wheel', (event) => this.translateMouseWheelToScroll(event));
    }

    if (this.topOverlay.trimmingContainer !== window && this.leftOverlay.trimmingContainer !== window) {
      eventManager.addEventListener(window, 'scroll', (event) => this.refreshAll(event));

      eventManager.addEventListener(window, 'wheel', (event) => {
        let overlay;
        let deltaY = event.wheelDeltaY || event.deltaY;
        let deltaX = event.wheelDeltaX || event.deltaX;

        if (this.topOverlay.clone.wtTable.holder.contains(event.target)) {
          overlay = 'top';

        } else if (this.leftOverlay.clone.wtTable.holder.contains(event.target)) {
          overlay = 'left';
        }

        if (overlay == 'top' && deltaY !== 0) {
          event.preventDefault();
        } else if (overlay == 'left' && deltaX !== 0) {
          event.preventDefault();
        }
      });
    }
  }

  /**
   * Translate wheel event into scroll event and sync scroll overlays position
   *
   * @param {DOMEvent} event
   * @returns {Boolean}
   */
  translateMouseWheelToScroll(event) {
    let topOverlay = this.topOverlay.clone.wtTable.holder;
    let leftOverlay = this.leftOverlay.clone.wtTable.holder;
    let eventMockup = {};
    let tempElem = event.target;
    let deltaY = event.wheelDeltaY || (-1) * event.deltaY;
    let deltaX = event.wheelDeltaX || (-1) * event.deltaX;
    let parentHolder;

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

    } else if (parentHolder == leftOverlay) {
      this.syncScrollPositions(eventMockup, (-0.2) * deltaX);
    }

    return false;
  }

  /**
   * Synchronize scroll position between master table and overlay table
   *
   * @param {DOMEvent} event
   * @param {Boolean} [fakeScrollValue=false]
   */
  syncScrollPositions(event, fakeScrollValue = false) {
    if (this.destroyed) {
      return;
    }
    if (this.scrollCallbacksPending > 0 &&
      (this.topOverlay.needFullRender || this.leftOverlay.needFullRender)) {
      this.scrollCallbacksPending--;

      return;
    }

    if (arguments.length === 0) {
      this.syncScrollWithMaster();

      return;
    }

    let master = this.mainTableScrollableElement;
    let target = event.target;
    let tempScrollValue = 0;
    let scrollValueChanged = false;
    let topOverlay;
    let leftOverlay;

    if (this.topOverlay.needFullRender) {
      topOverlay = this.topOverlay.clone.wtTable.holder;
    }
    if (this.leftOverlay.needFullRender) {
      leftOverlay = this.leftOverlay.clone.wtTable.holder;
    }

    if (target === document) {
      target = window;
    }

    if (target === master || target === document) {
      tempScrollValue = dom.getScrollLeft(target);

      // if scrolling the master table - populate the scroll values to both top and left overlays
      if (this.overlayScrollPositions.master.left !== tempScrollValue) {
        this.scrollCallbacksPending++;
        this.overlayScrollPositions.master.left = tempScrollValue;
        scrollValueChanged = true;

        if (topOverlay) {
          topOverlay.scrollLeft = tempScrollValue;
        }
      }
      tempScrollValue = dom.getScrollTop(target);

      if (this.overlayScrollPositions.master.top !== tempScrollValue) {
        this.scrollCallbacksPending++;
        this.overlayScrollPositions.master.top = tempScrollValue;
        scrollValueChanged = true;

        if (leftOverlay) {
          leftOverlay.scrollTop = tempScrollValue;
        }
      }

    } else if (target === topOverlay) {
      tempScrollValue = dom.getScrollLeft(target);

      // if scrolling the top overlay - populate the horizontal scroll to the master table
      if (this.overlayScrollPositions.top.left !== tempScrollValue) {
        this.scrollCallbacksPending++;
        this.overlayScrollPositions.top.left = tempScrollValue;
        scrollValueChanged = true;

        master.scrollLeft = tempScrollValue;
      }

      // "fake" scroll value calculated from the mousewheel event
      if (fakeScrollValue) {
        master.scrollTop += fakeScrollValue;
      }

    } else if (target === leftOverlay) {
      tempScrollValue = dom.getScrollTop(target);

      // if scrolling the left overlay - populate the vertical scroll to the master table
      if (this.overlayScrollPositions.left.top !== tempScrollValue) {
        this.scrollCallbacksPending++;
        this.overlayScrollPositions.left.top = tempScrollValue;
        scrollValueChanged = true;

        master.scrollTop = tempScrollValue;
      }

      // "fake" scroll value calculated from the mousewheel event
      if (fakeScrollValue) {
        master.scrollLeft += fakeScrollValue;
      }
    }

    if (scrollValueChanged) {
      this.refreshAll();
    }
  }

  /**
   * Synchronize overlay scrollbars with the master scrollbar
   */
  syncScrollWithMaster() {
    var master = this.topOverlay.mainTableScrollableElement;

    if(this.topOverlay.needFullRender) {
      this.topOverlay.clone.wtTable.holder.scrollLeft = master.scrollLeft;
    }
    if(this.leftOverlay.needFullRender) {
      this.leftOverlay.clone.wtTable.holder.scrollTop = master.scrollTop;
    }
  }

  /**
   *
   */
  destroy() {
    eventManagerObject(this.wot).clear();

    this.topOverlay.destroy();
    this.leftOverlay.destroy();

    if (this.topLeftCornerOverlay) {
      this.topLeftCornerOverlay.destroy();
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
    this.leftOverlay.refresh(fastDraw);
    this.topOverlay.refresh(fastDraw);

    if (this.topLeftCornerOverlay) {
      this.topLeftCornerOverlay.refresh(fastDraw);
    }
    if (this.debug) {
      this.debug.refresh(fastDraw);
    }
  }

  /**
   *
   */
  applyToDOM() {
    this.leftOverlay.applyToDOM();
    this.topOverlay.applyToDOM();
  }
}

export {WalkontableOverlays};

window.WalkontableOverlays = WalkontableOverlays;
