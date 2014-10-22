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

  var oldVerticalScrollPosition
    , oldHorizontalScrollPosition
    , oldBoxTop
    , oldBoxLeft;

  this.refreshAll = function refreshAll() {
    if(!that.instance.drawn) {
      return;
    }

    if (!that.instance.wtTable.holder.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.vertical.windowScrollPosition = that.vertical.getScrollPosition();
    that.horizontal.windowScrollPosition = that.horizontal.getScrollPosition();
    that.box = that.instance.wtTable.hider.getBoundingClientRect();

    if (that.vertical.windowScrollPosition !== oldVerticalScrollPosition || that.horizontal.windowScrollPosition !== oldHorizontalScrollPosition || that.box.top !== oldBoxTop || that.box.left !== oldBoxLeft) {
      that.vertical.onScroll();
      that.horizontal.onScroll(); //it's done here to make sure that all onScroll's are executed before changing styles
      that.corner.onScroll();

      oldVerticalScrollPosition = that.vertical.windowScrollPosition;
      oldHorizontalScrollPosition = that.horizontal.windowScrollPosition;
      oldBoxTop = that.box.top;
      oldBoxLeft = that.box.left;
    }
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
  this.corner && this.corner.destroy();
  this.debug && this.debug.destroy();
};

WalkontableScrollbars.prototype.refresh = function (selectionsOnly) {
  this.horizontal && this.horizontal.readSettings();
  this.vertical && this.vertical.readSettings();
  this.horizontal && this.horizontal.refresh(selectionsOnly);
  this.vertical && this.vertical.refresh(selectionsOnly);
  this.corner && this.corner.refresh(selectionsOnly);
  this.debug && this.debug.refresh(selectionsOnly);
};

WalkontableScrollbars.prototype.applyToDOM = function () {
  this.horizontal && this.horizontal.applyToDOM();
  this.vertical && this.vertical.applyToDOM();
  this.corner && this.corner.applyToDOM();
  this.debug && this.debug.applyToDOM();
};
