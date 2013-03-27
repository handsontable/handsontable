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
  this.TABLE.setAttribute('tabindex', 10000); //http://www.barryvan.com.au/2009/01/onfocus-and-onblur-for-divs-in-fx/; 32767 is max tabindex for IE7,8

  this.visibilityStartRow = this.visibilityStartColumn = this.visibilityEdgeRow = this.visibilityEdgeColumn = null;

  //wtSpreader
  var parent = this.TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !this.wtDom.hasClass(parent, 'wtHolder')) {
    var spreader = document.createElement('DIV');
    if (this.instance.hasSetting('width') && this.instance.hasSetting('height')) {
      spreader.style.position = 'absolute';
      spreader.style.top = '0';
      spreader.style.left = '0';
      spreader.style.width = '4000px';
      spreader.style.height = '4000px';
    }
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
    hider.style.position = 'relative';
    hider.className = 'wtHider';
    if (parent) {
      parent.insertBefore(hider, this.spreader); //if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
    }
    hider.appendChild(this.spreader);
  }
  this.hider = this.spreader.parentNode;

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

  if (this.instance.hasSetting('columnHeaders')) {
    if (!this.THEAD.childNodes.length) {
      var TR = document.createElement('TR');
      this.THEAD.appendChild(TR);
    }
  }

  this.colgroupChildrenLength = this.COLGROUP.childNodes.length;
  this.theadChildrenLength = this.THEAD.firstChild ? this.THEAD.firstChild.childNodes.length : 0;
  this.tbodyChildrenLength = this.TBODY.childNodes.length;
}

WalkontableTable.prototype.refreshHiderDimensions = function () {
  var height = this.instance.getSetting('height');
  var width = this.instance.getSetting('width');

  if (height || width) {
    this.hider.style.overflow = 'hidden';
  }

  if (height) {
    if (this.instance.wtScroll.wtScrollbarH.visible) {
      this.hider.style.height = height - this.instance.getSetting('scrollbarHeight') + 'px';
    }
    else {
      this.hider.style.height = height + 'px';
    }
  }
  if (width) {
    if (this.instance.wtScroll.wtScrollbarV.visible) {
      this.hider.style.width = width - this.instance.getSetting('scrollbarWidth') + 'px';
    }
    else {
      this.hider.style.width = width + 'px';
    }
  }
};

WalkontableTable.prototype.refreshStretching = function () {
  var stretchH = this.instance.getSetting('stretchH')
    , totalColumns = this.instance.getSetting('totalColumns')
    , displayColumns = this.instance.getSetting('displayColumns')
    , displayTds = Math.min(displayColumns, totalColumns)
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , frozenColumns = this.instance.getSetting('frozenColumns')
    , frozenColumnsCount = frozenColumns ? frozenColumns.length : 0;

  if (!this.instance.hasSetting('columnWidth')) {
    return;
  }

  if (stretchH === 'hybrid') {
    if (this.instance.wtScroll.wtScrollbarH.visible) {
      stretchH = 'last';
    }
    else {
      stretchH = 'none';
    }
  }

  var TD;
  if (this.instance.wtTable.TBODY.firstChild && this.instance.wtTable.TBODY.firstChild.firstChild) {
    TD = this.instance.wtTable.TBODY.firstChild.firstChild;
  }
  else if (this.instance.wtTable.THEAD.firstChild && this.instance.wtTable.THEAD.firstChild.firstChild) {
    TD = this.instance.wtTable.THEAD.firstChild.firstChild;
  }

  if (frozenColumnsCount) {
    TD = TD.nextSibling;
  }

  if (!TD) {
    return;
  }

  var cellOffset = this.instance.wtDom.offset(TD)
    , tableOffset = this.instance.wtTable.tableOffset
    , rowHeaderWidth = cellOffset.left - tableOffset.left
    , widths = []
    , widthSum = 0
    , c;
  for (c = 0; c < displayTds; c++) {
    widths.push(this.instance.getSetting('columnWidth', offsetColumn + c));
    widthSum += widths[c];
  }
  var domWidth = widthSum + rowHeaderWidth;

  if (stretchH === 'all' || stretchH === 'last') {
    var containerWidth = this.instance.getSetting('width');
    if (this.instance.wtScroll.wtScrollbarV.visible) {
      containerWidth -= this.instance.getSetting('scrollbarWidth');
    }

    var diff = containerWidth - domWidth;
    if (diff > 0) {
      if (stretchH === 'all') {
        var newWidth;
        var remainingDiff = diff;
        var ratio = diff / widthSum;

        for (c = 0; c < displayTds; c++) {
          if (widths[c]) {
            if (c === displayTds - 1) {
              newWidth = widths[c] + remainingDiff;
            }
            else {
              newWidth = widths[c] + Math.floor(ratio * widths[c]);
              remainingDiff -= Math.floor(ratio * widths[c]);
            }
          }
          widths[c] = newWidth;
        }
      }
      else {
        if (widths[widths.length - 1]) {
          widths[widths.length - 1] = widths[widths.length - 1] + diff;
        }
      }
    }
  }

  for (c = 0; c < displayTds; c++) {
    if (widths[c]) {
      this.COLGROUP.childNodes[c + frozenColumnsCount].style.width = widths[c] + 'px';
    }
    else {
      this.COLGROUP.childNodes[c + frozenColumnsCount].style.width = '';
    }
  }
};

