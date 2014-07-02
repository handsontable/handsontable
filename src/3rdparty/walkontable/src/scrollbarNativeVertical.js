function WalkontableVerticalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.cellSize = this.instance.wtSettings.settings.defaultRowHeight;
  this.offset = 0;
  this.totalRows = 0;
  this.init();
  this.clone = this.makeClone('top');
}

WalkontableVerticalScrollbarNative.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  var box;
  if (this.scrollHandler === window) {
    box = this.instance.wtTable.hider.getBoundingClientRect();
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
    box = this.instance.wtScrollbars.horizontal.scrollHandler.getBoundingClientRect();
    elem.style.top = Math.ceil(box.top, 10) + 'px';
    elem.style.left = Math.ceil(box.left, 10) + 'px';
  }

  if (this.instance.wtScrollbars.horizontal.scrollHandler === window) {
    elem.style.width = this.instance.wtViewport.getWorkspaceActualWidth() + 'px';
  }
  else {
    elem.style.width = WalkontableDom.prototype.outerWidth(this.instance.wtTable.holder.parentNode) + 'px';
  }

  elem.style.height = WalkontableDom.prototype.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';
};

//react on movement of the other dimension scrollbar (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.react = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }

  var overlayContainer = this.clone.wtTable.holder.parentNode;
  if (this.instance.wtScrollbars.horizontal.scrollHandler !== window) {

    overlayContainer.firstChild.style.left = -this.instance.wtScrollbars.horizontal.windowScrollPosition + 'px';
  } else {
      var box = this.instance.wtTable.hider.getBoundingClientRect();
      overlayContainer.style.left = Math.ceil(box.left, 10) + 'px';
      overlayContainer.style.width = WalkontableDom.prototype.outerWidth(this.clone.wtTable.TABLE) + 'px';
  }
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
  if (this.scrollHandler === window){
    window.scrollTo(window.scrollX, pos);
  } else {
    this.scrollHandler.scrollTop = pos;
  }
};

WalkontableVerticalScrollbarNative.prototype.onScroll = function () {
  WalkontableOverlay.prototype.onScroll.call(this);

  this.instance.draw(true);//

  this.instance.getSetting('onScrollVertically');
};

WalkontableVerticalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.getSetting('offsetRow') + this.instance.wtTable.tbodyChildrenLength - 1;
};

var partialOffset = 0;

WalkontableVerticalScrollbarNative.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while (from < length) {
    sum += this.instance.wtSettings.settings.rowHeight(from) || this.instance.wtSettings.settings.defaultRowHeight; //TODO optimize getSetting, because this is MUCH faster then getSetting
    from++;
  }
  return sum;
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.applyToDOM = function () {
  var headerSize = this.instance.wtViewport.getColumnHeaderHeight();
  this.fixedContainer.style.height = headerSize + this.sumCellSizes(0, this.total) + 4 + 'px'; //+4 is needed, otherwise vertical scroll appears in Chrome (window scroll mode) - maybe because of fill handle in last row or because of box shadow
  this.fixed.style.top = this.measureBefore + 'px';
  this.fixed.style.bottom = '';
};

WalkontableVerticalScrollbarNative.prototype.scrollTo = function (cell) {
  var newY = this.tableParentOffset + cell * this.cellSize;
  this.setScrollPosition(newY);
  this.onScroll();
};

//readWindowSize (in future merge it with this.prepare?)
WalkontableVerticalScrollbarNative.prototype.readWindowSize = function () {
  if (this.scrollHandler === window) {
    this.windowSize = document.documentElement.clientHeight;
    this.tableParentOffset = this.instance.wtTable.holderOffset.top;
  }
  else {
    var elemHeight = WalkontableDom.prototype.outerHeight(this.scrollHandler);
    this.windowSize = elemHeight > 0 && this.scrollHandler.clientHeight > 0 ? this.scrollHandler.clientHeight : Infinity; //returns height without DIV scrollbar
    this.tableParentOffset = 0;
  }
  this.windowScrollPosition = this.getScrollPosition();
};

//readSettings (in future merge it with this.prepare?)
WalkontableVerticalScrollbarNative.prototype.readSettings = function () {
  this.readWindowSize();

  var scrollDelta;
  var newOffset = 0;

  if (this.windowScrollPosition > this.tableParentOffset) {
    scrollDelta = this.windowScrollPosition - this.tableParentOffset;

    partialOffset = 0;
    if (scrollDelta > 0) {
      var sum = 0;
      var last;
      for (var i = 0; i < this.total; i++) {
        last = this.instance.getSetting('rowHeight', i) || this.instance.wtSettings.settings.defaultRowHeight;
        sum += last;
        if (sum - 1> scrollDelta) {
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

  this.instance.update('offsetRow', newOffset);

  this.offset = this.instance.getSetting('offsetRow');
  this.total = this.instance.getSetting('totalRows');
};