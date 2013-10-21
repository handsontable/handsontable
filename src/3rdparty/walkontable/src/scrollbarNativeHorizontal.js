function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.cellSize = 50;
  this.init();
  this.clone = this.makeClone('left');
}

WalkontableHorizontalScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableHorizontalScrollbarNative.prototype.makeClone = function (direction) {
  if (this.instance.cloneFrom) {
    return;
  }

  var that = this;

  var clone = $('<div id="cln_' + direction + '" class="handsontable"></div>');
  this.instance.wtTable.holder.parentNode.appendChild(clone[0]);

  clone.css({
    position: 'fixed',
    overflow: 'hidden'
  });

  clone[0].style.height = '184px';
  clone[0].style.width = '55px';

  var table2 = $('<table class="htCore"></table>');
  table2.className = this.instance.wtTable.TABLE.className;
  clone.append(table2);

  var walkontableConfig = {};
  walkontableConfig.cloneFrom = this.instance;
  walkontableConfig.cloneDirection = direction;
  walkontableConfig.table = table2[0];
  var wt = new Walkontable(walkontableConfig);

  var cloneTable = clone.find('table')[0];
  var scrollable = that.scrollHandler;

  //resetFixedPosition(clone[0]);

  this.$scrollHandler.on('scroll.' + this.instance.guid, function () {
    cloneTable.style.top = that.instance.wtScrollbars.vertical.measureBefore - scrollable.scrollTop + 'px';
  });

  $(window).on('load.' + this.instance.guid, function () {
    resetFixedPosition(clone[0]);
  });
  $(window).on('scroll.' + this.instance.guid, function () {
    resetFixedPosition(clone[0]);
  });
  $(window).on('resize.' + this.instance.guid, function () {
    resetFixedPosition(clone[0]);
  });
  $(document).on('ready.' + this.instance.guid, function () {
    resetFixedPosition(clone[0]);
  });

  function resetFixedPosition(elem) {
    if (!that.instance.wtTable.holder.parentNode) {
      return; //removed from DOM
    }

    var box;
    if (scrollable === window) {
      box = that.instance.wtTable.holder.getBoundingClientRect();
      var left = Math.ceil(box.left, 10);
      var right = Math.ceil(box.right, 10);

      if (left < 0 && right > 0) {
        elem.style.left = '0';
      }
      else {
        elem.style.left = left + 'px';
      }
    }
    else {
      box = that.scrollHandler.getBoundingClientRect();
      elem.style.top = Math.ceil(box.top, 10) + 'px';
      elem.style.left = Math.ceil(box.left, 10) + 'px';
    }
  }

  return wt;
};

WalkontableHorizontalScrollbarNative.prototype.prepare = function () {
};

WalkontableHorizontalScrollbarNative.prototype.refresh = function (selectionsOnly) {
  this.measureBefore = 0;
  this.measureAfter = 0;
  this.clone && this.clone.draw(selectionsOnly);
};

WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function () {
  if (this.scrollHandler === window) {
    return this.scrollHandler.scrollX;
  }
  else {
    return this.scrollHandler.scrollLeft;
  }
};

WalkontableHorizontalScrollbarNative.prototype.getLastCell = function () {
  return this.instance.wtTable.getLastVisibleColumn();
};

WalkontableHorizontalScrollbarNative.prototype.getTableSize = function () {
  return this.instance.wtDom.outerWidth(this.TABLE);
};

WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function () {
  this.fixedContainer.style.paddingLeft = this.measureBefore + 'px';
  this.fixedContainer.style.paddingRight = this.measureAfter + 'px';
};

WalkontableHorizontalScrollbarNative.prototype.scrollTo = function (cell) {
  this.$scrollHandler.scrollLeft(this.tableParentOffset + cell * this.cellSize);
};

WalkontableHorizontalScrollbarNative.prototype.readWindowSize = function () {
  if (this.scrollHandler === window) {
    this.windowSize = document.documentElement.clientWidth;
    this.tableParentOffset = this.instance.wtTable.holderOffset.left;
  }
  else {
    this.windowSize = WalkontableDom.prototype.outerWidth(this.scrollHandler);
    this.tableParentOffset = 0;
  }
};

WalkontableHorizontalScrollbarNative.prototype.readSettings = function () {
  this.windowScrollPosition = this.getScrollPosition();
  this.offset = this.instance.getSetting('offsetColumn');
  this.total = this.instance.getSetting('totalColumns');
};