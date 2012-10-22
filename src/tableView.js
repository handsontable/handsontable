/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this;
  this.instance = instance;
  var priv = {};

  var interaction = {
    onMouseDown: function (event) {
      priv.isMouseDown = true;
      if (event.button === 2 && that.instance.selection.inInSelection(that.getCellCoords(this))) { //right mouse button
        //do nothing
      }
      else if (event.shiftKey) {
        that.instance.selection.setRangeEnd(this);
      }
      else {
        that.instance.selection.setRangeStart(this);
      }
    },

    onMouseOver: function () {
      if (priv.isMouseDown) {
        that.instance.selection.setRangeEnd(this);
      }
      else if (that.instance.autofill.handle && that.instance.autofill.handle.isDragged) {
        that.instance.autofill.handle.isDragged++;
        that.instance.autofill.showBorder(this);
      }
    },

    onMouseWheel: function (event, delta, deltaX, deltaY) {
      if (priv.virtualScroll) {
        if (deltaY) {
          priv.virtualScroll.scrollTop(priv.virtualScroll.scrollTop() + 44 * -deltaY);
        }
        else if (deltaX) {
          priv.virtualScroll.scrollLeft(priv.virtualScroll.scrollLeft() + 100 * deltaX);
        }
        event.preventDefault();
      }
    }
  };


  that.instance.container = $('<div class="handsontable"></div>');
  var overflow = that.instance.rootElement.css('overflow');
  if (overflow === 'auto' || overflow === 'scroll') {
    that.instance.container[0].style.overflow = overflow;
    var w = that.instance.rootElement.css('width');
    if (w) {
      that.instance.container[0].style.width = w;
    }
    var h = that.instance.rootElement.css('height');
    if (h) {
      that.instance.container[0].style.height = h;
    }
    that.instance.rootElement[0].style.overflow = 'hidden';
    that.instance.rootElement[0].style.position = 'relative';
  }
  that.instance.rootElement.append(that.instance.container);

