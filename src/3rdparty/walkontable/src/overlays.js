function WalkontableOverlays(instance) {
  this.instance = instance;
  instance.update('scrollbarWidth', Handsontable.Dom.getScrollbarWidth());
  instance.update('scrollbarHeight', Handsontable.Dom.getScrollbarWidth());

  this.topOverlay = new WalkontableTopOverlay(instance);
  this.leftOverlay = new WalkontableLeftOverlay(instance);
  this.topLeftCornerOverlay = new WalkontableCornerOverlay(instance);

  this.preventMultipleScrolling = false;

  if (instance.getSetting('debug')) {
    this.debug = new WalkontableDebugOverlay(instance);
  }
  this.registerListeners();
}

WalkontableOverlays.prototype.registerListeners = function () {
  var that = this;
  this.mainTableScrollableElement = Handsontable.Dom.getScrollableElement(this.instance.wtTable.TABLE);

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

  var eventManager = Handsontable.eventManager(that.instance);

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

  eventManager.addEventListener(this.topOverlay.clone.wtTable.holder, 'mousewheel', function (e) {
    that.requestAnimFrame.call(window, function () {
      that.translateMouseWheelToScroll(e);
    });
  });

  eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'scroll', function (e) {
    that.requestAnimFrame.call(window, function () {
      that.syncScrollPositions(e);
    });
  });

  eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'mousewheel', function (e) {
    that.requestAnimFrame.call(window, function () {
      that.translateMouseWheelToScroll(e);
    });
  });

  if (this.topOverlay.trimmingContainer !== window && this.leftOverlay.trimmingContainer !== window) {
    eventManager.addEventListener(window, 'scroll', function (e) {
      that.refreshAll();
    });

    eventManager.addEventListener(window, 'mousewheel', function (e) {
      var overlay;

      if (that.topOverlay.clone.wtTable.holder.contains(e.target)) {
        overlay = 'top';
      } else if (that.leftOverlay.clone.wtTable.holder.contains(e.target)) {
        overlay = 'left';
      }

      if (overlay == 'top' && e.wheelDeltaY !== 0) {
        e.preventDefault();
      } else if (overlay == 'left' && e.wheelDeltaX !== 0) {
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
    eventMockup = {};

  while (tempElem != document && tempElem != null) {
    if (tempElem.className.indexOf('wtHolder') > -1) {
      parentHolder = tempElem;
      break;
    }
    tempElem = tempElem.parentNode;
  }

  eventMockup.target = parentHolder;

  if (parentHolder == topOverlay) {
    this.syncScrollPositions(eventMockup, (-0.2) * e.wheelDeltaY);
  } else if (parentHolder == leftOverlay) {
    this.syncScrollPositions(eventMockup, (-0.2) * e.wheelDeltaX);
  }

  return false;
};

WalkontableOverlays.prototype.syncScrollPositions = function (e, fakeScrollValue) {
  if (this.destroyed) {
    return;
  }

  if (this.preventMultipleScrolling) {
    this.preventMultipleScrolling = false;

    return;
  }

  this.preventMultipleScrolling = true;

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
    tempScrollValue = Handsontable.Dom.getScrollLeft(target);

    // if scrolling the master table - populate the scroll values to both top and left overlays
    if (this.overlayScrollPositions.master.left !== tempScrollValue) {
      topOverlay.scrollLeft = tempScrollValue;
      this.overlayScrollPositions.master.left = tempScrollValue;
      scrollValueChanged = true;
    }

    tempScrollValue = Handsontable.Dom.getScrollTop(target);

    if (this.overlayScrollPositions.master.top !== tempScrollValue) {
      leftOverlay.scrollTop = tempScrollValue;
      this.overlayScrollPositions.master.top = tempScrollValue;
      scrollValueChanged = true;
    }

  } else if (target === topOverlay) {
    tempScrollValue = Handsontable.Dom.getScrollLeft(target);

    // if scrolling the top overlay - populate the horizontal scroll to the master table
    if (this.overlayScrollPositions.top.left !== tempScrollValue) {
      master.scrollLeft = tempScrollValue;
      this.overlayScrollPositions.top.left = tempScrollValue;
      scrollValueChanged = true;
    }

    // "fake" scroll value calculated from the mousewheel event
    if (fakeScrollValue) {
      master.scrollTop += fakeScrollValue;
    }

  } else if (target === leftOverlay) {
    tempScrollValue = Handsontable.Dom.getScrollTop(target);

    // if scrolling the left overlay - populate the vertical scroll to the master table
    if (this.overlayScrollPositions.left.top !== tempScrollValue) {
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
  } else {
    this.preventMultipleScrolling = false;
  }
};

WalkontableOverlays.prototype.destroy = function () {
  var eventManager = Handsontable.eventManager(this.instance);


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
