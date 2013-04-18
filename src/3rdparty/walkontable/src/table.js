var FLAG_VISIBLE_HORIZONTAL = 0x1; // 000001
var FLAG_VISIBLE_VERTICAL = 0x2; // 000010
var FLAG_PARTIALLY_VISIBLE_HORIZONTAL = 0x4; // 000100
var FLAG_PARTIALLY_VISIBLE_VERTICAL = 0x8; // 001000
var FLAG_NOT_VISIBLE_HORIZONTAL = 0x10; // 010000
var FLAG_NOT_VISIBLE_VERTICAL = 0x20; // 100000

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
    if (this.instance.hasSetting('width') && this.instance.hasSetting('height')) {
      var spreaderStyle = spreader.style;
      spreaderStyle.position = 'absolute';
      spreaderStyle.top = '0';
      spreaderStyle.left = '0';
      spreaderStyle.width = '4000px';
      spreaderStyle.height = '4000px';
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
    this.hiderStyle.overflow = 'hidden';
  }

  if (height) {
    if (this.instance.wtScroll.wtScrollbarH.visible) {
      this.hiderStyle.height = height - this.instance.getSetting('scrollbarHeight') + 'px';
    }
    else {
      this.hiderStyle.height = height + 'px';
    }
  }
  if (width) {
    if (this.instance.wtScroll.wtScrollbarV.visible) {
      this.hiderStyle.width = width - this.instance.getSetting('scrollbarWidth') + 'px';
    }
    else {
      this.hiderStyle.width = width + 'px';
    }
  }
};

WalkontableTable.prototype.refreshStretching = function () {
  var instance = this.instance
    , stretchH = instance.getSetting('stretchH')
    , scrollH = instance.getSetting('scrollH')
    , scrollbarWidth = instance.getSetting('scrollbarWidth')
    , totalColumns = instance.getSetting('totalColumns')
    , offsetColumn = instance.getSetting('offsetColumn')
    , rowHeaderWidth = instance.hasSetting('rowHeaders') ? instance.getSetting('rowHeaderWidth') : 0
    , containerWidth = this.instance.getSetting('width') - rowHeaderWidth;

  var containerWidthFn = function (cacheWidth) {
    if (scrollH === 'scroll' || (scrollH === 'auto' && cacheWidth > containerWidth)) {
      return containerWidth - scrollbarWidth;
    }
    return containerWidth;
  };

  var columnWidthFn = function (index) {
    return instance.getSetting('columnWidth', index)
  };

  if (stretchH === 'hybrid') {
    if (offsetColumn > 0) {
      stretchH = 'last';
    }
    else {
      stretchH = 'none';
    }
  }

  this.columnStrategy = new WalkontableColumnStrategy(containerWidthFn, totalColumns ? [offsetColumn, totalColumns - 1] : null, columnWidthFn, stretchH);
  this.rowStrategy = {
    cells: [],
    cellCount: 0,
    remainingSize: 0
  }
};

