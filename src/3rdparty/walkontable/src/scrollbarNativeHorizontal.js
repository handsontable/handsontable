function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.cellSize = 50;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableHorizontalScrollbarNative.prototype = new WalkontableOverlay();

//resetFixedPosition (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  var box;

	var fixedColumns = this.instance.getSetting('fixedColumnsLeft') > 0,
		fixedRows = this.instance.getSetting('fixedRowsTop') > 0,
		fixedElements = fixedColumns && fixedRows;


	if (this.scrollHandler === window) {

		elem.style.position = 'absolute';

		if(fixedElements){
			box = this.instance.wtTable.hider.getBoundingClientRect();

			var left = Math.ceil(box.left);

			elem.style.position = 'absolute';

			if (left < 0) {
				elem.style.left = -left + 'px';
			} else {
				elem.style.left = '0';
			}

		} else {
			elem.style.left = '0';
			elem.style.top = '0';
		}
  }
  else {

		if(fixedElements) {
			box = this.scrollHandler.getBoundingClientRect();
			elem.style.position = 'fixed';
    	elem.style.top = Math.ceil(box.top) + 'px';
    	elem.style.left = Math.ceil(box.left) + 'px';
		} else {
			elem.style.position = 'absolute';
			elem.style.top = '0';
			elem.style.left = '0';
		}
  }

  this.react();
};

//react on movement of the other dimension scrollbar (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.react = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
	var overlayContainer = this.clone.wtTable.holder.parentNode;

	if (this.instance.wtScrollbars.vertical.scrollHandler === window) {
		var box  = this.instance.wtTable.hider.getBoundingClientRect(),
			left = box.left;

		if (left < 0) {
			overlayContainer.style.left = - left + 'px';
		} else {
			overlayContainer.style.left = '0';
		}

		overlayContainer.style.position = 'absolute';
		overlayContainer.style.top = this.instance.wtTable.hider.style.top; //Math.ceil(box.top) + 'px';

		overlayContainer.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 'px';
	}
	else {
		this.clone.wtTable.holder.style.top = -(this.instance.wtScrollbars.vertical.windowScrollPosition - this.instance.wtScrollbars.vertical.measureBefore) + 'px';
		overlayContainer.style.height = this.instance.wtViewport.getWorkspaceHeight() + 'px'
	}

  overlayContainer.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px'; //4 is for the box shadow
};

WalkontableHorizontalScrollbarNative.prototype.prepare = function () {
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function (selectionsOnly) {
  this.measureBefore = 0;
  this.measureAfter = 0;
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  return Handsontable.Dom.getScrollLeft(this.scrollHandler);
};

WalkontableHorizontalScrollbarNative.prototype.setScrollPosition = function (pos) {
  if (this.scrollHandler === window){
    window.scrollTo(pos, Handsontable.Dom.getWindowScrollTop());
  } else {
    this.scrollHandler.scrollLeft = pos;
  }
};

WalkontableHorizontalScrollbarNative.prototype.onScroll = function () {
  WalkontableOverlay.prototype.onScroll.call(this);

  this.instance.getSetting('onScrollHorizontally');
};

WalkontableHorizontalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.wtTable.getLastVisibleColumn();
};

//applyToDOM (in future merge it with this.refresh?)
WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function () {
  this.fixedContainer.style.paddingLeft = this.measureBefore + 'px';
  this.fixedContainer.style.paddingRight = this.measureAfter + 'px';
};

WalkontableHorizontalScrollbarNative.prototype.scrollTo = function (cell) {
  this.setScrollPosition(this.tableParentOffset + cell * this.cellSize);
};

//readWindowSize (in future merge it with this.prepare?)
WalkontableHorizontalScrollbarNative.prototype.readWindowSize = function () {
  if (this.scrollHandler === window) {
    this.windowSize = document.documentElement.clientWidth;
    this.tableParentOffset = this.instance.wtTable.holderOffset.left;
  }
  else {
    this.windowSize = this.scrollHandler.clientWidth;
    this.tableParentOffset = 0;
  }
  this.windowScrollPosition = this.getScrollPosition();
};

//readSettings (in future merge it with this.prepare?)
WalkontableHorizontalScrollbarNative.prototype.readSettings = function () {
  this.readWindowSize();
  this.offset = this.instance.getSetting('offsetColumn');
  this.total = this.instance.getSetting('totalColumns');
};