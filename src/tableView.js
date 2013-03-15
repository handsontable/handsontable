/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this;
  var $window = $(window);

  this.instance = instance;
  var settings = this.instance.getSettings();

  instance.rootElement.data('originalStyle', instance.rootElement.attr('style')); //needed to retrieve original style in jsFiddle link generator in HT examples. may be removed in future versions
  instance.rootElement.addClass('handsontable');
  var $table = $('<table class="htCore"><thead></thead><tbody></tbody></table>');

  instance.$table = $table;
  instance.rootElement.prepend($table);

  this.overflow = instance.rootElement.css('overflow');
  if ((settings.width || settings.height) && !(this.overflow === 'scroll' || this.overflow === 'auto')) {
    this.overflow = 'auto';
  }
  if (this.overflow === 'scroll' || this.overflow === 'auto') {
    instance.rootElement[0].style.overflow = 'visible';
    //instance.rootElement[0].style.overflow = 'hidden';
  }
  this.determineContainerSize();
  //instance.rootElement[0].style.height = '';
  //instance.rootElement[0].style.width = '';

  $(document.body).on('keyup', function (event) {
    if (instance.selection.isInProgress() && !event.shiftKey) {
      instance.selection.finish();
    }
  });

  var isMouseDown
    , dragInterval;

  $(document.body).on('mouseup', function (event) {
    if (instance.selection.isInProgress() && event.which === 1) { //is left mouse button
      instance.selection.finish();
    }

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

  $(document.documentElement).on('mousedown', function (event) {
    var next = event.target;
    if (next !== that.wt.wtTable.spreader) { //immediate click on "spreader" means click on the right side of vertical scrollbar
      while (next !== null && next !== document.documentElement) {
        if (next === instance.rootElement[0] || $(next).attr('id') === 'context-menu-layer' || $(next).is('.context-menu-list') || $(next).is('.typeahead li')) {
          return; //click inside container
        }
        next = next.parentNode;
      }
    }

    if (that.instance.getSettings().outsideClickDeselects) {
      that.instance.deselectCell();
    }
    else {
      that.instance.destroyEditor();
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
      , width = that.containerWidth - that.wt.getSetting('scrollbarWidth') - 2 * tolerance
      , height = that.containerHeight - that.wt.getSetting('scrollbarHeight') - 2 * tolerance
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

  var clearTextSelection = function () {
    //http://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
  };

  var walkontableConfig = {
    table: $table[0],
    async: settings.asyncRendering,
    stretchH: settings.stretchH,
    data: instance.getDataAtCell,
    totalRows: instance.countRows,
    totalColumns: instance.countCols,
    offsetRow: 0,
    offsetColumn: 0,
    displayRows: null,
    displayColumns: null,
    width: this.containerWidth,
    height: this.containerHeight,
    frozenColumns: settings.rowHeaders ? [instance.getRowHeader] : null,
    columnHeaders: settings.colHeaders ? instance.getColHeader : null,
    columnWidth: instance.getColWidth,
    cellRenderer: function (row, column, TD) {
      that.applyCellTypeMethod('renderer', TD, row, column);
    },
    selections: {
      current: {
        className: 'current',
        highlightRowClassName: settings.currentRowClassName,
        highlightColumnClassName: settings.currentColClassName,
        border: {
          width: 2,
          color: '#5292F7',
          style: 'solid',
          cornerVisible: function () {
            return settings.fillHandle && !that.isCellEdited() && !instance.selection.isMultiple()
          }
        }
      },
      area: {
        className: 'area',
        highlightRowClassName: settings.currentRowClassName,
        highlightColumnClassName: settings.currentColClassName,
        border: {
          width: 1,
          color: '#89AFF9',
          style: 'solid',
          cornerVisible: function () {
            return settings.fillHandle && !that.isCellEdited() && instance.selection.isMultiple()
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
      TD.focus();
      event.preventDefault();
      clearTextSelection();
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
    onCellCornerDblClick: function () {
      instance.autofill.selectAdjacent();
    },
    onDraw: function () {
      $window.trigger('resize');
    }
  };

  Handsontable.PluginHooks.run(this.instance, 'walkontableConfig', walkontableConfig);

  this.wt = new Walkontable(walkontableConfig);
  this.instance.forceFullRender = true; //used when data was changed
  this.render();

  $window.on('resize', function () {
    that.instance.registerTimeout('resizeTimeout', function () {
      var lastContainerWidth = that.containerWidth;
      var lastContainerHeight = that.containerHeight;
      that.determineContainerSize();
      if (lastContainerWidth !== that.containerWidth || lastContainerHeight !== that.containerHeight) {
        that.wt.update('width', that.containerWidth);
        that.wt.update('height', that.containerHeight);
        that.instance.forceFullRender = true;
        that.render();
      }
    }, 60);
  });

  $(that.wt.wtTable.spreader).on('mousedown.handsontable, contextmenu.handsontable', function (event) {
    if (event.target === that.wt.wtTable.spreader && event.which === 3) { //right mouse button exactly on spreader means right clickon the right hand side of vertical scrollbar
      event.stopPropagation();
    }
  });

  $table[0].focus(); //otherwise TextEditor tests do not pass in IE8
};

Handsontable.TableView.prototype.isCellEdited = function () {
  return (this.instance.textEditor && this.instance.textEditor.isCellEdited) || (this.instance.autocompleteEditor && this.instance.autocompleteEditor.isCellEdited);
};

Handsontable.TableView.prototype.determineContainerSize = function () {
  var settings = this.instance.getSettings();
  this.containerWidth = settings.width;
  this.containerHeight = settings.height;

  var computedWidth = this.instance.rootElement.width();
  var computedHeight = this.instance.rootElement.height();
  if (settings.width === void 0 && computedWidth > 0) {
    this.containerWidth = computedWidth;
  }

  if (this.overflow === 'scroll' || this.overflow === 'auto') {
    if (settings.height === void 0 && computedHeight > 0) {
      this.containerHeight = computedHeight;
    }
  }
};

Handsontable.TableView.prototype.render = function () {
  if (this.instance.forceFullRender) {
    Handsontable.PluginHooks.run(this.instance, 'beforeRender');
  }
  this.wt.draw(!this.instance.forceFullRender);
  this.instance.rootElement.triggerHandler('render.handsontable');
  if (this.instance.forceFullRender) {
    Handsontable.PluginHooks.run(this.instance, 'afterRender');
  }
  this.instance.forceFullRender = false;
};

Handsontable.TableView.prototype.applyCellTypeMethod = function (methodName, td, row, col) {
  var prop = this.instance.colToProp(col)
    , cellProperties = this.instance.getCellMeta(row, col);
  if (cellProperties[methodName]) {
    return cellProperties[methodName](this.instance, td, row, col, prop, this.instance.getDataAtRowProp(row, prop), cellProperties);
  }
};

/**
 * Returns td object given coordinates
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords) {
  var td = this.wt.wtTable.getCell([coords.row, coords.col]);
  if (td < 0) { //there was an exit code (cell is out of bounds)
    return null;
  }
  else {
    return td;
  }
};

/**
 * Scroll viewport to selection
 * @param coords
 */
Handsontable.TableView.prototype.scrollViewport = function (coords) {
  this.wt.scrollViewport([coords.row, coords.col]);
};