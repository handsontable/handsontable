function WalkontableScrollbar() {
}

WalkontableScrollbar.prototype.init = function () {
  var that = this;

  //reference to instance
  this.$table = $(this.instance.wtTable.TABLE);

  //create elements
  this.slider = document.createElement('DIV');
  this.sliderStyle = this.slider.style;
  this.sliderStyle.position = 'absolute';
  this.sliderStyle.top = '0';
  this.sliderStyle.left = '0';
  this.sliderStyle.display = 'none';
  this.slider.className = 'dragdealer ' + this.type;

  this.handle = document.createElement('DIV');
  this.handleStyle = this.handle.style;
  this.handle.className = 'handle';

  this.slider.appendChild(this.handle);
  this.instance.wtTable.parent.appendChild(this.slider);

  var firstRun = true;
  this.dragTimeout = null;
  var dragDelta;
  var dragRender = function () {
    that.onScroll(dragDelta);
  };

  this.dragdealer = new Dragdealer(this.slider, {
    vertical: (this.type === 'vertical'),
    horizontal: (this.type === 'horizontal'),
    slide: false,
    speed: 100,
    animationCallback: function (x, y) {
      if (firstRun) {
        firstRun = false;
        return;
      }
      that.skipRefresh = true;
      dragDelta = that.type === 'vertical' ? y : x;
      if (that.dragTimeout === null) {
        that.dragTimeout = setInterval(dragRender, 100);
        dragRender();
      }
    },
    callback: function (x, y) {
      that.skipRefresh = false;
      clearInterval(that.dragTimeout);
      that.dragTimeout = null;
      dragDelta = that.type === 'vertical' ? y : x;
      that.onScroll(dragDelta);
    }
  });
  this.skipRefresh = false;
};

WalkontableScrollbar.prototype.onScroll = function (delta) {
  if (this.instance.drawn) {
    this.readSettings();
    if (this.total > this.visibleCount) {
      var newOffset = Math.round(this.handlePosition * this.total / this.sliderSize);

      if (delta === 1) {
        if (this.type === 'vertical') {
          this.instance.scrollVertical(Infinity).draw();
        }
        else {
          this.instance.scrollHorizontal(Infinity).draw();
        }
      }
      else if (newOffset !== this.offset) { //is new offset different than old offset
        if (this.type === 'vertical') {
          this.instance.scrollVertical(newOffset - this.offset).draw();
        }
        else {
          this.instance.scrollHorizontal(newOffset - this.offset).draw();
        }
      }
      else {
        this.refresh();
      }
    }
  }
};

/**
 * Returns what part of the scroller should the handle take
 * @param viewportCount {Number} number of visible rows or columns
 * @param totalCount {Number} total number of rows or columns
 * @return {Number} 0..1
 */
WalkontableScrollbar.prototype.getHandleSizeRatio = function (viewportCount, totalCount) {
  if (!totalCount || viewportCount > totalCount) {
    return 1;
  }
  return viewportCount / totalCount;
};

WalkontableScrollbar.prototype.prepare = function () {
  if (this.skipRefresh) {
    return;
  }
  var ratio = this.getHandleSizeRatio(this.visibleCount, this.total);
  if (((ratio === 1 || isNaN(ratio)) && this.scrollMode === 'auto') || this.scrollMode === 'none') {
    //isNaN is needed because ratio equals NaN when totalRows/totalColumns equals 0
    this.visible = false;
  }
  else {
    this.visible = true;
  }
};

