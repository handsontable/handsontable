/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this;

  this.instance = instance;
  var settings = this.instance.getSettings();

  instance.rootElement.addClass('handsontable');
  var $table = $('<table class="htCore"><thead></thead><tbody></tbody></table>');
  instance.rootElement.prepend($table);
  var overflow = instance.rootElement.css('overflow');
  var myWidth = settings.width;
  var myHeight = settings.height;
  if (overflow === 'scroll' || overflow === 'auto') {
    instance.rootElement.css('overflow', 'visible');
    if (settings.width === void 0 && parseInt(instance.rootElement.css('width')) > 0) {
      myWidth = parseInt(instance.rootElement.css('width'));
      instance.rootElement[0].style.width = '';
    }
    if (settings.height === void 0 && parseInt(instance.rootElement.css('height')) > 0) {
      myHeight = parseInt(instance.rootElement.css('height'));
      instance.rootElement[0].style.height = '';
    }
  }

  var isMouseDown
    , dragInterval;

  $(document.body).on('mouseup', function () {
    isMouseDown = false;
    clearInterval(dragInterval);
    dragInterval = null;
  });
  $table.on('mouseenter', function () {
    if (dragInterval) { //if dragInterval was set (that means mouse was really outide of table, not over an element that is outside of <table> in DOM
      clearInterval(dragInterval);
      dragInterval = null;
    }
  });

  $table.on('mouseleave', function (event) {
    var tolerance = 1 //this is needed because width() and height() contains stuff like cell borders
      , offset = that.wt.wtDom.offset($table[0])
      , offsetTop = offset.top + tolerance
      , offsetLeft = offset.left + tolerance
      , width = $table.width() - 2 * tolerance
      , height = $table.height() - 2 * tolerance
      , method
      , row = 0
      , col = 0
      , dragFn;

    if (event.pageY < offsetTop) { //top edge crossed
      row = -1;
      method = 'scrollVertical';
    }
    else if (event.pageY >= offsetTop + height) { //bottom edge crossed
      row = 1;
      method = 'scrollVertical';
    }
    else if (event.pageX < offsetLeft) { //left edge crossed
      col = -1;
      method = 'scrollHorizontal';
    }
    else if (event.pageX >= offsetLeft + width) { //right edge crossed
      col = 1;
      method = 'scrollHorizontal';
    }

    if (method) {
      dragFn = function () {
        if (isMouseDown) {
          instance.selection.transformEnd(row, col);
          that.wt[method](row + col).draw();
        }
      };
      dragFn();
      dragInterval = setInterval(dragFn, 100);
    }
  });

  var walkontableConfig = {
    table: $table[0],
    async: settings.asyncRendering,
    data: instance.getDataAtCell,
    totalRows: instance.countRows,
    totalColumns: instance.countCols,
    offsetRow: 0,
    offsetColumn: 0,
    displayRows: null,
    displayColumns: null,
    width: myWidth,
    height: myHeight,
    frozenColumns: settings.rowHeaders ? [instance.getRowHeader] : null,
    columnHeaders: settings.colHeaders ? instance.getColHeader : null,
    columnWidth: settings.colWidths ? settings.colWidths : null,
    cellRenderer: function (row, column, TD) {
      that.applyCellTypeMethod('renderer', TD, {row: row, col: column}, instance.getDataAtCell(row, column));
    },
    selections: {
      current: {
        className: 'current',
        border: {
          width: 2,
          color: '#5292F7',
          style: 'solid'
        }
      },
      area: {
        className: 'area',
        border: {
          width: 1,
          color: '#89AFF9',
          style: 'solid'
        }
      }
    },
    onCellMouseDown: function (event, coords, TD) {
      isMouseDown = true;
      var coordsObj = {row: coords[0], col: coords[1]};
      if (event.button === 2 && instance.selection.inInSelection(coordsObj)) { //right mouse button
        //do nothing
      }
      else if (event.shiftKey) {
        instance.selection.setRangeEnd(coordsObj);
      }
      else {
        instance.selection.setRangeStart(coordsObj);
      }
    },
    onCellMouseOver: function (event, coords, TD) {
      var coordsObj = {row: coords[0], col: coords[1]};
      if (isMouseDown) {
        instance.selection.setRangeEnd(coordsObj);
      }
      else if (that.instance.autofill.handle && that.instance.autofill.handle.isDragged) {
        that.instance.autofill.handle.isDragged++;
        that.instance.autofill.showBorder(this);
      }
    }
  };

  Handsontable.PluginHooks.run(this.instance, 'walkontableConfig', [walkontableConfig]);

  this.wt = new Walkontable(walkontableConfig);
  this.wt.draw();
};

Handsontable.TableView.prototype.render = function (row, col, prop, value) {
  this.wt.draw();
  this.instance.rootElement.triggerHandler('render.handsontable');
};

Handsontable.TableView.prototype.applyCellTypeMethod = function (methodName, td, coords, extraParam) {
  var prop = this.instance.colToProp(coords.col)
    , method
    , cellProperties = this.instance.getCellMeta(coords.row, coords.col);

  if (cellProperties.type && typeof cellProperties.type[methodName] === "function") {
    method = cellProperties.type[methodName];
  }
  if (typeof method !== "function") {
    method = Handsontable.TextCell[methodName];
  }
  return method(this.instance, td, coords.row, coords.col, prop, extraParam, cellProperties);
};

/**
 * Returns td object given coordinates
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords) {
  return this.wt.wtTable.getCell([coords.row, coords.col]);
};

/**
 * Scroll viewport to selection
 * @param coords
 */
Handsontable.TableView.prototype.scrollViewport = function (coords) {
  this.wt.scrollViewport([coords.row, coords.col]);
};