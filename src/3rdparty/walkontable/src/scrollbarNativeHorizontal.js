function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.cellSize = 50;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableHorizontalScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableHorizontalScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  var box;
  if (this.scrollHandler === window) {
    box = this.instance.wtTable.holder.getBoundingClientRect();
    var left = Math.ceil(box.left, 10);
    var right = Math.ceil(box.right, 10);

    if (left < 0 && right > 0) {
      elem.style.left = '0';
    }
    else {
      elem.style.left = left + 'px';
    }
  }
  else {
    box = this.scrollHandler.getBoundingClientRect();
    elem.style.top = Math.ceil(box.top, 10) + 'px';
    elem.style.left = Math.ceil(box.left, 10) + 'px';
  }

  elem.style.width = WalkontableDom.prototype.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';
  elem.style.height = this.instance.wtViewport.getWorkspaceHeight() - this.instance.getSetting('scrollbarHeight') + 'px';
};

WalkontableHorizontalScrollbarNative.prototype.prepare = function () {
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function (selectionsOnly) {
  this.measureBefore = 0;
  this.measureAfter = 0;
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  if (this.scrollHandler === window) {
    return this.scrollHandler.scrollX;
  }
  else {
    return this.scrollHandler.scrollLeft;
  }
};

WalkontableHorizontalScrollbarNative.prototype.onScroll = function () {
  this.windowScrollPosition = this.getScrollPosition();
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

WalkontableHorizontalScrollbarNative.prototype.readWindowSize = function () {
  if (this.scrollHandler === window) {
    this.windowSize = document.documentElement.clientWidth;
    this.tableParentOffset = this.instance.wtTable.holderOffset.left;
  }
  else {
    this.windowSize = WalkontableDom.prototype.outerWidth(this.scrollHandler);
    this.tableParentOffset = 0;
  }
  this.windowScrollPosition = this.getScrollPosition();
};

WalkontableHorizontalScrollbarNative.prototype.readSettings = function () {
  this.offset = this.instance.getSetting('offsetColumn');
  this.total = this.instance.getSetting('totalColumns');
};