/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this
    , $documentElement = $(document.documentElement);

  this.instance = instance;
  this.settings = instance.getSettings();

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
  instance.container.prepend(instance.$table);

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
  this.isMouseDown = function () {
    return isMouseDown;
  };

  $documentElement.on('mouseup.' + instance.guid, function (event) {
    if (instance.selection.isInProgress() && event.which === 1) { //is left mouse button
      instance.selection.finish();
    }

    isMouseDown = false;

    if (Handsontable.helper.isOutsideInput(document.activeElement)) {
      instance.unlisten();
    }
  });

  $documentElement.on('mousedown.' + instance.guid, function (event) {
    var next = event.target;

    if (isMouseDown) {
      return; //it must have been started in a cell
    }

    if (next !== that.wt.wtTable.spreader) { //immediate click on "spreader" means click on the right side of vertical scrollbar
      while (next !== document.documentElement) {
        if (next === null) {
          return; //click on something that was a row but now is detached (possibly because your click triggered a rerender)
        }
        if (next === instance.rootElement[0]) {
          return; //click inside container
        }
        next = next.parentNode;
      }
    }

    //function did not return until here, we have an outside click!

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

    //https://github.com/handsontable/jquery-handsontable/issues/160
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

  var selections = [
    new WalkontableSelection({
      className: 'current',
      border: {
        width: 2,
        color: '#5292F7',
        //style: 'solid', //not used
        cornerVisible: function () {
          return that.settings.fillHandle && !that.isCellEdited() && !instance.selection.isMultiple()
        }
      }
    }),
    new WalkontableSelection({
      className: 'area',
      border: {
        width: 1,
        color: '#89AFF9',
        //style: 'solid', // not used
        cornerVisible: function () {
          return that.settings.fillHandle && !that.isCellEdited() && instance.selection.isMultiple()
        }
      }
    }),
    new WalkontableSelection({
      className: 'highlight',
      highlightRowClassName: that.settings.currentRowClassName,
      highlightColumnClassName: that.settings.currentColClassName
    }),
    new WalkontableSelection({
      className: 'fill',
      border: {
        width: 1,
        color: 'red'
        //style: 'solid' // not used
      }
    })
  ];
  selections.current = selections[0];
  selections.area = selections[1];
  selections.highlight = selections[2];
  selections.fill = selections[3];

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
    fixedColumnsLeft: function () {
      return that.settings.fixedColumnsLeft;
    },
    fixedRowsTop: function () {
      return that.settings.fixedRowsTop;
    },
    renderAllRows: that.settings.renderAllRows,
    rowHeaders: function () {
      var arr = [];
      if(instance.hasRowHeaders()) {
        arr.push(function (index, TH) {
          that.appendRowHeader(index, TH);
        });
      }
      Handsontable.hooks.run(instance, 'afterGetRowHeaderRenderers', arr);
      return arr;
    },
    columnHeaders: function () {

      var arr = [];
      if(instance.hasColHeaders()) {
        arr.push(function (index, TH) {
          that.appendColHeader(index, TH);
        });
      }
      Handsontable.hooks.run(instance, 'afterGetColumnHeaderRenderers', arr);
      return arr;
    },
    columnWidth: instance.getColWidth,
    rowHeight: instance.getRowHeight,
    cellRenderer: function (row, col, TD) {

      var prop = that.instance.colToProp(col)
        , cellProperties = that.instance.getCellMeta(row, col)
        , renderer = that.instance.getCellRenderer(cellProperties);

      var value = that.instance.getDataAtRowProp(row, prop);

      renderer(that.instance, TD, row, col, prop, value, cellProperties);
      Handsontable.hooks.run(that.instance, 'afterRenderer', TD, row, col, prop, value, cellProperties);

    },
    selections: selections,
    hideBorderOnMouseDownOver: function () {
      return that.settings.fragmentSelection;
    },
    onCellMouseDown: function (event, coords, TD, wt) {
      instance.listen();
      that.activeWt = wt;

      isMouseDown = true;

      Handsontable.hooks.run(instance, 'beforeOnCellMouseDown', event, coords, TD);

      if (!event.isImmediatePropagationStopped()) {

        if (event.button === 2 && instance.selection.inInSelection(coords)) { //right mouse button
          //do nothing
        }
        else if (event.shiftKey) {
          if (coords.row >= 0 && coords.col >= 0) {
            instance.selection.setRangeEnd(coords);
          }
        }
        else {
          if (coords.row < 0 || coords.col < 0) {
            if (coords.row < 0) {
              instance.selectCell(0, coords.col, instance.countRows() - 1, coords.col);
              instance.selection.setSelectedHeaders(false, true);
            }
            if (coords.col < 0) {
              instance.selectCell(coords.row, 0, coords.row, instance.countCols() - 1);
              instance.selection.setSelectedHeaders(true, false);
            }
          }
          else {
            instance.selection.setRangeStart(coords);
          }
        }

        Handsontable.hooks.run(instance, 'afterOnCellMouseDown', event, coords, TD);

        that.activeWt = that.wt;
      }
    },
    /*onCellMouseOut: function (/*event, coords, TD* /) {
     if (isMouseDown && that.settings.fragmentSelection === 'single') {
     clearTextSelection(); //otherwise text selection blinks during multiple cells selection
     }
     },*/
    onCellMouseOver: function (event, coords, TD, wt) {
      that.activeWt = wt;
      if (coords.row >= 0 && coords.col >= 0) { //is not a header
        if (isMouseDown) {
          /*if (that.settings.fragmentSelection === 'single') {
           clearTextSelection(); //otherwise text selection blinks during multiple cells selection
           }*/
          instance.selection.setRangeEnd(coords);
        }
      } else {
        if (isMouseDown) {
          // multi select columns
          if (coords.row < 0) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, coords.col));
            instance.selection.setSelectedHeaders(false, true);
          }

          // multi select rows
          if (coords.col < 0) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(coords.row, instance.countCols() - 1));
            instance.selection.setSelectedHeaders(true, false);
          }
        }
      }

      Handsontable.hooks.run(instance, 'afterOnCellMouseOver', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellCornerMouseDown: function (event) {
      event.preventDefault();
      Handsontable.hooks.run(instance, 'afterOnCellCornerMouseDown', event);
    },
    beforeDraw: function (force) {
      that.beforeRender(force);
    },
    onDraw: function (force) {
      that.onDraw(force);
    },
    onScrollVertically: function () {
      instance.runHooks('afterScrollVertically');
    },
    onScrollHorizontally: function () {
      instance.runHooks('afterScrollHorizontally');
    },
    onBeforeDrawBorders: function (corners, borderClassName) {
      instance.runHooks('beforeDrawBorders', corners, borderClassName);
    }
  };

  Handsontable.hooks.run(instance, 'beforeInitWalkontable', walkontableConfig);

  this.wt = new Walkontable(walkontableConfig);
  this.activeWt = this.wt;

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
  if (Handsontable.helper.isInput(el)) {
    return (true);
  }
  if (this.settings.fragmentSelection && Handsontable.Dom.isChildOf(el, this.TBODY)) {
    return (true);
  }
  return false;
};

