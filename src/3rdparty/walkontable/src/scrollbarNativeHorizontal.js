function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.cellSize = 50;
  this.offset = 0;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableHorizontalScrollbarNative.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  if (this.scrollHandler === window) {

    var box = this.instance.wtTable.holder.getBoundingClientRect();
    var left = Math.ceil(box.left);
    var finalLeft
      , finalTop;

    if (left < 0 && (left + Handsontable.Dom.outerWidth(this.instance.wtTable.TABLE)) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }

    finalTop = this.instance.wtTable.hider.style.top;
  }
  else {
    finalLeft = this.getScrollPosition() + "px";
    finalTop = this.instance.wtTable.hider.style.top;
  }

  Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);

  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 'px';
  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function (selectionsOnly) {
  WalkontableOverlay.prototype.refresh.call(this, selectionsOnly);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollLeft(this.scrollHandler);
};

WalkontableHorizontalScrollbarNative.prototype.setScrollPosition = function (pos) {
  if (this.scrollHandler === window) {
    window.scrollTo(pos, Handsontable.Dom.getWindowScrollTop());
  } else {
    this.scrollHandler.scrollLeft = pos;
  }
};

WalkontableHorizontalScrollbarNative.prototype.onScroll = function () {
  this.readSettings(); //read window scroll position
  this.instance.getSetting('onScrollHorizontally');
};

WalkontableHorizontalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.wtTable.getLastVisibleColumn();
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function () {
};

/**
 * Scrolls horizontally to a column at the left edge of the viewport
 * @param sourceCol {Number}
 */
WalkontableHorizontalScrollbarNative.prototype.scrollTo = function (sourceCol) {
  this.setScrollPosition(this.getTableParentOffset() + sourceCol * this.cellSize);
};

WalkontableHorizontalScrollbarNative.prototype.getTableParentOffset = function () {
  if (this.scrollHandler === window) {
    return this.instance.wtTable.holderOffset.left;
  }
  else {
    return 0;
  }
};

WalkontableHorizontalScrollbarNative.prototype.readSettings = function () {
  this.total = this.instance.getSetting('totalColumns');
};
