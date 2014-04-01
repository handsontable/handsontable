/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this
    , $window = $(window)
    , $documentElement = $(document.documentElement);

  this.instance = instance;
  this.settings = instance.getSettings();
  this.settingsFromDOM = instance.getSettingsFromDOM();

  instance.rootElement.data('originalStyle', instance.rootElement[0].getAttribute('style')); //needed to retrieve original style in jsFiddle link generator in HT examples. may be removed in future versions
  // in IE7 getAttribute('style') returns an object instead of a string, but we only support IE8+

  instance.rootElement.addClass('handsontable');

  var table = document.createElement('TABLE');
  table.className = 'htCore';
  this.THEAD = document.createElement('THEAD');
  table.appendChild(this.THEAD);
  this.TBODY = document.createElement('TBODY');
  table.appendChild(this.TBODY);

  instance.$table = $(table);
  instance.rootElement.prepend(instance.$table);

  instance.rootElement.on('mousedown.handsontable', function (event) {
    if (!that.isTextSelectionAllowed(event.target)) {
      clearTextSelection();
      event.preventDefault();
      window.focus(); //make sure that window that contains HOT is active. Important when HOT is in iframe.
    }
  });

  $documentElement.on('keyup.' + instance.guid, function (event) {
    if (instance.selection.isInProgress() && !event.shiftKey) {
      instance.selection.finish();
    }
  });

  var isMouseDown;

  $documentElement.on('mouseup.' + instance.guid, function (event) {
    if (instance.selection.isInProgress() && event.which === 1) { //is left mouse button
      instance.selection.finish();
    }

    isMouseDown = false;

    if (instance.autofill.handle && instance.autofill.handle.isDragged) {
      if (instance.autofill.handle.isDragged > 1) {
        instance.autofill.apply();
      }
      instance.autofill.handle.isDragged = 0;
    }

    if (Handsontable.helper.isOutsideInput(document.activeElement)) {
      instance.unlisten();
    }
  });

  $documentElement.on('mousedown.' + instance.guid, function (event) {
    var next = event.target;

    if (next !== that.wt.wtTable.spreader) { //immediate click on "spreader" means click on the right side of vertical scrollbar
      while (next !== document.documentElement) {
        if (next === null) {
          return; //click on something that was a row but now is detached (possibly because your click triggered a rerender)
        }
        if (next === instance.rootElement[0] || next.nodeName === 'HANDSONTABLE-TABLE') {
          return; //click inside container or Web Component (HANDSONTABLE-TABLE is the name of the custom element)
        }
        next = next.parentNode;
      }
    }

    if (that.settings.outsideClickDeselects) {
      instance.deselectCell();
    }
    else {
      instance.destroyEditor();
    }
  });

  instance.$table.on('selectstart', function (event) {
    if (that.settings.fragmentSelection) {
      return;
    }

    //https://github.com/warpech/jquery-handsontable/issues/160
    //selectstart is IE only event. Prevent text from being selected when performing drag down in IE8
    event.preventDefault();
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
    debug: function () {
      return that.settings.debug;
    },
    table: table,
    stretchH: this.settings.stretchH,
    data: instance.getDataAtCell,
    totalRows: instance.countRows,
    totalColumns: instance.countCols,
    offsetRow: 0,
    offsetColumn: 0,
    width: this.getWidth(),
    height: this.getHeight(),
    fixedColumnsLeft: function () {
      return that.settings.fixedColumnsLeft;
    },
    fixedRowsTop: function () {
      return that.settings.fixedRowsTop;
    },
    rowHeaders: function () {
      return instance.hasRowHeaders() ? [function (index, TH) {
        that.appendRowHeader(index, TH);
      }] : []
    },
    columnHeaders: function () {
      return instance.hasColHeaders() ? [function (index, TH) {
        that.appendColHeader(index, TH);
      }] : []
    },
    columnWidth: instance.getColWidth,
    cellRenderer: function (row, col, TD) {

      var prop = that.instance.colToProp(col)
        , cellProperties = that.instance.getCellMeta(row, col)
        , renderer = that.instance.getCellRenderer(cellProperties);

      var value = that.instance.getDataAtRowProp(row, prop);

      renderer(that.instance, TD, row, col, prop, value, cellProperties);

      Handsontable.hooks.run(that.instance, 'afterRenderer', TD, row, col, prop, value, cellProperties);

    },
    selections: {
      current: {
        className: 'current',
        border: {
          width: 2,
          color: '#5292F7',
          style: 'solid',
          cornerVisible: function () {
            return that.settings.fillHandle && !that.isCellEdited() && !instance.selection.isMultiple()
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
            return that.settings.fillHandle && !that.isCellEdited() && instance.selection.isMultiple()
          }
        }
      },
      highlight: {
        highlightRowClassName: that.settings.currentRowClassName,
        highlightColumnClassName: that.settings.currentColClassName
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
    hideBorderOnMouseDownOver: function () {
      return that.settings.fragmentSelection;
    },
    onCellMouseDown: function (event, coords, TD) {
      instance.listen();

      isMouseDown = true;
      if (event.button === 2 && instance.selection.inInSelection(coords)) { //right mouse button
        //do nothing
      }
      else if (event.shiftKey) {
        instance.selection.setRangeEnd(coords);
      }
      else {
        instance.selection.setRangeStart(coords);
      }

      Handsontable.hooks.run(instance, 'afterOnCellMouseDown', event, coords, TD);
    },
    /*onCellMouseOut: function (/*event, coords, TD* /) {
     if (isMouseDown && that.settings.fragmentSelection === 'single') {
     clearTextSelection(); //otherwise text selection blinks during multiple cells selection
     }
     },*/
    onCellMouseOver: function (event, coords, TD) {
      if (isMouseDown) {
        /*if (that.settings.fragmentSelection === 'single') {
         clearTextSelection(); //otherwise text selection blinks during multiple cells selection
         }*/
        instance.selection.setRangeEnd(coords);
      }
      else if (instance.autofill.handle && instance.autofill.handle.isDragged) {
        instance.autofill.handle.isDragged++;
        instance.autofill.showBorder(coords);
      }
      Handsontable.hooks.run(instance, 'afterOnCellMouseOver', event, coords, TD);
    },
    onCellCornerMouseDown: function (event) {
      instance.autofill.handle.isDragged = 1;
      event.preventDefault();
      Handsontable.hooks.run(instance, 'afterOnCellCornerMouseDown', event);
    },
    onCellCornerDblClick: function () {
      instance.autofill.selectAdjacent();
    },
    beforeDraw: function (force) {
      that.beforeRender(force);
    },
    onDraw: function(force){
      that.onDraw(force);
    },
    onScrollVertically: function () {
      instance.runHooks('afterScrollVertically');
    },
    onScrollHorizontally: function () {
      instance.runHooks('afterScrollHorizontally');
    }
  };

  Handsontable.hooks.run(instance, 'beforeInitWalkontable', walkontableConfig);

  this.wt = new Walkontable(walkontableConfig);

  $window.on('resize.' + instance.guid, function () {
    instance.registerTimeout('resizeTimeout', function () {
      instance.parseSettingsFromDOM();
      var newWidth = that.getWidth();
      var newHeight = that.getHeight();
      if (walkontableConfig.width !== newWidth || walkontableConfig.height !== newHeight) {
        instance.forceFullRender = true;
        that.render();
        walkontableConfig.width = newWidth;
        walkontableConfig.height = newHeight;
      }
    }, 60);
  });

  $(that.wt.wtTable.spreader).on('mousedown.handsontable, contextmenu.handsontable', function (event) {
    if (event.target === that.wt.wtTable.spreader && event.which === 3) { //right mouse button exactly on spreader means right clickon the right hand side of vertical scrollbar
      event.stopPropagation();
    }
  });

  $documentElement.on('click.' + instance.guid, function () {
    if (that.settings.observeDOMVisibility) {
      if (that.wt.drawInterrupted) {
        that.instance.forceFullRender = true;
        that.render();
      }
    }
  });
};

Handsontable.TableView.prototype.isTextSelectionAllowed = function (el) {
  if ( Handsontable.helper.isInput(el) ) {
    return (true);
  }
  if (this.settings.fragmentSelection && this.wt.wtDom.isChildOf(el, this.TBODY)) {
    return (true);
  }
  return false;
};

Handsontable.TableView.prototype.isCellEdited = function () {
  var activeEditor = this.instance.getActiveEditor();
  return activeEditor && activeEditor.isOpened();
};

Handsontable.TableView.prototype.getWidth = function () {
  var val = this.settings.width !== void 0 ? this.settings.width : this.settingsFromDOM.width;
  return typeof val === 'function' ? val() : val;
};

Handsontable.TableView.prototype.getHeight = function () {
  var val = this.settings.height !== void 0 ? this.settings.height : this.settingsFromDOM.height;
  return typeof val === 'function' ? val() : val;
};

Handsontable.TableView.prototype.beforeRender = function (force) {
  if (force) { //force = did Walkontable decide to do full render
    Handsontable.hooks.run(this.instance, 'beforeRender', this.instance.forceFullRender); //this.instance.forceFullRender = did Handsontable request full render?
    this.wt.update('width', this.getWidth());
    this.wt.update('height', this.getHeight());
  }
};

Handsontable.TableView.prototype.onDraw = function(force){
  if (force) { //force = did Walkontable decide to do full render
    Handsontable.hooks.run(this.instance, 'afterRender', this.instance.forceFullRender); //this.instance.forceFullRender = did Handsontable request full render?
  }
};

Handsontable.TableView.prototype.render = function () {
  this.wt.draw(!this.instance.forceFullRender);
  this.instance.forceFullRender = false;
  this.instance.rootElement.triggerHandler('render.handsontable');
};

/**
 * Returns td object given coordinates
 * @param {WalkontableCellCoords} coords
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords) {
  var td = this.wt.wtTable.getCell(coords);
  if (td < 0) { //there was an exit code (cell is out of bounds)
    return null;
  }
  else {
    return td;
  }
};

/**
 * Scroll viewport to selection
 * @param {WalkontableCellCoords} coords
 */
Handsontable.TableView.prototype.scrollViewport = function (coords) {
  this.wt.scrollViewport(coords);
};

/**
 * Append row header to a TH element
 * @param row
 * @param TH
 */
Handsontable.TableView.prototype.appendRowHeader = function (row, TH) {
  if (row > -1) {
    this.wt.wtDom.fastInnerHTML(TH, this.instance.getRowHeader(row));
  }
  else {
    var DIV = document.createElement('DIV');
    DIV.className = 'relative';
    this.wt.wtDom.fastInnerText(DIV, '\u00A0');
    this.wt.wtDom.empty(TH);
    TH.appendChild(DIV);
  }
};

/**
 * Append column header to a TH element
 * @param col
 * @param TH
 */
Handsontable.TableView.prototype.appendColHeader = function (col, TH) {
  var DIV = document.createElement('DIV')
    , SPAN = document.createElement('SPAN');

  DIV.className = 'relative';
  SPAN.className = 'colHeader';

  this.wt.wtDom.fastInnerHTML(SPAN, this.instance.getColHeader(col));
  DIV.appendChild(SPAN);

  this.wt.wtDom.empty(TH);
  TH.appendChild(DIV);
  Handsontable.hooks.run(this.instance, 'afterGetColHeader', col, TH);
};

/**
 * Given a element's left position relative to the viewport, returns maximum element width until the right edge of the viewport (before scrollbar)
 * @param {Number} left
 * @return {Number}
 */
Handsontable.TableView.prototype.maximumVisibleElementWidth = function (left) {
  var rootWidth = this.wt.wtViewport.getWorkspaceWidth();
  return rootWidth;
};

/**
 * Given a element's top position relative to the viewport, returns maximum element height until the bottom edge of the viewport (before scrollbar)
 * @param {Number} top
 * @return {Number}
 */
Handsontable.TableView.prototype.maximumVisibleElementHeight = function (top) {
  var rootHeight = this.wt.wtViewport.getWorkspaceHeight();
  return rootHeight;
};
