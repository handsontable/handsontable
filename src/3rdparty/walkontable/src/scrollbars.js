function WalkontableScrollbars(instance) {
  this.instance = instance;
  instance.update('scrollbarWidth', instance.wtDom.getScrollbarWidth());
  instance.update('scrollbarHeight', instance.wtDom.getScrollbarWidth());
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
    , oldBoxLeft
    , oldBoxWidth
    , oldBoxHeight;

  function refreshAll() {
    if (!that.instance.wtTable.holder.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.vertical.windowScrollPosition = that.vertical.getScrollPosition();
    that.horizontal.windowScrollPosition = that.horizontal.getScrollPosition();
    that.box = that.instance.wtTable.hider.getBoundingClientRect();

    if((that.box.width !== oldBoxWidth || that.box.height !== oldBoxHeight) && that.instance.rowHeightCache) {
      //that.instance.rowHeightCache.length = 0; //at this point the cached row heights may be invalid, but it is better not to reset the cache, which could cause scrollbar jumping when there are multiline cells outside of the rendered part of the table
      oldBoxWidth = that.box.width;
      oldBoxHeight = that.box.height;
      that.instance.draw();
    }

    if (that.vertical.windowScrollPosition !== oldVerticalScrollPosition || that.horizontal.windowScrollPosition !== oldHorizontalScrollPosition || that.box.top !== oldBoxTop || that.box.left !== oldBoxLeft) {
      that.vertical.onScroll();
      that.horizontal.onScroll(); //it's done here to make sure that all onScroll's are executed before changing styles

      that.vertical.react();
      that.horizontal.react(); //it's done here to make sure that all onScroll's are executed before changing styles

      oldVerticalScrollPosition = that.vertical.windowScrollPosition;
      oldHorizontalScrollPosition = that.horizontal.windowScrollPosition;
      oldBoxTop = that.box.top;
      oldBoxLeft = that.box.left;
    }
  }

  var $window = $(window);
  this.vertical.$scrollHandler.on('scroll.' + this.instance.guid, refreshAll);
  if (this.vertical.scrollHandler !== this.horizontal.scrollHandler) {
    this.horizontal.$scrollHandler.on('scroll.' + this.instance.guid, refreshAll);
  }

  if (this.vertical.scrollHandler !== window && this.horizontal.scrollHandler !== window) {
    $window.on('scroll.' + this.instance.guid, refreshAll);
  }
};

WalkontableScrollbars.prototype.destroy = function () {
  this.vertical && this.vertical.destroy();
  this.horizontal && this.horizontal.destroy();
  this.corner && this.corner.destroy();
};

WalkontableScrollbars.prototype.refresh = function (selectionsOnly) {
  this.horizontal && this.horizontal.readSettings();
  this.vertical && this.vertical.readSettings();
  this.horizontal && this.horizontal.prepare();
  this.vertical && this.vertical.prepare();
  this.horizontal && this.horizontal.refresh(selectionsOnly);
  this.vertical && this.vertical.refresh(selectionsOnly);
  this.corner && this.corner.refresh(selectionsOnly);
  this.debug && this.debug.refresh(selectionsOnly);
};