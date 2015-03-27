function WalkontableViewport(instance) {
  this.instance = instance;
  this.oversizedRows = [];
  this.oversizedCols = [];
  this.oversizedColumnHeaders = [];

  var that = this;

  var eventManager = Handsontable.eventManager(instance);
  eventManager.addEventListener(window,'resize',function () {
    that.clientHeight = that.getWorkspaceHeight();
  });
}

WalkontableViewport.prototype.getWorkspaceHeight = function () {
  //var scrollHandler = this.instance.wtOverlays.topOverlay.scrollHandler;
  var trimmingContainer = this.instance.wtOverlays.topOverlay.trimmingContainer;

  if (trimmingContainer === window) {
    return document.documentElement.clientHeight;
  }
  else {
    var elemHeight = Handsontable.Dom.outerHeight(trimmingContainer);
    var height = (elemHeight > 0 && trimmingContainer.clientHeight > 0) ? trimmingContainer.clientHeight : Infinity; //returns height without DIV scrollbar
    return height;
  }
};


WalkontableViewport.prototype.getWorkspaceWidth = function () {
  var width,
    totalColumns = this.instance.getSetting("totalColumns"),
    trimmingContainer = this.instance.wtOverlays.leftOverlay.trimmingContainer,
    overflow,
    stretchSetting = this.instance.getSetting('stretchH');

  if(Handsontable.freezeOverlays) {
    width = Math.min(document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  } else {
    width = Math.min(this.getContainerFillWidth(), document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  }

  if (trimmingContainer === window && totalColumns > 0 && this.sumColumnWidths(0, totalColumns - 1) > width) {
    //in case sum of column widths is higher than available stylesheet width, let's assume using the whole window
    //otherwise continue below, which will allow stretching
    //this is used in `scroll_window.html`
    //TODO test me
    return document.documentElement.clientWidth;
  }

  if (trimmingContainer !== window){
      overflow = this.instance.wtOverlays.leftOverlay.trimmingContainer.style.overflow;

    if (overflow == "scroll" || overflow == "hidden" || overflow == "auto") {
      //this is used in `scroll.html`
      //TODO test me
      return Math.max(width, trimmingContainer.clientWidth);
    }
  }

  if(stretchSetting === 'none' || !stretchSetting) {
    // if no stretching is used, return the maximum used workspace width
    return Math.max(width, Handsontable.Dom.outerWidth(this.instance.wtTable.TABLE));
  } else {
    // if stretching is used, return the actual container width, so the columns can fit inside it
    return width;
  }
};

WalkontableViewport.prototype.sumColumnWidths = function (from, length) {
  var sum = 0;
  while(from < length) {
    sum += this.instance.wtTable.getColumnWidth(from) || this.instance.wtSettings.defaultColumnWidth;
    from++;
  }
  return sum;
};
WalkontableViewport.prototype.getContainerFillWidth = function() {

  if(this.containerWidth) {
    return this.containerWidth;
  }

  var mainContainer = this.instance.wtTable.holder,
      fillWidth,
      dummyElement;

  //while(mainContainer.parentNode != document.body && mainContainer.parentNode != null && mainContainer.className.indexOf('handsontable') === -1) {
  //  mainContainer = mainContainer.parentNode;
  //}

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
  return Handsontable.Dom.outerWidth(this.instance.wtTable.TABLE) ||
    Handsontable.Dom.outerWidth(this.instance.wtTable.TBODY) ||
    Handsontable.Dom.outerWidth(this.instance.wtTable.THEAD); //IE8 reports 0 as <table> offsetWidth;
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
  var containerWidth = this.getWorkspaceWidth(),
    rowHeaderWidth;

  if (containerWidth === Infinity) {
    return containerWidth;
  }
  rowHeaderWidth = this.getRowHeaderWidth();

  if (rowHeaderWidth > 0) {
    return containerWidth - rowHeaderWidth;
  }

  return containerWidth;
};

/**
 * Creates:
 *  - rowsRenderCalculator (before draw, to qualify rows for rendering)
 *  - rowsVisibleCalculator (after draw, to measure which rows are actually visible)
 *
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

  var pos = Handsontable.Dom.getScrollTop(this.instance.wtOverlays.mainTableScrollableElement) - this.instance.wtOverlays.topOverlay.getTableParentOffset();
  if (pos < 0) {
    pos = 0;
  }

  var fixedRowsTop = this.instance.getSetting('fixedRowsTop');
  if(fixedRowsTop) {
    var fixedRowsHeight = this.instance.wtOverlays.topOverlay.sumCellSizes(0, fixedRowsTop);
    pos += fixedRowsHeight;
    height -= fixedRowsHeight;
  }

  var that = this;
  return new WalkontableViewportRowsCalculator(
    height,
    pos,
    this.instance.getSetting('totalRows'),
    function(sourceRow) {
      return that.instance.wtTable.getRowHeight(sourceRow);
    },
    visible ? null : this.instance.wtSettings.settings.viewportRowCalculatorOverride,
    visible ? true : false
  );
};

/**
 * Creates:
 *  - columnsRenderCalculator (before draw, to qualify columns for rendering)
 *  - columnsVisibleCalculator (after draw, to measure which columns are actually visible)
 *
 * @returns {WalkontableViewportRowsCalculator}
 */
WalkontableViewport.prototype.createColumnsCalculator = function (visible) {
  this.columnHeaderHeight = NaN;

  var width = this.getViewportWidth();

  var pos = this.instance.wtOverlays.leftOverlay.getScrollPosition() - this.instance.wtOverlays.topOverlay.getTableParentOffset();
  if (pos < 0) {
    pos = 0;
  }

  var fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');
  if(fixedColumnsLeft) {
    var fixedColumnsWidth = this.instance.wtOverlays.leftOverlay.sumCellSizes(0, fixedColumnsLeft);
    pos += fixedColumnsWidth;
    width -= fixedColumnsWidth;
  }

  if(this.instance.wtTable.holder.clientWidth !== this.instance.wtTable.holder.offsetWidth) {
    width -= Handsontable.Dom.getScrollbarWidth();
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
  );
};


/**
 * Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and cols should be rendered)
 *
 * @param fastDraw {Boolean} If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
 * @returns fastDraw {Boolean} The fastDraw value, possibly modified
 */
WalkontableViewport.prototype.createRenderCalculators = function (fastDraw) {
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
WalkontableViewport.prototype.createVisibleCalculators = function () {
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
 * @returns {Boolean}
 */
WalkontableViewport.prototype.areAllProposedVisibleRowsAlreadyRendered = function (proposedRowsVisibleCalculator) {
  if (this.rowsVisibleCalculator) {
    if (proposedRowsVisibleCalculator.startRow < this.rowsRenderCalculator.startRow ||
        (proposedRowsVisibleCalculator.startRow === this.rowsRenderCalculator.startRow &&
        proposedRowsVisibleCalculator.startRow > 0)) {
      return false;
    }
    else if (proposedRowsVisibleCalculator.endRow > this.rowsRenderCalculator.endRow ||
        (proposedRowsVisibleCalculator.endRow === this.rowsRenderCalculator.endRow &&
        proposedRowsVisibleCalculator.endRow < this.instance.getSetting('totalRows') - 1)) {
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
 * @returns {Boolean}
 */
WalkontableViewport.prototype.areAllProposedVisibleColumnsAlreadyRendered = function (proposedColumnsVisibleCalculator) {
  if (this.columnsVisibleCalculator) {
    if (proposedColumnsVisibleCalculator.startColumn < this.columnsRenderCalculator.startColumn ||
        (proposedColumnsVisibleCalculator.startColumn === this.columnsRenderCalculator.startColumn &&
        proposedColumnsVisibleCalculator.startColumn > 0)) {
      return false;
    }
    else if (proposedColumnsVisibleCalculator.endColumn > this.columnsRenderCalculator.endColumn ||
        (proposedColumnsVisibleCalculator.endColumn === this.columnsRenderCalculator.endColumn &&
        proposedColumnsVisibleCalculator.endColumn < this.instance.getSetting('totalColumns') - 1)) {
      return false;
    }
    else {
      return true;
    }
  }
  return false;
};
