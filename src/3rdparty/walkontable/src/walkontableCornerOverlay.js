function WalkontableCornerOverlay(instance) {
  this.instance = instance;
  this.type = 'corner';
  this.init();
  this.clone = this.makeClone('corner');
}

WalkontableCornerOverlay.prototype = new WalkontableOverlay();

WalkontableCornerOverlay.prototype.resetFixedPosition = function () {
  if (!this.instance.wtTable.holder.parentNode) {
    return; //removed from DOM
  }
  var elem = this.clone.wtTable.holder.parentNode,
    finalLeft,
    finalTop;

  if (this.trimmingContainer === window) {
    var box = this.instance.wtTable.hider.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var left = Math.ceil(box.left);
    var bottom = Math.ceil(box.bottom);
    var right = Math.ceil(box.right);

    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }

    if (top < 0 && (bottom - elem.offsetHeight) > 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }

    Handsontable.Dom.setOverlayPosition(elem, finalLeft, finalTop);
  }


  var tableHeight = Handsontable.Dom.outerHeight(this.clone.wtTable.TABLE);
  var tableWidth = Handsontable.Dom.outerWidth(this.clone.wtTable.TABLE);
  elem.style.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
  elem.style.width = (tableWidth === 0 ? tableWidth : tableWidth + 4) + 'px';
};
