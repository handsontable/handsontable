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

  this.columnWidthCache = [];
}

WalkontableTable.prototype.getColumnStrategy = function () {
  return this.isWorkingOnClone() ? this.instance.cloneSource.wtTable.columnStrategy : this.columnStrategy;
};

WalkontableTable.prototype.isWorkingOnClone = function () {
  return !!this.instance.cloneSource;
};

WalkontableTable.prototype.refreshHiderDimensions = function () {
  var spreaderStyle = this.spreader.style;
  spreaderStyle.position = 'relative';
  spreaderStyle.width = 'auto';
  spreaderStyle.height = 'auto';
};

WalkontableTable.prototype.draw = function (selectionsOnly) {
  if (!this.isWorkingOnClone()) {
    this.holderOffset = Handsontable.Dom.offset(this.holder);
    this.instance.wtViewport.resetSettings();
  }

  if (selectionsOnly && this.instance.wtViewport.calculator) {
    if(this.instance.wtViewport.preCalculator.visibleStartRow < this.instance.wtViewport.calculator.renderStartRow || this.instance.wtViewport.preCalculator.visibleEndRow > this.instance.wtViewport.calculator.renderEndRow) {
      selectionsOnly = false;
    }
    else if(this.instance.wtViewport.preCalculator.scrollOffset !== this.instance.wtViewport.calculator.scrollOffset && (this.instance.wtViewport.preCalculator.visibleStartRow <= this.instance.wtViewport.calculator.renderStartRow || this.instance.wtViewport.preCalculator.visibleEndRow >= this.instance.wtViewport.calculator.renderEndRow)) {
      selectionsOnly = false;
    }
  }

  if (!this.isWorkingOnClone()) {
    var oldCalc = this.instance.wtViewport.calculator;
    this.instance.wtViewport.calculator = null; //must be created after render
  }

  if (!selectionsOnly) {
    if (this.isWorkingOnClone()) {
      this.tableOffset = this.instance.cloneSource.wtTable.tableOffset;
    }
    else {
      this.tableOffset = Handsontable.Dom.offset(this.TABLE);
      this.instance.wtScrollbars.vertical.readSettings();
      this.instance.wtScrollbars.horizontal.readSettings();
    }
    var offsetRow;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay
        || this.instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative
        || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
      offsetRow = 0;
    }
    else {
      offsetRow = this.instance.wtViewport.preCalculator.renderStartRow;
    }

    this.rowFilter = new WalkontableRowFilter(
      offsetRow,
      this.instance.getSetting('totalRows'),
      this.instance.getSetting('columnHeaders').length
    );
    this.columnFilter = new WalkontableColumnFilter(
      this.instance.getSetting('totalColumns'),
      this.instance.getSetting('rowHeaders').length
    );
    this._doDraw(); //creates calculator after draw
  }
  else {
    if (!this.isWorkingOnClone()) {
      var tmp = this.instance.wtViewport.createCalculator();
      this.instance.wtViewport.calculator = oldCalc;
      this.instance.wtViewport.calculator.visibleCellCount = tmp.visibleCellCount;
      this.instance.wtViewport.calculator.visibleStartRow = tmp.visibleStartRow;
      this.instance.wtViewport.calculator.visibleEndRow = tmp.visibleEndRow;
    };
    this.instance.wtScrollbars && this.instance.wtScrollbars.refresh(true);
  }

  this.refreshPositions(selectionsOnly);

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

WalkontableTable.prototype.refreshPositions = function (selectionsOnly) {
  this.refreshHiderDimensions();
  this.refreshSelections(selectionsOnly);
};

WalkontableTable.prototype.removeClassFromCells = function (className) {
  var nodes = this.TABLE.querySelectorAll('.' + className);
  for (var i = 0, ilen = nodes.length; i < ilen; i++) {
    Handsontable.Dom.removeClass(nodes[i], className);
  }
};