Handsontable.TableView.prototype.isCellEdited = function () {
  var activeEditor = this.instance.getActiveEditor();
  return activeEditor && activeEditor.isOpened();
};

Handsontable.TableView.prototype.beforeRender = function (force) {
  if (force) { //force = did Walkontable decide to do full render
    Handsontable.hooks.run(this.instance, 'beforeRender', this.instance.forceFullRender); //this.instance.forceFullRender = did Handsontable request full render?
  }
};

Handsontable.TableView.prototype.onDraw = function (force) {
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
  var DIV = document.createElement('DIV'),
    SPAN = document.createElement('SPAN');

  DIV.className = 'relative';
  SPAN.className = 'rowHeader';

  if (row > -1) {
    Handsontable.Dom.fastInnerHTML(SPAN, this.instance.getRowHeader(row));
  } else {
    Handsontable.Dom.fastInnerText(SPAN, '\u00A0');
  }

  DIV.appendChild(SPAN);
  Handsontable.Dom.empty(TH);

  TH.appendChild(DIV);

  Handsontable.hooks.run(this.instance, 'afterGetRowHeader', row, TH);
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

  if (col > -1) {
    Handsontable.Dom.fastInnerHTML(SPAN, this.instance.getColHeader(col));
  } else {
    Handsontable.Dom.fastInnerText(SPAN, '\u00A0');
  }
  DIV.appendChild(SPAN);

  Handsontable.Dom.empty(TH);
  TH.appendChild(DIV);
  Handsontable.hooks.run(this.instance, 'afterGetColHeader', col, TH);
};

/**
 * Given a element's left position relative to the viewport, returns maximum element width until the right edge of the viewport (before scrollbar)
 * @param {Number} leftOffset
 * @return {Number}
 */
Handsontable.TableView.prototype.maximumVisibleElementWidth = function (leftOffset) {
  var workspaceWidth = this.wt.wtViewport.getWorkspaceWidth();
  var maxWidth = workspaceWidth - leftOffset;
  return maxWidth > 0 ? maxWidth : 0;
};

/**
 * Given a element's top position relative to the viewport, returns maximum element height until the bottom edge of the viewport (before scrollbar)
 * @param {Number} topOffset
 * @return {Number}
 */
Handsontable.TableView.prototype.maximumVisibleElementHeight = function (topOffset) {
  var workspaceHeight = this.wt.wtViewport.getWorkspaceHeight();
  var maxHeight = workspaceHeight - topOffset;
  return maxHeight > 0 ? maxHeight : 0;
};

Handsontable.TableView.prototype.mainViewIsActive = function () {
  return this.wt === this.activeWt;
};
