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
  this.spreader.style.position = 'relative';

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

  //wtHolder
  parent = this.hider.parentNode;
  if (!parent || parent.nodeType !== 1 || !Handsontable.Dom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';

    if (parent) {
      parent.insertBefore(holder, this.hider); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }

    if(!instance.cloneSource) {
      holder.parentNode.className += 'ht_master handsontable';
    }

    holder.appendChild(this.hider);
  }
  this.holder = this.hider.parentNode;

  this.wtRootElement = this.holder.parentNode;

  this.alignOverlaysWithTrimmingContainer();

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

WalkontableTable.prototype.alignOverlaysWithTrimmingContainer = function () {
  var trimmingElement = Handsontable.Dom.getTrimmingContainer(this.wtRootElement);

  if (!this.isWorkingOnClone()) {
    this.holder.parentNode.style.position = "relative";

    if(trimmingElement !== window) {
      this.holder.style.width = Handsontable.Dom.getStyle(trimmingElement, 'width');
      this.holder.style.height = Handsontable.Dom.getStyle(trimmingElement, 'height');
    } else {
      this.holder.style.overflow = "visible";
      this.wtRootElement.style.overflow = "visible";
    }
  }
};

WalkontableTable.prototype.isWorkingOnClone = function () {
  return !!this.instance.cloneSource;
};

/**
 * Redraws the table
 *
 * @param fastDraw {Boolean} If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
 * @returns {WalkontableTable}
 */
WalkontableTable.prototype.draw = function (fastDraw) {
  if (!this.isWorkingOnClone()) {
    this.holderOffset = Handsontable.Dom.offset(this.holder);
    fastDraw = this.instance.wtViewport.createRenderCalculators(fastDraw);
  }

  if (!fastDraw) {
    if (this.isWorkingOnClone()) {
      this.tableOffset = this.instance.cloneSource.wtTable.tableOffset;
    }
    else {
      this.tableOffset = Handsontable.Dom.offset(this.TABLE);
    }
    var startRow;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay ||
        this.instance.cloneOverlay instanceof WalkontableTopOverlay ||
        this.instance.cloneOverlay instanceof WalkontableCornerOverlay) {
      startRow = 0;
    }
    else {
      startRow = this.instance.wtViewport.rowsRenderCalculator.startRow;
    }


    var startColumn;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay ||
        this.instance.cloneOverlay instanceof  WalkontableLeftOverlay ||
        this.instance.cloneOverlay instanceof WalkontableCornerOverlay) {
      startColumn = 0;
    } else {
      startColumn = this.instance.wtViewport.columnsRenderCalculator.startColumn;
    }

    this.rowFilter = new WalkontableRowFilter(
      startRow,
      this.instance.getSetting('totalRows'),
      this.instance.getSetting('columnHeaders').length
    );
    this.columnFilter = new WalkontableColumnFilter(
      startColumn,
      this.instance.getSetting('totalColumns'),
      this.instance.getSetting('rowHeaders').length
    );
    this._doDraw(); //creates calculator after draw

    this.alignOverlaysWithTrimmingContainer();

  }
  else {
    if (!this.isWorkingOnClone()) {
      //in case we only scrolled without redraw, update visible rows information in oldRowsCalculator
      this.instance.wtViewport.createVisibleCalculators();
    }
    if (this.instance.wtOverlays) {
      this.instance.wtOverlays.refresh(true);
    }
  }

  this.refreshSelections(fastDraw);

  if (!this.isWorkingOnClone()) {
    this.instance.wtOverlays.topOverlay.resetFixedPosition();
    this.instance.wtOverlays.leftOverlay.resetFixedPosition();
    this.instance.wtOverlays.topLeftCornerOverlay.resetFixedPosition();
  }

  this.instance.drawn = true;
  return this;
};

WalkontableTable.prototype._doDraw = function () {
  var wtRenderer = new WalkontableTableRenderer(this);
  wtRenderer.render();
};

WalkontableTable.prototype.removeClassFromCells = function (className) {
  var nodes = this.TABLE.querySelectorAll('.' + className);
  for (var i = 0, ilen = nodes.length; i < ilen; i++) {
    Handsontable.Dom.removeClass(nodes[i], className);
  }
};

