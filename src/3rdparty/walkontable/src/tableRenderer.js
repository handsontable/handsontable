function WalkontableTableRenderer(wtTable) {
  this.wtTable = wtTable;
  this.instance = wtTable.instance;
  this.rowFilter = wtTable.rowFilter;
  this.columnFilter = wtTable.columnFilter;

  this.TABLE = wtTable.TABLE;
  this.THEAD = wtTable.THEAD;
  this.TBODY = wtTable.TBODY;
  this.COLGROUP = wtTable.COLGROUP;

  this.utils = WalkontableTableRenderer.utils;

}

WalkontableTableRenderer.prototype.render = function () {
  if (!this.wtTable.isWorkingOnClone()) {
    this.instance.getSetting('beforeDraw', true);
  }

  this.rowHeaders = this.instance.getSetting('rowHeaders');
  this.rowHeaderCount = this.rowHeaders.length;
  this.fixedRowsTop = this.instance.getSetting('fixedRowsTop');
  this.columnHeaders = this.instance.getSetting('columnHeaders');
  this.columnHeaderCount = this.columnHeaders.length;

  var visibleColIndex
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , displayTds
    , adjusted = false
    , workspaceWidth
    , cloneLimit = this.instance.wtViewport.rowsPreCalculator.countRendered;

  if (totalColumns > 0) {
    if (this.wtTable.isWorkingOnClone()) {
      if (this.instance.cloneOverlay instanceof WalkontableVerticalScrollbarNative || this.instance.cloneOverlay instanceof WalkontableCornerScrollbarNative) {
        cloneLimit = this.fixedRowsTop;
      }
      else if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
        cloneLimit = totalRows;
      }
    }

    this.adjustAvailableNodes();
    adjusted = true;

    this.renderColGroups();

    this.renderColumnHeaders();

    displayTds = this.wtTable.getRenderedColumnsCount();

    //Render table rows
    this.renderRows(totalRows, cloneLimit, displayTds);

    if (!this.wtTable.isWorkingOnClone()) {
      workspaceWidth = this.instance.wtViewport.getWorkspaceWidth();
      this.instance.wtViewport.containerWidth = null;
      //TODO
      this.instance.wtViewport.columnsPreCalculator.stretch();
      //this.wtTable.getColumnStrategy().stretch();
    }

    this.adjustColumnWidths(displayTds);
  }

  if (!adjusted) {
    this.adjustAvailableNodes();
    this.instance.wtViewport.columnsPreCalculator.stretch();
  }

  this.removeRedundantRows(cloneLimit);

  if (!this.wtTable.isWorkingOnClone()) {
    this.markOversizedRows();

    this.instance.wtViewport.createCalculators();

    this.instance.wtScrollbars.applyToDOM();

    if (workspaceWidth !== this.instance.wtViewport.getWorkspaceWidth()) {
      //workspace width changed though to shown/hidden vertical scrollbar. Let's reapply stretching
      this.instance.wtViewport.containerWidth = null;

      //TODO
      //this.wtTable.getColumnStrategy().stretch();

      var cache = this.instance.wtTable.columnWidthCache;
      var fVC = this.wtTable.getFirstVisibleColumn();
      var lVC = this.wtTable.getLastVisibleColumn();

      for (visibleColIndex = fVC ; visibleColIndex < lVC; visibleColIndex++) {
      //for (visibleColIndex = 0; visibleColIndex < this.wtTable.getColumnStrategy().cellCount; visibleColIndex++) {
      //  var width = this.wtTable.getColumnStrategy().getSize(visibleColIndex);
        var width = this.wtTable.getColumnWidth(visibleColIndex);
        this.COLGROUP.childNodes[visibleColIndex + this.rowHeaderCount].style.width = width + 'px';
        cache[visibleColIndex] = width;
      }
    }

    this.instance.wtScrollbars.refresh(false);

    this.instance.getSetting('onDraw', true);
  }

};

WalkontableTableRenderer.prototype.removeRedundantRows = function (renderedRowsCount) {
  while (this.wtTable.tbodyChildrenLength > renderedRowsCount) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.wtTable.tbodyChildrenLength--;
  }
};