WalkontableTable.prototype.adjustAvailableNodes = function () {
  var instance = this.instance
    , totalRows = instance.getSetting('totalRows')
    , totalColumns = instance.getSetting('totalColumns')
    , displayRows = instance.getSetting('displayRows')
    , displayColumns = instance.getSetting('displayColumns')
    , displayTds
    , frozenColumns = instance.getSetting('frozenColumns')
    , frozenColumnsCount = frozenColumns ? frozenColumns.length : 0
    , TR
    , c;

  displayRows = Math.min(displayRows, totalRows);
  displayTds = Math.min(displayColumns, totalColumns);

  //adjust COLGROUP
  while (this.colgroupChildrenLength < displayTds + frozenColumnsCount) {
    this.COLGROUP.appendChild(document.createElement('COL'));
    this.colgroupChildrenLength++;
  }
  while (this.colgroupChildrenLength > displayTds + frozenColumnsCount) {
    this.COLGROUP.removeChild(this.COLGROUP.lastChild);
    this.colgroupChildrenLength--;
  }

  //adjust THEAD
  if (this.instance.hasSetting('columnHeaders')) {
    while (this.theadChildrenLength < displayTds + frozenColumnsCount) {
      this.THEAD.firstChild.appendChild(document.createElement('TH'));
      this.theadChildrenLength++;
    }
    while (this.theadChildrenLength > displayTds + frozenColumnsCount) {
      this.THEAD.firstChild.removeChild(this.THEAD.firstChild.lastChild);
      this.theadChildrenLength--;
    }
  }

  //adjust TBODY
  while (this.tbodyChildrenLength < displayRows) {
    TR = document.createElement('TR');
    for (c = 0; c < frozenColumnsCount; c++) {
      TR.appendChild(document.createElement('TH'));
    }
    this.TBODY.appendChild(TR);
    this.tbodyChildrenLength++;
  }
  while (this.tbodyChildrenLength > displayRows) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.tbodyChildrenLength--;
  }

  var TRs = this.TBODY.childNodes;
  var trChildrenLength;
  for (var r = 0, rlen = TRs.length; r < rlen; r++) {
    trChildrenLength = TRs[r].childNodes.length;
    while (trChildrenLength < displayTds + frozenColumnsCount) {
      var TD = document.createElement('TD');
      TD.setAttribute('tabindex', 10000); //http://www.barryvan.com.au/2009/01/onfocus-and-onblur-for-divs-in-fx/; 32767 is max tabindex for IE7,8
      TRs[r].appendChild(TD);
      trChildrenLength++;
    }
    while (trChildrenLength > displayTds + frozenColumnsCount) {
      TRs[r].removeChild(TRs[r].lastChild);
      trChildrenLength--;
    }
  }
};

WalkontableTable.prototype.draw = function (selectionsOnly) {
  if (!selectionsOnly) {
    this.tableOffset = this.wtDom.offset(this.TABLE);
    //this.TABLE.removeChild(this.TBODY); //possible future optimization - http://jsperf.com/table-scrolling/9
    this.adjustAvailableNodes();
    this._doDraw();
    //this.TABLE.appendChild(this.TBODY);
  }

  this.refreshPositions(selectionsOnly);

  this.instance.drawn = true;
  return this;
};

