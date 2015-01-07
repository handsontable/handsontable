function WalkontableTable(instance, table) {
  //reference to instance
  this.instance = instance;
  this.TABLE = table;
  Handsontable.Dom.removeTextNodes(this.TABLE);

  //wtSpreader
  var parent = this.TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
    var spreader = document.createElement('DIV');
    spreader.className = 'wtSpreader';
    if (parent) {
      parent.insertBefore(spreader, this.TABLE); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    spreader.appendChild(this.TABLE);
  }
  this.spreader = this.TABLE.parentNode;

  //wtHider
  parent = this.spreader.parentNode;
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
    var hider = document.createElement('DIV');
    hider.className = 'wtHider';
    if (parent) {
      parent.insertBefore(hider, this.spreader); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    hider.appendChild(this.spreader);
  }
  this.hider = this.spreader.parentNode;
  this.hiderStyle = this.hider.style;
  this.hiderStyle.position = 'relative';

  //wtHolder
  parent = this.hider.parentNode;
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';

    if(!instance.cloneSource) {
      holder.className += ' ht_master';
    }

    if (parent) {
      parent.insertBefore(holder, this.hider); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    holder.appendChild(this.hider);
  }
  this.holder = this.hider.parentNode;

  if (!this.isWorkingOnClone()) {
    this.holder.parentNode.style.position = "relative";
  }

  //bootstrap from settings
  this.TBODY = this.TABLE.getElementsByTagName('TBODY')[0];
  if (!this.TBODY) {
    this.TBODY = document.createElement('TBODY');
    this.TABLE.appendChild(this.TBODY);
  }
  this.THEAD = this.TABLE.getElementsByTagName('THEAD')[0];
  if (!this.THEAD) {
    this.THEAD = document.createElement('THEAD');
    this.TABLE.insertBefore(this.THEAD, this.TBODY);
  }
  this.COLGROUP = this.TABLE.getElementsByTagName('COLGROUP')[0];
  if (!this.COLGROUP) {
    this.COLGROUP = document.createElement('COLGROUP');
    this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
  }

  if (this.instance.getSetting('columnHeaders').length) {
    if (!this.THEAD.childNodes.length) {
      var TR = document.createElement('TR');
      this.THEAD.appendChild(TR);
    }
  }

  this.colgroupChildrenLength = this.COLGROUP.childNodes.length;
  this.theadChildrenLength = this.THEAD.firstChild ? this.THEAD.firstChild.childNodes.length : 0;
  this.tbodyChildrenLength = this.TBODY.childNodes.length;

  this.rowFilter = null;
  this.columnFilter = null;
}

WalkontableTable.prototype.isWorkingOnClone = function () {
  return !!this.instance.cloneSource;
};

WalkontableTable.prototype.refreshHiderDimensions = function () {
  var spreaderStyle = this.spreader.style;
  spreaderStyle.position = 'relative';
  spreaderStyle.width = '0';
  spreaderStyle.height = 'auto';
};

/**
 * Redraws the table
 * @param fastDraw {Boolean} If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
 * @returns {WalkontableTable}
 */
WalkontableTable.prototype.draw = function (fastDraw) {
  if (!this.isWorkingOnClone()) {
    this.holderOffset = Handsontable.Dom.offset(this.holder);
    var rowsRenderCalculator = this.instance.wtViewport.createRowsCalculator();
    var columnsRenderCalculator = this.instance.wtViewport.createColumnsCalculator();

    if (fastDraw) {
      var proposedRowsVisibleCalculator = this.instance.wtViewport.createRowsCalculator(true);
      if (!(this.instance.wtViewport.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) && this.instance.wtViewport.areAllProposedVisibleColumnsAlreadyRendered() ) ) {
        fastDraw = false;
      }
    }

    this.instance.wtViewport.rowsVisibleCalculator = null; //delete temporarily to make sure that renderers always use rowsRenderCalculator, not rowsVisibleCalculator
    this.instance.wtViewport.columnsVisibleCalculator = null;
  }

  if (!fastDraw) {
    if (this.isWorkingOnClone()) {
      this.tableOffset = this.instance.cloneSource.wtTable.tableOffset;
    }
    else {
      this.instance.wtViewport.rowsRenderCalculator = rowsRenderCalculator;
      this.instance.wtViewport.columnsRenderCalculator = columnsRenderCalculator;
      this.tableOffset = Handsontable.Dom.offset(this.TABLE);
      this.instance.wtScrollbars.vertical.readSettings();
      this.instance.wtScrollbars.horizontal.readSettings();
    }
    var startRow;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay
        || this.instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative
        || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
      startRow = 0;
    }
    else {
      startRow = this.instance.wtViewport.rowsRenderCalculator.startRow;
    }


    var renderStartColumn;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay
    || this.instance.cloneOverlay instanceof  WalkontableHorizontalScrollbarNative
    || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
      renderStartColumn = 0;
    } else {
      renderStartColumn = this.instance.wtViewport.columnsRenderCalculator.renderStartColumn;
    }

    this.rowFilter = new WalkontableRowFilter(
      startRow,
      this.instance.getSetting('totalRows'),
      this.instance.getSetting('columnHeaders').length
    );
    this.columnFilter = new WalkontableColumnFilter(
      renderStartColumn,
      this.instance.getSetting('totalColumns'),
      this.instance.getSetting('rowHeaders').length
    );
    this._doDraw(); //creates calculator after draw
  }
  else {
    if (!this.isWorkingOnClone()) {
      this.instance.wtViewport.createCalculators(this.instance.wtViewport.rowsRenderCalculator, this.instance.wtViewport.columnsRenderCalculator); //in case we only scrolled without redraw, update visible rows information in oldRowsCalculator
    }
    this.instance.wtScrollbars && this.instance.wtScrollbars.refresh(true);
  }

  this.refreshPositions(fastDraw);

  if (!this.isWorkingOnClone()) {
    this.instance.wtScrollbars.vertical.resetFixedPosition();
    this.instance.wtScrollbars.horizontal.resetFixedPosition();
    this.instance.wtScrollbars.corner.resetFixedPosition();
  }

  this.instance.drawn = true;
  return this;
};

