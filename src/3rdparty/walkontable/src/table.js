/*var FLAG_VISIBLE_HORIZONTAL = 0x1; // 000001
var FLAG_VISIBLE_VERTICAL = 0x2; // 000010
var FLAG_PARTIALLY_VISIBLE_HORIZONTAL = 0x4; // 000100
var FLAG_PARTIALLY_VISIBLE_VERTICAL = 0x8; // 001000
var FLAG_NOT_VISIBLE_HORIZONTAL = 0x10; // 010000
var FLAG_NOT_VISIBLE_VERTICAL = 0x20; // 100000*/

function WalkontableTable(instance) {
  //reference to instance
  this.instance = instance;
  this.TABLE = this.instance.getSetting('table');
  this.wtDom = this.instance.wtDom;
  this.wtDom.removeTextNodes(this.TABLE);

  this.hasEmptyCellProblem = ($.browser.msie && (parseInt($.browser.version, 10) <= 7));
  this.hasCellSpacingProblem = ($.browser.msie && (parseInt($.browser.version, 10) <= 7));

  if (this.hasCellSpacingProblem) { //IE7
    this.TABLE.cellSpacing = 0;
  }

  //wtSpreader
  var parent = this.TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !this.wtDom.hasClass(parent, 'wtHolder')) {
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
  if (!parent || parent.nodeType !== 1 || !this.wtDom.hasClass(parent, 'wtHolder')) {
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
  if (!parent || parent.nodeType !== 1 || !this.wtDom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';
    if (parent) {
      parent.insertBefore(holder, this.hider); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    holder.appendChild(this.hider);
  }
  this.parent = this.hider.parentNode;

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

  this.oldCellCache = new WalkontableClassNameCache();
  this.currentCellCache = new WalkontableClassNameCache();

  this.rowFilter = new WalkontableRowFilter();
  this.columnFilter = new WalkontableColumnFilter();
}

WalkontableTable.prototype.refreshHiderDimensions = function () {
  var height = this.instance.wtViewport.getWorkspaceHeight();
  var width = this.instance.wtViewport.getWorkspaceWidth();

  var spreaderStyle = this.spreader.style;

  if (height !== Infinity || width !== Infinity) {
    this.hiderStyle.overflow = 'hidden';

    spreaderStyle.position = 'absolute';
    spreaderStyle.top = '0';
    spreaderStyle.left = '0';

    if (this.instance.getSetting('scrollbarModelV') === 'dragdealer') {
      spreaderStyle.height = '4000px';
    }

    if (this.instance.getSetting('scrollbarModelH') === 'dragdealer') {
      spreaderStyle.width = '4000px';
    }

    if (height === Infinity) {
      height = this.instance.wtViewport.getWorkspaceActualHeight();
    }
    this.hiderStyle.height = height + 'px';

    if (width === Infinity) {
      width = this.instance.wtViewport.getWorkspaceActualWidth();
    }
    this.hiderStyle.width = width + 'px';
  }
  else {
    spreaderStyle.position = 'relative';
    spreaderStyle.width = 'auto';
    spreaderStyle.height = 'auto';
  }
};

WalkontableTable.prototype.refreshStretching = function () {
  var instance = this.instance
    , stretchH = instance.getSetting('stretchH')
    , totalRows = instance.getSetting('totalRows')
    , totalColumns = instance.getSetting('totalColumns')
    , offsetColumn = instance.getSetting('offsetColumn');

  var containerWidthFn = function (cacheWidth) {
    return that.instance.wtViewport.getViewportWidth(cacheWidth);
  };

  var that = this;

  var columnWidthFn = function (i) {
    var source_c = that.columnFilter.visibleToSource(i);
    if (source_c < totalColumns) {
      return instance.getSetting('columnWidth', source_c);
    }
  };

  if (stretchH === 'hybrid') {
    if (offsetColumn > 0) {
      stretchH = 'last';
    }
    else {
      stretchH = 'none';
    }
  }

  var containerHeightFn = function (cacheHeight) {
    return that.instance.wtViewport.getViewportHeight(cacheHeight);
  };

  var rowHeightFn = function (i, TD) {
    var source_r = that.rowFilter.visibleToSource(i);
    if (source_r < totalRows) {
      return that.wtDom.outerHeight(TD);
    }
  };

  this.columnStrategy = new WalkontableColumnStrategy(containerWidthFn, columnWidthFn, stretchH);
  this.rowStrategy = new WalkontableRowStrategy(containerHeightFn, rowHeightFn);
};

WalkontableTable.prototype.adjustAvailableNodes = function () {
  var displayTds
    , rowHeaders = this.instance.getSetting('rowHeaders')
    , displayThs = rowHeaders.length
    , columnHeaders = this.instance.getSetting('columnHeaders')
    , TR
    , TD
    , c;

  //adjust COLGROUP
  while (this.colgroupChildrenLength < displayThs) {
    this.COLGROUP.appendChild(document.createElement('COL'));
    this.colgroupChildrenLength++;
  }

  this.refreshStretching();
  displayTds = this.columnStrategy.cellCount;

  //adjust COLGROUP
  while (this.colgroupChildrenLength < displayTds + displayThs) {
    this.COLGROUP.appendChild(document.createElement('COL'));
    this.colgroupChildrenLength++;
  }
  while (this.colgroupChildrenLength > displayTds + displayThs) {
    this.COLGROUP.removeChild(this.COLGROUP.lastChild);
    this.colgroupChildrenLength--;
  }

  //adjust THEAD
  if (columnHeaders.length) {
    TR = this.THEAD.firstChild;
    while (this.theadChildrenLength < displayTds + displayThs) {
      TR.appendChild(document.createElement('TH'));
      this.theadChildrenLength++;
    }
    while (this.theadChildrenLength > displayTds + displayThs) {
      TR.removeChild(TR.lastChild);
      this.theadChildrenLength--;
    }
  }

  //draw COLGROUP
  for (c = 0; c < this.colgroupChildrenLength; c++) {
    if (c < displayThs) {
      this.wtDom.addClass(this.COLGROUP.childNodes[c], 'rowHeader');
    }
    else {
      this.wtDom.removeClass(this.COLGROUP.childNodes[c], 'rowHeader');
    }
  }

  //draw THEAD
  if (columnHeaders.length) {
    TR = this.THEAD.firstChild;
    if (displayThs) {
      TD = TR.firstChild; //actually it is TH but let's reuse single variable
      for (c = 0; c < displayThs; c++) {
        rowHeaders[c](-displayThs + c, TD);
        if (this.hasEmptyCellProblem) { //IE7
          TD.innerHTML = '&nbsp;';
        }
        TD = TD.nextSibling;
      }
    }
  }

  for (c = 0; c < displayTds; c++) {
    if (columnHeaders.length) {
      columnHeaders[0](this.columnFilter.visibleToSource(c), TR.childNodes[displayThs + c]);
    }
  }
};

WalkontableTable.prototype.adjustColumns = function (TR, desiredCount) {
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

WalkontableTable.prototype.draw = function (selectionsOnly) {
  this.rowFilter.readSettings(this.instance);
  this.columnFilter.readSettings(this.instance);

  if (!selectionsOnly) {
    this.tableOffset = this.wtDom.offset(this.TABLE);
    this._doDraw();
  }
  else {
    this.instance.wtScrollbars.refresh();
  }

  this.refreshPositions(selectionsOnly);

  this.instance.drawn = true;
  return this;
};

WalkontableTable.prototype._doDraw = function () {
  var r = 0
    , source_r
    , c
    , source_c
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , displayTds
    , rowHeaders = this.instance.getSetting('rowHeaders')
    , displayThs = rowHeaders.length
    , TR
    , TD
    , adjusted = false
    , workspaceWidth;

  this.instance.wtViewport.resetSettings();

  //draw TBODY
  if (totalColumns > 0) {
    source_r = this.rowFilter.visibleToSource(r);
    while (source_r < totalRows) {
      if (r >= this.tbodyChildrenLength) {
        TR = document.createElement('TR');
        for (c = 0; c < displayThs; c++) {
          TR.appendChild(document.createElement('TH'));
        }
        this.TBODY.appendChild(TR);
        this.tbodyChildrenLength++;
      }
      else if (r === 0) {
        TR = this.TBODY.firstChild;
      }
      else {
        TR = TR.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
      }

      //TH
      TD = TR.firstChild;
      for (c = 0; c < displayThs; c++) {
        rowHeaders[c](source_r, TD); //actually TH
        TD = TD.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
      }

      if (r === 0) {
        this.adjustAvailableNodes();
        adjusted = true;
        displayTds = this.columnStrategy.cellCount;

        //TD
        this.adjustColumns(TR, displayTds + displayThs);

        workspaceWidth = this.instance.wtViewport.getWorkspaceWidth();
        this.columnStrategy.stretch();
        for (c = 0; c < displayTds; c++) {
          this.COLGROUP.childNodes[c + displayThs].style.width = this.columnStrategy.getSize(c) + 'px';
        }
      }
      else {
        //TD
        this.adjustColumns(TR, displayTds + displayThs);
      }

      for (c = 0; c < displayTds; c++) {
        source_c = this.columnFilter.visibleToSource(c);
        if (c === 0) {
          TD = TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(source_c)];
        }
        else {
          TD = TD.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
        }
        TD.className = '';
        TD.removeAttribute('style');
        this.instance.getSetting('cellRenderer', source_r, source_c, TD);
        if (this.hasEmptyCellProblem && TD.innerHTML === '') { //IE7
          TD.innerHTML = '&nbsp;';
        }
      }

      //after last column is rendered, check if last cell is fully displayed
      this.rowStrategy.add(r, TD);
      if (this.rowStrategy.isLastIncomplete()) {
        break;
      }

      r++;
      source_r = this.rowFilter.visibleToSource(r);
    }
  }

  if (!adjusted) {
    this.adjustAvailableNodes();
  }

  r = this.rowStrategy.countVisible();
  while (this.tbodyChildrenLength > r) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.tbodyChildrenLength--;
  }

  this.instance.wtScrollbars.refresh();

  if (workspaceWidth !== this.instance.wtViewport.getWorkspaceWidth()) {
    //workspace width changed though to shown/hidden vertical scrollbar. Let's reapply stretching
    this.columnStrategy.stretch();
    for (c = 0; c < displayTds; c++) {
      this.COLGROUP.childNodes[c + displayThs].style.width = this.columnStrategy.getSize(c) + 'px';
    }
  }
};

WalkontableTable.prototype.refreshPositions = function (selectionsOnly) {
  this.refreshHiderDimensions();
  this.refreshSelections(selectionsOnly);
};

WalkontableTable.prototype.refreshSelections = function (selectionsOnly) {
  var vr
    , r
    , vc
    , c
    , s
    , slen
    , classNames = []
    , visibleRows = this.rowStrategy.countVisible()
    , visibleColumns = this.columnStrategy.countVisible();

  this.oldCellCache = this.currentCellCache;
  this.currentCellCache = new WalkontableClassNameCache();

  if (this.instance.selections) {
    for (r in this.instance.selections) {
      if (this.instance.selections.hasOwnProperty(r)) {
        this.instance.selections[r].draw();
        if (this.instance.selections[r].settings.className) {
          classNames.push(this.instance.selections[r].settings.className);
        }
        if (this.instance.selections[r].settings.highlightRowClassName) {
          classNames.push(this.instance.selections[r].settings.highlightRowClassName);
        }
        if (this.instance.selections[r].settings.highlightColumnClassName) {
          classNames.push(this.instance.selections[r].settings.highlightColumnClassName);
        }
      }
    }
  }

  slen = classNames.length;

  for (vr = 0; vr < visibleRows; vr++) {
    for (vc = 0; vc < visibleColumns; vc++) {
      r = this.rowFilter.visibleToSource(vr);
      c = this.columnFilter.visibleToSource(vc);
      for (s = 0; s < slen; s++) {
        if (this.currentCellCache.test(vr, vc, classNames[s])) {
          this.wtDom.addClass(this.getCell([r, c]), classNames[s]);
        }
        else if (selectionsOnly && this.oldCellCache.test(vr, vc, classNames[s])) {
          this.wtDom.removeClass(this.getCell([r, c]), classNames[s]);
        }
      }
    }
  }
};

/* this function is not used currently (was used in _doDraw)
WalkontableTable.prototype.isCellVisible = function (r, c) {
  var out = 0;

  if (this.isRowInViewport(r)) {
    if (this.getLastVisibleRow() === c && this.rowStrategy.remainingSize > 0) {
      out |= FLAG_PARTIALLY_VISIBLE_VERTICAL;
    }
    else {
      out |= FLAG_VISIBLE_VERTICAL;
    }
  }
  else {
    out |= FLAG_NOT_VISIBLE_VERTICAL;
  }

  if (this.isColumnInViewport(c)) {
    if (this.getLastVisibleColumn() === c && this.columnStrategy.remainingSize > 0) {
      out |= FLAG_PARTIALLY_VISIBLE_HORIZONTAL;
    }
    else {
      out |= FLAG_VISIBLE_HORIZONTAL;
    }
  }
  else {
    out |= FLAG_NOT_VISIBLE_HORIZONTAL;
  }

  return out;
};*/

/**
 * getCell
 * @param {Array} coords
 * @return {Object} HTMLElement on success or {Number} one of the exit codes on error:
 *  -1 row before viewport
 *  -2 row after viewport
 *  -3 column before viewport
 *  -4 column after viewport
 *
 */
WalkontableTable.prototype.getCell = function (coords) {
  if (this.isRowBeforeViewport(coords[0])) {
    return -1; //row before viewport
  }
  else if (this.isRowAfterViewport(coords[0])) {
    return -2; //row after viewport
  }
  else {
    if (this.isColumnBeforeViewport(coords[1])) {
      return -3; //column before viewport
    }
    else if (this.isColumnAfterViewport(coords[1])) {
      return -4; //column after viewport
    }
    else {
      return this.TBODY.childNodes[this.rowFilter.sourceToVisible(coords[0])].childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(coords[1])];
    }
  }
};

