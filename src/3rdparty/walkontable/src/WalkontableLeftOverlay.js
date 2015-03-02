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
  var elem = this.clone.wtTable.holder.parentNode;

  if (this.mainTableScrollableElement === window) {

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

  //Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);

  elem.style.height = this.instance.wtViewport.getWorkspaceHeight() - Handsontable.Dom.getScrollbarWidth() + 'px';
  //TODO: Remove after refactoring
  //elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 'px';

  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';// + 4 + 'px';
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
  var total = this.instance.getSetting('totalColumns');
  var headerSize = this.instance.wtViewport.getRowHeaderWidth();


  //debugger;
  this.hider.style.width = headerSize + this.sumCellSizes(0, total) + 'px';// + 4 + 'px';
  this.clone.wtTable.holder.style.width = parseInt(this.holder.style.width,10) + Handsontable.Dom.getScrollbarWidth() + 'px';

  this.clone.wtTable.hider.style.height = this.hider.style.height;
  this.clone.wtTable.holder.style.height = this.clone.wtTable.holder.parentNode.style.height;


  //TODO: Remove after refactoring
  //this.holder.style.width = headerSize + this.sumCellSizes(0, total) + 'px';// + 4 + 'px';

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

WalkontableLeftOverlay.prototype.getTableParentOffset = function () {
  if (this.trimmingContainer === window) {
    return this.instance.wtTable.holderOffset.left;
  }
  else {
    return 0;
  }
};
