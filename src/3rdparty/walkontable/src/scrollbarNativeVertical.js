var WalkontableVerticalScrollbarNative = function (instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.cellSize = 23;
  this.init();

  var that = this;
  this.$scrollHandler.on('scroll.walkontable', function () {
    if (!that.instance.wtTable.holder.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.onScroll();
  });

  WalkontableCellStrategy.prototype.isLastIncomplete = function () { //monkey patch needed. In future get rid of it to improve performance
    /*
     * this.remainingSize = window viewport reduced by sum of all rendered cells (also those before the visible part)
     * that.sumCellSizes(...) = sum of the sizes of cells that are before the visible part + 1 cell that is partially visible on top of the screen
     */
    return this.remainingSize > that.sumCellSizes(that.offset, that.offset + that.curOuts + 1);
  };

  this.clone = this.makeClone('top');
};

WalkontableVerticalScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableVerticalScrollbarNative.prototype.getScrollPosition = function () {
  if(this.$scrollHandler[0] === window) {
    return this.$scrollHandler[0].scrollY;
  }
  else {
    return this.$scrollHandler[0].scrollTop;
  }
};

WalkontableVerticalScrollbarNative.prototype.setScrollPosition = function (pos) {
  this.$scrollHandler[0].scrollTop = pos;
};

WalkontableVerticalScrollbarNative.prototype.onScroll = function (forcePosition) {
  this.readSettings(); //read window scroll position
  if (forcePosition) {

    this.windowScrollPosition = forcePosition;
  }

  if (this.windowScrollPosition === this.lastWindowScrollPosition) {
    return;
  }

  if (this.windowScrollPosition > this.lastBegin && this.windowScrollPosition + this.windowSize < this.lastEnd) {
    return;
  }

  this.lastWindowScrollPosition = this.windowScrollPosition;

  var scrollDelta;
  var newOffset = 0;

  if (1 == 1 || this.windowScrollPosition > this.tableParentOffset) {
    scrollDelta = this.windowScrollPosition - this.tableParentOffset;

    partialOffset = 0;
    if (scrollDelta > 0) {
      var sum = 0;
      var last;
      for (var i = 0; i < this.total; i++) {
        last = this.instance.getSetting('rowHeight', i);
        sum += last;
        if (sum > scrollDelta) {
          break;
        }
      }

      if (this.offset > 0) {
        partialOffset = (sum - scrollDelta);
      }
      newOffset = i;
      newOffset = Math.min(newOffset, this.total);
    }
  }

  this.curOuts = newOffset > this.maxOuts ? this.maxOuts : newOffset;
  newOffset -= this.curOuts;

  this.instance.update('offsetRow', newOffset);
  this.readSettings(); //read new offset
  this.instance.draw();
};

WalkontableVerticalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.getSetting('offsetRow') + this.instance.wtTable.tbodyChildrenLength - 1;
};

WalkontableVerticalScrollbarNative.prototype.getTableSize = function () {
  return this.instance.wtDom.outerHeight(this.TABLE);
};

var partialOffset = 0;

WalkontableVerticalScrollbarNative.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while (from < length) {
    sum += this.instance.getSetting('rowHeight', from);
    from++;
  }
  return sum;
};

WalkontableVerticalScrollbarNative.prototype.applyToDOM = function () {
  if(this.instance.cloneDirection === 'top') {
    return;
  }

  var headerSize = this.instance.wtViewport.getColumnHeaderHeight();
  this.fixedContainer.style.height = headerSize + this.sumCellSizes(0, this.total) + 'px';
  this.fixed.style.top = this.measureBefore + 'px';
  this.fixed.style.bottom = '';

  this.lastBegin = this.tableParentOffset + this.measureBefore;
  this.lastEnd = this.lastBegin + headerSize + this.instance.wtTable.rowStrategy.cellSizesSum;
};

WalkontableVerticalScrollbarNative.prototype.scrollTo = function (cell) {
  var newY = this.tableParentOffset + cell * this.cellSize;
  this.$scrollHandler.scrollTop(newY);
  this.onScroll(newY);
};

WalkontableVerticalScrollbarNative.prototype.readSettings = function () {
  var offset = this.instance.wtDom.offset(this.fixedContainer);
  this.windowSize = this.$scrollHandler.height();
  this.windowScrollPosition = this.$scrollHandler.scrollTop();
  if(this.$scrollHandler[0] === window) {
    this.scrollableOffset = 0;
  }
  else {
    this.scrollableOffset = this.instance.wtDom.offset(this.$scrollHandler[0]).top;
  }
  this.tableParentOffset = offset.top - this.scrollableOffset;
  this.offset = this.instance.getSetting('offsetRow');
  this.total = this.instance.getSetting('totalRows');
};

///

var WalkontableHorizontalScrollbarNative = function (instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.cellSize = 50;
  this.init();
  this.clone = this.makeClone('left');
};

WalkontableHorizontalScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableHorizontalScrollbarNative.prototype.prepare = function () {
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function () {
  this.clone && this.clone.draw(!this.instance.forceFullRender);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  if(this.$scrollHandler[0] === window) {
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
  if(this.$scrollHandler[0] === window) {
    this.scrollableOffset = 0;
  }
  else {
    this.scrollableOffset = this.instance.wtDom.offset(this.$scrollHandler[0]).left;
  }
  this.tableParentOffset = offset.left - this.scrollableOffset;
  this.offset = this.instance.getSetting('offsetColumn');
  this.total = this.instance.getSetting('totalColumns');
};