WalkontableTable.prototype._doDraw = function () {
  var wtRenderer = new WalkontableTableRenderer(this);
  wtRenderer.render();
};

WalkontableTable.prototype.refreshPositions = function (fastDraw) {
  this.refreshHiderDimensions();
  this.refreshSelections(fastDraw);
};

WalkontableTable.prototype.removeClassFromCells = function (className) {
  var nodes = this.TABLE.querySelectorAll('.' + className);
  for (var i = 0, ilen = nodes.length; i < ilen; i++) {
    Handsontable.Dom.removeClass(nodes[i], className);
  }
};

WalkontableTable.prototype.refreshSelections = function (fastDraw) {
  var i, ilen;
  if (this.instance.selections) {
    if(fastDraw) {
    for (i = 0, ilen = this.instance.selections.length; i < ilen; i++) {
        //there was no rerender, so we need to remove classNames by ourselves
        if (this.instance.selections[i].settings.className) {
          this.removeClassFromCells(this.instance.selections[i].settings.className);
        }
        if (this.instance.selections[i].settings.highlightRowClassName) {
          this.removeClassFromCells(this.instance.selections[i].settings.highlightRowClassName);
        }
        if (this.instance.selections[i].settings.highlightColumnClassName) {
          this.removeClassFromCells(this.instance.selections[i].settings.highlightColumnClassName);
        }
      }
    }

    for (i = 0, ilen = this.instance.selections.length; i < ilen; i++) {
      this.instance.selections[i].draw(this.instance, fastDraw);
    }
  }
};

/**
 * getCell
 * @param {WalkontableCellCoords} coords
 * @return {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  -1 row before viewport
 *  -2 row after viewport
 *
 */
WalkontableTable.prototype.getCell = function (coords) {
  if (this.isRowBeforeRenderedRows(coords.row)) {
    return -1; //row before rendered rows
  }
  else if (this.isRowAfterRenderedRows(coords.row)) {
    return -2; //row after rendered rows
  }

    var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(coords.row)];

    if (TR) {
      return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(coords.col)];
    }
};

/**
 * getColumnHeader
 * @param col
 * @return {Object} HTMLElement on success or undefined on error
 *
 */
WalkontableTable.prototype.getColumnHeader = function(col) {
  var THEAD = this.THEAD.childNodes[0];
  if (THEAD) {
    return THEAD.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(col)];
  }
};

/**
 * getRowHeader
 * @param row
 * @return {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  null table doesn't have row headers
 *
 */
WalkontableTable.prototype.getRowHeader = function(row) {
  if(this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) == 0) {
    return null;
  }

  var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];

  if (TR) {
    return TR.childNodes[0];
  }
};

/**
 * Returns cell coords object for a given TD
 * @param TD
 * @returns {WalkontableCellCoords}
 */
WalkontableTable.prototype.getCoords = function (TD) {
  var TR = TD.parentNode;
  var row = Handsontable.Dom.index(TR);
  if (TR.parentNode === this.THEAD) {
    row = this.rowFilter.visibleColHeadedRowToSourceRow(row);
  }
  else {
    row = this.rowFilter.renderedToSource(row);
  }

  return new WalkontableCellCoords(
    row,
    this.columnFilter.visibleRowHeadedColumnToSourceColumn(TD.cellIndex)
  );
};

WalkontableTable.prototype.getTrForRow = function (row) {
  return this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
};

WalkontableTable.prototype.getFirstRenderedRow = function () {
  return this.instance.wtViewport.rowsRenderCalculator.startRow;
};

WalkontableTable.prototype.getFirstVisibleRow = function () {
  return this.instance.wtViewport.rowsVisibleCalculator.startRow;
};

WalkontableTable.prototype.getFirstRenderedColumn = function () {
  //TODO change to this.instance.wtViewport.colsCalculator.renderedStartCol when implemented; make sure code calls to getFirstVisibleColumn/getFirstRenderedColumn correctly
  //return 0; //currently all columns are rendered
  return this.instance.wtViewport.columnsVisibleCalculator.renderStartColumn;
};

