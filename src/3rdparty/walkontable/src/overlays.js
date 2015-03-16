function WalkontableOverlays(instance) {
  this.instance = instance;
  instance.update('scrollbarWidth', Handsontable.Dom.getScrollbarWidth());
  instance.update('scrollbarHeight', Handsontable.Dom.getScrollbarWidth());

  this.topOverlay = new WalkontableTopOverlay(instance);
  this.leftOverlay = new WalkontableLeftOverlay(instance);
  this.topLeftCornerOverlay = new WalkontableCornerOverlay(instance);

  this.preventMultipleScrolling = false;

  //TODO: remove after finishing refactoring
  //this.vertical = new WalkontableVerticalScrollbarNative(instance);
  //this.horizontal = new WalkontableHorizontalScrollbarNative(instance);
  //this.corner = new WalkontableCornerScrollbarNative(instance);

  if (instance.getSetting('debug')) {
    this.debug = new WalkontableDebugOverlay(instance);
  }
  this.registerListeners();
}

WalkontableOverlays.prototype.registerListeners = function () {
  var that = this;
  this.mainTableScrollableElement = Handsontable.Dom.getScrollableElement(this.instance.wtTable.TABLE);

  this.refreshAll = function refreshAll() {
    if(!that.instance.drawn) {
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

  eventManager.addEventListener(this.mainTableScrollableElement, 'scroll', function (e) {
    that.syncScrollPositions.call(that, e);
    that.refreshAll.call(that);
  });


  eventManager.addEventListener(this.topOverlay.clone.wtTable.holder, 'scroll', function (e) {
    that.syncScrollPositions.call(that, e);
  });

  eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'scroll', function (e) {
    that.syncScrollPositions.call(that, e);
  });

  if (this.topOverlay.trimmingContainer !== window && this.leftOverlay.trimmingContainer !== window) {
    eventManager.addEventListener(window,'scroll', this.refreshAll);
  }
};

WalkontableOverlays.prototype.syncScrollPositions = function (e) {
  if (this.preventMultipleScrolling) {
    this.preventMultipleScrolling = false;
    return;
  }

  this.preventMultipleScrolling = true;
  var target = e.target,
    master = this.topOverlay.mainTableScrollableElement,
    topOverlay = this.topOverlay.clone.wtTable.holder,
    leftOverlay = this.leftOverlay.clone.wtTable.holder;

  // If the overlay holder doesn't have assigned width/height yet, reapply it's DOM properties
  if(leftOverlay.style.height === "" && target.scrollTop !== 0) {
    this.leftOverlay.applyToDOM();
  }
  if(topOverlay.style.width === "" && target.scrollLeft !== 0) {
    this.topOverlay.applyToDOM();
  }

  if (target === master) {
    topOverlay.scrollLeft = target.scrollLeft;
    leftOverlay.scrollTop = target.scrollTop;
  } else if (target === topOverlay) {
    master.scrollLeft = target.scrollLeft;
  } else if (target === leftOverlay) {
    master.scrollTop = target.scrollTop;
  }
};

WalkontableOverlays.prototype.destroy = function () {
  var eventManager = Handsontable.eventManager(this.instance);

  if (this.topOverlay) {
    this.topOverlay.destroy();
    eventManager.removeEventListener(this.topOverlay.trimmingContainer,'scroll', this.refreshAll);
  }
  if (this.leftOverlay) {
    this.leftOverlay.destroy();
    eventManager.removeEventListener(this.leftOverlay.trimmingContainer,'scroll', this.refreshAll);
  }
  eventManager.removeEventListener(window,'scroll', this.refreshAll);
  if (this.topLeftCornerOverlay ) {
    this.topLeftCornerOverlay.destroy();
  }
  if (this.debug) {
    this.debug.destroy();
  }
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
