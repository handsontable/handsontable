function WalkontableScrollbars(instance) {
  this.instance = instance;
  instance.update('scrollbarWidth', Handsontable.Dom.getScrollbarWidth());
  instance.update('scrollbarHeight', Handsontable.Dom.getScrollbarWidth());
  this.vertical = new WalkontableVerticalScrollbarNative(instance);
  this.horizontal = new WalkontableHorizontalScrollbarNative(instance);
  this.corner = new WalkontableCornerScrollbarNative(instance);
  if (instance.getSetting('debug')) {
    this.debug = new WalkontableDebugOverlay(instance);
  }
  this.registerListeners();
}

WalkontableScrollbars.prototype.registerListeners = function () {
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
    that.vertical.onScroll();
    that.horizontal.onScroll();
  };

  var eventManager = Handsontable.eventManager(that.instance);

  eventManager.addEventListener(this.vertical.scrollHandler, 'scroll', this.refreshAll);
  if (this.vertical.scrollHandler !== this.horizontal.scrollHandler) {
    eventManager.addEventListener(this.horizontal.scrollHandler, 'scroll', this.refreshAll);
  }

  if (this.vertical.scrollHandler !== window && this.horizontal.scrollHandler !== window) {
    eventManager.addEventListener(window,'scroll', this.refreshAll);
  }
};

WalkontableScrollbars.prototype.destroy = function () {
  var eventManager = Handsontable.eventManager(this.instance);

  if (this.vertical) {
    this.vertical.destroy();
    eventManager.removeEventListener(this.vertical.scrollHandler,'scroll', this.refreshAll);
  }
  if (this.horizontal) {
    this.horizontal.destroy();
    eventManager.removeEventListener(this.horizontal.scrollHandler,'scroll', this.refreshAll);
  }
  eventManager.removeEventListener(window,'scroll', this.refreshAll);
  if (this.corner ) {
    this.corner.destroy();
  }
  if (this.debug) {
    this.debug.destroy();
  }
};

WalkontableScrollbars.prototype.refresh = function (fastDraw) {
  if (this.horizontal) {
    this.horizontal.refresh(fastDraw);
  }
  if (this.vertical) {
    this.vertical.refresh(fastDraw);
  }
  if (this.corner) {
    this.corner.refresh(fastDraw);
  }
  if (this.debug) {
    this.debug.refresh(fastDraw);
  }
};

WalkontableScrollbars.prototype.applyToDOM = function () {
  if (this.horizontal) {
    this.horizontal.applyToDOM();
  }
  if (this.vertical) {
    this.vertical.applyToDOM();
  }
};
