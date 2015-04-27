
import {eventManager as eventManagerObject} from './../../../eventManager.js';
import * as dom from './../../../dom.js';

export {WalkontableOverlays};

window.WalkontableOverlays = WalkontableOverlays;

function WalkontableOverlays(instance) {
  this.instance = instance;
  instance.update('scrollbarWidth', dom.getScrollbarWidth());
  instance.update('scrollbarHeight', dom.getScrollbarWidth());

  this.topOverlay = new WalkontableTopOverlay(instance);
  this.leftOverlay = new WalkontableLeftOverlay(instance);
  this.topLeftCornerOverlay = new WalkontableCornerOverlay(instance);

  this.scrollCallbacksPending = 0;

  if (instance.getSetting('debug')) {
    this.debug = new WalkontableDebugOverlay(instance);
  }
  this.registerListeners();
}

WalkontableOverlays.prototype.registerListeners = function () {
  var that = this;
  this.mainTableScrollableElement = dom.getScrollableElement(this.instance.wtTable.TABLE);

  this.refreshAll = function refreshAll() {
    if (!that.instance.drawn) {
      return;
    }

    if (!that.instance.wtTable.holder.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.instance.draw(true);
    that.topOverlay.onScroll();
    that.leftOverlay.onScroll();
  };

  var eventManager = eventManagerObject(that.instance);

  this.requestAnimFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };

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

  eventManager.addEventListener(this.mainTableScrollableElement, 'scroll', function (e) {
    that.requestAnimFrame.call(window, function () {
      that.syncScrollPositions(e);
    });
  });

  eventManager.addEventListener(this.topOverlay.clone.wtTable.holder, 'scroll', function (e) {
    that.requestAnimFrame.call(window, function () {
      that.syncScrollPositions(e);
    });
  });

  eventManager.addEventListener(this.topOverlay.clone.wtTable.holder, 'wheel', function (e) {
    that.requestAnimFrame.call(window, function () {
      that.translateMouseWheelToScroll(e);
    });
  });

  eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'scroll', function (e) {
    that.requestAnimFrame.call(window, function () {
      that.syncScrollPositions(e);
    });
  });

  eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'wheel', function (e) {
    that.requestAnimFrame.call(window, function () {
      that.translateMouseWheelToScroll(e);
    });
  });

  if (this.topOverlay.trimmingContainer !== window && this.leftOverlay.trimmingContainer !== window) {
    eventManager.addEventListener(window, 'scroll', function (e) {
      that.refreshAll();
    });

    eventManager.addEventListener(window, 'wheel', function (e) {
      var overlay,
        deltaY = e.wheelDeltaY || e.deltaY,
        deltaX = e.wheelDeltaX || e.deltaX;

      if (that.topOverlay.clone.wtTable.holder.contains(e.target)) {
        overlay = 'top';
      } else if (that.leftOverlay.clone.wtTable.holder.contains(e.target)) {
        overlay = 'left';
      }

      if (overlay == 'top' && deltaY !== 0) {
        e.preventDefault();
      } else if (overlay == 'left' && deltaX !== 0) {
        e.preventDefault();
      }
    });
  }
};

WalkontableOverlays.prototype.translateMouseWheelToScroll = function (e) {
  var topOverlay = this.topOverlay.clone.wtTable.holder,
    leftOverlay = this.leftOverlay.clone.wtTable.holder,
    parentHolder,
    tempElem = e.target,
    eventMockup = {},
    deltaY = e.wheelDeltaY || (-1) * e.deltaY,
    deltaX = e.wheelDeltaX || (-1) * e.deltaX;

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
};

