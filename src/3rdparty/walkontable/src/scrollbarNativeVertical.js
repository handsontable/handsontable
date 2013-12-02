function WalkontableVerticalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.cellSize = 23;
  this.init();

  var that = this;

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

  var table2 = $('<table class="htCore"></table>');
  table2.className = this.instance.wtTable.TABLE.className;
  clone.append(table2);

  var walkontableConfig = {};
  walkontableConfig.cloneFrom = this.instance;
  walkontableConfig.cloneDirection = direction;
  walkontableConfig.table = table2[0];
  var wt = new Walkontable(walkontableConfig);

  var cloneTable = clone.find('table')[0];

  this.$scrollHandler.on('scroll.' + this.instance.guid, function () {
    if (!that.instance.wtTable.holder.parentNode) {
      //Walkontable was detached from DOM, but this handler was not removed
      that.destroy();
      return;
    }

    that.onScroll();
    that.instance.wtScrollbars.horizontal.onScroll(); //it's done here to make sure that all onScroll's are executed before changing styles

    cloneTable.style.left = that.instance.wtScrollbars.horizontal.measureBefore - that.instance.wtScrollbars.horizontal.windowScrollPosition + 'px';
    that.instance.wtScrollbars.horizontal.clone.wtTable.TABLE.style.top = that.instance.wtScrollbars.vertical.measureBefore - that.instance.wtScrollbars.vertical.windowScrollPosition + 'px';
  });

  $(window).on('load.' + this.instance.guid, function () {
    that.resetFixedPosition();
    that.instance.wtScrollbars.horizontal.resetFixedPosition();
    that.instance.wtScrollbars.corner.resetFixedPosition();
  });
  $(window).on('scroll.' + this.instance.guid, function () {
    that.resetFixedPosition();
    that.instance.wtScrollbars.horizontal.resetFixedPosition();
    that.instance.wtScrollbars.corner.resetFixedPosition();
  });
  $(window).on('resize.' + this.instance.guid, function () {
    that.resetFixedPosition();
    that.instance.wtScrollbars.horizontal.resetFixedPosition();
    that.instance.wtScrollbars.corner.resetFixedPosition();
  });
  $(document).on('ready.' + this.instance.guid, function () {
    that.resetFixedPosition();
    that.instance.wtScrollbars.horizontal.resetFixedPosition();
    that.instance.wtScrollbars.corner.resetFixedPosition();
  });

  return wt;
};

WalkontableVerticalScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  var box;
  if (this.scrollHandler === window) {
    box = this.instance.wtTable.holder.getBoundingClientRect();
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
    box = this.scrollHandler.getBoundingClientRect();
    elem.style.top = Math.ceil(box.top, 10) + 'px';
    elem.style.left = Math.ceil(box.left, 10) + 'px';
  }

  elem.style.width = WalkontableDom.prototype.outerWidth(this.instance.wtTable.holder.parentNode) + 'px';
  elem.style.height = WalkontableDom.prototype.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';
};

WalkontableVerticalScrollbarNative.prototype.getScrollPosition = function () {
  if (this.scrollHandler === window) {
    return this.scrollHandler.scrollY;
  }
  else {
    return this.scrollHandler.scrollTop;
  }
};

WalkontableVerticalScrollbarNative.prototype.setScrollPosition = function (pos) {
  this.scrollHandler.scrollTop = pos;
};

WalkontableVerticalScrollbarNative.prototype.onScroll = function (forcePosition) {
  if (this.instance.cloneFrom) {
    return;
  }

  this.instance.getSetting('onScrollVertically');

  this.windowScrollPosition = this.getScrollPosition();
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

WalkontableVerticalScrollbarNative.prototype.readWindowSize = function () {
  if (this.scrollHandler === window) {
    this.windowSize = document.documentElement.clientHeight;
    this.tableParentOffset = this.instance.wtTable.holderOffset.left;
  }
  else {
    this.windowSize = WalkontableDom.prototype.outerHeight(this.scrollHandler);
    this.tableParentOffset = 0;
  }
  this.windowScrollPosition = this.getScrollPosition();
};

WalkontableVerticalScrollbarNative.prototype.readSettings = function () {
  this.offset = this.instance.getSetting('offsetRow');
  this.total = this.instance.getSetting('totalRows');
};