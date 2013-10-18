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



  this.readSettings();
};

///////////

WalkontableScrollbarNative.prototype.makeClone = function (direction) {
  if(this.instance.cloneFrom) {
    return;
  }

  var that = this;

  var clone = $('<div id="cln_' + direction + '" class="handsontable"></div>');
  this.instance.wtTable.holder.parentNode.appendChild(clone[0]);

  clone.css({
    position: 'fixed',
    overflow: 'hidden'
  });

  if (direction === 'top') {
    clone[0].style.height = '55px';
    clone[0].style.width = '384px';

  }
  else if (direction === 'left') {
    clone[0].style.height = '184px';
    clone[0].style.width = '55px';
  }

  var table2 = $('<table class="htCore"></table>');
  table2.className = this.instance.wtTable.TABLE.className;
  clone.append(table2);

  var walkontableConfig = {};
  walkontableConfig.cloneFrom = this.instance;
  walkontableConfig.cloneDirection = direction;
  walkontableConfig.table = table2[0];
  var wt = new Walkontable(walkontableConfig);

  var cloneTable = clone.find('table')[0];
  var scrollable = wt.wtScrollbars.vertical.$scrollHandler[0];

  //resetFixedPosition(clone[0]);

  this.$scrollHandler.on('scroll', function () {
    if (direction === 'top') {
      cloneTable.style.left = 0 - scrollable.scrollLeft + 'px';
    }
    else {
      cloneTable.style.top = 0 - scrollable.scrollTop + 'px';
    }
  });

  $(window).on('load', function () {
    resetFixedPosition(clone[0]);
  });
  $(window).on('scroll', function () {
    resetFixedPosition(clone[0]);
  });
  $(window).on('resize', function () {
    resetFixedPosition(clone[0]);
  });
  $(document).on('ready', function () {
    resetFixedPosition(clone[0]);
  });


  function resetFixedPosition(elem) {
    var box = that.instance.wtTable.holder.getBoundingClientRect();
    elem.style.top = box.top + that.instance.wtScrollbars.vertical.getScrollPosition() + 'px';
    elem.style.left = box.left + that.instance.wtScrollbars.horizontal.getScrollPosition() + 'px';
    console.log("wch2", that.instance.wtScrollbars.vertical.getScrollPosition(), that.instance.wtScrollbars.horizontal.getScrollPosition());
  }

  return wt;
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

WalkontableScrollbarNative.prototype.refresh = function () {
  var last = this.getLastCell();
  this.measureBefore = this.sumCellSizes(0, this.offset);
  if (last === -1) { //last -1 means that viewport is scrolled behind the table
    this.measureAfter = 0;
  }
  else {
    this.measureAfter = this.sumCellSizes(last, this.total - last);
  }
  this.applyToDOM();
  this.clone && this.clone.draw(!this.instance.forceFullRender);
};

WalkontableScrollbarNative.prototype.destroy = function () {
  this.$scrollHandler.off('scroll.walkontable');
};

///

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