WalkontableTable.prototype._doDraw = function () {
  var r
    , c
    , offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns')
    , displayRows = this.instance.getSetting('displayRows')
    , displayColumns = this.instance.getSetting('displayColumns')
    , displayTds
    , frozenColumns = this.instance.getSetting('frozenColumns')
    , frozenColumnsCount = frozenColumns ? frozenColumns.length : 0
    , TR
    , TH
    , TD
    , cellData;

  displayRows = Math.min(displayRows, totalRows);
  displayTds = Math.min(displayColumns, totalColumns);

  //draw COLGROUP
  for (c = 0; c < this.colgroupChildrenLength; c++) {
    if (c < frozenColumnsCount) {
      this.wtDom.addClass(this.COLGROUP.childNodes[c], 'rowHeader');
      if (typeof frozenColumns[c] === "function") {
        frozenColumns[c](null, this.COLGROUP.childNodes[c])
      }
    }
    else {
      this.wtDom.removeClass(this.COLGROUP.childNodes[c], 'rowHeader');
    }
  }

  this.refreshStretching(); //needed here or otherwise scrollbarH is not shown

  //draw THEAD
  if (frozenColumnsCount && this.instance.hasSetting('columnHeaders')) {
    for (c = 0; c < frozenColumnsCount; c++) {
      TH = this.THEAD.childNodes[0].childNodes[c];
      if (typeof frozenColumns[c] === "function") {
        frozenColumns[c](null, TH);
      }
      else {
        this.wtDom.empty(TH);
      }
      if (this.hasEmptyCellProblem && TH.innerHTML === '') { //IE7
        TH.innerHTML = '&nbsp;';
      }
    }
  }

  if (this.instance.hasSetting('columnHeaders')) {
    for (c = 0; c < displayTds; c++) {
      this.instance.getSetting('columnHeaders', offsetColumn + c, this.THEAD.childNodes[0].childNodes[frozenColumnsCount + c]);
    }
  }

  //draw TBODY
  this.visibilityEdgeRow = this.visibilityEdgeColumn = null;
  this.visibilityStartRow = offsetRow; //needed bacause otherwise the values get out of sync in async mode
  this.visibilityStartColumn = offsetColumn;
  for (r = 0; r < displayRows; r++) {
    TR = this.TBODY.childNodes[r];
    for (c = 0; c < frozenColumnsCount; c++) { //in future use nextSibling; http://jsperf.com/nextsibling-vs-indexed-childnodes
      TH = TR.childNodes[c];
      cellData = typeof frozenColumns[c] === "function" ? frozenColumns[c](offsetRow + r, TH) : frozenColumns[c];
      if (cellData !== void 0) {
        this.wtDom.avoidInnerHTML(TH, cellData);
      }
      /*
       we can assume that frozenColumns[c] function took care of inserting content into TH
       else {
       TH.innerHTML = '';
       }*/
    }

    var visibilityFullRow = null;
    var visibilityFullColumn = null;
    this.wtDom.tdResetCache();

    for (c = 0; c < displayTds; c++) { //in future use nextSibling; http://jsperf.com/nextsibling-vs-indexed-childnodes
      if (this.visibilityEdgeColumn !== null && offsetColumn + c > this.visibilityEdgeColumn) {
        break;
      }
      else {
        TD = TR.childNodes[c + frozenColumnsCount];
        TD.className = '';
        TD.removeAttribute('style');
        this.instance.getSetting('cellRenderer', offsetRow + r, offsetColumn + c, TD);
        if (this.hasEmptyCellProblem && TD.innerHTML === '') { //IE7
          TD.innerHTML = '&nbsp;';
        }

        var visibility = this.isCellVisible(offsetRow + r, offsetColumn + c, TD);
        if (this.visibilityEdgeColumn === null && visibility & FLAG_VISIBLE_HORIZONTAL) {
          visibilityFullColumn = offsetColumn + c;
        }
        else if (this.visibilityEdgeColumn === null && visibility & FLAG_PARTIALLY_VISIBLE_HORIZONTAL) {
          this.visibilityEdgeColumn = offsetColumn + c;
        }

        if (this.visibilityEdgeRow === null && visibility & FLAG_VISIBLE_VERTICAL) {
          visibilityFullRow = offsetRow + r;
        }
        else if (this.visibilityEdgeRow === null && visibility & FLAG_PARTIALLY_VISIBLE_VERTICAL) {
          this.visibilityEdgeRow = offsetRow + r;
        }
      }
    }
    /*if (this.visibilityEdgeRow !== null && offsetRow + r > this.visibilityEdgeRow) {
     break;
     }*/
  }

  if (this.visibilityEdgeRow === null) {
    this.visibilityEdgeRow = visibilityFullRow + 1;
  }
  if (this.visibilityEdgeColumn === null) {
    this.visibilityEdgeColumn = visibilityFullColumn + 1;
  }
};

WalkontableTable.prototype.refreshPositions = function (selectionsOnly) {
  this.instance.wtScroll.refreshScrollbars();
  this.refreshHiderDimensions();
  this.refreshStretching();
  this.refreshSelections(selectionsOnly);
};

WalkontableTable.prototype.refreshSelections = function (selectionsOnly) {
  var r;
  if (this.instance.selections) {
    for (r in this.instance.selections) {
      if (this.instance.selections.hasOwnProperty(r)) {
        this.instance.selections[r].draw(selectionsOnly);
      }
    }
  }
};

