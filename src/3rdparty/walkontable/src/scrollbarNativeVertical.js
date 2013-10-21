function WalkontableVerticalScrollbarNative(instance) {
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
}

WalkontableVerticalScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableVerticalScrollbarNative.prototype.makeClone = function (direction) {
  if (this.instance.cloneFrom) {
    return;
  }

  var that = this;

  var clone = $('<div id="cln_' + direction + '" class="handsontable"></div>');
  this.instance.wtTable.holder.parentNode.appendChild(clone[0]);

  clone.css({
    position: 'fixed',
    overflow: 'hidden'
  });

//  clone[0].style.height = '55px';
//  clone[0].style.width = '384px';

  var table2 = $('<table class="htCore"></table>');
  table2.className = this.instance.wtTable.TABLE.className;
  clone.append(table2);

  var walkontableConfig = {};
  walkontableConfig.cloneFrom = this.instance;
  walkontableConfig.cloneDirection = direction;
  walkontableConfig.table = table2[0];
  var wt = new Walkontable(walkontableConfig);

  var cloneTable = clone.find('table')[0];
  var scrollable = that.$scrollHandler[0];

  //resetFixedPosition(clone[0]);

  this.$scrollHandler.on('scroll.' + this.instance.guid, function () {
    cloneTable.style.left = that.instance.wtScrollbars.horizontal.measureBefore - scrollable.scrollLeft + 'px';
  });

  $(window).on('load.' + this.instance.guid, function () {
    resetFixedPosition(clone[0]);
  });
  $(window).on('scroll.' + this.instance.guid, function () {
    resetFixedPosition(clone[0]);
  });
  $(window).on('resize.' + this.instance.guid, function () {
    resetFixedPosition(clone[0]);
  });
  $(document).on('ready.' + this.instance.guid, function () {
    resetFixedPosition(clone[0]);
  });

  function resetFixedPosition(elem) {
    if (!that.instance.wtTable.holder.parentNode) {
      return; //removed from DOM
    }

    var box;
    if (scrollable === window) {
      box = that.instance.wtTable.holder.getBoundingClientRect();
      var top = Math.ceil(box.top, 10);
      var bottom = Math.ceil(box.bottom, 10);

      if (top < 0 && bottom > 0) {
        elem.style.top = '0';
      }
      else {
        elem.style.top = top + 'px';
      }
    }
    else {
      box = that.$scrollHandler[0].getBoundingClientRect();
      elem.style.top = Math.ceil(box.top, 10) + 'px';
      elem.style.left = Math.ceil(box.left, 10) + 'px';
    }


    clone[0].style.width = WalkontableDom.prototype.outerWidth(that.instance.wtTable.holder.parentNode) + 'px';
    clone[0].style.height = WalkontableDom.prototype.outerHeight(wt.wtTable.TABLE) + 4 + 'px';
  }

  return wt;
};

WalkontableVerticalScrollbarNative.prototype.getScrollPosition = function () {
  if (this.$scrollHandler[0] === window) {
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
  if (this.instance.cloneFrom) {
    return;
  }

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
  if (this.instance.cloneDirection === 'top') {
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
  if (this.$scrollHandler[0] === window) {
    this.scrollableOffset = 0;
  }
  else {
    this.scrollableOffset = this.instance.wtDom.offset(this.$scrollHandler[0]).top;
  }
  this.tableParentOffset = offset.top - this.scrollableOffset;
  this.offset = this.instance.getSetting('offsetRow');
  this.total = this.instance.getSetting('totalRows');
};