WalkontableScrollbar.prototype.refresh = function () {
  if (this.skipRefresh) {
    return;
  }
  else if (!this.visible) {
    this.sliderStyle.display = 'none';
    return;
  }

  var ratio
    , sliderSize
    , handleSize
    , handlePosition
    , visibleCount = this.visibleCount
    , tableOuterWidth = this.$table.outerWidth()
    , tableOuterHeight = this.$table.outerHeight()
    , tableWidth = this.instance.hasSetting('width') ? this.instance.getSetting('width') : tableOuterWidth
    , tableHeight = this.instance.hasSetting('height') ? this.instance.getSetting('height') : tableOuterHeight;

  if (!tableWidth) {
    //throw new Error("I could not compute table width. Is the <table> element attached to the DOM?");
    return;
  }
  if (!tableHeight) {
    //throw new Error("I could not compute table height. Is the <table> element attached to the DOM?");
    return;
  }

  if (this.instance.hasSetting('width') && this.instance.wtScroll.wtScrollbarV.visible) {
    tableWidth -= this.instance.getSetting('scrollbarWidth');
  }
  if (tableWidth > tableOuterWidth + this.instance.getSetting('scrollbarWidth')) {
    tableWidth = tableOuterWidth;
  }

  if (this.instance.hasSetting('height') && this.instance.wtScroll.wtScrollbarH.visible) {
    tableHeight -= this.instance.getSetting('scrollbarHeight');
  }
  if (tableHeight > tableOuterHeight + this.instance.getSetting('scrollbarHeight')) {
    tableHeight = tableOuterHeight;
  }

  if (this.type === 'vertical') {
    if (this.instance.wtTable.isLastRowIncomplete()) {
      visibleCount--;
    }

    sliderSize = tableHeight - 2; //2 is sliders border-width

    this.sliderStyle.top = this.$table.position().top + 'px';
    this.sliderStyle.left = tableWidth - 1 + 'px'; //1 is sliders border-width
    this.sliderStyle.height = sliderSize + 'px';
  }
  else { //horizontal
    if (this.instance.wtTable.isLastColumnIncomplete()) {
      visibleCount--;
    }

    sliderSize = tableWidth - 2; //2 is sliders border-width

    this.sliderStyle.left = this.$table.position().left + 'px';
    this.sliderStyle.top = tableHeight - 1 + 'px'; //1 is sliders border-width
    this.sliderStyle.width = sliderSize + 'px';
  }

  ratio = this.getHandleSizeRatio(visibleCount, this.total);
  handleSize = Math.round(sliderSize * ratio);
  if (handleSize < 10) {
    handleSize = 15;
  }

  handlePosition = Math.floor(sliderSize * (this.offset / this.total));
  if (handleSize + handlePosition > sliderSize) {
    handlePosition = sliderSize - handleSize;
  }

  if (this.type === 'vertical') {
    this.handleStyle.height = handleSize + 'px';
    this.handleStyle.top = handlePosition + 'px';

  }
  else { //horizontal
    this.handleStyle.width = handleSize + 'px';
    this.handleStyle.left = handlePosition + 'px';
  }

  this.sliderStyle.display = 'block';
};

///

var WalkontableVerticalScrollbar = function (instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.init();
};

WalkontableVerticalScrollbar.prototype = new WalkontableScrollbar();

WalkontableVerticalScrollbar.prototype.readSettings = function () {
  this.scrollMode = this.instance.getSetting('scrollV');
  this.offset = this.instance.getSetting('offsetRow');
  this.total = this.instance.getSetting('totalRows');
  this.visibleCount = this.instance.wtTable.countVisibleRows();
  this.handlePosition = parseInt(this.handleStyle.top, 10);
  this.sliderSize = parseInt(this.sliderStyle.height, 10);
  this.fixedCount = this.instance.getSetting('fixedRowsTop');
};

///

var WalkontableHorizontalScrollbar = function (instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.init();
};

WalkontableHorizontalScrollbar.prototype = new WalkontableScrollbar();

WalkontableHorizontalScrollbar.prototype.readSettings = function () {
  this.scrollMode = this.instance.getSetting('scrollH');
  this.offset = this.instance.getSetting('offsetColumn');
  this.total = this.instance.getSetting('totalColumns');
  this.visibleCount = this.instance.wtTable.countVisibleColumns();
  this.handlePosition = parseInt(this.handleStyle.left, 10);
  this.sliderSize = parseInt(this.sliderStyle.width, 10);
  this.fixedCount = this.instance.getSetting('fixedColumnsLeft');
};