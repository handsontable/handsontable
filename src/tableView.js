import {
  addClass,
  empty,
  fastInnerHTML,
  fastInnerText,
  getScrollbarWidth,
  hasClass,
  isChildOf,
  isInput,
  isOutsideInput
} from './helpers/dom/element';
import EventManager from './eventManager';
import { stopPropagation, isImmediatePropagationStopped, isRightClick, isLeftClick } from './helpers/dom/event';
import Walkontable from './3rdparty/walkontable/src';
import { handleMouseEvent } from './selection/mouseEventHandler';

/**
 * Cross-platform helper to clear text selection.
 */
const clearTextSelection = function() {
  // http://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
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

/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
function TableView(instance) {
  const that = this;

  this.eventManager = new EventManager(instance);
  this.instance = instance;
  this.settings = instance.getSettings();
  this.selectionMouseDown = false;

  const originalStyle = instance.rootElement.getAttribute('style');

  if (originalStyle) {
    instance.rootElement.setAttribute('data-originalstyle', originalStyle); // needed to retrieve original style in jsFiddle link generator in HT examples. may be removed in future versions
  }

  addClass(instance.rootElement, 'handsontable');

  const table = document.createElement('TABLE');
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

  this.eventManager.addEventListener(instance.rootElement, 'mousedown', (event) => {
    this.selectionMouseDown = true;

    if (!that.isTextSelectionAllowed(event.target)) {
      clearTextSelection();
      event.preventDefault();
      window.focus(); // make sure that window that contains HOT is active. Important when HOT is in iframe.
    }
  });
  this.eventManager.addEventListener(instance.rootElement, 'mouseup', () => {
    this.selectionMouseDown = false;
  });
  this.eventManager.addEventListener(instance.rootElement, 'mousemove', (event) => {
    if (this.selectionMouseDown && !that.isTextSelectionAllowed(event.target)) {
      // Clear selection only when fragmentSelection is enabled, otherwise clearing selection breakes the IME editor.
      if (this.settings.fragmentSelection) {
        clearTextSelection();
      }
      event.preventDefault();
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'keyup', (event) => {
    if (instance.selection.isInProgress() && !event.shiftKey) {
      instance.selection.finish();
    }
  });

  let isMouseDown;
  this.isMouseDown = function() {
    return isMouseDown;
  };

  this.eventManager.addEventListener(document.documentElement, 'mouseup', (event) => {
    if (instance.selection.isInProgress() && isLeftClick(event)) { // is left mouse button
      instance.selection.finish();
    }

    isMouseDown = false;

    if (isOutsideInput(document.activeElement) || (!instance.selection.isSelected() && !isRightClick(event))) {
      instance.unlisten();
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'contextmenu', (event) => {
    if (instance.selection.isInProgress() && isRightClick(event)) {
      instance.selection.finish();

      isMouseDown = false;
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'touchend', () => {
    if (instance.selection.isInProgress()) {
      instance.selection.finish();
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'mousedown', (event) => {
    const originalTarget = event.target;
    const eventX = event.x || event.clientX;
    const eventY = event.y || event.clientY;
    let next = event.target;

    if (isMouseDown || !instance.rootElement) {
      return; // it must have been started in a cell
    }

    // immediate click on "holder" means click on the right side of vertical scrollbar
    if (next === instance.view.wt.wtTable.holder) {
      const scrollbarWidth = getScrollbarWidth();

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

    const outsideClickDeselects = typeof that.settings.outsideClickDeselects === 'function' ?
      that.settings.outsideClickDeselects(originalTarget) :
      that.settings.outsideClickDeselects;

    if (outsideClickDeselects) {
      instance.deselectCell();
    } else {
      instance.destroyEditor(false, false);
    }
  });

  this.eventManager.addEventListener(table, 'selectstart', (event) => {
    if (that.settings.fragmentSelection || isInput(event.target)) {
      return;
    }
    // https://github.com/handsontable/handsontable/issues/160
    // Prevent text from being selected when performing drag down.
    event.preventDefault();
  });

  const walkontableConfig = {
    debug: () => that.settings.debug,
    externalRowCalculator: this.instance.getPlugin('autoRowSize') && this.instance.getPlugin('autoRowSize').isEnabled(),
    table,
    preventOverflow: () => this.settings.preventOverflow,
    stretchH: () => that.settings.stretchH,
    data: instance.getDataAtCell,
    totalRows: () => instance.countRows(),
    totalColumns: () => instance.countCols(),
    fixedColumnsLeft: () => that.settings.fixedColumnsLeft,
    fixedRowsTop: () => that.settings.fixedRowsTop,
    fixedRowsBottom: () => that.settings.fixedRowsBottom,
    minSpareRows: () => that.settings.minSpareRows,
    renderAllRows: that.settings.renderAllRows,
    rowHeaders: () => {
      const headerRenderers = [];

      if (instance.hasRowHeaders()) {
        headerRenderers.push((row, TH) => that.appendRowHeader(row, TH));
      }

      instance.runHooks('afterGetRowHeaderRenderers', headerRenderers);

      return headerRenderers;
    },
    columnHeaders: () => {
      const headerRenderers = [];

      if (instance.hasColHeaders()) {
        headerRenderers.push((column, TH) => {
          that.appendColHeader(column, TH);
        });
      }

      instance.runHooks('afterGetColumnHeaderRenderers', headerRenderers);

      return headerRenderers;
    },
    columnWidth: instance.getColWidth,
    rowHeight: instance.getRowHeight,
    cellRenderer(row, col, TD) {
      const cellProperties = that.instance.getCellMeta(row, col);
      const prop = that.instance.colToProp(col);
      let value = that.instance.getDataAtRowProp(row, prop);

      if (that.instance.hasHook('beforeValueRender')) {
        value = that.instance.runHooks('beforeValueRender', value, cellProperties);
      }

      that.instance.runHooks('beforeRenderer', TD, row, col, prop, value, cellProperties);
      that.instance.getCellRenderer(cellProperties)(that.instance, TD, row, col, prop, value, cellProperties);
      that.instance.runHooks('afterRenderer', TD, row, col, prop, value, cellProperties);

    },
    selections: that.instance.selection.highlight,
    hideBorderOnMouseDownOver: () => that.settings.fragmentSelection,
    onCellMouseDown: (event, coords, TD, wt) => {
      const blockCalculations = {
        row: false,
        column: false,
        cell: false
      };

      instance.listen();

      that.activeWt = wt;
      isMouseDown = true;

      instance.runHooks('beforeOnCellMouseDown', event, coords, TD, blockCalculations);

      if (isImmediatePropagationStopped(event)) {
        return;
      }

      handleMouseEvent(event, {
        coords,
        selection: instance.selection,
        controller: blockCalculations,
      });

      instance.runHooks('afterOnCellMouseDown', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellContextMenu: (event, coords, TD, wt) => {
      that.activeWt = wt;
      isMouseDown = false;

      if (instance.selection.isInProgress()) {
        instance.selection.finish();
      }

      instance.runHooks('beforeOnCellContextMenu', event, coords, TD);

      if (isImmediatePropagationStopped(event)) {
        return;
      }

      instance.runHooks('afterOnCellContextMenu', event, coords, TD);

      that.activeWt = that.wt;
    },
    onCellMouseOut: (event, coords, TD, wt) => {
      that.activeWt = wt;
      instance.runHooks('beforeOnCellMouseOut', event, coords, TD);

      if (isImmediatePropagationStopped(event)) {
        return;
      }

      instance.runHooks('afterOnCellMouseOut', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellMouseOver: (event, coords, TD, wt) => {
      const blockCalculations = {
        row: false,
        column: false,
        cell: false
      };

      that.activeWt = wt;

      instance.runHooks('beforeOnCellMouseOver', event, coords, TD, blockCalculations);

      if (isImmediatePropagationStopped(event)) {
        return;
      }

      if (isMouseDown) {
        handleMouseEvent(event, {
          coords,
          selection: instance.selection,
          controller: blockCalculations,
        });
      }

      instance.runHooks('afterOnCellMouseOver', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellMouseUp: (event, coords, TD, wt) => {
      that.activeWt = wt;
      instance.runHooks('beforeOnCellMouseUp', event, coords, TD);

      instance.runHooks('afterOnCellMouseUp', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellCornerMouseDown(event) {
      event.preventDefault();
      instance.runHooks('afterOnCellCornerMouseDown', event);
    },
    onCellCornerDblClick(event) {
      event.preventDefault();
      instance.runHooks('afterOnCellCornerDblClick', event);
    },
    beforeDraw(force, skipRender) {
      that.beforeRender(force, skipRender);
    },
    onDraw(force) {
      that.onDraw(force);
    },
    onScrollVertically() {
      instance.runHooks('afterScrollVertically');
    },
    onScrollHorizontally() {
      instance.runHooks('afterScrollHorizontally');
    },
    onBeforeRemoveCellClassNames: () => instance.runHooks('beforeRemoveCellClassNames'),
    onAfterDrawSelection: (currentRow, currentColumn, cornersOfSelection, layerLevel) => instance.runHooks('afterDrawSelection',
      currentRow, currentColumn, cornersOfSelection, layerLevel),
    onBeforeDrawBorders(corners, borderClassName) {
      instance.runHooks('beforeDrawBorders', corners, borderClassName);
    },
    onBeforeTouchScroll() {
      instance.runHooks('beforeTouchScroll');
    },
    onAfterMomentumScroll() {
      instance.runHooks('afterMomentumScroll');
    },
    onBeforeStretchingColumnWidth: (stretchedWidth, column) => instance.runHooks('beforeStretchingColumnWidth', stretchedWidth, column),
    onModifyRowHeaderWidth: rowHeaderWidth => instance.runHooks('modifyRowHeaderWidth', rowHeaderWidth),
    onModifyGetCellCoords: (row, column, topmost) => instance.runHooks('modifyGetCellCoords', row, column, topmost),
    viewportRowCalculatorOverride(calc) {
      const rows = instance.countRows();
      let viewportOffset = that.settings.viewportRowRenderingOffset;

      if (viewportOffset === 'auto' && that.settings.fixedRowsTop) {
        viewportOffset = 10;
      }
      if (typeof viewportOffset === 'number') {
        calc.startRow = Math.max(calc.startRow - viewportOffset, 0);
        calc.endRow = Math.min(calc.endRow + viewportOffset, rows - 1);
      }
      if (viewportOffset === 'auto') {
        const center = calc.startRow + calc.endRow - calc.startRow;
        const offset = Math.ceil(center / rows * 12);

        calc.startRow = Math.max(calc.startRow - offset, 0);
        calc.endRow = Math.min(calc.endRow + offset, rows - 1);
      }
      instance.runHooks('afterViewportRowCalculatorOverride', calc);
    },
    viewportColumnCalculatorOverride(calc) {
      const cols = instance.countCols();
      let viewportOffset = that.settings.viewportColumnRenderingOffset;

      if (viewportOffset === 'auto' && that.settings.fixedColumnsLeft) {
        viewportOffset = 10;
      }
      if (typeof viewportOffset === 'number') {
        calc.startColumn = Math.max(calc.startColumn - viewportOffset, 0);
        calc.endColumn = Math.min(calc.endColumn + viewportOffset, cols - 1);
      }
      if (viewportOffset === 'auto') {
        const center = calc.startColumn + calc.endColumn - calc.startColumn;
        const offset = Math.ceil(center / cols * 12);

        calc.startRow = Math.max(calc.startColumn - offset, 0);
        calc.endColumn = Math.min(calc.endColumn + offset, cols - 1);
      }
      instance.runHooks('afterViewportColumnCalculatorOverride', calc);
    },
    rowHeaderWidth: () => that.settings.rowHeaderWidth,
    columnHeaderHeight() {
      const columnHeaderHeight = instance.runHooks('modifyColumnHeaderHeight');
      return that.settings.columnHeaderHeight || columnHeaderHeight;
    }
  };

  instance.runHooks('beforeInitWalkontable', walkontableConfig);

  this.wt = new Walkontable(walkontableConfig);
  this.activeWt = this.wt;

  this.eventManager.addEventListener(that.wt.wtTable.spreader, 'mousedown', (event) => {
    // right mouse button exactly on spreader means right click on the right hand side of vertical scrollbar
    if (event.target === that.wt.wtTable.spreader && event.which === 3) {
      stopPropagation(event);
    }
  });

  this.eventManager.addEventListener(that.wt.wtTable.spreader, 'contextmenu', (event) => {
    // right mouse button exactly on spreader means right click on the right hand side of vertical scrollbar
    if (event.target === that.wt.wtTable.spreader && event.which === 3) {
      stopPropagation(event);
    }
  });

  this.eventManager.addEventListener(document.documentElement, 'click', () => {
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
  const isChildOfTableBody = isChildOf(el, this.instance.view.wt.wtTable.spreader);

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
  const [row, col, rowEnd, colEnd] = this.instance.getSelectedLast() || [];

  return row !== void 0 && row === rowEnd && col === colEnd;
};

TableView.prototype.isCellEdited = function() {
  const activeEditor = this.instance.getActiveEditor();

  return activeEditor && activeEditor.isOpened();
};

TableView.prototype.beforeRender = function(force, skipRender) {
  if (force) {
    // this.instance.forceFullRender = did Handsontable request full render?
    this.instance.runHooks('beforeRender', this.instance.forceFullRender, skipRender);
  }
};

TableView.prototype.onDraw = function(force) {
  if (force) {
    // this.instance.forceFullRender = did Handsontable request full render?
    this.instance.runHooks('afterRender', this.instance.forceFullRender);
  }
};

TableView.prototype.render = function() {
  this.wt.draw(!this.instance.forceFullRender);
  this.instance.forceFullRender = false;
  this.instance.renderCall = false;
};

/**
 * Returns td object given coordinates
 *
 * @param {CellCoords} coords
 * @param {Boolean} topmost
 */
TableView.prototype.getCellAtCoords = function(coords, topmost) {
  const td = this.wt.getCell(coords, topmost);

  if (td < 0) { // there was an exit code (cell is out of bounds)
    return null;
  }

  return td;
};

/**
 * Scroll viewport to a cell.
 *
 * @param {CellCoords} coords
 * @param {Boolean} [snapToTop]
 * @param {Boolean} [snapToRight]
 * @param {Boolean} [snapToBottom]
 * @param {Boolean} [snapToLeft]
 * @returns {Boolean}
 */
TableView.prototype.scrollViewport = function(coords, snapToTop, snapToRight, snapToBottom, snapToLeft) {
  return this.wt.scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft);
};

/**
 * Scroll viewport to a column.
 *
 * @param {Number} column Visual column index.
 * @param {Boolean} [snapToLeft]
 * @param {Boolean} [snapToRight]
 * @returns {Boolean}
 */
TableView.prototype.scrollViewportHorizontally = function(column, snapToRight, snapToLeft) {
  return this.wt.scrollViewportHorizontally(column, snapToRight, snapToLeft);
};

/**
 * Scroll viewport to a row.
 *
 * @param {Number} row Visual row index.
 * @param {Boolean} [snapToTop]
 * @param {Boolean} [snapToBottom]
 * @returns {Boolean}
 */
TableView.prototype.scrollViewportVertically = function(row, snapToTop, snapToBottom) {
  return this.wt.scrollViewportVertically(row, snapToTop, snapToBottom);
};

/**
 * Append row header to a TH element
 * @param row
 * @param TH
 */
TableView.prototype.appendRowHeader = function(row, TH) {
  if (TH.firstChild) {
    const container = TH.firstChild;

    if (!hasClass(container, 'relative')) {
      empty(TH);
      this.appendRowHeader(row, TH);

      return;
    }
    this.updateCellHeader(container.querySelector('.rowHeader'), row, this.instance.getRowHeader);

  } else {
    const div = document.createElement('div');
    const span = document.createElement('span');

    div.className = 'relative';
    span.className = 'rowHeader';
    this.updateCellHeader(span, row, this.instance.getRowHeader);

    div.appendChild(span);
    TH.appendChild(div);
  }

  this.instance.runHooks('afterGetRowHeader', row, TH);
};

/**
 * Append column header to a TH element
 * @param col
 * @param TH
 */
TableView.prototype.appendColHeader = function(col, TH) {
  if (TH.firstChild) {
    const container = TH.firstChild;

    if (hasClass(container, 'relative')) {
      this.updateCellHeader(container.querySelector('.colHeader'), col, this.instance.getColHeader);
    } else {
      empty(TH);
      this.appendColHeader(col, TH);
    }

  } else {
    const div = document.createElement('div');
    const span = document.createElement('span');

    div.className = 'relative';
    span.className = 'colHeader';
    this.updateCellHeader(span, col, this.instance.getColHeader);

    div.appendChild(span);
    TH.appendChild(div);
  }

  this.instance.runHooks('afterGetColHeader', col, TH);
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
  const parentOverlay = this.wt.wtOverlays.getParentOverlay(element) || this.wt;

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
  const workspaceWidth = this.wt.wtViewport.getWorkspaceWidth();
  const maxWidth = workspaceWidth - leftOffset;
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
  const workspaceHeight = this.wt.wtViewport.getWorkspaceHeight();
  const maxHeight = workspaceHeight - topOffset;
  return maxHeight > 0 ? maxHeight : 0;
};

TableView.prototype.mainViewIsActive = function() {
  return this.wt === this.activeWt;
};

TableView.prototype.destroy = function() {
  this.wt.destroy();
  this.eventManager.destroy();
};

export default TableView;