WalkontableTable.prototype.getCoords = function (TD) {
  return [
    this.rowFilter.visibleToSource(this.wtDom.prevSiblings(TD.parentNode).length),
    this.columnFilter.visibleRowHeadedColumnToSourceColumn(TD.cellIndex)
  ];
};

//returns -1 if no row is visible
WalkontableTable.prototype.getLastVisibleRow = function () {
  return this.rowFilter.visibleToSource(this.rowStrategy.cellCount - 1);
};

//returns -1 if no column is visible
WalkontableTable.prototype.getLastVisibleColumn = function () {
  return this.columnFilter.visibleToSource(this.columnStrategy.cellCount - 1);
};

WalkontableTable.prototype.isRowBeforeViewport = function (r) {
  return (this.rowFilter.sourceToVisible(r) < this.rowFilter.fixedCount && r >= this.rowFilter.fixedCount);
};

WalkontableTable.prototype.isRowAfterViewport = function (r) {
  return (r > this.getLastVisibleRow());
};

WalkontableTable.prototype.isColumnBeforeViewport = function (c) {
  return (this.columnFilter.sourceToVisible(c) < this.columnFilter.fixedCount && c >= this.columnFilter.fixedCount);
};

WalkontableTable.prototype.isColumnAfterViewport = function (c) {
  return (c > this.getLastVisibleColumn());
};

WalkontableTable.prototype.isRowInViewport = function (r) {
  return (!this.isRowBeforeViewport(r) && !this.isRowAfterViewport(r));
};

WalkontableTable.prototype.isColumnInViewport = function (c) {
  return (!this.isColumnBeforeViewport(c) && !this.isColumnAfterViewport(c));
};

WalkontableTable.prototype.isLastRowFullyVisible = function () {
  return (this.getLastVisibleRow() === this.instance.getSetting('totalRows') - 1 && !this.rowStrategy.isLastIncomplete());
};

WalkontableTable.prototype.isLastColumnFullyVisible = function () {
  return (this.getLastVisibleColumn() === this.instance.getSetting('totalColumns') - 1 && !this.columnStrategy.isLastIncomplete());
};