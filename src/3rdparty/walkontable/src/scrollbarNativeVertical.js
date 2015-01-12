function WalkontableVerticalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'vertical';
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

  if (this.scrollHandler === window) {
    var box = this.instance.wtTable.holder.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var finalLeft
      , finalTop;
    var bottom = Math.ceil(box.bottom);

    finalLeft = this.instance.wtTable.hider.style.left;

    if (top < 0 && (bottom - elem.offsetHeight) > 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }
  }
  else if(!Handsontable.freezeOverlays) {
    finalTop = this.getScrollPosition() + "px";
    finalLeft = this.instance.wtTable.hider.style.left;
  }

  Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);

  if (this.instance.wtScrollbars.horizontal.scrollHandler === window) {
    elem.style.width = this.instance.wtViewport.getWorkspaceActualWidth() + 'px';
  }
  else {
    elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 'px';
  }

  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';// + 4 + 'px';
};

WalkontableVerticalScrollbarNative.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollTop(this.scrollHandler);
};

WalkontableVerticalScrollbarNative.prototype.setScrollPosition = function (pos) {
  if (this.scrollHandler === window){
    window.scrollTo(Handsontable.Dom.getWindowScrollLeft(), pos);
  } else {
    this.scrollHandler.scrollTop = pos;
  }
};

WalkontableVerticalScrollbarNative.prototype.onScroll = function () {
  this.instance.getSetting('onScrollVertically');
};

WalkontableVerticalScrollbarNative.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while (from < length) {
    sum += this.instance.wtTable.getRowHeight(from) || this.instance.wtSettings.settings.defaultRowHeight; //TODO optimize getSetting, because this is MUCH faster then getSetting
    from++;
  }
  return sum;
};

WalkontableVerticalScrollbarNative.prototype.refresh = function (fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableVerticalScrollbarNative.prototype.applyToDOM = function () {
  var total = this.instance.getSetting('totalRows');
  var headerSize = this.instance.wtViewport.getColumnHeaderHeight();
  this.fixedContainer.style.height = headerSize + this.sumCellSizes(0, total) +  'px';// + 4 + 'px'; //+4 is needed, otherwise vertical scroll appears in Chrome (window scroll mode) - maybe because of fill handle in last row or because of box shadow
  if (typeof this.instance.wtViewport.rowsRenderCalculator.startPosition === 'number') {
    this.fixed.style.top = this.instance.wtViewport.rowsRenderCalculator.startPosition + 'px';
  }
  else if (total === 0) {
    this.fixed.style.top = '0'; //can happen if there are 0 rows
  }
  else {
    throw new Error("Incorrect value of the rowsRenderCalculator");
  }
  this.fixed.style.bottom = '';
};

/**
 * Scrolls vertically to a row
 * @param sourceRow {Number}
 * @param bottomEdge {Boolean} if TRUE, scrolls according to the bottom edge (top edge is by default)
 */
WalkontableVerticalScrollbarNative.prototype.scrollTo = function (sourceRow, bottomEdge) {
  var newY = this.getTableParentOffset();
  if (bottomEdge) {
    newY += this.sumCellSizes(0, sourceRow + 1);
    newY -= this.instance.wtViewport.getViewportHeight();
  }
  else {
    var fixedRowsTop = this.instance.getSetting('fixedRowsTop');
    newY += this.sumCellSizes(fixedRowsTop, sourceRow);
  }

  this.setScrollPosition(newY);
};

WalkontableVerticalScrollbarNative.prototype.getTableParentOffset = function () {
  if (this.scrollHandler === window) {
    return this.instance.wtTable.holderOffset.top;
  }
  else {
    return 0;
  }
};