WalkontableTable.prototype.refreshSelections = function (fastDraw) {
  var i, len;

  if (!this.instance.selections) {
    return;
  }
  len = this.instance.selections.length;

  if (fastDraw) {
    for (i = 0; i < len; i++) {
      // there was no rerender, so we need to remove classNames by ourselves
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
  for (i = 0; i < len; i++) {
    this.instance.selections[i].draw(this.instance, fastDraw);
  }
};

/**
 * getCell
 *
 * @param {WalkontableCellCoords} coords
 * @returns {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  -1 row before viewport
 *  -2 row after viewport
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
 *
 * @param col
 * @param level Header level (0 = most distant to the table)
 * @returns {Object} HTMLElement on success or undefined on error
 */
WalkontableTable.prototype.getColumnHeader = function(col, level) {
  if(!level) {
    level = 0;
  }

  var TR = this.THEAD.childNodes[level];
  if (TR) {
    return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(col)];
  }
};

/**
 * getRowHeader
 *
 * @param row
 * @returns {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  null table doesn't have row headers
 */
WalkontableTable.prototype.getRowHeader = function(row) {
  if(this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) === 0) {
    return null;
  }

  var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];

  if (TR) {
    return TR.childNodes[0];
  }
};

/**
 * Returns cell coords object for a given TD
 *
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
  return this.instance.wtViewport.columnsRenderCalculator.startColumn;
};

//returns -1 if no column is visible
WalkontableTable.prototype.getFirstVisibleColumn = function () {
  return this.instance.wtViewport.columnsVisibleCalculator.startColumn;
};

//returns -1 if no row is visible
WalkontableTable.prototype.getLastRenderedRow = function () {
  return this.instance.wtViewport.rowsRenderCalculator.endRow;
};

WalkontableTable.prototype.getLastVisibleRow = function () {
  return this.instance.wtViewport.rowsVisibleCalculator.endRow;
};

WalkontableTable.prototype.getLastRenderedColumn = function () {
  return this.instance.wtViewport.columnsRenderCalculator.endColumn;
};

//returns -1 if no column is visible
WalkontableTable.prototype.getLastVisibleColumn = function () {
  return this.instance.wtViewport.columnsVisibleCalculator.endColumn;
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
  else if (this.instance.cloneOverlay instanceof WalkontableLeftOverlay || this.instance.cloneOverlay instanceof WalkontableCornerOverlay) {
    return this.instance.getSetting('fixedColumnsLeft');
  }
  else {
    return this.instance.wtViewport.columnsRenderCalculator.count;
  }
};

WalkontableTable.prototype.getRenderedRowsCount = function () {
  if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    return this.instance.getSetting('totalRows');
  }
  else if (this.instance.cloneOverlay instanceof WalkontableTopOverlay || this.instance.cloneOverlay instanceof WalkontableCornerOverlay) {
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
 *
 * @param {Number} sourceRow
 * @returns {Number}
 */
WalkontableTable.prototype.getRowHeight = function (sourceRow) {
  var height = this.instance.wtSettings.settings.rowHeight(sourceRow);
  var oversizedHeight = this.instance.wtViewport.oversizedRows[sourceRow];
  if (oversizedHeight !== void 0) {
    height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
  }
  return height;
};

WalkontableTable.prototype.getColumnHeaderHeight = function (level) {
  var height = this.instance.wtSettings.settings.defaultRowHeight,
    oversizedHeight = this.instance.wtViewport.oversizedColumnHeaders[level];
  if (oversizedHeight !== void 0) {
    height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
  }
  return height;
};

WalkontableTable.prototype.getVisibleColumnsCount = function () {
  return this.instance.wtViewport.columnsVisibleCalculator.count;
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
  var
    width = this.getColumnWidth(sourceColumn) || this.instance.wtSettings.settings.defaultColumnWidth,
    calculator = this.instance.wtViewport.columnsRenderCalculator,
    stretchedWidth;

  if (calculator) {
    stretchedWidth = calculator.getStretchedColumnWidth(sourceColumn, width);

    if (stretchedWidth) {
      width = stretchedWidth;
    }
  }

  return width;
};