WalkontableOverlays.prototype.syncScrollPositions = function (e, fakeScrollValue) {
  if (this.destroyed) {
    return;
  }

  if (this.scrollCallbacksPending > 0) {
    this.scrollCallbacksPending--;
    return;
  }

  //this.scrollCallbacksPending = true;

  var target = e.target,
    master = this.topOverlay.mainTableScrollableElement,
    topOverlay = this.topOverlay.clone.wtTable.holder,
    leftOverlay = this.leftOverlay.clone.wtTable.holder,
    tempScrollValue = 0,
    scrollValueChanged = false;

  if(target === document) {
    target = window;
  }

  if (target === master || target === document) {
    tempScrollValue = dom.getScrollLeft(target);

    // if scrolling the master table - populate the scroll values to both top and left overlays
    if (this.overlayScrollPositions.master.left !== tempScrollValue) {
      this.scrollCallbacksPending++;
      topOverlay.scrollLeft = tempScrollValue;
      this.overlayScrollPositions.master.left = tempScrollValue;
      scrollValueChanged = true;
    }

    tempScrollValue = dom.getScrollTop(target);

    if (this.overlayScrollPositions.master.top !== tempScrollValue) {
      this.scrollCallbacksPending++;
      leftOverlay.scrollTop = tempScrollValue;
      this.overlayScrollPositions.master.top = tempScrollValue;
      scrollValueChanged = true;
    }

  } else if (target === topOverlay) {
    tempScrollValue = dom.getScrollLeft(target);

    // if scrolling the top overlay - populate the horizontal scroll to the master table
    if (this.overlayScrollPositions.top.left !== tempScrollValue) {
      this.scrollCallbacksPending++;
      master.scrollLeft = tempScrollValue;
      this.overlayScrollPositions.top.left = tempScrollValue;
      scrollValueChanged = true;
    }

    // "fake" scroll value calculated from the mousewheel event
    if (fakeScrollValue) {
      //this.scrollCallbacksPending++;
      master.scrollTop += fakeScrollValue;
    }

  } else if (target === leftOverlay) {
    tempScrollValue = dom.getScrollTop(target);

    // if scrolling the left overlay - populate the vertical scroll to the master table
    if (this.overlayScrollPositions.left.top !== tempScrollValue) {
      this.scrollCallbacksPending++;
      master.scrollTop = tempScrollValue;
      this.overlayScrollPositions.left.top = tempScrollValue;
      scrollValueChanged = true;
    }

    // "fake" scroll value calculated from the mousewheel event
    if (fakeScrollValue) {
      master.scrollLeft += fakeScrollValue;
    }
  }


  if (scrollValueChanged) {
    this.refreshAll();
  }
};

WalkontableOverlays.prototype.destroy = function () {
  var eventManager = eventManagerObject(this.instance);


  if (this.topOverlay) {
    this.topOverlay.destroy();
    eventManager.removeEventListener(this.topOverlay.trimmingContainer, 'scroll', this.refreshAll);
  }
  if (this.leftOverlay) {
    this.leftOverlay.destroy();
    eventManager.removeEventListener(this.leftOverlay.trimmingContainer, 'scroll', this.refreshAll);
  }
  eventManager.removeEventListener(window, 'scroll', this.refreshAll);
  if (this.topLeftCornerOverlay) {
    this.topLeftCornerOverlay.destroy();
  }
  if (this.debug) {
    this.debug.destroy();
  }

  this.destroyed = true;
};

WalkontableOverlays.prototype.refresh = function (fastDraw) {
  if (this.leftOverlay) {
    this.leftOverlay.refresh(fastDraw);
  }
  if (this.topOverlay) {
    this.topOverlay.refresh(fastDraw);
  }
  if (this.topLeftCornerOverlay) {
    this.topLeftCornerOverlay.refresh(fastDraw);
  }
  if (this.debug) {
    this.debug.refresh(fastDraw);
  }
};

WalkontableOverlays.prototype.applyToDOM = function () {
  if (this.leftOverlay) {
    this.leftOverlay.applyToDOM();
  }
  if (this.topOverlay) {
    this.topOverlay.applyToDOM();
  }
};
