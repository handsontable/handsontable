function WalkontableCornerScrollbarNative(instance) {
  this.instance = instance;
  this.init();
  this.clone = this.makeClone('corner');
}

WalkontableCornerScrollbarNative.prototype = new WalkontableScrollbarNative();

WalkontableCornerScrollbarNative.prototype.makeClone = function (direction) {
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

  var table2 = $('<table class="htCore"></table>');
  table2.className = this.instance.wtTable.TABLE.className;
  clone.append(table2);

  var walkontableConfig = {};
  walkontableConfig.cloneFrom = this.instance;
  walkontableConfig.cloneDirection = direction;
  walkontableConfig.table = table2[0];
  var wt = new Walkontable(walkontableConfig);

  var scrollable = that.scrollHandler;

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
      var top = Math.ceil(box.top, 10);
      var bottom = Math.ceil(box.bottom, 10);

      if (top < 0 && bottom > 0) {
        elem.style.top = '0';
        elem.style.left = '0';
      }
      else {
        elem.style.top = top + 'px';
        elem.style.left = left + 'px';
      }
    }
    else {
      box = that.scrollHandler.getBoundingClientRect();
      elem.style.top = Math.ceil(box.top, 10) + 'px';
      elem.style.left = Math.ceil(box.left, 10) + 'px';
    }

    clone[0].style.width = WalkontableDom.prototype.outerWidth(wt.wtTable.TABLE) + 4 + 'px';
    clone[0].style.height = WalkontableDom.prototype.outerHeight(wt.wtTable.TABLE) + 4 + 'px';
  }

  return wt;
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

WalkontableCornerScrollbarNative.prototype.getTableSize = function () {
};

WalkontableCornerScrollbarNative.prototype.applyToDOM = function () {
};

WalkontableCornerScrollbarNative.prototype.scrollTo = function () {
};

WalkontableCornerScrollbarNative.prototype.readWindowSize = function () {
};

WalkontableCornerScrollbarNative.prototype.readSettings = function () {
};