function WalkontableTopOverlay(instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.init();
  this.clone = this.makeClone('top');
}

WalkontableTopOverlay.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableTopOverlay.prototype.resetFixedPosition = function () {
  var finalLeft, finalTop;

  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode,
    scrollbarWidth = this.instance.wtTable.holder.clientWidth !== this.instance.wtTable.holder.offsetWidth ? Handsontable.Dom.getScrollbarWidth() : 0;

  if (this.instance.wtOverlays.leftOverlay.trimmingContainer !== window) {
    elem.style.width = this.instance.wtViewport.getWorkspaceWidth() - scrollbarWidth + 'px';
  } else {
    var box = this.instance.wtTable.hider.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var bottom = Math.ceil(box.bottom);

    finalLeft = this.instance.wtTable.hider.style.left;
    finalLeft = finalLeft === "" ? 0 : finalLeft;

    if (top < 0 && (bottom - elem.offsetHeight) > 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }

    Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);
  }

  this.clone.wtTable.holder.style.width = elem.style.width;

  var tableHeight = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE);
  elem.style.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
};

WalkontableTopOverlay.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollTop(this.mainTableScrollableElement);
};

WalkontableTopOverlay.prototype.setScrollPosition = function (pos) {
  if (this.mainTableScrollableElement === window){
    window.scrollTo(Handsontable.Dom.getWindowScrollLeft(), pos);
  } else {
    this.mainTableScrollableElement.scrollTop = pos;
  }
};

WalkontableTopOverlay.prototype.onScroll = function () {
  this.instance.getSetting('onScrollVertically');
};

WalkontableTopOverlay.prototype.sumCellSizes = function (from, length) {
  var sum = 0;
  while (from < length) {
    sum += this.instance.wtTable.getRowHeight(from) || this.instance.wtSettings.settings.defaultRowHeight; //TODO optimize getSetting, because this is MUCH faster then getSetting
    from++;
  }
  return sum;
};

WalkontableTopOverlay.prototype.refresh = function (fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableTopOverlay.prototype.applyToDOM = function () {
  var total = this.instance.getSetting('totalRows');
  var headerSize = this.instance.wtViewport.getColumnHeaderHeight();
  var scrollbarWidth = Handsontable.Dom.getScrollbarWidth(true);

  var totalEstimatedHeight = headerSize + this.sumCellSizes(0, total) + 1 +  'px';

  this.hider.style.height = totalEstimatedHeight;

  this.clone.wtTable.hider.style.width = this.hider.style.width;

  this.clone.wtTable.holder.style.width = this.clone.wtTable.holder.parentNode.style.width;

  this.clone.wtTable.holder.style.height = parseInt(this.clone.wtTable.holder.parentNode.style.height,10) + scrollbarWidth + 'px';

  if (typeof this.instance.wtViewport.rowsRenderCalculator.startPosition === 'number') {
    this.spreader.style.top = this.instance.wtViewport.rowsRenderCalculator.startPosition + 'px';
  }
  else if (total === 0) {
    this.spreader.style.top = '0'; //can happen if there are 0 rows
  }
  else {
    throw new Error("Incorrect value of the rowsRenderCalculator");
  }
  this.spreader.style.bottom = '';

  this.syncOverlayOffset();
};

WalkontableTopOverlay.prototype.syncOverlayOffset = function () {
  if (typeof this.instance.wtViewport.columnsRenderCalculator.startPosition === 'number'){
    this.clone.wtTable.spreader.style.left = this.instance.wtViewport.columnsRenderCalculator.startPosition + 'px';
  } else {
    this.clone.wtTable.spreader.style.left = '';
  }
};

/**
 * Scrolls vertically to a row
 *
 * @param sourceRow {Number}
 * @param bottomEdge {Boolean} if TRUE, scrolls according to the bottom edge (top edge is by default)
 */
WalkontableTopOverlay.prototype.scrollTo = function (sourceRow, bottomEdge) {
  var newY = this.getTableParentOffset(),
    sourceInstance = this.instance.cloneSource ? this.instance.cloneSource : this.instance,
    mainHolder = sourceInstance.wtTable.holder,
    scrollbarCompensation = 0;

  if(bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
    scrollbarCompensation = Handsontable.Dom.getScrollbarWidth();
  }

  if (bottomEdge) {
    newY += this.sumCellSizes(0, sourceRow + 1);
    newY -= this.instance.wtViewport.getViewportHeight();
    // Fix 1 pixel offset when cell is selected
    newY += 1;
  }
  else {
    var fixedRowsTop = this.instance.getSetting('fixedRowsTop');
    newY += this.sumCellSizes(fixedRowsTop, sourceRow);
  }

  newY += scrollbarCompensation;

  this.setScrollPosition(newY);
};

WalkontableTopOverlay.prototype.getTableParentOffset = function () {
  if (this.mainTableScrollableElement === window) {
    return this.instance.wtTable.holderOffset.top;
  }
  else {
    return 0;
  }
};
