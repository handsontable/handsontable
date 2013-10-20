function WalkontableScrollbarNative() {
  this.lastWindowScrollPosition = NaN;
  this.maxOuts = 10; //max outs in one direction (before and after table)
  this.lastBegin = 0;
  this.lastEnd = 0;
}

/*
 Possible optimizations:
 [x] don't rerender if scroll delta is smaller than the fragment outside of the viewport
 [ ] move .style.top change before .draw()
 [ ] put .draw() in requestAnimationFrame
 [ ] don't rerender rows that remain visible after the scroll
 */

WalkontableScrollbarNative.prototype.init = function () {
  this.TABLE = this.instance.wtTable.TABLE;
  this.fixed = this.instance.wtTable.hider;
  this.fixedContainer = this.instance.wtTable.holder;
  this.fixed.style.position = 'absolute';
  this.fixed.style.left = '0';
  this.$scrollHandler = $(this.getScrollableElement(this.TABLE)); //in future remove jQuery from here



  this.readSettings();
};

///////////

WalkontableScrollbarNative.prototype.makeClone = function (direction) {
  if(this.instance.cloneFrom) {
    return;
  }

  var that = this;

  var clone = $('<div id="cln_' + direction + '" class="handsontable"></div>');
  this.instance.wtTable.holder.parentNode.appendChild(clone[0]);

  clone.css({
    position: 'fixed',
    overflow: 'hidden'
  });

  if (direction === 'top') {
    clone[0].style.height = '55px';
    clone[0].style.width = '384px';

  }
  else if (direction === 'left') {
    clone[0].style.height = '184px';
    clone[0].style.width = '55px';
  }

  var table2 = $('<table class="htCore"></table>');
  table2.className = this.instance.wtTable.TABLE.className;
  clone.append(table2);

  var walkontableConfig = {};
  walkontableConfig.cloneFrom = this.instance;
  walkontableConfig.cloneDirection = direction;
  walkontableConfig.table = table2[0];
  var wt = new Walkontable(walkontableConfig);

  var cloneTable = clone.find('table')[0];
  var scrollable = wt.wtScrollbars.vertical.$scrollHandler[0];

  //resetFixedPosition(clone[0]);

  this.$scrollHandler.on('scroll', function () {
    if (direction === 'top') {
      cloneTable.style.left = 0 - scrollable.scrollLeft + 'px';
    }
    else {
      cloneTable.style.top = 0 - scrollable.scrollTop + 'px';
    }
  });

  $(window).on('load', function () {
    resetFixedPosition(clone[0]);
  });
  $(window).on('scroll', function () {
    resetFixedPosition(clone[0]);
  });
  $(window).on('resize', function () {
    resetFixedPosition(clone[0]);
  });
  $(document).on('ready', function () {
    resetFixedPosition(clone[0]);
  });


  function resetFixedPosition(elem) {
    var box = that.instance.wtTable.holder.getBoundingClientRect();
    elem.style.top = box.top + that.instance.wtScrollbars.vertical.getScrollPosition() + 'px';
    elem.style.left = box.left + that.instance.wtScrollbars.horizontal.getScrollPosition() + 'px';
    console.log("wch2", that.instance.wtScrollbars.vertical.getScrollPosition(), that.instance.wtScrollbars.horizontal.getScrollPosition());
  }

  return wt;
};

WalkontableScrollbarNative.prototype.getScrollableElement = function (TABLE) {
  var el = TABLE.parentNode;
  while (el && el.style) {
    if (el.style.overflow === 'scroll') {
      return el;
    }
    el = el.parentNode;
  }
  return window;
};

WalkontableScrollbarNative.prototype.prepare = function () {
};

WalkontableScrollbarNative.prototype.availableSize = function () {
  var availableSize;

  if (this.windowScrollPosition > this.tableParentOffset /*&& last > -1*/) { //last -1 means that viewport is scrolled behind the table
    if (this.instance.wtTable.getLastVisibleRow() === this.total - 1) {
      availableSize = this.instance.wtDom.outerHeight(this.TABLE);
    }
    else {
      availableSize = this.windowSize;
    }
  }
  else {
    availableSize = this.windowSize - (this.tableParentOffset);
  }

  return availableSize;
};

WalkontableScrollbarNative.prototype.refresh = function () {
  var last = this.getLastCell();
  this.measureBefore = this.sumCellSizes(0, this.offset);
  if (last === -1) { //last -1 means that viewport is scrolled behind the table
    this.measureAfter = 0;
  }
  else {
    this.measureAfter = this.sumCellSizes(last, this.total - last);
  }
  this.applyToDOM();
  this.clone && this.clone.draw(!this.instance.forceFullRender);
};

WalkontableScrollbarNative.prototype.destroy = function () {
  this.$scrollHandler.off('scroll.walkontable');
};