WalkontableTable.prototype.recalcViewportCells = function () {
  if (this.instance.wtScroll.wtScrollbarV.visible && this.visibilityEdgeColumnRemainder <= this.instance.getSetting('scrollbarWidth')) {
    this.visibilityEdgeColumn--;
    this.visibilityEdgeColumnRemainder = Infinity;
  }
  if (this.instance.wtScroll.wtScrollbarH.visible && this.visibilityEdgeRowRemainder <= this.instance.getSetting('scrollbarHeight')) {
    this.visibilityEdgeRow--;
    this.visibilityEdgeRowRemainder = Infinity;
  }
};

var FLAG_VISIBLE_HORIZONTAL = 0x1; // 000001
var FLAG_VISIBLE_VERTICAL = 0x2; // 000010
var FLAG_PARTIALLY_VISIBLE_HORIZONTAL = 0x4; // 000100
var FLAG_PARTIALLY_VISIBLE_VERTICAL = 0x8; // 001000
var FLAG_NOT_VISIBLE_HORIZONTAL = 0x16; // 010000
var FLAG_NOT_VISIBLE_VERTICAL = 0x32; // 100000

WalkontableTable.prototype.isCellVisible = function (r, c, TD) {
  var out = 0
    , scrollV = this.instance.getSetting('scrollV')
    , scrollH = this.instance.getSetting('scrollH')
    , cellOffset = this.wtDom.offset(TD)
    , tableOffset = this.tableOffset
    , innerOffsetTop = cellOffset.top - tableOffset.top
    , innerOffsetLeft = cellOffset.left - tableOffset.left
    , $td = $(TD)
    , width = $td.outerWidth()
    , height = $td.outerHeight()
    , tableWidth = this.instance.hasSetting('width') ? this.instance.getSetting('width') : Infinity
    , tableHeight = this.instance.hasSetting('height') ? this.instance.getSetting('height') : Infinity;

  this.instance.wtSettings.rowHeightCache[r] = height;

  /**
   * Legend:
   * 0 - not visible vertically
   * 1 - not visible horizontally
   * 2 - partially visible vertically
   * 3 - partially visible horizontally
   * 4 - visible
   */

  if (innerOffsetTop > tableHeight) {
    out |= FLAG_NOT_VISIBLE_VERTICAL;
  }
  else if (innerOffsetTop + height > tableHeight) {
    this.visibilityEdgeRowRemainder = tableHeight - innerOffsetTop;
    out |= FLAG_PARTIALLY_VISIBLE_VERTICAL;
  }
  else {
    out |= FLAG_VISIBLE_VERTICAL;
  }

  if (innerOffsetLeft > tableWidth) {
    out |= FLAG_NOT_VISIBLE_HORIZONTAL;
  }
  else if (innerOffsetLeft + width > tableWidth) {
    this.visibilityEdgeColumnRemainder = tableWidth - innerOffsetLeft;
    out |= FLAG_PARTIALLY_VISIBLE_HORIZONTAL;
  }
  else {
    out |= FLAG_VISIBLE_HORIZONTAL;
  }

  return out;
};

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
  var offsetRow = this.instance.getSetting('offsetRow');
  if (coords[0] < offsetRow) {
    return -1; //row before viewport
  }
  else if (coords[0] > offsetRow + this.instance.getSetting('displayRows') - 1) {
    return -2; //row after viewport
  }
  else {
    var offsetColumn = this.instance.getSetting('offsetColumn');
    if (coords[1] < offsetColumn) {
      return -3; //column before viewport
    }
    else if (coords[1] > offsetColumn + this.instance.getSetting('displayColumns') - 1) {
      return -4; //column after viewport
    }
    else {
      var frozenColumns = this.instance.getSetting('frozenColumns')
        , frozenColumnsCount = (frozenColumns ? frozenColumns.length : 0)
        , tr = this.TBODY.childNodes[coords[0] - offsetRow];

      if (typeof tr === "undefined") { //this block is only needed in async mode
        this.adjustAvailableNodes();
        tr = this.TBODY.childNodes[coords[0] - offsetRow];
      }

      return tr.childNodes[coords[1] - offsetColumn + frozenColumnsCount];
    }
  }
};

WalkontableTable.prototype.getCoords = function (TD) {
  var frozenColumns = this.instance.getSetting('frozenColumns')
    , frozenColumnsCount = frozenColumns ? frozenColumns.length : 0;
  return [
    this.wtDom.prevSiblings(TD.parentNode).length + this.instance.getSetting('offsetRow'),
    TD.cellIndex + this.instance.getSetting('offsetColumn') - frozenColumnsCount
  ];
};