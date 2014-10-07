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

    if (left < 0) {
      elem.style.left = -left + 'px';
    } else {
      elem.style.left = '0';
    }

    if (top < 0) {
      elem.style.top = -top + "px";
    } else {
      elem.style.top = "0";
    }
  }
  else {
    elem.style.top = this.instance.wtScrollbars.vertical.getScrollPosition() + "px";
    elem.style.left = this.instance.wtScrollbars.horizontal.getScrollPosition() + "px";
  }

  elem.style.width = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';
  elem.style.height = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE) + 4 + 'px';
};