//this.init

  function onMouseEnterTable() {
    priv.isMouseOverTable = true;
  }

  function onMouseLeaveTable() {
    priv.isMouseOverTable = false;
  }

  that.instance.curScrollTop = that.instance.curScrollLeft = 0;
  that.instance.lastScrollTop = that.instance.lastScrollLeft = null;
  this.scrollbarSize = this.measureScrollbar();

  var div = $('<div><table class="htCore" cellspacing="0" cellpadding="0"><thead></thead><tbody></tbody></table></div>');
  priv.tableContainer = div[0];
  that.instance.table = $(priv.tableContainer.firstChild);
  this.$tableBody = that.instance.table.find("tbody")[0];
  that.instance.table.on('mousedown', 'td', interaction.onMouseDown);
  that.instance.table.on('mouseover', 'td', interaction.onMouseOver);
  that.instance.table.on('mousewheel', 'td', interaction.onMouseWheel);
  that.instance.container.append(div);

  //...


  that.instance.container.on('mouseenter', onMouseEnterTable).on('mouseleave', onMouseLeaveTable);


  function onMouseUp() {
    if (priv.isMouseDown) {
      setTimeout(that.instance.editproxy.focus, 1);
    }
    priv.isMouseDown = false;
    if (that.instance.autofill.handle && that.instance.autofill.handle.isDragged) {
      if (that.instance.autofill.handle.isDragged > 1) {
        that.instance.autofill.apply();
      }
      that.instance.autofill.handle.isDragged = 0;
    }
  }

  function onOutsideClick(event) {
    if (that.instance.getSettings().outsideClickDeselects) {
      setTimeout(function () {//do async so all mouseenter, mouseleave events will fire before
        if (!priv.isMouseOverTable && event.target !== priv.tableContainer && $(event.target).attr('id') !== 'context-menu-layer') { //if clicked outside the table or directly at container which also means outside
          that.instance.selection.deselect();
        }
      }, 1);
    }
  }

  $("html").on('mouseup', onMouseUp).
    on('click', onOutsideClick);

  if (that.instance.container[0].tagName.toLowerCase() !== "html" && that.instance.container[0].tagName.toLowerCase() !== "body" && (that.instance.container.css('overflow') === 'scroll' || that.instance.container.css('overflow') === 'auto')) {
    that.scrollable = that.instance.container;
  }

  if (that.scrollable) {
    //create fake scrolling div
    priv.virtualScroll = $('<div class="virtualScroll"><div class="spacer"></div></div>');
    that.scrollable = priv.virtualScroll;
    that.instance.container.before(priv.virtualScroll);
    that.instance.table[0].style.position = 'absolute';
    priv.virtualScroll.css({
      width: that.instance.container.width() + 'px',
      height: that.instance.container.height() + 'px',
      overflow: that.instance.container.css('overflow')
    });
    that.instance.container.css({
      overflow: 'hidden',
      position: 'absolute',
      top: '0px',
      left: '0px'
    });
    that.instance.container.width(priv.virtualScroll.innerWidth() - this.scrollbarSize.width);
    that.instance.container.height(priv.virtualScroll.innerHeight() - this.scrollbarSize.height);
    setInterval(function () {
      priv.virtualScroll.find('.spacer').height(that.instance.table.height());
      priv.virtualScroll.find('.spacer').width(that.instance.table.width());
    }, 100);

    that.scrollable.scrollTop(0);
    that.scrollable.scrollLeft(0);

    that.scrollable.on('scroll.handsontable', function () {
      that.instance.curScrollTop = that.scrollable[0].scrollTop;
      that.instance.curScrollLeft = that.scrollable[0].scrollLeft;

      if (that.instance.curScrollTop !== that.instance.lastScrollTop) {
        that.instance.blockedRows.refreshBorders();
        that.instance.blockedCols.main[0].style.top = -that.instance.curScrollTop + 'px';
        that.instance.table[0].style.top = -that.instance.curScrollTop + 'px';
      }

      if (that.instance.curScrollLeft !== that.instance.lastScrollLeft) {
        that.instance.blockedCols.refreshBorders();
        that.instance.blockedRows.main[0].style.left = -that.instance.curScrollLeft + 'px';
        that.instance.table[0].style.left = -that.instance.curScrollLeft + 'px';
      }

      if (that.instance.curScrollTop !== that.instance.lastScrollTop || that.instance.curScrollLeft !== that.instance.lastScrollLeft) {
        that.instance.selection.refreshBorders();

        if (that.instance.blockedCorner) {
          if (that.instance.curScrollTop === 0 && that.instance.curScrollLeft === 0) {
            that.instance.blockedCorner.find("th:last-child").css({borderRightWidth: 0});
            that.instance.blockedCorner.find("tr:last-child th").css({borderBottomWidth: 0});
          }
          else if (that.instance.lastScrollTop === 0 && that.instance.lastScrollLeft === 0) {
            that.instance.blockedCorner.find("th:last-child").css({borderRightWidth: '1px'});
            that.instance.blockedCorner.find("tr:last-child th").css({borderBottomWidth: '1px'});
          }
        }
      }

      that.instance.lastScrollTop = that.instance.curScrollTop;
      that.instance.lastScrollLeft = that.instance.curScrollLeft;

      that.instance.selection.refreshBorders();
    });

    Handsontable.PluginHooks.push('afterInit', function () {
      that.scrollable.trigger('scroll.handsontable');
    });
  }
  else {
    that.scrollable = $(window);
    if (that.instance.blockedCorner) {
      that.instance.blockedCorner.find("th:last-child").css({borderRightWidth: 0});
      that.instance.blockedCorner.find("tr:last-child th").css({borderBottomWidth: 0});
    }
  }

  that.scrollable.on('scroll', function (e) {
    e.stopPropagation();
  });

  $(window).on('resize', function () {
    //https://github.com/warpech/jquery-handsontable/issues/193
    that.instance.blockedCols.update();
    that.instance.blockedRows.update();
  });

  $('.context-menu-root').on('mouseenter', onMouseEnterTable).on('mouseleave', onMouseLeaveTable);

};

/**
 * Measure the width and height of browser scrollbar
 * @return {Object}
 */
Handsontable.TableView.prototype.measureScrollbar = function () {
  var div = $('<div style="width:150px;height:150px;overflow:hidden;position:absolute;top:200px;left:200px"><div style="width:100%;height:100%;position:absolute">x</div>');
  $('body').append(div);
  var subDiv = $(div[0].firstChild);
  var w1 = subDiv.innerWidth();
  var h1 = subDiv.innerHeight();
  div[0].style.overflow = 'scroll';
  w1 -= subDiv.innerWidth();
  h1 -= subDiv.innerHeight();
  if (w1 === 0) {
    w1 = 17;
  }
  if (h1 === 0) {
    h1 = 17;
  }
  div.remove();
  return {width: w1, height: h1};
};

