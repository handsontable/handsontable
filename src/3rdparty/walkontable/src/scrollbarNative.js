function WalkontableScrollbarNative() {
  this.lastWindowScrollPosition = NaN;
}

WalkontableScrollbarNative.prototype.init = function () {
  this.fixedContainer = this.instance.wtTable.TABLE.parentNode.parentNode.parentNode;
  this.fixed = this.instance.wtTable.TABLE.parentNode.parentNode;
  this.TABLE = this.instance.wtTable.TABLE;
  this.$scrollHandler = $(window); //in future remove jQuery from here

  var that = this;
  this.$scrollHandler.on('scroll.walkontable', function () {
    if (!that.instance.wtTable.parent.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.onScroll();
  });

  this.readSettings();
};

WalkontableScrollbarNative.prototype.onScroll = function () {
  this.readSettings();
  if (this.windowScrollPosition === this.lastWindowScrollPosition) {
    return;
  }
  this.lastWindowScrollPosition = this.windowScrollPosition;

  var scrollDelta;
  var newOffset = 0;

  if (this.windowScrollPosition > this.tableParentOffset) {
    scrollDelta = this.windowScrollPosition - this.tableParentOffset;
    newOffset = Math.ceil(scrollDelta / 20, 10);
    newOffset = Math.min(newOffset, this.total)
  }

  this.instance.update('offsetRow', newOffset);
  this.instance.draw();
};

WalkontableScrollbarNative.prototype.prepare = function () {
};

WalkontableScrollbarNative.prototype.availableSize = function () {
  var availableSize;

  //var last = this.getLastCell();
  if (this.windowScrollPosition > this.tableParentOffset /*&& last > -1*/) { //last -1 means that viewport is scrolled behind the table
    if (this.instance.wtTable.getLastVisibleRow() === this.total - 1) {
      availableSize = this.instance.wtDom.outerHeight(this.TABLE);
    }
    else {
      availableSize = this.windowSize;
    }
  }
  else {
    availableSize = this.windowSize - (this.tableParentOffset - this.windowScrollPosition);
  }

  return availableSize;
};

WalkontableScrollbarNative.prototype.refresh = function () {
  var last = this.getLastCell();
  this.measureBefore = this.offset * this.cellSize;
  this.measureInside = this.getTableSize();
  if (last === -1) { //last -1 means that viewport is scrolled behind the table
    this.measureAfter = 0;
  }
  else {
    this.measureAfter = (this.total - last - 1) * this.cellSize;
  }
  this.applyToDOM();
};

WalkontableScrollbarNative.prototype.destroy = function () {
  this.$scrollHandler.off('scroll.walkontable');
};

///

var WalkontableVerticalScrollbarNative = function (instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.cellSize = 20;
  this.init();
};

WalkontableVerticalScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableVerticalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.wtTable.getLastVisibleRow();
};

WalkontableVerticalScrollbarNative.prototype.getTableSize = function () {
  return this.instance.wtDom.outerHeight(this.TABLE);
};

WalkontableVerticalScrollbarNative.prototype.applyToDOM = function () {
  if (this.windowScrollPosition > this.tableParentOffset /*&& last > -1*/) { //last -1 means that viewport is scrolled behind the table
    this.fixed.style.position = 'fixed';
    this.fixed.style.top = '0';
    this.fixed.style.left = this.tableParentOtherOffset;
  }
  else {
    this.fixed.style.position = 'relative';
  }

  var debug = false;
  if (debug) {
    //this.fixedContainer.style.borderTop = this.measureBefore + 'px solid red';
    //this.fixedContainer.style.borderBottom = (this.tableSize + this.measureAfter) + 'px solid blue';
  }
  else {
    this.fixedContainer.style.paddingTop = this.measureBefore + 'px';
    this.fixedContainer.style.paddingBottom = (this.measureInside + this.measureAfter) + 'px';
  }
};

WalkontableVerticalScrollbarNative.prototype.scrollTo = function (cell) {
  this.$scrollHandler.scrollTop(this.tableParentOffset + cell * this.cellSize);
};

WalkontableVerticalScrollbarNative.prototype.readSettings = function () {
  var offset = this.instance.wtDom.offset(this.fixedContainer);
  this.tableParentOffset = offset.top;
  this.tableParentOtherOffset = offset.left;
  this.windowSize = this.$scrollHandler.height();
  this.windowScrollPosition = this.$scrollHandler.scrollTop();
  this.offset = this.instance.getSetting('offsetRow');
  this.total = this.instance.getSetting('totalRows');
};

///

var WalkontableHorizontalScrollbarNative = function (instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.cellSize = 50;
  this.init();
};

WalkontableHorizontalScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableHorizontalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.wtTable.getLastVisibleColumn();
};

WalkontableHorizontalScrollbarNative.prototype.getTableSize = function () {
  return this.instance.wtDom.outerWidth(this.TABLE);
};

WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function () {
  if (this.windowScrollPosition > this.tableParentOffset /*&& last > -1*/) { //last -1 means that viewport is scrolled behind the table
    this.fixed.style.position = 'fixed';
    this.fixed.style.left = '0';
    this.fixed.style.top = this.tableParentOtherOffset;
  }
  else {
    this.fixed.style.position = 'relative';
  }

  var debug = false;
  if (debug) {
    //this.fixedContainer.style.borderLeft = this.measureBefore + 'px solid red';
    //this.fixedContainer.style.borderBottom = (this.tableSize + this.measureAfter) + 'px solid blue';
  }
  else {
    this.fixedContainer.style.paddingLeft = this.measureBefore + 'px';
    this.fixedContainer.style.paddingRight = (this.measureInside + this.measureAfter) + 'px';
  }
};

WalkontableHorizontalScrollbarNative.prototype.scrollTo = function (cell) {
  this.$scrollHandler.scrollLeft(this.tableParentOffset + cell * this.cellSize);
};

WalkontableHorizontalScrollbarNative.prototype.readSettings = function () {
  var offset = this.instance.wtDom.offset(this.fixedContainer);
  this.tableParentOffset = offset.left;
  this.tableParentOtherOffset = offset.top;
  this.windowSize = this.$scrollHandler.width();
  this.windowScrollPosition = this.$scrollHandler.scrollLeft();
  this.offset = this.instance.getSetting('offsetColumn');
  this.total = this.instance.getSetting('totalColumns');
};