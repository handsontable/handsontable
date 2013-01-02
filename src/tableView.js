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
  var overflow = instance.rootElement[0].style.overflow;
  var myWidth = settings.width;
  var myHeight = settings.height;
  if ((myWidth || myHeight) && !(overflow === 'scroll' || overflow === 'auto')) {
    overflow = 'auto';
  }
  if (overflow === 'scroll' || overflow === 'auto') {
    instance.rootElement[0].style.overflow = 'visible';
    if (settings.width === void 0 && parseInt(instance.rootElement[0].style.width) > 0) {
      myWidth = parseInt(instance.rootElement[0].style.width);
      instance.rootElement[0].style.width = '';
    }
    if (settings.height === void 0 && parseInt(instance.rootElement[0].style.height) > 0) {
      myHeight = parseInt(instance.rootElement[0].style.height);
      instance.rootElement[0].style.height = '';
    }
  }

  var isMouseDown
    , dragInterval;

  $(document.body).on('mouseup', function () {
    isMouseDown = false;
    clearInterval(dragInterval);
    dragInterval = null;

    if (instance.autofill.handle && instance.autofill.handle.isDragged) {
      if (instance.autofill.handle.isDragged > 1) {
        instance.autofill.apply();
      }
      instance.autofill.handle.isDragged = 0;
    }
  });

  $table.on('selectstart', function (event) {
    //https://github.com/warpech/jquery-handsontable/issues/160
    //selectstart is IE only event. Prevent text from being selected when performing drag down in IE8
    event.preventDefault();
  });

  $table.on('mouseenter', function () {
    if (dragInterval) { //if dragInterval was set (that means mouse was really outside of table, not over an element that is outside of <table> in DOM
      clearInterval(dragInterval);
      dragInterval = null;
    }
  });

  $table.on('mouseleave', function (event) {
    if (!(isMouseDown || (instance.autofill.handle && instance.autofill.handle.isDragged))) {
      return;
    }

    var tolerance = 1 //this is needed because width() and height() contains stuff like cell borders
      , offset = that.wt.wtDom.offset($table[0])
      , offsetTop = offset.top + tolerance
      , offsetLeft = offset.left + tolerance
      , width = myWidth - that.wt.settings.scrollbarWidth - 2 * tolerance
      , height = myHeight - that.wt.settings.scrollbarHeight - 2 * tolerance
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
        if (isMouseDown || (instance.autofill.handle && instance.autofill.handle.isDragged)) {
          //instance.selection.transformEnd(row, col);
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
    columnWidth: instance.getColWidth,
    cellRenderer: function (row, column, TD) {
      that.applyCellTypeMethod('renderer', TD, {row: row, col: column}, instance.getDataAtCell(row, column));
    },
    selections: {
      current: {
        className: 'current',
        border: {
          width: 2,
          color: '#5292F7',
          style: 'solid',
          cornerVisible: function () {
            return settings.fillHandle && !texteditor.isCellEdited && !instance.selection.isMultiple()
          }
        }
      },
      area: {
        className: 'area',
        border: {
          width: 1,
          color: '#89AFF9',
          style: 'solid',
          cornerVisible: function () {
            return settings.fillHandle && !texteditor.isCellEdited && instance.selection.isMultiple()
          }
        }
      },
      fill: {
        className: 'fill',
        border: {
          width: 1,
          color: 'red',
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
      else if (instance.autofill.handle && instance.autofill.handle.isDragged) {
        instance.autofill.handle.isDragged++;
        instance.autofill.showBorder(coords);
      }
    },
    onCellCornerMouseDown: function (event) {
      instance.autofill.handle.isDragged = 1;
      event.preventDefault();
    },
    onCellCornerDblClick: function (event) {
      instance.autofill.selectAdjacent();
    }
  };

  Handsontable.PluginHooks.run(this.instance, 'walkontableConfig', [walkontableConfig]);

  this.wt = new Walkontable(walkontableConfig);
  this.instance.forceFullRender = true; //used when data was changed
  this.render();
};

Handsontable.TableView.prototype.render = function () {
  this.wt.draw(!this.instance.forceFullRender);
  this.instance.rootElement.triggerHandler('render.handsontable');
  this.instance.forceFullRender = false;
};

Handsontable.TableView.prototype.applyCellTypeMethod = function (methodName, td, coords, extraParam) {
  var prop = this.instance.colToProp(coords.col)
    , method
    , cellProperties = this.instance.getCellMeta(coords.row, coords.col);

  if (typeof cellProperties.type === 'string') {
    switch (cellProperties.type) {
      case 'autocomplete':
        cellProperties.type = Handsontable.AutocompleteCell;
        break;

      case 'checkbox':
        cellProperties.type = Handsontable.CheckboxCell;
        break;
    }
  }

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