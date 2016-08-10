import Handsontable from './browser';
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
  removeClass
} from './helpers/dom/element';
import {eventManager as eventManagerObject} from './eventManager';
import {stopPropagation, isImmediatePropagationStopped, isRightClick, isLeftClick} from './helpers/dom/event';
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
    var originalTarget = event.target;
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

    var outsideClickDeselects = typeof that.settings.outsideClickDeselects === 'function' ?
      that.settings.outsideClickDeselects(originalTarget) :
      that.settings.outsideClickDeselects;

    if (outsideClickDeselects) {
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
      highlightHeaderClassName: that.settings.currentHeaderClassName,
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
    stretchH: function() {
      return that.settings.stretchH;
    },
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
      const cellProperties = that.instance.getCellMeta(row, col);
      const prop = that.instance.colToProp(col);
      const value = that.instance.getDataAtRowProp(row, prop);

      Handsontable.hooks.run(that.instance, 'beforeRenderer', TD, row, col, prop, value, cellProperties);
      that.instance.getCellRenderer(cellProperties)(that.instance, TD, row, col, prop, value, cellProperties);
      Handsontable.hooks.run(that.instance, 'afterRenderer', TD, row, col, prop, value, cellProperties);

    },
    selections: selections,
    hideBorderOnMouseDownOver: function() {
      return that.settings.fragmentSelection;
    },
    onCellMouseDown: function(event, coords, TD, wt) {
      let blockCalculations = {
        row: false,
        column: false,
        cells: false
      };

      instance.listen();

      that.activeWt = wt;
      isMouseDown = true;

      Handsontable.hooks.run(instance, 'beforeOnCellMouseDown', event, coords, TD, blockCalculations);

      if (isImmediatePropagationStopped(event)) {
        return;
      }

      let actualSelection = instance.getSelectedRange();
      let selection = instance.selection;
      let selectedHeader = selection.selectedHeader;

      if (event.shiftKey && actualSelection) {
        if (coords.row >= 0 && coords.col >= 0 && !blockCalculations.cells) {
          selection.setSelectedHeaders(false, false);
          selection.setRangeEnd(coords);

        } else if ((selectedHeader.cols || selectedHeader.rows) && coords.row >= 0 && coords.col >= 0 && !blockCalculations.cells) {
          selection.setSelectedHeaders(false, false);
          selection.setRangeEnd(new WalkontableCellCoords(coords.row, coords.col));

        } else if (selectedHeader.cols && coords.row < 0 && !blockCalculations.column) {
          selection.setRangeEnd(new WalkontableCellCoords(actualSelection.to.row, coords.col));

        } else if (selectedHeader.rows && coords.col < 0 && !blockCalculations.row) {
          selection.setRangeEnd(new WalkontableCellCoords(coords.row, actualSelection.to.col));

        } else if (((!selectedHeader.cols && !selectedHeader.rows && coords.col < 0) ||
                   (selectedHeader.cols && coords.col < 0)) && !blockCalculations.row) {
          selection.setSelectedHeaders(true, false);
          selection.setRangeStartOnly(new WalkontableCellCoords(actualSelection.from.row, 0));
          selection.setRangeEnd(new WalkontableCellCoords(coords.row, instance.countCols() - 1));

        } else if (((!selectedHeader.cols && !selectedHeader.rows && coords.row < 0) ||
                   (selectedHeader.rows && coords.row < 0)) && !blockCalculations.column) {
          selection.setSelectedHeaders(false, true);
          selection.setRangeStartOnly(new WalkontableCellCoords(0, actualSelection.from.col));
          selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, coords.col));
        }
      } else {
        let doNewSelection = true;

        if (actualSelection) {
          let {from, to} = actualSelection;
          let coordsNotInSelection = !selection.inInSelection(coords);

          if (coords.row < 0 && selectedHeader.cols) {
            let start = Math.min(from.col, to.col);
            let end = Math.max(from.col, to.col);

            doNewSelection = (coords.col < start || coords.col > end);

          } else if (coords.col < 0 && selectedHeader.rows) {
            let start = Math.min(from.row, to.row);
            let end = Math.max(from.row, to.row);

            doNewSelection = (coords.row < start || coords.row > end);

          } else {
            doNewSelection = coordsNotInSelection;
          }
        }

        const rightClick = isRightClick(event);
        const leftClick = isLeftClick(event);

        // clicked row header and when some column was selected
        if (coords.row < 0 && coords.col >= 0 && !blockCalculations.column) {
          selection.setSelectedHeaders(false, true);

          if (leftClick || (rightClick && doNewSelection)) {
            selection.setRangeStartOnly(new WalkontableCellCoords(0, coords.col));
            selection.setRangeEnd(new WalkontableCellCoords(Math.max(instance.countRows() - 1, 0), coords.col), false);
          }

        // clicked column header and when some row was selected
        } else if (coords.col < 0 && coords.row >= 0 && !blockCalculations.row) {
          selection.setSelectedHeaders(true, false);

          if (leftClick || (rightClick && doNewSelection)) {
            selection.setRangeStartOnly(new WalkontableCellCoords(coords.row, 0));
            selection.setRangeEnd(new WalkontableCellCoords(coords.row, Math.max(instance.countCols() - 1, 0)), false);
          }

        } else if (coords.col >= 0 && coords.row >= 0 && !blockCalculations.cells) {
          if (leftClick || (rightClick && doNewSelection)) {
            selection.setSelectedHeaders(false, false);
            selection.setRangeStart(coords);
          }
        } else if (coords.col < 0 && coords.row < 0) {
          coords.row = 0;
          coords.col = 0;

          selection.setSelectedHeaders(false, false, true);
          selection.setRangeStart(coords);
        }
      }

      if (selection.selectedHeader.rows) {
        removeClass(instance.rootElement, 'ht__selection--columns');
        addClass(instance.rootElement, 'ht__selection--rows');

      } else if (selection.selectedHeader.cols) {
        removeClass(instance.rootElement, 'ht__selection--rows');
        addClass(instance.rootElement, 'ht__selection--columns');

      } else {
        removeClass(instance.rootElement, 'ht__selection--rows');
        removeClass(instance.rootElement, 'ht__selection--columns');
      }
      Handsontable.hooks.run(instance, 'afterOnCellMouseDown', event, coords, TD);
      that.activeWt = that.wt;
    },
    /*onCellMouseOut: function (/*event, coords, TD* /) {
     if (isMouseDown && that.settings.fragmentSelection === 'single') {
     clearTextSelection(); //otherwise text selection blinks during multiple cells selection
     }
     },*/
    onCellMouseOver: function(event, coords, TD, wt) {
      let blockCalculations = {
        row: false,
        column: false,
        cell: false
      };

      that.activeWt = wt;
      Handsontable.hooks.run(instance, 'beforeOnCellMouseOver', event, coords, TD, blockCalculations);

      if (isImmediatePropagationStopped(event)) {
        return;
      }

      if (event.button === 0 && isMouseDown) {
        if (coords.row >= 0 && coords.col >= 0) { //is not a header
          if (instance.selection.selectedHeader.cols && !blockCalculations.column) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, coords.col), false);

          } else if (instance.selection.selectedHeader.rows && !blockCalculations.row) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(coords.row, instance.countCols() - 1), false);

          } else if (!blockCalculations.cell) {
            instance.selection.setRangeEnd(coords);
          }
        } else {
          if (instance.selection.selectedHeader.cols && !blockCalculations.column) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, coords.col), false);

          } else if (instance.selection.selectedHeader.rows && !blockCalculations.row) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(coords.row, instance.countCols() - 1), false);

          } else if (!blockCalculations.cell) {
            instance.selection.setRangeEnd(coords);
          }
        }
      }

      Handsontable.hooks.run(instance, 'afterOnCellMouseOver', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellMouseUp: function(event, coords, TD, wt) {
      that.activeWt = wt;
      Handsontable.hooks.run(instance, 'beforeOnCellMouseUp', event, coords, TD);

      Handsontable.hooks.run(instance, 'afterOnCellMouseUp', event, coords, TD);
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
    onBeforeStretchingColumnWidth: function(stretchedWidth, column) {
      return instance.runHooks('beforeStretchingColumnWidth', stretchedWidth, column);
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
    rowHeaderWidth: function() {
      return that.settings.rowHeaderWidth;
    },
    columnHeaderHeight: function() {
      const columnHeaderHeight = instance.runHooks('modifyColumnHeaderHeight');
      return that.settings.columnHeaderHeight || columnHeaderHeight;
    }
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
  if (!this.settings.fragmentSelection && this.isCellEdited() && this.isSelectedOnlyCell()) {
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
  let renderedIndex = index;
  let parentOverlay = this.wt.wtOverlays.getParentOverlay(element) || this.wt;

  // prevent wrong calculations from SampleGenerator
  if (element.parentNode) {
    if (hasClass(element, 'colHeader')) {
      renderedIndex = parentOverlay.wtTable.columnFilter.sourceToRendered(index);
    } else if (hasClass(element, 'rowHeader')) {
      renderedIndex = parentOverlay.wtTable.rowFilter.sourceToRendered(index);
    }
  }

  if (renderedIndex > -1) {
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
