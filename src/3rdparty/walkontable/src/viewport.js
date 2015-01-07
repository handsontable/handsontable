function WalkontableViewport(instance) {
  this.instance = instance;
  this.oversizedRows = [];
  this.oversizedCols = [];

  var that = this;

  var eventManager = Handsontable.eventManager(instance);
  eventManager.addEventListener(window,'resize',function () {
    that.clientHeight = that.getWorkspaceHeight();
  });
}

WalkontableViewport.prototype.getWorkspaceHeight = function () {
  var scrollHandler = this.instance.wtScrollbars.vertical.scrollHandler;
  if (scrollHandler === window) {
    return document.documentElement.clientHeight;
  }
  else {
    var elemHeight = Handsontable.Dom.outerHeight(scrollHandler);
    var height = (elemHeight > 0 && scrollHandler.clientHeight > 0) ? scrollHandler.clientHeight : Infinity; //returns height without DIV scrollbar
    return height;
  }
};

WalkontableViewport.prototype.getWorkspaceWidth = function () {
  var width;

  if(Handsontable.freezeOverlays) {
    width = Math.min(document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  } else {
    width = Math.min(this.getContainerFillWidth(), document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  }

  var scrollHandler = this.instance.wtScrollbars.horizontal.scrollHandler;
  if (scrollHandler != window) {
    var overflow = this.instance.wtScrollbars.horizontal.scrollHandler.style.overflow;
    if (overflow == "scroll" || overflow == "hidden" || overflow == "auto") {
      return Math.max(width, scrollHandler.clientWidth);
    }
  }
  return Math.max(width, Handsontable.Dom.outerWidth(this.instance.wtTable.TABLE));
};

WalkontableViewport.prototype.getContainerFillWidth = function() {

  if(this.containerWidth) {
    return this.containerWidth;
  }

  var mainContainer = this.instance.wtTable.holder,
      fillWidth,
      dummyElement;

  while(mainContainer.parentNode != document.body && mainContainer.parentNode != null && mainContainer.className.indexOf('handsontable') === -1) {
    mainContainer = mainContainer.parentNode;
  }

  dummyElement = document.createElement("DIV");
  dummyElement.style.width = "100%";
  dummyElement.style.height = "1px";
  mainContainer.appendChild(dummyElement);
  fillWidth = dummyElement.offsetWidth;

  this.containerWidth = fillWidth;

  mainContainer.removeChild(dummyElement);

  return fillWidth;
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
    this.columnHeaderHeight = Handsontable.Dom.outerHeight(this.instance.wtTable.THEAD);
  }
  return this.columnHeaderHeight;
};

WalkontableViewport.prototype.getViewportHeight = function () {

  var containerHeight = this.getWorkspaceHeight();

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

// Viewport width = Workspace width - Row Headers width
WalkontableViewport.prototype.getViewportWidth = function () {
  var containerWidth = this.getWorkspaceWidth();

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

/**
 * Creates:
 *  - rowsRenderCalculator (before draw, to qualify rows for rendering)
 *  - rowsVisibleCalculator (after draw, to measure which rows are actually visible)
 * @returns {WalkontableViewportRowsCalculator}
 */
WalkontableViewport.prototype.createRowsCalculator = function (visible) {
  this.rowHeaderWidth = NaN;

  var height;
  if (this.instance.wtSettings.settings.renderAllRows) {
    height = Infinity;
  }
  else {
    height = this.getViewportHeight();
  }

  var pos = this.instance.wtScrollbars.vertical.getScrollPosition() - this.instance.wtScrollbars.vertical.getTableParentOffset();
  if (pos < 0) {
    pos = 0;
  }

  var that = this;
  return new WalkontableViewportRowsCalculator(
    height,
    pos,
    this.instance.getSetting('totalRows'),
    function(sourceRow) {
      return that.instance.wtTable.getRowHeight(sourceRow)
    },
    visible ? null : this.instance.wtSettings.settings.viewportRowCalculatorOverride,
    visible ? true : false
  );
};

/**
 * Creates:
 *  - columnsRenderCalculator (before draw, to qualify columns for rendering)
 *  - columnsVisibleCalculator (after draw, to measure which columns are actually visible)
 * @returns {WalkontableViewportRowsCalculator}
 */
WalkontableViewport.prototype.createColumnsCalculator = function (visible) {
  this.columnHeaderHeight = NaN;

  var width = this.getViewportWidth();

  var pos = this.instance.wtScrollbars.horizontal.getScrollPosition() - this.instance.wtScrollbars.vertical.getTableParentOffset();
  if (pos < 0) {
    pos = 0;
  }

  var that = this;
  return new WalkontableViewportColumnsCalculator(
    width,
    pos,
    this.instance.getSetting('totalColumns'),
    function (sourceCol) {
      return that.instance.wtTable.getColumnWidth(sourceCol);
    },
    visible ? null : this.instance.wtSettings.settings.viewportColumnCalculatorOverride,
    visible ? true : false,
    this.instance.getSetting('stretchH')
  )
};


/**
 * Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and cols should be rendered)
 * @param fastDraw {Boolean} If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
 */
WalkontableViewport.prototype.createPreCalculators = function (fastDraw) {
  if (fastDraw) {
    var proposedRowsVisibleCalculator = this.createRowsCalculator(true);
    var proposedColumnsVisibleCalculator = this.createColumnsCalculator(true);
    if (!(this.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) && this.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator) ) ) {
      fastDraw = false;
    }
  }

  if(!fastDraw) {
    this.rowsRenderCalculator = this.createRowsCalculator();
    this.columnsRenderCalculator = this.createColumnsCalculator();
  }

  this.rowsVisibleCalculator = null; //delete temporarily to make sure that renderers always use rowsRenderCalculator, not rowsVisibleCalculator
  this.columnsVisibleCalculator = null;

  return fastDraw;
};

/**
 * Creates rowsVisibleCalculator and columnsVisibleCalculator (after draw, to determine what are the actually visible rows and columns)
 */
WalkontableViewport.prototype.createCalculators = function () {
  this.rowsVisibleCalculator = this.createRowsCalculator(true);
  this.columnsVisibleCalculator = this.createColumnsCalculator(true);
};

/**
 * Returns information whether proposedRowsVisibleCalculator viewport
 * is contained inside rows rendered in previous draw (cached in rowsRenderCalculator)
 *
 * Returns TRUE if all proposed visible rows are already rendered (meaning: redraw is not needed)
 * Returns FALSE if at least one proposed visible row is not already rendered (meaning: redraw is needed)
 *
 * @returns {boolean}
 */
WalkontableViewport.prototype.areAllProposedVisibleRowsAlreadyRendered = function (proposedRowsVisibleCalculator) {
  if (this.rowsVisibleCalculator) {
    if (proposedRowsVisibleCalculator.startRow < this.rowsRenderCalculator.startRow || (proposedRowsVisibleCalculator.startRow === this.rowsRenderCalculator.startRow && proposedRowsVisibleCalculator.startRow > 0)) {
      return false;
    }
    else if (proposedRowsVisibleCalculator.endRow > this.rowsRenderCalculator.endRow || (proposedRowsVisibleCalculator.endRow === this.rowsRenderCalculator.endRow && proposedRowsVisibleCalculator.endRow < this.instance.getSetting('totalRows') - 1)) {
      return false;
    }
    else {
      return true;
    }
  }
  return false;
};

/**
 * Returns information whether proposedColumnsVisibleCalculator viewport
 * is contained inside column rendered in previous draw (cached in columnsRenderCalculator)
 *
 * Returns TRUE if all proposed visible columns are already rendered (meaning: redraw is not needed)
 * Returns FALSE if at least one proposed visible column is not already rendered (meaning: redraw is needed)
 *
 * @returns {boolean}
 */
WalkontableViewport.prototype.areAllProposedVisibleColumnsAlreadyRendered = function (proposedColumnsVisibleCalculator) {
  if (this.columnsVisibleCalculator) {
    if (proposedColumnsVisibleCalculator.startRow < this.columnsRenderCalculator.startRow || (proposedColumnsVisibleCalculator.startRow === this.columnsRenderCalculator.startRow && proposedColumnsVisibleCalculator.startRow > 0)) {
      return false;
    }
    else if (proposedColumnsVisibleCalculator.endRow > this.columnsRenderCalculator.endRow || (proposedColumnsVisibleCalculator.endRow === this.columnsRenderCalculator.endRow && proposedColumnsVisibleCalculator.endRow < this.instance.getSetting('totalColumns') - 1)) {
      return false;
    }
    else {
      return true;
    }
  }
  return false;
};