WalkontableTableRenderer.prototype.renderRows = function (totalRows, cloneLimit, displayTds) {
  var lastTD, TR;
  var visibleRowIndex = 0;
  var sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
  var isWorkingOnClone = this.wtTable.isWorkingOnClone();

  while (sourceRowIndex < totalRows && sourceRowIndex >= 0) {
    if (visibleRowIndex > 1000) {
      throw new Error('Security brake: Too much TRs. Please define height for your table, which will enforce scrollbars.');
    }

    if (cloneLimit !== void 0 && visibleRowIndex === cloneLimit) {
      break; //we have as much rows as needed for this clone
    }

    TR = this.getOrCreateTrForRow(visibleRowIndex, TR);

    //Render row headers
    this.renderRowHeaders(sourceRowIndex, TR);

    this.adjustColumns(TR, displayTds + this.rowHeaderCount);

    lastTD = this.renderCells(sourceRowIndex, TR, displayTds);

    //after last column is rendered, check if last cell is fully displayed
    if (!isWorkingOnClone) {
      this.resetOversizedRow(sourceRowIndex);
    }


    if (TR.firstChild) {
      var height = this.instance.wtTable.getRowHeight(sourceRowIndex); //if I have 2 fixed columns with one-line content and the 3rd column has a multiline content, this is the way to make sure that the overlay will has same row height
      if (height) {
        TR.firstChild.style.height = height + 'px';
      }
      else {
        TR.firstChild.style.height = '';
      }
    }

    visibleRowIndex++;

    sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
  }
};

WalkontableTableRenderer.prototype.resetOversizedRow = function (sourceRow) {
  if (this.instance.wtViewport.oversizedRows && this.instance.wtViewport.oversizedRows[sourceRow]) {
    this.instance.wtViewport.oversizedRows[sourceRow] = void 0;  //void 0 is faster than delete, see http://jsperf.com/delete-vs-undefined-vs-null/16
  }
};

WalkontableTableRenderer.prototype.markOversizedRows = function () {
  var previousRowHeight
    , trInnerHeight
    , sourceRowIndex
    , currentTr;

  var rowCount = this.instance.wtTable.TBODY.childNodes.length;
  while (rowCount) {
    rowCount--;
    sourceRowIndex = this.instance.wtTable.rowFilter.renderedToSource(rowCount);
    previousRowHeight = this.instance.wtTable.getRowHeight(sourceRowIndex);
    currentTr = this.instance.wtTable.getTrForRow(sourceRowIndex);

    trInnerHeight = Handsontable.Dom.innerHeight(currentTr) - 1;

    if ((!previousRowHeight && this.instance.wtSettings.settings.defaultRowHeight < trInnerHeight || previousRowHeight < trInnerHeight)) {
      this.instance.wtViewport.oversizedRows[sourceRowIndex] = trInnerHeight;
    }
  }

};

WalkontableTableRenderer.prototype.renderCells = function (sourceRowIndex, TR, displayTds) {
  var TD, sourceColIndex;
  var visibleColIndex = this.instance.wtViewport.columnsPreCalculator.visibleStartColumn;
  console.log(visibleColIndex);

  for (var visibleColIndex = 0; visibleColIndex < displayTds; visibleColIndex++) {
      sourceColIndex = this.columnFilter.renderedToSource(visibleColIndex);
      if (visibleColIndex === 0) {
        TD = TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(sourceColIndex)];
      }
      else {
        TD = TD.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
      }

      //If the number of headers has been reduced, we need to replace excess TH with TD
      if (TD.nodeName == 'TH') {
        TD = this.utils.replaceThWithTd(TD, TR);
      }

      if (!Handsontable.Dom.hasClass(TD, 'hide')) {
        TD.className = '';
      }

      TD.removeAttribute('style');

      this.instance.getSetting('cellRenderer', sourceRowIndex, sourceColIndex, TD);

    }


  return TD;
};

