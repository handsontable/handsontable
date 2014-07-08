function WalkontableViewport(instance) {
  this.instance = instance;
  this.resetSettings();

  var that = this;
  $(window).on('resize.walkontable.' + this.instance.guid, function () {
    that.clientHeight = that.getWorkspaceHeight();
  });
}

//used by scrollbar
WalkontableViewport.prototype.getWorkspaceHeight = function (proposedHeight) {
  return this.instance.wtScrollbars.vertical.windowSize;
};

WalkontableViewport.prototype.getWorkspaceWidth = function (proposedWidth) {
  if (this.instance.wtScrollbars.horizontal.scrollHandler === window){
    return Math.min(document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  }

  return this.instance.wtScrollbars.horizontal.windowSize;

};

WalkontableViewport.prototype.getWorkspaceOffset = function () {
  return Handsontable.Dom.offset(this.instance.wtTable.TABLE);
};

WalkontableViewport.prototype.getWorkspaceActualHeight = function () {
  return Handsontable.Dom.outerHeight(this.instance.wtTable.TABLE);
};

WalkontableViewport.prototype.getWorkspaceActualWidth = function () {
  return Handsontable.Dom.outerWidth(this.instance.wtTable.TABLE) || Handsontable.Dom.outerWidth(this.instance.wtTable.TBODY) || Handsontable.Dom.outerWidth(this.instance.wtTable.THEAD); //IE8 reports 0 as <table> offsetWidth;
};

WalkontableViewport.prototype.getColumnHeaderHeight = function () {
  if (isNaN(this.columnHeaderHeight)) {
    var cellOffset = Handsontable.Dom.offset(this.instance.wtTable.TBODY)
      , tableOffset = this.instance.wtTable.tableOffset;
    this.columnHeaderHeight = cellOffset.top - tableOffset.top;
  }
  return this.columnHeaderHeight;
};

WalkontableViewport.prototype.getViewportHeight = function (proposedHeight) {
  var containerHeight = this.getWorkspaceHeight(proposedHeight);

  if (containerHeight === Infinity) {
    return containerHeight;
  }

  var columnHeaderHeight = this.getColumnHeaderHeight();
  if (columnHeaderHeight > 0) {
    containerHeight -= columnHeaderHeight;
  }

  return containerHeight;

};

WalkontableViewport.prototype.getRowHeaderWidth = function () {
  if (this.instance.cloneSource) {
    return this.instance.cloneSource.wtViewport.getRowHeaderWidth();
  }
  if (isNaN(this.rowHeaderWidth)) {
    var rowHeaders = this.instance.getSetting('rowHeaders');
    if (rowHeaders.length) {
      var TH = this.instance.wtTable.TABLE.querySelector('TH');
      this.rowHeaderWidth = 0;
      for (var i = 0, ilen = rowHeaders.length; i < ilen; i++) {
        if (TH) {
          this.rowHeaderWidth += Handsontable.Dom.outerWidth(TH);
          TH = TH.nextSibling;
        }
        else {
          this.rowHeaderWidth += 50; //yes this is a cheat but it worked like that before, just taking assumption from CSS instead of measuring. TODO: proper fix
        }
      }
    }
    else {
      this.rowHeaderWidth = 0;
    }
  }
  return this.rowHeaderWidth;
};

WalkontableViewport.prototype.getViewportWidth = function (proposedWidth) {
  var containerWidth = this.getWorkspaceWidth(proposedWidth);

  if (containerWidth === Infinity) {
    return containerWidth;
  }

  var rowHeaderWidth = this.getRowHeaderWidth();
  if (rowHeaderWidth > 0) {
    return containerWidth - rowHeaderWidth;
  }
  else {
    return containerWidth;
  }
};

WalkontableViewport.prototype.resetSettings = function () {
  this.rowHeaderWidth = NaN;
  this.columnHeaderHeight = NaN;
};