WalkontableTable.prototype.refreshSelections = function (selectionsOnly) {
  if (this.instance.selections) {
    if(selectionsOnly) {
    for (var i = 0, ilen = this.instance.selections.length; i < ilen; i++) {
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

    for (var i = 0, ilen = this.instance.selections.length; i < ilen; i++) {
      this.instance.selections[i].draw(this.instance, selectionsOnly);
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
  return this.rowFilter.renderedToSource(0);
};

WalkontableTable.prototype.getFirstVisibleRow = function () {
  var scrollbarPosition = this.instance.wtScrollbars.vertical.getScrollPosition()
    , sum = 0
    , i = 0;

  do {
    i++;
    sum += this.instance.wtTable.getRowHeight(i) || this.instance.wtSettings.settings.defaultRowHeight;
  } while (scrollbarPosition > 0 && sum - 1 < scrollbarPosition);

  if(i > 0)
    i--;

  return i;
};

//returns -1 if no column is visible
WalkontableTable.prototype.getFirstVisibleColumn = function () {

  if (this.isWorkingOnClone()){
    if (this.instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative){
      return 0;
    } else {
      return this.instance.cloneSource.wtTable.getFirstVisibleColumn();
    }
  }

  var leftOffset = this.instance.wtScrollbars.horizontal.getScrollPosition();
  var columnCount = this.getColumnStrategy().cellCount;
  var firstTR = this.TBODY.firstChild;

  if (!firstTR){
    return 0;
  }

  for (var colIndex = 0; colIndex < columnCount; colIndex++){
    leftOffset -= firstTR.childNodes[colIndex].offsetWidth;

    if (leftOffset < 0){
      return colIndex;
    }

  }

  return -1;
};

//returns -1 if no row is visible
WalkontableTable.prototype.getLastRenderedRow = function () {
  return this.instance.wtViewport.preCalculator.renderEndRow;
};

WalkontableTable.prototype.getLastVisibleRow = function () {
  return this.instance.wtViewport.calculator.visibleEndRow;
};

//returns -1 if no column is visible
WalkontableTable.prototype.getLastVisibleColumn = function () {
  var instance = this.instance;

  if (this.isWorkingOnClone()){

    if (instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || instance.cloneOverlay instanceof WalkontableCornerScrollbarNative){
      var lastVisibleColumn = this.getColumnStrategy().countVisible() - 1;
      var fixedColumnsLeft =  instance.getSetting('fixedColumnsLeft');
      return Math.min(fixedColumnsLeft - 1, lastVisibleColumn);
    } else {
      return this.instance.cloneSource.wtTable.getLastVisibleColumn();
    }

  }


  var leftOffset = this.instance.wtScrollbars.horizontal.getScrollPosition();
  var leftPartOfTable = leftOffset + this.instance.wtViewport.getWorkspaceWidth();
  var columnCount = this.getColumnStrategy().cellCount;
  var rowHeaderCount = this.instance.getSetting('rowHeaders').length || 0;
  var firstTR = this.TBODY.firstChild;

  if (!columnCount) {
    return -1;
  }

  for (var colIndex = 0; colIndex < columnCount + rowHeaderCount; colIndex++){
    leftPartOfTable -= firstTR.childNodes[colIndex].offsetWidth;

    if (leftPartOfTable <= 0){
      return colIndex - rowHeaderCount;
    }

  }

  return colIndex - rowHeaderCount - 1;
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
  return (this.getLastVisibleColumn() === this.instance.getSetting('totalColumns') - 1 && !this.getColumnStrategy().isLastIncomplete());
};

WalkontableTable.prototype.getRenderedColumnsCount = function () {
  var isClone = this.isWorkingOnClone();
  if (isClone && this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    return 1;
  }
  if (isClone && (this.instance.cloneOverlay instanceof WalkontableHorizontalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative)) {
    return this.instance.getSetting('fixedColumnsLeft');
  }
  else {
    return this.getColumnStrategy().cellCount;
  }
};

WalkontableTable.prototype.getRenderedRowsCount = function () {
  return this.instance.wtViewport.preCalculator.countRendered;
};

WalkontableTable.prototype.getVisibleRowsCount = function () {
  return this.instance.wtViewport.calculator.countVisible;
};

WalkontableTable.prototype.allRowsInViewport = function () {
  return this.instance.getSetting('totalRows') == this.getVisibleRowsCount();
};

/**
 * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height
 * @param {Number} row
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
