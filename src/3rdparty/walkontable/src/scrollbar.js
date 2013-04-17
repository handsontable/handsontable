function WalkontableScrollbar(instance, type) {
  var that = this;

  //reference to instance
  this.instance = instance;
  this.type = type;
  this.$table = $(this.instance.wtTable.TABLE);

  //create elements
  this.slider = document.createElement('DIV');
  this.sliderStyle = this.slider.style;
  this.sliderStyle.position = 'absolute';
  this.sliderStyle.top = '0';
  this.sliderStyle.left = '0';
  this.sliderStyle.display = 'none';
  this.slider.className = 'dragdealer ' + type;

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
    vertical: (type === 'vertical'),
    horizontal: (type === 'horizontal'),
    slide: false,
    speed: 100,
    animationCallback: function (x, y) {
      if (firstRun) {
        firstRun = false;
        return;
      }
      that.skipRefresh = true;
      dragDelta = type === 'vertical' ? y : x;
      if (that.dragTimeout === null) {
        that.dragTimeout = setInterval(dragRender, 100);
        dragRender();
      }
    },
    callback: function (x, y) {
      that.skipRefresh = false;
      clearInterval(that.dragTimeout);
      that.dragTimeout = null;
      dragDelta = type === 'vertical' ? y : x;
      that.onScroll(dragDelta);
    }
  });
  that.skipRefresh = false;
}

WalkontableScrollbar.prototype.onScroll = function (delta) {
  if (this.instance.drawn) {
    var keys = this.type === 'vertical' ? ['offsetRow', 'totalRows', 'countVisibleRows', 'top', 'height'] : ['offsetColumn', 'totalColumns', 'countVisibleColumns', 'left', 'width'];
    var total = this.instance.getSetting(keys[1]);
    var display = this.instance.wtTable[keys[2]]();
    if (total > display) {
      var newOffset = Math.round(parseInt(this.handleStyle[keys[3]], 10) * total / parseInt(this.slider.style[keys[4]], 10)); //offset = handlePos * totalRows / offsetRows

      if (delta === 1) {
        if (this.type === 'vertical') {
          this.instance.scrollVertical(Infinity).draw();
        }
        else {
          this.instance.scrollHorizontal(Infinity).draw();
        }
      }
      else if (newOffset !== this.instance.getSetting(keys[0])) { //is new offset different than old offset
        if (this.type === 'vertical') {
          this.instance.scrollVertical(newOffset - this.instance.getSetting(keys[0])).draw();
        }
        else {
          this.instance.scrollHorizontal(newOffset - this.instance.getSetting(keys[0])).draw();
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
  var ratio
    , scroll;

  if (this.type === 'vertical') {
    ratio = this.getHandleSizeRatio(this.instance.wtTable.countVisibleRows(), this.instance.getSetting('totalRows'));
    scroll = this.instance.getSetting('scrollV');

  }
  else {
    ratio = this.getHandleSizeRatio(this.instance.wtTable.countVisibleColumns(), this.instance.getSetting('totalColumns'));
    scroll = this.instance.getSetting('scrollH');
  }

  if (((ratio === 1 || isNaN(ratio)) && scroll === 'auto') || scroll === 'none') {
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
    , offsetCount
    , totalCount
    , visibleCount
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
    offsetCount = this.instance.getSetting('offsetRow');
    totalCount = this.instance.getSetting('totalRows');
    visibleCount = this.instance.wtTable.countVisibleRows();
    if (this.instance.wtTable.isLastRowIncomplete()) {
      visibleCount--;
    }
    ratio = this.getHandleSizeRatio(visibleCount, totalCount);

    sliderSize = tableHeight - 2; //2 is sliders border-width

    this.sliderStyle.top = this.$table.position().top + 'px';
    this.sliderStyle.left = tableWidth - 1 + 'px'; //1 is sliders border-width
    this.sliderStyle.height = sliderSize + 'px';
  }
  else { //horizontal
    offsetCount = this.instance.getSetting('offsetColumn');
    totalCount = this.instance.getSetting('totalColumns');
    visibleCount = this.instance.wtTable.countVisibleColumns();
    if (this.instance.wtTable.isLastColumnIncomplete()) {
      visibleCount--;
    }
    ratio = this.getHandleSizeRatio(visibleCount, totalCount);

    sliderSize = tableWidth - 2; //2 is sliders border-width

    this.sliderStyle.left = this.$table.position().left + 'px';
    this.sliderStyle.top = tableHeight - 1 + 'px'; //1 is sliders border-width
    this.sliderStyle.width = sliderSize + 'px';
  }

  handleSize = Math.round(sliderSize * ratio);
  if (handleSize < 10) {
    handleSize = 15;
  }

  handlePosition = Math.floor(sliderSize * (offsetCount / totalCount));
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

  this.dragdealer.setWrapperOffset();
  this.dragdealer.setBounds();
};