function WalkontableScrollbars(instance) {
  this.instance = instance;
  if (instance.getSetting('nativeScrollbars')) {
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
  else {
    this.vertical = new WalkontableVerticalScrollbar(instance);
    this.horizontal = new WalkontableHorizontalScrollbar(instance);
  }
}

WalkontableScrollbars.prototype.registerListeners = function () {
  var that = this;

  function refreshAll() {
    if (!that.instance.wtTable.holder.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.vertical.windowScrollPosition = that.vertical.getScrollPosition();
    that.horizontal.windowScrollPosition = that.horizontal.getScrollPosition();

    that.vertical.onScroll();
    that.horizontal.onScroll(); //it's done here to make sure that all onScroll's are executed before changing styles

    that.vertical.react();
    //that.horizontal.react(); //it's done here to make sure that all onScroll's are executed before changing styles
  }

  var $window = $(window);
  this.vertical.$scrollHandler.on('scroll.' + this.instance.guid, refreshAll);
  if (this.vertical.scrollHandler !== this.horizontal.scrollHandler) {
    this.horizontal.$scrollHandler.on('scroll.' + this.instance.guid, refreshAll);
  }

  if (this.vertical.scrollHandler !== window && this.horizontal.scrollHandler !== window) {
    $window.on('scroll.' + this.instance.guid, refreshAll);
  }
  $window.on('load.' + this.instance.guid, refreshAll);
  $window.on('resize.' + this.instance.guid, refreshAll);
  $(document).on('ready.' + this.instance.guid, refreshAll);
};

WalkontableScrollbars.prototype.destroy = function () {
  this.vertical && this.vertical.destroy();
  this.horizontal && this.horizontal.destroy();
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