/**
 * Creates row at the bottom of the <table>
 * @param {Object} [coords] Optional. Coords of the cell before which the new row will be inserted
 */
Handsontable.TableView.prototype.createRow = function (coords) {
  var tr, c, r, td, p;
  tr = document.createElement('tr');
  this.instance.blockedCols.createRow(tr);
  for (c = 0; c < this.instance.colCount; c++) {
    tr.appendChild(td = document.createElement('td'));
    this.instance.minWidthFix(td);
  }
  if (!coords || coords.row >= this.instance.rowCount) {
    this.$tableBody.appendChild(tr);
    r = this.instance.rowCount;
  }
  else {
    var oldTr = this.instance.getCell(coords.row, coords.col).parentNode;
    this.$tableBody.insertBefore(tr, oldTr);
    r = coords.row;
  }
  this.instance.rowCount++;
  for (c = 0; c < this.instance.colCount; c++) {
    p = this.instance.colToProp(c);
    this.render(r, c, p, this.instance.getData()[r][p]);
  }
};

/**
 * Creates col at the right of the <table>
 * @param {Object} [coords] Optional. Coords of the cell before which the new column will be inserted
 */
Handsontable.TableView.prototype.createCol = function (coords) {
  var trs = this.$tableBody.childNodes, r, c, td, p;
  this.instance.blockedRows.createCol();
  if (!coords || coords.col >= this.instance.colCount) {
    for (r = 0; r < this.instance.rowCount; r++) {
      trs[r].appendChild(td = document.createElement('td'));
      this.instance.minWidthFix(td);
    }
    c = this.instance.colCount;
  }
  else {
    for (r = 0; r < this.instance.rowCount; r++) {
      trs[r].insertBefore(td = document.createElement('td'), this.instance.getCell(r, coords.col));
      this.instance.minWidthFix(td);
    }
    c = coords.col;
  }
  this.instance.colCount++;
  for (r = 0; r < this.instance.rowCount; r++) {
    p = this.instance.colToProp(c);
    this.render(r, c, p, this.instance.getData()[r][p]);
  }
};

/**
 * Removes row at the bottom of the <table>
 * @param {Object} [coords] Optional. Coords of the cell which row will be removed
 * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all rows will be removed
 */
Handsontable.TableView.prototype.removeRow = function (coords, toCoords) {
  if (!coords || coords.row === this.instance.rowCount - 1) {
    $(this.$tableBody.childNodes[this.instance.rowCount - 1]).remove();
    this.instance.rowCount--;
  }
  else {
    for (var i = toCoords.row; i >= coords.row; i--) {
      $(this.$tableBody.childNodes[i]).remove();
      this.instance.rowCount--;
    }
  }
};

/**
 * Removes col at the right of the <table>
 * @param {Object} [coords] Optional. Coords of the cell which col will be removed
 * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all cols will be removed
 */
Handsontable.TableView.prototype.removeCol = function (coords, toCoords) {
  var trs = this.$tableBody.childNodes, colThs, i;
  if (this.instance.blockedRows) {
    colThs = this.instance.table.find('thead th');
  }
  var r = 0;
  if (!coords || coords.col === this.instance.colCount - 1) {
    for (; r < this.instance.rowCount; r++) {
      $(trs[r].childNodes[this.instance.colCount + this.instance.blockedCols.count() - 1]).remove();
      if (colThs) {
        colThs.eq(this.instance.colCount + this.instance.blockedCols.count() - 1).remove();
      }
    }
    this.instance.colCount--;
  }
  else {
    for (; r < this.instance.rowCount; r++) {
      for (i = toCoords.col; i >= coords.col; i--) {
        $(trs[r].childNodes[i + this.instance.blockedCols.count()]).remove();

      }
    }
    if (colThs) {
      for (i = toCoords.col; i >= coords.col; i--) {
        colThs.eq(i + this.instance.blockedCols.count()).remove();
      }
    }
    this.instance.colCount -= toCoords.col - coords.col + 1;
  }
};


Handsontable.TableView.prototype.render = function (row, col, prop, value) {
  var coords = {row: row, col: col};
  var td = this.instance.getCell(row, col);
  this.applyCellTypeMethod('renderer', td, coords, value);
  this.instance.minWidthFix(td);
  return td;
};


