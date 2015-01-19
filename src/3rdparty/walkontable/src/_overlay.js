/**
 * Creates an overlay over the original Walkontable instance. The overlay renders the clone of the original Walkontable
 * and (optionally) implements behavior needed for native horizontal and vertical scrolling
 */
function WalkontableOverlay() {}

/*
 Possible optimizations:
 [x] don't rerender if scroll delta is smaller than the fragment outside of the viewport
 [ ] move .style.top change before .draw()
 [ ] put .draw() in requestAnimationFrame
 [ ] don't rerender rows that remain visible after the scroll
 */

WalkontableOverlay.prototype.init = function () {
  this.TABLE = this.instance.wtTable.TABLE;
  this.fixed = this.instance.wtTable.hider;
  this.fixedContainer = this.instance.wtTable.holder;
  this.scrollHandler = this.getScrollableElement(this.TABLE);
};

WalkontableOverlay.prototype.makeClone = function (direction) {
  var clone = document.createElement('DIV');
  clone.className = 'ht_clone_' + direction + ' handsontable';
  clone.style.position = 'absolute';
  clone.style.top = 0;
  clone.style.left = 0;
  clone.style.overflow = 'hidden';

  var table2 = document.createElement('TABLE');
  table2.className = this.instance.wtTable.TABLE.className;
  clone.appendChild(table2);

  this.instance.wtTable.holder.parentNode.appendChild(clone);

  return new Walkontable({
    cloneSource: this.instance,
    cloneOverlay: this,
    table: table2
  });
};

WalkontableOverlay.prototype.getScrollableElement = function (TABLE) {
  var el = TABLE.parentNode;
  while (el && el.style) {
    if (el.style.overflow !== 'visible' && el.style.overflow !== '') {
      return el;
    }
    if (this instanceof WalkontableHorizontalScrollbarNative && el.style.overflowX !== 'visible' && el.style.overflowX !== '') {
      return el;
    }
    el = el.parentNode;
  }
  return window;
};

WalkontableOverlay.prototype.refresh = function (fastDraw) {
  if (this.clone) {
    this.clone.draw(fastDraw);
  }
};

WalkontableOverlay.prototype.destroy = function () {
  var eventManager = Handsontable.eventManager(this.clone);

  eventManager.clear();
};
