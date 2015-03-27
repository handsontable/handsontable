function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.offset = 0;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableHorizontalScrollbarNative.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.resetFixedPosition = function () {
  var finalLeft, finalTop;

  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  if (this.scrollHandler === window) {

    var box = this.instance.wtTable.holder.getBoundingClientRect();
    var left = Math.ceil(box.left);
    var right = Math.ceil(box.right);

    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }

    finalTop = this.instance.wtTable.hider.style.top;
  }
  else if(!Handsontable.freezeOverlays) {
    finalLeft = this.getScrollPosition() + "px";
    finalTop = this.instance.wtTable.hider.style.top;
  }

  Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);

  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 'px';
  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';// + 4 + 'px';
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function (fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollLeft(this.scrollHandler);
};

WalkontableHorizontalScrollbarNative.prototype.setScrollPosition = function (pos) {
  if (this.scrollHandler === window) {
    window.scrollTo(pos, Handsontable.Dom.getWindowScrollTop());
  } else {
    this.scrollHandler.scrollLeft = pos;
  }
};

WalkontableHorizontalScrollbarNative.prototype.onScroll = function () {
  this.instance.getSetting('onScrollHorizontally');
};

WalkontableHorizontalScrollbarNative.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while(from < length) {
    sum += this.instance.wtTable.getStretchedColumnWidth(from) || this.instance.wtSettings.defaultColumnWidth;
    from++;
  }
  return sum;
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function () {
  var total = this.instance.getSetting('totalColumns');
  var headerSize = this.instance.wtViewport.getRowHeaderWidth();

  this.fixedContainer.style.width = headerSize + this.sumCellSizes(0, total) + 'px';// + 4 + 'px';

  if (typeof this.instance.wtViewport.columnsRenderCalculator.startPosition === 'number'){
    this.fixed.style.left = this.instance.wtViewport.columnsRenderCalculator.startPosition + 'px';
  }
  else if (total === 0) {
    this.fixed.style.left = '0';
  } else {
    throw  new Error('Incorrect value of the columnsRenderCalculator');
  }
  this.fixed.style.right = '';
};

/**
 * Scrolls horizontally to a column at the left edge of the viewport
 *
 * @param sourceCol {Number}
 * @param beyondRendered {Boolean} if TRUE, scrolls according to the bottom edge (top edge is by default)
 */
WalkontableHorizontalScrollbarNative.prototype.scrollTo = function (sourceCol, beyondRendered) {
  var newX = this.getTableParentOffset();

  if (beyondRendered) {
    newX += this.sumCellSizes(0, sourceCol + 1);
    newX -= this.instance.wtViewport.getViewportWidth();
  }
  else {
    var fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');
    newX += this.sumCellSizes(fixedColumnsLeft, sourceCol);
  }

  this.setScrollPosition(newX);
};

WalkontableHorizontalScrollbarNative.prototype.getTableParentOffset = function () {
  if (this.scrollHandler === window) {
    return this.instance.wtTable.holderOffset.left;
  }
  else {
    return 0;
  }
};