WalkontableTableRenderer.prototype.adjustColumnWidths = function (displayTds) {
  var cache = this.instance.wtTable.columnWidthCache;
  var cacheChanged = false;
  var width;
  for (var visibleColIndex = 0; visibleColIndex < displayTds; visibleColIndex++) {
    if (this.wtTable.isWorkingOnClone()) {
      width = this.instance.cloneSource.wtTable.columnWidthCache[visibleColIndex];
    }
    else {
      //width = this.wtTable.getColumnStrategy().getSize(visibleColIndex);
      width = this.wtTable.getColumnWidth(visibleColIndex);
    }
    if (width !== cache[visibleColIndex]) {
      this.COLGROUP.childNodes[visibleColIndex + this.rowHeaderCount].style.width = width + 'px';
      cache[visibleColIndex] = width;
      cacheChanged = true;
    }
  }
};

WalkontableTableRenderer.prototype.appendToTbody = function (TR) {
  this.TBODY.appendChild(TR);
  this.wtTable.tbodyChildrenLength++;
};

WalkontableTableRenderer.prototype.getOrCreateTrForRow = function (rowIndex, currentTr) {
  var TR;

  if (rowIndex >= this.wtTable.tbodyChildrenLength) {
    TR = this.createRow();
    this.appendToTbody(TR);
  } else if (rowIndex === 0) {
    TR = this.TBODY.firstChild;
  } else {
    TR = currentTr.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
  }

  return TR;
};

WalkontableTableRenderer.prototype.createRow = function () {
  var TR = document.createElement('TR');
  for (var visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
    TR.appendChild(document.createElement('TH'));
  }

  return TR;
};

WalkontableTableRenderer.prototype.renderRowHeader = function(row, col, TH){
  TH.className = '';
  TH.removeAttribute('style');
  this.rowHeaders[col](row, TH, col);
};

