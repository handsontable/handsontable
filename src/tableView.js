import {
  addClass,
  empty,
  fastInnerHTML,
  fastInnerText,
  getScrollbarWidth,
  hasClass,
  isChildOf,
  isInput,
  isOutsideInput,
} from './helpers/dom/element';
import {eventManager as eventManagerObject} from './eventManager';
import {stopPropagation, isImmediatePropagationStopped} from './helpers/dom/event';
import {WalkontableCellCoords} from './3rdparty/walkontable/src/cell/coords';
import {WalkontableSelection} from './3rdparty/walkontable/src/selection';
import {Walkontable} from './3rdparty/walkontable/src/core';

// Support for older Handsontable versions
Handsontable.TableView = TableView;

/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
function TableView(instance) {
  var that = this;

  this.eventManager = eventManagerObject(instance);
  this.instance = instance;
  this.settings = instance.getSettings();
  this.selectionMouseDown = false;

  var originalStyle = instance.rootElement.getAttribute('style');

  if (originalStyle) {
    instance.rootElement.setAttribute('data-originalstyle', originalStyle); // needed to retrieve original style in jsFiddle link generator in HT examples. may be removed in future versions
  }

  addClass(instance.rootElement, 'handsontable');
  // instance.rootElement.addClass('handsontable');

  var table = document.createElement('TABLE');
  addClass(table, 'htCore');

  if (instance.getSettings().tableClassName) {
    addClass(table, instance.getSettings().tableClassName);
  }
  this.THEAD = document.createElement('THEAD');
  table.appendChild(this.THEAD);
  this.TBODY = document.createElement('TBODY');
  table.appendChild(this.TBODY);

  instance.table = table;

  instance.container.insertBefore(table, instance.container.firstChild);

  this.eventManager.addEventListener(instance.rootElement, 'mousedown', function(event) {
    this.selectionMouseDown = true;

    if (!that.isTextSelectionAllowed(event.target)) {
      clearTextSelection();
      event.preventDefault();
      window.focus(); // make sure that window that contains HOT is active. Important when HOT is in iframe.
    }
  });
  this.eventManager.addEventListener(instance.rootElement, 'mouseup', function(event) {
    this.selectionMouseDown = false;
  });
  this.eventManager.addEventListener(instance.rootElement, 'mousemove', function(event) {
    if (this.selectionMouseDown && !that.isTextSelectionAllowed(event.target)) {
      clearTextSelection();
      event.preventDefault();
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'keyup', function(event) {
    if (instance.selection.isInProgress() && !event.shiftKey) {
      instance.selection.finish();
    }
  });

  var isMouseDown;
  this.isMouseDown = function() {
    return isMouseDown;
  };

  this.eventManager.addEventListener(document.documentElement, 'mouseup', function(event) {
    if (instance.selection.isInProgress() && event.which === 1) { //is left mouse button
      instance.selection.finish();
    }

    isMouseDown = false;

    if (isOutsideInput(document.activeElement)) {
      instance.unlisten();
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'mousedown', function(event) {
    var next = event.target;
    var eventX = event.x || event.clientX;
    var eventY = event.y || event.clientY;

    if (isMouseDown || !instance.rootElement) {
      return; // it must have been started in a cell
    }

    // immediate click on "holder" means click on the right side of vertical scrollbar
    if (next === instance.view.wt.wtTable.holder) {
      var scrollbarWidth = getScrollbarWidth();

      if (document.elementFromPoint(eventX + scrollbarWidth, eventY) !== instance.view.wt.wtTable.holder ||
        document.elementFromPoint(eventX, eventY + scrollbarWidth) !== instance.view.wt.wtTable.holder) {
        return;
      }
    } else {
      while (next !== document.documentElement) {
        if (next === null) {
          if (event.isTargetWebComponent) {
            break;
          }
          // click on something that was a row but now is detached (possibly because your click triggered a rerender)
          return;
        }
        if (next === instance.rootElement) {
          // click inside container
          return;
        }
        next = next.parentNode;
      }
    }

    // function did not return until here, we have an outside click!
    if (that.settings.outsideClickDeselects) {
      instance.deselectCell();
    } else {
      instance.destroyEditor();
    }
  });

  this.eventManager.addEventListener(table, 'selectstart', function(event) {
    if (that.settings.fragmentSelection || isInput(event.target)) {
      return;
    }
    // https://github.com/handsontable/handsontable/issues/160
    // Prevent text from being selected when performing drag down.
    event.preventDefault();
  });

  var clearTextSelection = function() {
    //http://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
    if (window.getSelection) {
      if (window.getSelection().empty) { // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) { // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) { // IE?
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
        cornerVisible: function() {
          return that.settings.fillHandle && !that.isCellEdited() && !instance.selection.isMultiple();
        },
        multipleSelectionHandlesVisible: function() {
          return !that.isCellEdited() && !instance.selection.isMultiple();
        },
      },
    }),
    new WalkontableSelection({
      className: 'area',
      border: {
        width: 1,
        color: '#89AFF9',
        //style: 'solid', // not used
        cornerVisible: function() {
          return that.settings.fillHandle && !that.isCellEdited() && instance.selection.isMultiple();
        },
        multipleSelectionHandlesVisible: function() {
          return !that.isCellEdited() && instance.selection.isMultiple();
        },
      },
    }),
    new WalkontableSelection({
      className: 'highlight',
      highlightRowClassName: that.settings.currentRowClassName,
      highlightColumnClassName: that.settings.currentColClassName,
    }),
    new WalkontableSelection({
      className: 'fill',
      border: {
        width: 1,
        color: 'red',
        //style: 'solid' // not used
      },
    }),
  ];
  selections.current = selections[0];
  selections.area = selections[1];
  selections.highlight = selections[2];
  selections.fill = selections[3];

  var walkontableConfig = {
    debug: function() {
      return that.settings.debug;
    },
    externalRowCalculator: this.instance.getPlugin('autoRowSize') && this.instance.getPlugin('autoRowSize').isEnabled(),
    table: table,
    preventOverflow: () => this.settings.preventOverflow,
    stretchH: this.settings.stretchH,
    data: instance.getDataAtCell,
    totalRows: () => instance.countRows(),
    totalColumns: () => instance.countCols(),
    fixedColumnsLeft: function() {
      return that.settings.fixedColumnsLeft;
    },
    fixedRowsTop: function() {
      return that.settings.fixedRowsTop;
    },
    fixedRowsBottom: function() {
      return that.settings.fixedRowsBottom;
    },
    minSpareRows: function() {
      return that.settings.minSpareRows;
    },
    renderAllRows: that.settings.renderAllRows,
    rowHeaders: function() {
      let headerRenderers = [];

      if (instance.hasRowHeaders()) {
        headerRenderers.push(function(row, TH) {
          that.appendRowHeader(row, TH);
        });
      }
      Handsontable.hooks.run(instance, 'afterGetRowHeaderRenderers', headerRenderers);

      return headerRenderers;
    },
    columnHeaders: function() {
      let headerRenderers = [];

      if (instance.hasColHeaders()) {
        headerRenderers.push(function(column, TH) {
          that.appendColHeader(column, TH);
        });
      }
      Handsontable.hooks.run(instance, 'afterGetColumnHeaderRenderers', headerRenderers);

      return headerRenderers;
    },
    columnWidth: instance.getColWidth,
    rowHeight: instance.getRowHeight,
    cellRenderer: function(row, col, TD) {

      var prop = that.instance.colToProp(col),
        cellProperties = that.instance.getCellMeta(row, col),
        renderer = that.instance.getCellRenderer(cellProperties);

      var value = that.instance.getDataAtRowProp(row, prop);

      renderer(that.instance, TD, row, col, prop, value, cellProperties);
      Handsontable.hooks.run(that.instance, 'afterRenderer', TD, row, col, prop, value, cellProperties);

    },
    selections: selections,
    hideBorderOnMouseDownOver: function() {
      return that.settings.fragmentSelection;
    },
    onCellMouseDown: function(event, coords, TD, wt) {
      var colspanOffset;
      var TR = TD.parentNode;
      var THEAD = TR.parentNode;
      var headerLevel;
      var headerColspan;

      instance.listen();
      that.activeWt = wt;

      isMouseDown = true;

      Handsontable.hooks.run(instance, 'beforeOnCellMouseDown', event, coords, TD);

      instance.selection.setSelectedHeaders(false, false);

      if (!isImmediatePropagationStopped(event)) {
        if (event.button === 2 && instance.selection.inInSelection(coords)) { //right mouse button
          var nothing = 1; // do nothing
        } else if (event.shiftKey) {
          if (coords.row >= 0 && coords.col >= 0) {
            instance.selection.setRangeEnd(coords);
          }
        } else {
          if ((coords.row < 0 || coords.col < 0) && (coords.row >= 0 || coords.col >= 0)) {
            if (coords.row < 0) {
              headerLevel = THEAD.childNodes.length - Array.prototype.indexOf.call(THEAD.childNodes, TR) - 1;
              headerColspan = instance.getHeaderColspan(coords.col, headerLevel);

              instance.selection.setSelectedHeaders(false, true);
              instance.selectCell(0, coords.col, instance.countRows() - 1, coords.col + Math.max(0, headerColspan - 1));
            }
            if (coords.col < 0) {
              instance.selection.setSelectedHeaders(true, false);
              instance.selectCell(coords.row, 0, coords.row, instance.countCols() - 1);
            }
          } else {
            coords.row = coords.row < 0 ? 0 : coords.row;
            coords.col = coords.col < 0 ? 0 : coords.col;

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
    onCellMouseOver: function(event, coords, TD, wt) {
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
            if (instance.selection.selectedHeader.cols) {
              instance.selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, coords.col));
              instance.selection.setSelectedHeaders(false, true);

            } else {
              instance.selection.setRangeEnd(new WalkontableCellCoords(coords.row, coords.col));
            }

          }

          // multi select rows
          if (coords.col < 0) {
            if (instance.selection.selectedHeader.rows) {
              instance.selection.setRangeEnd(new WalkontableCellCoords(coords.row, instance.countCols() - 1));
              instance.selection.setSelectedHeaders(true, false);

            } else {
              instance.selection.setRangeEnd(new WalkontableCellCoords(coords.row, coords.col));
            }
          }
        }
      }

      Handsontable.hooks.run(instance, 'afterOnCellMouseOver', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellCornerMouseDown: function(event) {
      event.preventDefault();
      Handsontable.hooks.run(instance, 'afterOnCellCornerMouseDown', event);
    },
    beforeDraw: function(force) {
      that.beforeRender(force);
    },
    onDraw: function(force) {
      that.onDraw(force);
    },
    onScrollVertically: function() {
      instance.runHooks('afterScrollVertically');
    },
    onScrollHorizontally: function() {
      instance.runHooks('afterScrollHorizontally');
    },
    onBeforeDrawBorders: function(corners, borderClassName) {
      instance.runHooks('beforeDrawBorders', corners, borderClassName);
    },
    onBeforeTouchScroll: function() {
      instance.runHooks('beforeTouchScroll');
    },
    onAfterMomentumScroll: function() {
      instance.runHooks('afterMomentumScroll');
    },
    viewportRowCalculatorOverride: function(calc) {
      let rows = instance.countRows();
      let viewportOffset = that.settings.viewportRowRenderingOffset;

      if (viewportOffset === 'auto' && that.settings.fixedRowsTop) {
        viewportOffset = 10;
      }
      if (typeof viewportOffset === 'number') {
        calc.startRow = Math.max(calc.startRow - viewportOffset, 0);
        calc.endRow = Math.min(calc.endRow + viewportOffset, rows - 1);
      }
      if (viewportOffset === 'auto') {
        let center = calc.startRow + calc.endRow - calc.startRow;
        let offset = Math.ceil(center / rows * 12);

        calc.startRow = Math.max(calc.startRow - offset, 0);
        calc.endRow = Math.min(calc.endRow + offset, rows - 1);
      }
      instance.runHooks('afterViewportRowCalculatorOverride', calc);
    },
    viewportColumnCalculatorOverride: function(calc) {
      let cols = instance.countCols();
      let viewportOffset = that.settings.viewportColumnRenderingOffset;

      if (viewportOffset === 'auto' && that.settings.fixedColumnsLeft) {
        viewportOffset = 10;
      }
      if (typeof viewportOffset === 'number') {
        calc.startColumn = Math.max(calc.startColumn - viewportOffset, 0);
        calc.endColumn = Math.min(calc.endColumn + viewportOffset, cols - 1);
      }
      if (viewportOffset === 'auto') {
        let center = calc.startColumn + calc.endColumn - calc.startColumn;
        let offset = Math.ceil(center / cols * 12);

        calc.startRow = Math.max(calc.startColumn - offset, 0);
        calc.endColumn = Math.min(calc.endColumn + offset, cols - 1);
      }
      instance.runHooks('afterViewportColumnCalculatorOverride', calc);
    },
  };

  Handsontable.hooks.run(instance, 'beforeInitWalkontable', walkontableConfig);

  this.wt = new Walkontable(walkontableConfig);
  this.activeWt = this.wt;

  this.eventManager.addEventListener(that.wt.wtTable.spreader, 'mousedown', function(event) {
    //right mouse button exactly on spreader means right click on the right hand side of vertical scrollbar
    if (event.target === that.wt.wtTable.spreader && event.which === 3) {
      stopPropagation(event);
      //event.stopPropagation();
    }
  });

  this.eventManager.addEventListener(that.wt.wtTable.spreader, 'contextmenu', function(event) {
    //right mouse button exactly on spreader means right click on the right hand side of vertical scrollbar
    if (event.target === that.wt.wtTable.spreader && event.which === 3) {
      stopPropagation(event);
      //event.stopPropagation();
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'click', function() {
    if (that.settings.observeDOMVisibility) {
      if (that.wt.drawInterrupted) {
        that.instance.forceFullRender = true;
        that.render();
      }
    }
  });
}

TableView.prototype.isTextSelectionAllowed = function(el) {
  if (isInput(el)) {
    return true;
  }
  let isChildOfTableBody = isChildOf(el, this.instance.view.wt.wtTable.spreader);

  if (this.settings.fragmentSelection === true && isChildOfTableBody) {
    return true;
  }
  if (this.settings.fragmentSelection === 'cell' && this.isSelectedOnlyCell() && isChildOfTableBody) {
    return true;
  }

  return false;
};

/**
 * Check if selected only one cell.
 *
 * @returns {Boolean}
 */
TableView.prototype.isSelectedOnlyCell = function() {
  var [row, col, rowEnd, colEnd] = this.instance.getSelected() || [];

  return row !== void 0 && row === rowEnd && col === colEnd;
};

TableView.prototype.isCellEdited = function() {
  var activeEditor = this.instance.getActiveEditor();

  return activeEditor && activeEditor.isOpened();
};

TableView.prototype.beforeRender = function(force) {
  if (force) {
    //this.instance.forceFullRender = did Handsontable request full render?
    Handsontable.hooks.run(this.instance, 'beforeRender', this.instance.forceFullRender);
  }
};

TableView.prototype.onDraw = function(force) {
  if (force) {
    //this.instance.forceFullRender = did Handsontable request full render?
    Handsontable.hooks.run(this.instance, 'afterRender', this.instance.forceFullRender);
  }
};

TableView.prototype.render = function() {
  this.wt.draw(!this.instance.forceFullRender);
  this.instance.forceFullRender = false;
  this.instance.renderCall = false;
};

/**
 * Returns td object given coordinates
 * @param {WalkontableCellCoords} coords
 * @param {Boolean} topmost
 */
TableView.prototype.getCellAtCoords = function(coords, topmost) {
  var td = this.wt.getCell(coords, topmost);
  //var td = this.wt.wtTable.getCell(coords);
  if (td < 0) { //there was an exit code (cell is out of bounds)
    return null;
  } else {
    return td;
  }
};

/**
 * Scroll viewport to selection
 * @param {WalkontableCellCoords} coords
 */
TableView.prototype.scrollViewport = function(coords) {
  this.wt.scrollViewport(coords);
};

/**
 * Append row header to a TH element
 * @param row
 * @param TH
 */
TableView.prototype.appendRowHeader = function(row, TH) {
  if (TH.firstChild) {
    let container = TH.firstChild;

    if (!hasClass(container, 'relative')) {
      empty(TH);
      this.appendRowHeader(row, TH);

      return;
    }
    this.updateCellHeader(container.querySelector('.rowHeader'), row, this.instance.getRowHeader);

  } else {
    let div = document.createElement('div');
    let span = document.createElement('span');

    div.className = 'relative';
    span.className = 'rowHeader';
    this.updateCellHeader(span, row, this.instance.getRowHeader);

    div.appendChild(span);
    TH.appendChild(div);
  }
  Handsontable.hooks.run(this.instance, 'afterGetRowHeader', row, TH);
};

/**
 * Append column header to a TH element
 * @param col
 * @param TH
 */
TableView.prototype.appendColHeader = function(col, TH) {
  if (TH.firstChild) {
    let container = TH.firstChild;

    if (hasClass(container, 'relative')) {
      this.updateCellHeader(container.querySelector('.colHeader'), col, this.instance.getColHeader);
    } else {
      empty(TH);
      this.appendColHeader(col, TH);
    }

  } else {
    var div = document.createElement('div');
    let span = document.createElement('span');

    div.className = 'relative';
    span.className = 'colHeader';
    this.updateCellHeader(span, col, this.instance.getColHeader);

    div.appendChild(span);
    TH.appendChild(div);
  }
  Handsontable.hooks.run(this.instance, 'afterGetColHeader', col, TH);
};

/**
 * Update header cell content
 *
 * @since 0.15.0-beta4
 * @param {HTMLElement} element Element to update
 * @param {Number} index Row index or column index
 * @param {Function} content Function which should be returns content for this cell
 */
TableView.prototype.updateCellHeader = function(element, index, content) {
  if (index > -1) {
    fastInnerHTML(element, content(index));

  } else {
    // workaround for https://github.com/handsontable/handsontable/issues/1946
    fastInnerText(element, String.fromCharCode(160));
    addClass(element, 'cornerHeader');
  }
};

/**
 * Given a element's left position relative to the viewport, returns maximum element width until the right
 * edge of the viewport (before scrollbar)
 *
 * @param {Number} leftOffset
 * @return {Number}
 */
TableView.prototype.maximumVisibleElementWidth = function(leftOffset) {
  var workspaceWidth = this.wt.wtViewport.getWorkspaceWidth();
  var maxWidth = workspaceWidth - leftOffset;
  return maxWidth > 0 ? maxWidth : 0;
};

/**
 * Given a element's top position relative to the viewport, returns maximum element height until the bottom
 * edge of the viewport (before scrollbar)
 *
 * @param {Number} topOffset
 * @return {Number}
 */
TableView.prototype.maximumVisibleElementHeight = function(topOffset) {
  var workspaceHeight = this.wt.wtViewport.getWorkspaceHeight();
  var maxHeight = workspaceHeight - topOffset;
  return maxHeight > 0 ? maxHeight : 0;
};

TableView.prototype.mainViewIsActive = function() {
  return this.wt === this.activeWt;
};

TableView.prototype.destroy = function() {
  this.wt.destroy();
  this.eventManager.destroy();
};

export {TableView};