Handsontable.TableView.prototype.applyCellTypeMethod = function (methodName, td, coords, extraParam) {
  var prop = this.instance.colToProp(coords.col)
    , method
    , cellProperties = this.instance.getCellMeta(coords.row, coords.col)
    , settings = this.instance.getSettings();

  if (cellProperties.type && typeof cellProperties.type[methodName] === "function") {
    method = cellProperties.type[methodName];
  }
  else if (settings.autoComplete) {
    for (var i = 0, ilen = settings.autoComplete.length; i < ilen; i++) {
      if (settings.autoComplete[i].match(coords.row, coords.col, this.instance.getData())) {
        method = Handsontable.AutocompleteCell[methodName];
        cellProperties.autoComplete = settings.autoComplete[i];
        break;
      }
    }
  }
  if (typeof method !== "function") {
    method = Handsontable.TextCell[methodName];
  }
  return method(this.instance, td, coords.row, coords.col, prop, extraParam, cellProperties);
};

/**
 * Returns coordinates given td object
 */
Handsontable.TableView.prototype.getCellCoords = function (td) {
  return {
    row: td.parentNode.rowIndex - this.instance.blockedRows.count(),
    col: td.cellIndex - this.instance.blockedCols.count()
  };
};

/**
 * Returns td object given coordinates
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords) {
  if (coords.row < 0 || coords.col < 0) {
    return null;
  }
  var tr = this.$tableBody.childNodes[coords.row];
  if (tr) {
    return tr.childNodes[coords.col + this.instance.blockedCols.count()];
  }
  else {
    return null;
  }
};

/**
 * Returns all td objects in grid
 */
Handsontable.TableView.prototype.getAllCells = function () {
  var tds = [], trs, r, rlen, c, clen;
  trs = this.$tableBody.childNodes;
  rlen = this.instance.rowCount;
  if (rlen > 0) {
    clen = this.instance.colCount;
    for (r = 0; r < rlen; r++) {
      for (c = 0; c < clen; c++) {
        tds.push(trs[r].childNodes[c + this.instance.blockedCols.count()]);
      }
    }
  }
  return tds;
};

/**
 * Scroll viewport to selection
 * @param td
 */
Handsontable.TableView.prototype.scrollViewport = function (td) {
  if (!this.instance.selection.isSelected()) {
    return false;
  }

  var $td = $(td);
  var tdOffset = $td.offset();
  var scrollLeft = this.scrollable.scrollLeft(); //scrollbar position
  var scrollTop = this.scrollable.scrollTop(); //scrollbar position
  var scrollOffset = this.scrollable.offset();
  var rowHeaderWidth = this.instance.blockedCols.count() ? $(this.instance.blockedCols.main[0].firstChild).outerWidth() : 2;
  var colHeaderHeight = this.instance.blockedRows.count() ? $(this.instance.blockedRows.main[0].firstChild).outerHeight() : 2;

  var offsetTop = tdOffset.top;
  var offsetLeft = tdOffset.left;
  var scrollWidth, scrollHeight;
  if (scrollOffset) { //if is not the window
    scrollWidth = this.scrollable.outerWidth();
    scrollHeight = this.scrollable.outerHeight();
    offsetTop += scrollTop - scrollOffset.top;
    offsetLeft += scrollLeft - scrollOffset.left;
  }
  else {
    scrollWidth = this.scrollable.width(); //don't use outerWidth with window (http://api.jquery.com/outerWidth/)
    scrollHeight = this.scrollable.height();
  }
  scrollWidth -= this.scrollbarSize.width;
  scrollHeight -= this.scrollbarSize.height;

  var height = $td.outerHeight();
  var width = $td.outerWidth();

  var that = this;
  if (scrollLeft + scrollWidth <= offsetLeft + width) {
    setTimeout(function () {
      that.scrollable.scrollLeft(offsetLeft + width - scrollWidth);
    }, 1);
  }
  else if (scrollLeft > offsetLeft - rowHeaderWidth) {
    setTimeout(function () {
      that.scrollable.scrollLeft(offsetLeft - rowHeaderWidth);
    }, 1);
  }

  if (scrollTop + scrollHeight <= offsetTop + height) {
    setTimeout(function () {
      that.scrollable.scrollTop(offsetTop + height - scrollHeight);
    }, 1);
  }
  else if (scrollTop > offsetTop - colHeaderHeight) {
    setTimeout(function () {
      that.scrollable.scrollTop(offsetTop - colHeaderHeight);
    }, 1);
  }
};