WalkontableTableRenderer.prototype.renderRowHeaders = function (row, TR) {
  for (var TH = TR.firstChild, visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {

    //If the number of row headers increased we need to create TH or replace an existing TD node with TH
    if (!TH) {
      TH = document.createElement('TH');
      TR.appendChild(TH);
    } else if (TH.nodeName == 'TD') {
      TH = this.utils.replaceTdWithTh(TH, TR);
    }

    this.renderRowHeader(row, visibleColIndex, TH);
    TH = TH.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
  }
};

WalkontableTableRenderer.prototype.adjustAvailableNodes = function () {

  //this.refreshStretching(); //actually it is wrong position because it assumes rowHeader would be always 50px wide (because we measure before it is filled with text). TODO: debug

  //adjust COLGROUP
  this.adjustColGroups();

  //adjust THEAD
  this.adjustThead();
};

WalkontableTableRenderer.prototype.renderColumnHeaders = function () {
  if (!this.columnHeaderCount) {
    return;
  }

    var columnCount = this.wtTable.getRenderedColumnsCount()
    , TR;

  for (var i = 0; i < this.columnHeaderCount; i++) {
    TR = this.getTrForColumnHeaders(i);

    for (var columnIndex = (-1) * this.rowHeaderCount; columnIndex < columnCount; columnIndex++) {
      this.renderColumnHeader(i, columnIndex, TR.childNodes[columnIndex + this.rowHeaderCount]);
    }
  }
};

WalkontableTableRenderer.prototype.adjustColGroups = function () {
  var columnCount = this.wtTable.getRenderedColumnsCount();

  //adjust COLGROUP
  while (this.wtTable.colgroupChildrenLength < columnCount + this.rowHeaderCount) {
    this.COLGROUP.appendChild(document.createElement('COL'));
    this.wtTable.colgroupChildrenLength++;
  }
  while (this.wtTable.colgroupChildrenLength > columnCount + this.rowHeaderCount) {
    this.COLGROUP.removeChild(this.COLGROUP.lastChild);
    this.wtTable.colgroupChildrenLength--;
    if (this.wtTable.columnWidthCache) {
      this.wtTable.columnWidthCache.splice(-1, 1);
    }
  }
};

WalkontableTableRenderer.prototype.adjustThead = function () {
  var columnCount = this.wtTable.getRenderedColumnsCount();
  var TR = this.THEAD.firstChild;
  if (this.columnHeaders.length) {

    for (var i = 0, columnHeadersLength = this.columnHeaders.length; i < columnHeadersLength; i++) {
      TR = this.THEAD.childNodes[i];
      if (!TR) {
        TR = document.createElement('TR');
        this.THEAD.appendChild(TR);
      }
      this.theadChildrenLength = TR.childNodes.length;
      while (this.theadChildrenLength < columnCount + this.rowHeaderCount) {
        TR.appendChild(document.createElement('TH'));
        this.theadChildrenLength++;
      }
      while (this.theadChildrenLength > columnCount + this.rowHeaderCount) {
        TR.removeChild(TR.lastChild);
        this.theadChildrenLength--;
      }
    }

    var theadChildrenLength = this.THEAD.childNodes.length;
    if(theadChildrenLength > this.columnHeaders.length) {
      for(var i = this.columnHeaders.length; i < theadChildrenLength; i++ ) {
        this.THEAD.removeChild(this.THEAD.lastChild);
      }
    }
  }

  else if (TR) {
    Handsontable.Dom.empty(TR);
  }
};

WalkontableTableRenderer.prototype.getTrForColumnHeaders = function (index) {
  var TR = this.THEAD.childNodes[index];
//  if (this.rowHeaderCount) {
//    for(var i = 0; i < this.rowHeaderCount; i++) {
//      this.renderRowHeaders(i - this.rowHeaderCount, TR);
//    }
//  }

  return TR;
};

WalkontableTableRenderer.prototype.renderColumnHeader = function (row, col, TH) {
  TH.className = '';
  TH.removeAttribute('style');
  return this.columnHeaders[row](col, TH, row);
};

WalkontableTableRenderer.prototype.renderColGroups = function () {
  for (var colIndex = 0; colIndex < this.wtTable.colgroupChildrenLength; colIndex++) {
    if (colIndex < this.rowHeaderCount) {
      Handsontable.Dom.addClass(this.COLGROUP.childNodes[colIndex], 'rowHeader');
    }
    else {
      Handsontable.Dom.removeClass(this.COLGROUP.childNodes[colIndex], 'rowHeader');
    }
  }
};

WalkontableTableRenderer.prototype.adjustColumns = function (TR, desiredCount) {
  var count = TR.childNodes.length;
  while (count < desiredCount) {
    var TD = document.createElement('TD');
    TR.appendChild(TD);
    count++;
  }
  while (count > desiredCount) {
    TR.removeChild(TR.lastChild);
    count--;
  }
};

WalkontableTableRenderer.prototype.removeRedundantColumns = function (renderedColumnsCount) {
  while (this.wtTable.tbodyChildrenLength > renderedColumnsCount) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.wtTable.tbodyChildrenLength--;
  }
};

WalkontableTableRenderer.prototype.refreshStretching = function () {
  if (this.wtTable.isWorkingOnClone()) {
    return;
  }

  var instance = this.instance
    , stretchH = instance.getSetting('stretchH')
    , totalColumns = instance.getSetting('totalColumns');

  var containerWidthFn = function () {
    var viewportWidth = that.instance.wtViewport.getViewportWidth();
    return viewportWidth;
  };

  var that = this;

  var columnWidthFn = function (i) {
    var source_c = that.columnFilter.renderedToSource(i);
    if (source_c < totalColumns) {
      return instance.getSetting('columnWidth', source_c);
    }
  };


  //this.wtTable.columnStrategy = new WalkontableColumnStrategy(instance, containerWidthFn, columnWidthFn, stretchH);

  // TODO NEW STRETCH-H
};

/*
 Helper functions, which does not have any side effects
 */
WalkontableTableRenderer.utils = {};

WalkontableTableRenderer.utils.replaceTdWithTh = function (TD, TR) {
  var TH;
  TH = document.createElement('TH');
  TR.insertBefore(TH, TD);
  TR.removeChild(TD);

  return TH;
};

WalkontableTableRenderer.utils.replaceThWithTd = function (TH, TR) {
  var TD = document.createElement('TD');
  TR.insertBefore(TD, TH);
  TR.removeChild(TH);

  return TD;
};


