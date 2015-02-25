function WalkontableOverlays(instance) {
  this.instance = instance;
  instance.update('scrollbarWidth', Handsontable.Dom.getScrollbarWidth());
  instance.update('scrollbarHeight', Handsontable.Dom.getScrollbarWidth());

  this.topOverlay = new WalkontableHorizontalOverlay(instance);
  this.leftOverlay = new WalkontableVerticalOverlay(instance);
  this.topLeftCornerOverlay = new WalkontableCornerOverlay(instance);

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

  eventManager.addEventListener(this.topOverlay.scrollHandler, 'scroll', this.refreshAll);
  if (this.topOverlay.scrollHandler !== this.leftOverlay.scrollHandler) {
    eventManager.addEventListener(this.leftOverlay.scrollHandler, 'scroll', this.refreshAll);
  }

  if (this.topOverlay.scrollHandler !== window && this.leftOverlay.scrollHandler !== window) {
    eventManager.addEventListener(window,'scroll', this.refreshAll);
  }
};

WalkontableOverlays.prototype.destroy = function () {
  var eventManager = Handsontable.eventManager(this.instance);

  if (this.topOverlay) {
    this.topOverlay.destroy();
    eventManager.removeEventListener(this.topOverlay.scrollHandler,'scroll', this.refreshAll);
  }
  if (this.leftOverlay) {
    this.leftOverlay.destroy();
    eventManager.removeEventListener(this.leftOverlay.scrollHandler,'scroll', this.refreshAll);
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