WalkontableTable.prototype.adjustAvailableNodes = function () {
  var displayTds
    , displayThs = this.instance.hasSetting('rowHeaders') ? 1 : 0
    , TR;

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
  if (this.instance.hasSetting('columnHeaders')) {
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
  if (!selectionsOnly) {
    this.tableOffset = this.wtDom.offset(this.TABLE);
    // this.TABLE.removeChild(this.TBODY); //possible future optimization - http://jsperf.com/table-scrolling/9
    this.adjustAvailableNodes();
    this._doDraw();
    // this.TABLE.appendChild(this.TBODY);
  }

  this.refreshPositions(selectionsOnly);

  this.instance.drawn = true;
  return this;
};

WalkontableTable.prototype._doDraw = function () {
  var r = 0
    , c
    , offsetRow = this.instance.getSetting('offsetRow')
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , totalRows = this.instance.getSetting('totalRows')
    , displayTds = this.columnStrategy.cellCount
    , rowHeaders = this.instance.hasSetting('rowHeaders')
    , displayThs = rowHeaders ? 1 : 0
    , TR
    , TD;

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
  var columnHeaders = this.instance.hasSetting('columnHeaders');
  if (columnHeaders) {
    TR = this.THEAD.firstChild;
    if (displayThs) {
      TD = TR.firstChild; //actually it is TH but let's reuse single variable
      this.wtDom.empty(TD);
      if (this.hasEmptyCellProblem) { //IE7
        TD.innerHTML = '&nbsp;';
      }
    }
  }

  for (c = 0; c < displayTds; c++) {
    if (columnHeaders) {
      this.instance.getSetting('columnHeaders', offsetColumn + c, TR.childNodes[displayThs + c]);
    }
    this.COLGROUP.childNodes[c + displayThs].style.width = this.columnStrategy.getSize(offsetColumn + c) + 'px';
  }

  //draw TBODY
  this.wtDom.tdResetCache();
  while (offsetRow + r < totalRows) {
    if (r >= this.tbodyChildrenLength) {
      TR = document.createElement('TR');
      if (displayThs) {
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
    this.rowStrategy.cells.push(offsetRow + r);
    this.rowStrategy.cellCount++;

    //TH
    if (displayThs) {
      this.instance.getSetting('rowHeaders', offsetRow + r, TR.firstChild);
    }

    //TD
    this.adjustColumns(TR, displayTds + displayThs);

    for (c = 0; c < displayTds; c++) {
      if (c === 0) {
        TD = TR.childNodes[c + displayThs];
      }
      else {
        TD = TD.nextSibling; //http://jsperf.com/nextsibling-vs-indexed-childnodes
      }
      TD.className = '';
      TD.removeAttribute('style');
      this.instance.getSetting('cellRenderer', offsetRow + r, this.columnStrategy.cells[c], TD);
      if (this.hasEmptyCellProblem && TD.innerHTML === '') { //IE7
        TD.innerHTML = '&nbsp;';
      }
    }

    //after last column is rendered, check if last cell is fully displayed
    var isCellVisible = this.isCellVisible(offsetRow + r, this.columnStrategy.cells[c], TD);
    if (isCellVisible & (FLAG_NOT_VISIBLE_VERTICAL | FLAG_PARTIALLY_VISIBLE_VERTICAL)) { //when it is invisible or partially visible, don't render more rows
      break;
    }

    r++;
  }
  while (this.tbodyChildrenLength > totalRows - offsetRow) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.tbodyChildrenLength--;
  }
};

WalkontableTable.prototype.refreshPositions = function (selectionsOnly) {
  this.instance.wtScroll.refreshScrollbars();
  this.refreshHiderDimensions();
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

WalkontableTable.prototype.isCellVisible = function (r, c, TD) {
  var out = 0
    , cellOffset = this.wtDom.offset(TD)
    , tableOffset = this.tableOffset
    , innerOffsetTop = cellOffset.top - tableOffset.top
    , $td = $(TD)
    , height = $td.outerHeight()
    , tableHeight = this.instance.hasSetting('height') ? this.instance.getSetting('height') : Infinity;

  this.instance.wtSettings.rowHeightCache[r] = height;


  if (innerOffsetTop > tableHeight) {
    out |= FLAG_NOT_VISIBLE_VERTICAL;
  }
  else if (innerOffsetTop + height > tableHeight) {
    this.rowStrategy.remainingSize = tableHeight - innerOffsetTop; //hackish but enough
    out |= FLAG_PARTIALLY_VISIBLE_VERTICAL;
  }
  else {
    out |= FLAG_VISIBLE_VERTICAL;
  }

  if (this.columnStrategy.cells.indexOf(c) > -1) {
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
  else if (coords[0] > this.getLastVisibleRow()) {
    return -2; //row after viewport
  }
  else {
    var offsetColumn = this.instance.getSetting('offsetColumn');
    if (coords[1] < offsetColumn) {
      return -3; //column before viewport
    }
    else if (coords[1] > this.getLastVisibleColumn()) {
      return -4; //column after viewport
    }
    else {
      var displayThs = this.instance.hasSetting('rowHeaders') ? 1 : 0
        , tr = this.TBODY.childNodes[coords[0] - offsetRow];

      /*if (typeof tr === "undefined") { //this block is only needed in async mode
        this.adjustAvailableNodes();
        tr = this.TBODY.childNodes[coords[0] - offsetRow];
      }*/

      return tr.childNodes[coords[1] - offsetColumn + displayThs];
    }
  }
};

WalkontableTable.prototype.getCoords = function (TD) {
  var displayThs = this.instance.hasSetting('rowHeaders') ? 1 : 0;
  return [
    this.wtDom.prevSiblings(TD.parentNode).length + this.instance.getSetting('offsetRow'),
    TD.cellIndex + this.instance.getSetting('offsetColumn') - displayThs
  ];
};

WalkontableTable.prototype.countVisibleRows = function () {
  return this.rowStrategy.cellCount;
};

WalkontableTable.prototype.countVisibleColumns = function () {
  return this.columnStrategy.cellCount;
};

WalkontableTable.prototype.getLastVisibleRow = function () {
  return this.rowStrategy.cells[this.rowStrategy.cellCount - 1];
};

WalkontableTable.prototype.getLastVisibleColumn = function () {
  return this.columnStrategy.cells[this.columnStrategy.cellCount - 1];
};

WalkontableTable.prototype.isLastRowIncomplete = function () {
  return (this.rowStrategy.remainingSize > 0);
};

WalkontableTable.prototype.isLastColumnIncomplete = function () {
  return (this.columnStrategy.remainingSize > 0);
};