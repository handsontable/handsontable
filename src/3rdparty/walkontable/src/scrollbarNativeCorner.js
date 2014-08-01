function WalkontableCornerScrollbarNative(instance) {
  this.instance = instance;
  this.init();
  this.clone = this.makeClone('corner');
}

WalkontableCornerScrollbarNative.prototype = new WalkontableOverlay();

WalkontableCornerScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

	var box = this.instance.wtTable.hider.getBoundingClientRect();

	var fixedColumns = this.instance.getSetting('fixedColumnsLeft') > 0,
		fixedRows = this.instance.getSetting('fixedRowsTop') > 0,
		fixedElements = fixedColumns && fixedRows;


  if (this.scrollHandler === window) {

		if(fixedElements){

			var top = Math.ceil(box.top);
			var left = Math.ceil(box.left);

			if (left < 0) {
				elem.style.left = -left + 'px';
			} else {
				elem.style.left = '0';
			}

			if (top < 0) {
				elem.style.top = this.instance.wtTable.hider.style.top
			} else {
				elem.style.top = '0';
			}

		} else {
			elem.style.left = '0';
			elem.style.top = '0';
		}
  }
  else {

		if(fixedElements){
			var hider = this.scrollHandler.getBoundingClientRect();
			elem.style.top = this.instance.wtTable.hider.style.top;
			elem.style.left =  Math.ceil(hider.left) - Math.ceil(box.left) + 'px';
		} else {
			elem.style.top = '0';
			elem.style.left = '0';
		}

  }

  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';
  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';
};

WalkontableCornerScrollbarNative.prototype.prepare = function () {
};

WalkontableCornerScrollbarNative.prototype.refresh = function (selectionsOnly) {
  this.measureBefore = 0;
  this.measureAfter = 0;
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableCornerScrollbarNative.prototype.getScrollPosition = function () {
};

WalkontableCornerScrollbarNative.prototype.getLastCell = function () {
};

WalkontableCornerScrollbarNative.prototype.applyToDOM = function () {
};

WalkontableCornerScrollbarNative.prototype.scrollTo = function () {
};

WalkontableCornerScrollbarNative.prototype.readWindowSize = function () {
};

WalkontableCornerScrollbarNative.prototype.readSettings = function () {
};