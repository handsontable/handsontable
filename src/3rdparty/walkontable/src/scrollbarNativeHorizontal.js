function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.cellSize = 50;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableHorizontalScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableHorizontalScrollbarNative.prototype.prepare = function () {
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function () {
  this.clone && this.clone.draw(!this.instance.forceFullRender);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  if (this.$scrollHandler[0] === window) {
    return this.$scrollHandler[0].scrollX;
  }
  else {
    return this.$scrollHandler[0].scrollLeft;
  }
};

WalkontableHorizontalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.wtTable.getLastVisibleColumn();
};

WalkontableHorizontalScrollbarNative.prototype.getTableSize = function () {
  return this.instance.wtDom.outerWidth(this.TABLE);
};

WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function () {
  this.fixedContainer.style.paddingLeft = this.measureBefore + 'px';
  this.fixedContainer.style.paddingRight = this.measureAfter + 'px';
};

WalkontableHorizontalScrollbarNative.prototype.scrollTo = function (cell) {
  this.$scrollHandler.scrollLeft(this.tableParentOffset + cell * this.cellSize);
};

WalkontableHorizontalScrollbarNative.prototype.readSettings = function () {
  var offset = this.instance.wtDom.offset(this.fixedContainer);
  this.windowSize = this.$scrollHandler.width();
  this.windowScrollPosition = this.$scrollHandler.scrollLeft();
  if (this.$scrollHandler[0] === window) {
    this.scrollableOffset = 0;
  }
  else {
    this.scrollableOffset = this.instance.wtDom.offset(this.$scrollHandler[0]).left;
  }
  this.tableParentOffset = offset.left - this.scrollableOffset;
  this.offset = this.instance.getSetting('offsetColumn');
  this.total = this.instance.getSetting('totalColumns');
};