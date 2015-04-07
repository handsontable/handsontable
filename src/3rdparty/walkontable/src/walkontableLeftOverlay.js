function WalkontableLeftOverlay(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.offset = 0;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableLeftOverlay.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableLeftOverlay.prototype.resetFixedPosition = function () {
  var finalLeft, finalTop;

  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode,
    scrollbarHeight = this.instance.wtTable.holder.clientHeight !== this.instance.wtTable.holder.offsetHeight ? Handsontable.Dom.getScrollbarWidth() : 0,
    scrollbarWidth = this.instance.wtTable.holder.clientWidth !== this.instance.wtTable.holder.offsetWidth ? Handsontable.Dom.getScrollbarWidth() : 0;

  if (this.instance.wtOverlays.leftOverlay.trimmingContainer !== window) {
    elem.style.height = this.instance.wtViewport.getWorkspaceHeight() - scrollbarHeight + 'px';
  } else {

    var box = this.instance.wtTable.hider.getBoundingClientRect();
    var left = Math.ceil(box.left);
    var right = Math.ceil(box.right);

    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }

    finalTop = this.instance.wtTable.hider.style.top;
    finalTop = finalTop === "" ? 0 : finalTop;

    Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);
  }

  var tableWidth = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE);
  var elemWidth = (tableWidth === 0 ? tableWidth : tableWidth + 4);
  elem.style.width = elemWidth + 'px';

  this.clone.wtTable.holder.style.width = elemWidth + scrollbarWidth + 'px';
};

WalkontableLeftOverlay.prototype.refresh = function (fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};

WalkontableLeftOverlay.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollLeft(this.mainTableScrollableElement);
};

WalkontableLeftOverlay.prototype.setScrollPosition = function (pos) {
  if (this.mainTableScrollableElement === window) {
    window.scrollTo(pos, Handsontable.Dom.getWindowScrollTop());
  } else {
    this.mainTableScrollableElement.scrollLeft = pos;
  }
};

WalkontableLeftOverlay.prototype.onScroll = function () {
  this.instance.getSetting('onScrollHorizontally');
};

WalkontableLeftOverlay.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while(from < length) {
    sum += this.instance.wtTable.getStretchedColumnWidth(from) || this.instance.wtSettings.defaultColumnWidth;
    from++;
  }
  return sum;
};

//applyToDOM (in future merge it with this.refresh?)
/**
 * Adjust the overlay dimensions and position
 */
WalkontableLeftOverlay.prototype.applyToDOM = function () {
  var total = this.instance.getSetting('totalColumns'),
    headerSize = this.instance.wtViewport.getRowHeaderWidth(),
    cloneHolder = this.clone.wtTable.holder,
    cloneHider = this.clone.wtTable.hider,
    masterHider = this.hider,
    cloneHolderParent = cloneHolder.parentNode,
    scrollbarWidth = Handsontable.Dom.getScrollbarWidth(true);

  masterHider.style.width = headerSize + this.sumCellSizes(0, total) + 'px';

  cloneHolder.style.width = parseInt(cloneHolderParent.style.width,10) + scrollbarWidth + 'px';

  cloneHider.style.height = masterHider.style.height;

  cloneHolder.style.height = cloneHolderParent.style.height;

  if (typeof this.instance.wtViewport.columnsRenderCalculator.startPosition === 'number'){
    this.spreader.style.left = this.instance.wtViewport.columnsRenderCalculator.startPosition + 'px';
  }
  else if (total === 0) {
    this.spreader.style.left = '0';
  } else {
    throw  new Error('Incorrect value of the columnsRenderCalculator');
  }
  this.spreader.style.right = '';

  this.syncOverlayOffset();
};

WalkontableLeftOverlay.prototype.syncOverlayOffset = function () {
  if (typeof this.instance.wtViewport.rowsRenderCalculator.startPosition === 'number'){
    this.clone.wtTable.spreader.style.top = this.instance.wtViewport.rowsRenderCalculator.startPosition + 'px';
  } else {
    this.clone.wtTable.spreader.style.top = '';
  }
};

/**
 * Scrolls horizontally to a column at the left edge of the viewport
 * @param sourceCol {Number}
 * @param beyondRendered {Boolean} if TRUE, scrolls according to the bottom edge (top edge is by default)
 */
WalkontableLeftOverlay.prototype.scrollTo = function (sourceCol, beyondRendered) {
  var newX = this.getTableParentOffset(),
    sourceInstance = this.instance.cloneSource ? this.instance.cloneSource : this.instance,
    mainHolder = sourceInstance.wtTable.holder,
    scrollbarCompensation = 0;

  if(beyondRendered && mainHolder.offsetWidth !== mainHolder.clientWidth) {
    scrollbarCompensation = Handsontable.Dom.getScrollbarWidth();
  }

  if (beyondRendered) {
    newX += this.sumCellSizes(0, sourceCol + 1);
    newX -= this.instance.wtViewport.getViewportWidth();
  }
  else {
    var fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');
    newX += this.sumCellSizes(fixedColumnsLeft, sourceCol);
  }

  newX += scrollbarCompensation;

  this.setScrollPosition(newX);
};

WalkontableLeftOverlay.prototype.getTableParentOffset = function () {
  if (this.trimmingContainer === window) {
    return this.instance.wtTable.holderOffset.left;
  }
  else {
    return 0;
  }
};
