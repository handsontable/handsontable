function WalkontableCornerScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'corner';
  this.init();
  this.clone = this.makeClone('corner');
}

WalkontableCornerScrollbarNative.prototype = new WalkontableOverlay();

WalkontableCornerScrollbarNative.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode;

  if (this.scrollHandler === window) {
    var box = this.instance.wtTable.holder.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var left = Math.ceil(box.left);
    var finalLeft
      , finalTop;

    if (left < 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }

    if (top < 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }
  }
  else {
    finalLeft = this.instance.wtScrollbars.horizontal.getScrollPosition() + "px";
    finalTop = this.instance.wtScrollbars.vertical.getScrollPosition() + "px";
  }

  Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);

  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';
  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';
};