//returns -1 if no column is visible
WalkontableTable.prototype.getFirstVisibleColumn = function () {
  //TODO change to this.instance.wtViewport.colsCalculator.visibleStartCol when implemented; make sure code calls to getFirstVisibleColumn/getFirstRenderedColumn correctly
  return this.instance.wtViewport.columnsVisibleCalculator.visibleStartColumn;
};

//returns -1 if no row is visible
WalkontableTable.prototype.getLastRenderedRow = function () {
  return this.instance.wtViewport.rowsRenderCalculator.endRow;
};

WalkontableTable.prototype.getLastVisibleRow = function () {
  return this.instance.wtViewport.rowsVisibleCalculator.endRow;
};

WalkontableTable.prototype.getLastRenderedColumn = function () {
  return this.instance.wtViewport.columnsRenderCalculator.renderEndColumn;
};

//returns -1 if no column is visible
WalkontableTable.prototype.getLastVisibleColumn = function () {
  return this.instance.wtViewport.columnsVisibleCalculator.visibleEndColumn;
  //TODO change to this.instance.wtViewport.colsCalculator.visibleEndCol when implemented; make sure code calls to getLastVisibleColumn/getLastRenderedColumn correctly
};

WalkontableTable.prototype.isRowBeforeRenderedRows = function (r) {
  return (this.rowFilter.sourceToRendered(r) < 0 && r >= 0);
};

WalkontableTable.prototype.isRowAfterViewport = function (r) {
  return (r > this.getLastVisibleRow());
};

WalkontableTable.prototype.isRowAfterRenderedRows = function (r) {
  return (r > this.getLastRenderedRow());
};

WalkontableTable.prototype.isColumnBeforeViewport = function (c) {
  return (this.columnFilter.sourceToRendered(c) < 0 && c >= 0);
};

WalkontableTable.prototype.isColumnAfterViewport = function (c) {
  return (c > this.getLastVisibleColumn());
};

WalkontableTable.prototype.isLastRowFullyVisible = function () {
  return (this.getLastVisibleRow() === this.getLastRenderedRow());
};

WalkontableTable.prototype.isLastColumnFullyVisible = function () {
  return (this.getLastVisibleColumn() === this.getLastRenderedColumn);
};

WalkontableTable.prototype.getRenderedColumnsCount = function () {
  if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    return this.instance.getSetting('totalColumns');
  }
  else if (this.instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    return this.instance.getSetting('fixedColumnsLeft');
  }
  else {
    return this.instance.wtViewport.columnsRenderCalculator.countRenderedColumns;
  }
};

WalkontableTable.prototype.getRenderedRowsCount = function () {
  if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    return this.instance.getSetting('totalRows');
  }
  else if (this.instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
    return this.instance.getSetting('fixedRowsTop');
  }
  return this.instance.wtViewport.rowsRenderCalculator.count;
};

WalkontableTable.prototype.getVisibleRowsCount = function () {
  return this.instance.wtViewport.rowsVisibleCalculator.count;
};

WalkontableTable.prototype.allRowsInViewport = function () {
  return this.instance.getSetting('totalRows') == this.getVisibleRowsCount();
};

/**
 * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height
 * @param {Number} sourceRow
 * @return {Number}
 */
WalkontableTable.prototype.getRowHeight = function (sourceRow) {
  var height = this.instance.wtSettings.settings.rowHeight(sourceRow);
  var oversizedHeight = this.instance.wtViewport.oversizedRows[sourceRow];
  if (oversizedHeight !== void 0) {
    height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
  }
  return height;
};


WalkontableTable.prototype.getVisibleColumnsCount = function () {
  return this.instance.wtViewport.columnsVisibleCalculator.countVisibleColumns;
};


WalkontableTable.prototype.allColumnsInViewport = function () {
  return this.instance.getSetting('totalColumns') == this.getVisibleColumnsCount();
};



WalkontableTable.prototype.getColumnWidth = function (sourceColumn) {
  var width = this.instance.wtSettings.settings.columnWidth;
  if(typeof width === 'function') {
    width = width(sourceColumn);
  } else if(typeof width === 'object') {
    width = width[sourceColumn];
  }

  var oversizedWidth = this.instance.wtViewport.oversizedCols[sourceColumn];
  if (oversizedWidth !== void 0) {
    width = width ? Math.max(width, oversizedWidth) : oversizedWidth;
  }
  return width;
};

WalkontableTable.prototype.getStretchedColumnWidth = function (sourceColumn) {
  var allColumns = this.instance.getSetting('totalColumns');
  var width = this.getColumnWidth(sourceColumn) || this.instance.wtSettings.settings.defaultColumnWidth;

  if (this.instance.wtViewport.columnsRenderCalculator.stretchAllRatio != 0) {
    width = width * this.instance.wtViewport.columnsRenderCalculator.stretchAllRatio;
  } else if (this.instance.wtViewport.columnsRenderCalculator.stretchLastWidth != 0) {
    if (sourceColumn == allColumns - 1) {
      width = this.instance.wtViewport.columnsRenderCalculator.stretchLastWidth;
    }
  }
  return width;
};

