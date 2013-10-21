function WalkontableScrollbarNative() {
  this.lastWindowScrollPosition = NaN;
  this.maxOuts = 10; //max outs in one direction (before and after table)
  this.lastBegin = 0;
  this.lastEnd = 0;
}

/*
 Possible optimizations:
 [x] don't rerender if scroll delta is smaller than the fragment outside of the viewport
 [ ] move .style.top change before .draw()
 [ ] put .draw() in requestAnimationFrame
 [ ] don't rerender rows that remain visible after the scroll
 */

WalkontableScrollbarNative.prototype.init = function () {
  this.TABLE = this.instance.wtTable.TABLE;
  this.fixed = this.instance.wtTable.hider;
  this.fixedContainer = this.instance.wtTable.holder;
  this.fixed.style.position = 'absolute';
  this.fixed.style.left = '0';
  this.$scrollHandler = $(this.getScrollableElement(this.TABLE)); //in future remove jQuery from here
};

WalkontableScrollbarNative.prototype.getScrollableElement = function (TABLE) {
  var el = TABLE.parentNode;
  while (el && el.style) {
    if (el.style.overflow === 'scroll') {
      return el;
    }
    el = el.parentNode;
  }
  return window;
};

WalkontableScrollbarNative.prototype.prepare = function () {
};

WalkontableScrollbarNative.prototype.availableSize = function () {
  var availableSize;

  if (this.windowScrollPosition > this.tableParentOffset /*&& last > -1*/) { //last -1 means that viewport is scrolled behind the table
    if (this.instance.wtTable.getLastVisibleRow() === this.total - 1) {
      availableSize = this.instance.wtDom.outerHeight(this.TABLE);
    }
    else {
      availableSize = this.windowSize;
    }
  }
  else {
    availableSize = this.windowSize - (this.tableParentOffset);
  }

  return availableSize;
};

WalkontableScrollbarNative.prototype.refresh = function (selectionsOnly) {
  var last = this.getLastCell();
  this.measureBefore = this.sumCellSizes(0, this.offset);
  if (last === -1) { //last -1 means that viewport is scrolled behind the table
    this.measureAfter = 0;
  }
  else {
    this.measureAfter = this.sumCellSizes(last, this.total - last);
  }
  this.applyToDOM();
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableScrollbarNative.prototype.destroy = function () {
  this.$scrollHandler.off('.' + this.instance.guid);
  $(window).off('.' + this.instance.guid);
  $(document).off('.' + this.instance.guid);
};